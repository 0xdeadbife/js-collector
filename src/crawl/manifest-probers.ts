import type { ScriptEntry } from '../types.js';
import { fetchUrl, type FetchOptions } from './fetcher.js';
import type { FrameworkHint } from './framework-hints.js';

/**
 * Try fetching a URL and return the body if successful, null otherwise.
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
 * Resolve JS paths from a JSON body relative to a base URL.
 */
function extractJsUrls(paths: string[], baseUrl: string): string[] {
  const urls: string[] = [];
  for (const p of paths) {
    if (/\.js(\?.*)?$/i.test(p)) {
      try {
        const resolved = new URL(p, baseUrl);
        resolved.hash = '';
        urls.push(resolved.href);
      } catch {
        // skip
      }
    }
  }
  return urls;
}

/**
 * Probe for React/CRA manifests: asset-manifest.json and manifest.json
 */
export async function probeReactManifests(
  baseUrl: string,
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const entries: ScriptEntry[] = [];
  const origin = new URL(baseUrl).origin;

  for (const path of ['/asset-manifest.json', '/manifest.json']) {
    const body = await tryFetch(`${origin}${path}`, fetchOpts);
    if (!body) continue;

    try {
      const json = JSON.parse(body);

      // asset-manifest.json format: { files: { "main.js": "/static/js/main.abc.js" }, entrypoints: [...] }
      if (json.files && typeof json.files === 'object') {
        const jsUrls = extractJsUrls(Object.values(json.files) as string[], origin);
        for (const url of jsUrls) {
          entries.push({ url, source: 'manifest' });
        }
      }
      if (Array.isArray(json.entrypoints)) {
        const jsUrls = extractJsUrls(json.entrypoints, origin);
        for (const url of jsUrls) {
          entries.push({ url, source: 'manifest' });
        }
      }
    } catch {
      // Not valid JSON
    }
  }

  return entries;
}

/**
 * Probe for Next.js scripts: _next/static chunks and _buildManifest.js
 */
export async function probeNextJs(
  baseUrl: string,
  html: string,
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const entries: ScriptEntry[] = [];
  const origin = new URL(baseUrl).origin;

  // Find buildId from _next/static/BUILDID pattern in HTML
  const buildIdMatch = html.match(/_next\/static\/([a-zA-Z0-9_-]+)\//);
  if (!buildIdMatch) return entries;

  const buildId = buildIdMatch[1];

  // Try fetching _buildManifest.js
  const manifestUrl = `${origin}/_next/static/${buildId}/_buildManifest.js`;
  const body = await tryFetch(manifestUrl, fetchOpts);

  if (body) {
    // _buildManifest.js contains JS assignments with chunk paths
    // Extract quoted strings that look like JS paths
    const pathMatches = body.matchAll(/"([^"]*\.js)"/g);
    for (const match of pathMatches) {
      try {
        const resolved = new URL(`/_next/${match[1]}`, origin);
        entries.push({ url: resolved.href, source: 'manifest' });
      } catch {
        // skip
      }
    }
  }

  // Also look for _next/static paths already in HTML that we might have missed
  const nextPaths = html.matchAll(/"(\/\/_next\/static\/[^"]+\.js)"/g);
  for (const match of nextPaths) {
    try {
      const resolved = new URL(match[1], origin);
      entries.push({ url: resolved.href, source: 'manifest' });
    } catch {
      // skip
    }
  }

  return entries;
}

/**
 * Probe for Angular service worker manifest (ngsw.json).
 */
export async function probeAngular(
  baseUrl: string,
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const entries: ScriptEntry[] = [];
  const origin = new URL(baseUrl).origin;

  const body = await tryFetch(`${origin}/ngsw.json`, fetchOpts);
  if (!body) return entries;

  try {
    const json = JSON.parse(body);

    // ngsw.json has assetGroups with urls arrays
    if (Array.isArray(json.assetGroups)) {
      for (const group of json.assetGroups) {
        if (Array.isArray(group.urls)) {
          const jsUrls = extractJsUrls(group.urls, origin);
          for (const url of jsUrls) {
            entries.push({ url, source: 'manifest' });
          }
        }
      }
    }
  } catch {
    // Not valid JSON
  }

  return entries;
}

/**
 * Probe for Vue/Nuxt manifests.
 */
export async function probeVueNuxt(
  baseUrl: string,
  fetchOpts: FetchOptions,
): Promise<ScriptEntry[]> {
  const entries: ScriptEntry[] = [];
  const origin = new URL(baseUrl).origin;

  const body = await tryFetch(`${origin}/vue-ssr-client-manifest.json`, fetchOpts);
  if (!body) return entries;

  try {
    const json = JSON.parse(body);

    // vue-ssr-client-manifest.json has arrays of JS paths
    const allPaths: string[] = [];
    if (Array.isArray(json.initial)) allPaths.push(...json.initial);
    if (Array.isArray(json.async)) allPaths.push(...json.async);
    if (Array.isArray(json.all)) allPaths.push(...json.all);

    const jsUrls = extractJsUrls(allPaths, origin);
    for (const url of jsUrls) {
      entries.push({ url, source: 'manifest' });
    }
  } catch {
    // Not valid JSON
  }

  return entries;
}

/**
 * Run framework manifest probes in parallel.
 * If hints are provided, only probe detected frameworks (reduces requests).
 * Falls back to probing all frameworks when no hints are given.
 */
export async function probeAllManifests(
  baseUrl: string,
  html: string,
  fetchOpts: FetchOptions,
  hints?: Set<FrameworkHint>,
): Promise<ScriptEntry[]> {
  const shouldProbe = (framework: FrameworkHint): boolean => {
    // No hints = unknown framework, probe all as fallback
    if (!hints || hints.size === 0) return true;
    return hints.has(framework);
  };

  const probes: Promise<ScriptEntry[]>[] = [];
  if (shouldProbe('react')) probes.push(probeReactManifests(baseUrl, fetchOpts));
  if (shouldProbe('nextjs')) probes.push(probeNextJs(baseUrl, html, fetchOpts));
  if (shouldProbe('angular')) probes.push(probeAngular(baseUrl, fetchOpts));
  if (shouldProbe('vue')) probes.push(probeVueNuxt(baseUrl, fetchOpts));

  const results = await Promise.allSettled(probes);

  const entries: ScriptEntry[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      entries.push(...result.value);
    }
  }

  return entries;
}
