import pLimit from 'p-limit';
import type { CollectorOptions, CollectorResult, ScriptEntry, WafSignal } from '../types.js';
import { fetchUrl, type FetchOptions } from '../crawl/fetcher.js';
import { parseHtml } from '../crawl/html-parser.js';
import { parseLinkHeader } from '../crawl/link-header.js';
import { probeAllManifests } from '../crawl/manifest-probers.js';
import { discoverAll } from '../crawl/discovery.js';
import { parseSourcemaps } from '../crawl/sourcemap-parser.js';
import { detectFrameworkHints } from '../crawl/framework-hints.js';
import { runKatana } from '../integrations/katana.js';
import { runGetJs } from '../integrations/getjs.js';
import { filterThirdParty } from '../filter/third-party-filter.js';
import { WafBlockedError } from '../concurrency/host-throttle.js';

/**
 * Normalize a URL for deduplication:
 * - Lowercase scheme and hostname
 * - Strip trailing slash from path
 * - Strip fragment
 * - Normalize www. vs non-www
 */
function normalizeForDedup(raw: string): string {
  try {
    const url = new URL(raw);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    url.hash = '';
    // Remove trailing slash from path (but keep "/" for root)
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.href;
  } catch {
    // If it's not a valid URL (e.g. sourcemap relative paths), just normalize basics
    return raw.replace(/\/$/, '').toLowerCase();
  }
}

/**
 * Deduplicate script entries by normalized URL, keeping the first occurrence's source.
 */
function deduplicateScripts(entries: ScriptEntry[]): ScriptEntry[] {
  const seen = new Map<string, ScriptEntry>();
  for (const entry of entries) {
    const key = normalizeForDedup(entry.url);
    if (!seen.has(key)) {
      seen.set(key, entry);
    }
  }
  return [...seen.values()];
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/**
 * Collect all JavaScript files for a single URL.
 */
export async function collectScripts(
  url: string,
  options: CollectorOptions,
): Promise<CollectorResult> {
  const host = new URL(url).hostname;

  // Budget: abort signal with wall-clock timeout for this entire target
  const budgetSignal = options.budget > 0 ? AbortSignal.timeout(options.budget) : undefined;

  // Intra-target concurrency limiter: caps parallel requests to this target
  const intraLimit = pLimit(options.intraConcurrency);

  const fetchOpts: FetchOptions = {
    userAgent: options.userAgent,
    timeout: options.timeout,
    maxRetries: options.maxRetries,
    stealth: options.stealth,
    intraLimit,
    signal: budgetSignal,
  };

  // --- Stage 1: Fetch main page (critical path) ---
  let page;
  try {
    page = await fetchUrl(url, { ...fetchOpts, requestType: 'navigate' });
  } catch (err) {
    if (err instanceof WafBlockedError) {
      return {
        url,
        host,
        scripts: [],
        status: 'error',
        error: err.message,
        wafSignal: err.signal,
      };
    }
    return {
      url,
      host,
      scripts: [],
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Accumulate entries — populated incrementally so budget expiry returns partial results
  const allEntries: ScriptEntry[] = [];
  allEntries.push(...parseHtml(page.body, page.finalUrl));
  allEntries.push(...parseLinkHeader(page.headers.get('Link'), page.finalUrl));

  // Detect framework hints from the HTML (zero extra requests)
  const hints = detectFrameworkHints(page.body);

  // --- Stage 2: Probe/discovery (partial results on budget expiry or WAF block) ---
  let wafSignalResult: WafSignal | undefined;

  try {
    const [manifestScripts, discoveryScripts] = await Promise.all([
      probeAllManifests(page.finalUrl, page.body, fetchOpts, hints),
      discoverAll(page.finalUrl, fetchOpts),
    ]);
    allEntries.push(...manifestScripts);
    allEntries.push(...discoveryScripts);

    // External tool integrations
    const externalPromises: Promise<ScriptEntry[]>[] = [];
    if (options.useKatana) externalPromises.push(runKatana(url));
    if (options.useGetjs) externalPromises.push(runGetJs(url));

    if (externalPromises.length > 0) {
      const externalResults = await Promise.allSettled(externalPromises);
      for (const result of externalResults) {
        if (result.status === 'fulfilled') {
          allEntries.push(...result.value);
        }
      }
    }

    // Sourcemap parsing
    if (options.sourcemaps) {
      const jsUrls = deduplicateScripts(allEntries)
        .filter((e) => /\.js(\?.*)?$/i.test(e.url))
        .map((e) => e.url);
      const sourcemapEntries = await parseSourcemaps(jsUrls, fetchOpts);
      allEntries.push(...sourcemapEntries);
    }
  } catch (err) {
    if (err instanceof WafBlockedError) {
      wafSignalResult = err.signal;
      // Fall through — return whatever was collected before the block
    } else if (!isAbortError(err)) {
      // Unexpected error in probe/discovery phase: return partial with what we have
      // (main page scripts are still useful)
    }
    // Budget expiry (AbortError) or WAF block: fall through with partial results
  }

  const finalScripts = filterThirdParty(deduplicateScripts(allEntries), host, {
    trustedDomains: options.trustedDomains,
  });

  return {
    url,
    host,
    scripts: finalScripts,
    status: 'completed',
    wafSignal: wafSignalResult,
  };
}
