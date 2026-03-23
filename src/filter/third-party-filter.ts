import type { ScriptEntry } from '../types.js';
import { CDN_HOSTNAMES } from './cdn-hostnames.js';
import { matchesLibPattern } from './lib-patterns.js';

export interface FilterOptions {
  trustedDomains?: string[];
}

/**
 * Tag each script entry as third-party or first-party using 3 layers:
 *
 * Layer 1: CDN hostname matching — instant, catches scripts from known CDN hosts.
 * Layer 2: Filename pattern matching — catches self-hosted known libraries.
 * Layer 3: Cross-host heuristic — different host than target = likely third-party.
 *
 * Returns the same entries with `thirdParty` field populated.
 * Does NOT remove entries — callers decide what to do with the tag.
 */
export function filterThirdParty(
  entries: ScriptEntry[],
  targetHost: string,
  options: FilterOptions = {},
): ScriptEntry[] {
  const trustedSet = buildTrustedSet(targetHost, options.trustedDomains ?? []);

  return entries.map((entry) => {
    const thirdParty = isThirdParty(entry.url, targetHost, trustedSet);
    return { ...entry, thirdParty };
  });
}

function isThirdParty(url: string, targetHost: string, trustedSet: Set<string>): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    // Relative or invalid URLs are treated as first-party
    return false;
  }

  // Layer 1: CDN hostname
  if (CDN_HOSTNAMES.has(hostname)) {
    return true;
  }

  // Layer 2: Filename pattern matching (applies regardless of host)
  if (matchesLibPattern(url)) {
    return true;
  }

  // Layer 3: Cross-host heuristic
  // If hostname differs from all trusted domains → third-party
  if (!trustedSet.has(hostname)) {
    return true;
  }

  return false;
}

/**
 * Build a set of hostnames that should be considered first-party.
 * Includes the target host, its www-variant, and any user-specified trusted domains.
 */
function buildTrustedSet(targetHost: string, trustedDomains: string[]): Set<string> {
  const normalized = targetHost.toLowerCase().replace(/^www\./, '');
  const trusted = new Set<string>([
    normalized,
    `www.${normalized}`,
    targetHost.toLowerCase(),
  ]);

  for (const domain of trustedDomains) {
    const d = domain.trim().toLowerCase().replace(/^www\./, '');
    trusted.add(d);
    trusted.add(`www.${d}`);
    trusted.add(domain.trim().toLowerCase());
  }

  return trusted;
}
