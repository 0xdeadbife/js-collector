import type { WafSignal } from '../types.js';

export interface WafDetectionResult {
  signal: WafSignal | null;
  shouldBlock: boolean;
}

/**
 * Analyze an HTTP response for WAF / bot-protection signals.
 * Purely post-response analysis — no extra network requests.
 */
export function detectWaf(
  status: number,
  body: string,
  finalUrl: string,
  contentType: string | null,
): WafDetectionResult {
  // 429 = rate limited
  if (status === 429) {
    return { signal: 'rate-limited', shouldBlock: false };
  }

  // Captcha / challenge redirect in URL
  const urlLower = finalUrl.toLowerCase();
  if (
    urlLower.includes('captcha') ||
    urlLower.includes('/challenge') ||
    urlLower.includes('hcaptcha')
  ) {
    return { signal: 'captcha-redirect', shouldBlock: true };
  }

  // Cloudflare challenge page detection
  if (
    body.includes('cf-ray') ||
    body.includes('Just a moment') ||
    body.includes('__cf_chl') ||
    body.includes('cloudflare-static')
  ) {
    return { signal: 'cloudflare', shouldBlock: true };
  }

  // Generic 403 (no other WAF markers)
  if (status === 403) {
    return { signal: 'generic-403', shouldBlock: false };
  }

  // Suspicious empty response: 200 with near-empty body that isn't JS/HTML
  if (status === 200 && body.length < 50) {
    const ct = contentType?.toLowerCase() ?? '';
    if (!ct.includes('javascript') && !ct.includes('html')) {
      return { signal: 'suspicious-empty', shouldBlock: false };
    }
  }

  return { signal: null, shouldBlock: false };
}
