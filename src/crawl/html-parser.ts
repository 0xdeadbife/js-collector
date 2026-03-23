import * as cheerio from 'cheerio';
import type { ScriptEntry } from '../types.js';

/**
 * Resolve a potentially relative URL against a base URL.
 * Returns null if the result is not a valid HTTP(S) URL.
 */
function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(src, baseUrl);
    if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
      // Strip fragment
      resolved.hash = '';
      return resolved.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse HTML and extract JavaScript file URLs from:
 * - <script src="..."> tags
 * - <link rel="modulepreload" href="...">
 * - <link rel="preload" as="script" href="...">
 */
export function parseHtml(html: string, baseUrl: string): ScriptEntry[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const entries: ScriptEntry[] = [];

  function addEntry(url: string) {
    if (!seen.has(url)) {
      seen.add(url);
      entries.push({ url, source: 'html' });
    }
  }

  // Extract <script src="...">
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      const resolved = resolveUrl(src, baseUrl);
      if (resolved) addEntry(resolved);
    }
  });

  // Extract <link rel="modulepreload" href="...">
  $('link[rel="modulepreload"][href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const resolved = resolveUrl(href, baseUrl);
      if (resolved) addEntry(resolved);
    }
  });

  // Extract <link rel="preload" as="script" href="...">
  $('link[rel="preload"][as="script"][href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const resolved = resolveUrl(href, baseUrl);
      if (resolved) addEntry(resolved);
    }
  });

  return entries;
}
