import type { ScriptEntry } from '../types.js';

/**
 * Parse the Link response header to find preloaded/modulepreloaded scripts.
 * Format: <url>; rel="preload"; as="script", <url>; rel="modulepreload"
 */
export function parseLinkHeader(
  linkHeader: string | null,
  baseUrl: string,
): ScriptEntry[] {
  if (!linkHeader) return [];

  const entries: ScriptEntry[] = [];
  const parts = linkHeader.split(',');

  for (const part of parts) {
    const urlMatch = part.match(/<([^>]+)>/);
    if (!urlMatch) continue;

    const rawUrl = urlMatch[1];
    const isModulePreload = /rel\s*=\s*"?modulepreload"?/i.test(part);
    const isPreloadScript =
      /rel\s*=\s*"?preload"?/i.test(part) && /as\s*=\s*"?script"?/i.test(part);

    if (isModulePreload || isPreloadScript) {
      try {
        const resolved = new URL(rawUrl, baseUrl);
        resolved.hash = '';
        entries.push({ url: resolved.href, source: 'link-header' });
      } catch {
        // Skip invalid URLs
      }
    }
  }

  return entries;
}
