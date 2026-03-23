import type { ScriptEntry } from '../types.js';
import { fetchUrl, type FetchOptions } from './fetcher.js';

/**
 * Try fetching a URL, return body on success or null.
 */
async function tryFetch(
  url: string,
  opts: FetchOptions,
): Promise<string | null> {
  try {
    const result = await fetchUrl(url, { ...opts, retries: 0 });
    if (result.status >= 200 && result.status < 300) {
      return result.body;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse robots.txt for JS file paths and Sitemap directives.
 */
export async function parseRobotsTxt(
  baseUrl: string,
  fetchOpts: FetchOptions,
): Promise<{ scripts: ScriptEntry[]; sitemapUrls: string[] }> {
  const origin = new URL(baseUrl).origin;
  const body = await tryFetch(`${origin}/robots.txt`, fetchOpts);
  const scripts: ScriptEntry[] = [];
  const sitemapUrls: string[] = [];

  if (!body) return { scripts, sitemapUrls };

  for (const line of body.split('\n')) {
    const trimmed = line.trim();

    // Look for Sitemap directives
    const sitemapMatch = trimmed.match(/^Sitemap:\s*(.+)/i);
    if (sitemapMatch) {
      try {
        const url = new URL(sitemapMatch[1].trim());
        sitemapUrls.push(url.href);
      } catch {
        // skip
      }
      continue;
    }

    // Look for Allow/Disallow paths ending in .js
    const pathMatch = trimmed.match(/^(?:Allow|Disallow):\s*(.+)/i);
    if (pathMatch) {
      const path = pathMatch[1].trim();
      if (/\.js(\?.*)?$/i.test(path)) {
        try {
          const resolved = new URL(path, origin);
          scripts.push({ url: resolved.href, source: 'robots' });
        } catch {
          // skip
        }
      }
    }
  }

  return { scripts, sitemapUrls };
}

/**
 * Parse a sitemap XML for JS file URLs.
 * Supports sitemap index files (one level of recursion).
 */
export async function parseSitemap(
  sitemapUrl: string,
  fetchOpts: FetchOptions,
  depth = 0,
): Promise<ScriptEntry[]> {
  if (depth > 2) return []; // Prevent deep recursion

  const body = await tryFetch(sitemapUrl, fetchOpts);
  if (!body) return [];

  const scripts: ScriptEntry[] = [];

  // Check for sitemap index (<sitemapindex>)
  if (body.includes('<sitemapindex')) {
    const locMatches = body.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g);
    const childUrls: string[] = [];
    for (const match of locMatches) {
      childUrls.push(match[1]);
    }
    const results = await Promise.allSettled(
      childUrls.map((url) => parseSitemap(url, fetchOpts, depth + 1)),
    );
    for (const result of results) {
      if (result.status === 'fulfilled') {
        scripts.push(...result.value);
      }
    }
    return scripts;
  }

  // Regular sitemap — look for <loc> entries that are .js files
  const locMatches = body.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g);
  for (const match of locMatches) {
    const url = match[1].trim();
    if (/\.js(\?.*)?$/i.test(url)) {
      scripts.push({ url, source: 'sitemap' });
    }
  }

  return scripts;
}

/**
 * Parse a service worker file for importScripts() calls and cached JS URLs.
 */
export async function parseServiceWorker(
  baseUrl: string,
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const origin = new URL(baseUrl).origin;
  const scripts: ScriptEntry[] = [];

  for (const swPath of ['/service-worker.js', '/sw.js']) {
    const body = await tryFetch(`${origin}${swPath}`, fetchOpts);
    if (!body) continue;

    // Extract importScripts(...) URLs
    const importMatches = body.matchAll(
      /importScripts\s*\(\s*(['"`])(.*?)\1/g,
    );
    for (const match of importMatches) {
      try {
        const resolved = new URL(match[2], origin);
        scripts.push({ url: resolved.href, source: 'service-worker' });
      } catch {
        // skip
      }
    }

    // Extract URLs from cache lists or workbox precache manifests
    const urlMatches = body.matchAll(
      /["']((?:https?:\/\/|\/)[^"']*\.js(?:\?[^"']*)?)["']/g,
    );
    for (const match of urlMatches) {
      try {
        const resolved = new URL(match[1], origin);
        scripts.push({ url: resolved.href, source: 'service-worker' });
      } catch {
        // skip
      }
    }
  }

  return scripts;
}

/**
 * Run all discovery probes: robots.txt, sitemap, service worker.
 */
export async function discoverAll(
  baseUrl: string,
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const entries: ScriptEntry[] = [];

  const [robotsResult, swResult] = await Promise.allSettled([
    parseRobotsTxt(baseUrl, fetchOpts),
    parseServiceWorker(baseUrl, fetchOpts),
  ]);

  if (robotsResult.status === 'fulfilled') {
    entries.push(...robotsResult.value.scripts);

    // Parse sitemaps found in robots.txt
    const sitemapResults = await Promise.allSettled(
      robotsResult.value.sitemapUrls.map((url) => parseSitemap(url, fetchOpts)),
    );
    for (const result of sitemapResults) {
      if (result.status === 'fulfilled') {
        entries.push(...result.value);
      }
    }
  }

  // Also try default sitemap.xml
  const defaultSitemap = await parseSitemap(
    `${new URL(baseUrl).origin}/sitemap.xml`,
    fetchOpts,
  );
  entries.push(...defaultSitemap);

  if (swResult.status === 'fulfilled') {
    entries.push(...swResult.value);
  }

  return entries;
}
