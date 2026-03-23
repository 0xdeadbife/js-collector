import { STEALTH_UA_POOL } from '../config.js';

export type RequestType = 'navigate' | 'fetch';

// Per-session UA rotation: same hostname always gets the same UA for naturalness
const hostUaMap = new Map<string, string>();

function getStealthUa(hostname: string): string {
  if (!hostUaMap.has(hostname)) {
    const idx = Math.floor(Math.random() * STEALTH_UA_POOL.length);
    hostUaMap.set(hostname, STEALTH_UA_POOL[idx]);
  }
  return hostUaMap.get(hostname)!;
}

/** Reset per-host UA assignments (useful for tests). */
export function resetUaMap(): void {
  hostUaMap.clear();
}

/**
 * Build browser-like request headers.
 *
 * @param url         - Target URL (hostname used for stealth UA rotation)
 * @param requestType - 'navigate' for top-level page loads, 'fetch' for sub-resources/API calls
 * @param userAgent   - Base User-Agent (used when stealth=false)
 * @param stealth     - Whether to add full browser headers (Sec-Fetch-*, UA hints, etc.)
 */
export function buildHeaders(
  url: string,
  requestType: RequestType,
  userAgent: string,
  stealth: boolean,
): Record<string, string> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  const ua = stealth ? getStealthUa(hostname) : userAgent;

  const headers: Record<string, string> = {
    'User-Agent': ua,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  };

  if (requestType === 'navigate') {
    headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
  } else {
    headers['Accept'] = 'application/json, text/plain, */*';
  }

  if (stealth) {
    if (requestType === 'navigate') {
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'none';
      headers['Sec-Fetch-User'] = '?1';
    } else {
      headers['Sec-Fetch-Dest'] = 'empty';
      headers['Sec-Fetch-Mode'] = 'cors';
      headers['Sec-Fetch-Site'] = 'same-origin';
    }
    headers['Sec-Ch-Ua'] = '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"';
    headers['Sec-Ch-Ua-Mobile'] = '?0';
    headers['Sec-Ch-Ua-Platform'] = '"Windows"';
  }

  return headers;
}
