import type { ScriptEntry } from '../types.js';
import { fetchUrl, type FetchOptions } from './fetcher.js';

/**
 * For a given JS URL, attempt to find and parse its sourcemap.
 * Extracts source file paths from the sourcemap's "sources" array.
 */
export async function parseSourcemap(
  jsUrl: string,
  jsBody: string | null,
  headers: Headers | null,
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const entries: ScriptEntry[] = [];

  // 1. Check SourceMap response header
  let mapUrl: string | null = headers?.get('SourceMap') || headers?.get('X-SourceMap') || null;

  // 2. Check for //# sourceMappingURL= in the JS body
  if (!mapUrl && jsBody) {
    const match = jsBody.match(/\/\/[#@]\s*sourceMappingURL=(\S+)/);
    if (match) {
      mapUrl = match[1];
    }
  }

  if (!mapUrl) return entries;

  // Resolve the map URL relative to the JS URL
  let resolvedMapUrl: string;
  try {
    resolvedMapUrl = new URL(mapUrl, jsUrl).href;
  } catch {
    return entries;
  }

  // Fetch the sourcemap
  try {
    const result = await fetchUrl(resolvedMapUrl, { ...fetchOpts, retries: 0 });
    if (result.status < 200 || result.status >= 300) return entries;

    const json = JSON.parse(result.body);
    if (!Array.isArray(json.sources)) return entries;

    const sourceRoot = json.sourceRoot || '';

    for (const source of json.sources) {
      if (typeof source !== 'string') continue;
      try {
        const fullPath = sourceRoot ? `${sourceRoot}${source}` : source;
        const resolved = new URL(fullPath, resolvedMapUrl);
        entries.push({ url: resolved.href, source: 'sourcemap' });
      } catch {
        // Record as-is if it can't be resolved
        entries.push({ url: `${sourceRoot}${source}`, source: 'sourcemap' });
      }
    }
  } catch {
    // Sourcemap fetch or parse failed
  }

  return entries;
}

/**
 * Parse sourcemaps for a batch of JS URLs.
 */
export async function parseSourcemaps(
  jsUrls: string[],
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const results = await Promise.allSettled(
    jsUrls.map(async (jsUrl) => {
      const result = await fetchUrl(jsUrl, { ...fetchOpts, retries: 0 });
      return parseSourcemap(jsUrl, result.body, result.headers, fetchOpts);
    }),
  );

  const entries: ScriptEntry[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      entries.push(...result.value);
    }
  }
  return entries;
}
