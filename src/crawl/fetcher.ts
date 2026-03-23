import { DEFAULT_USER_AGENT, DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES } from '../config.js';
import type { FetchResult } from '../types.js';
import { buildHeaders, type RequestType } from './headers.js';
import { detectWaf } from './waf-detector.js';
import { hostThrottle, WafBlockedError } from '../concurrency/host-throttle.js';

export interface FetchOptions {
  userAgent?: string;
  timeout?: number;
  /** Legacy: explicit retry count. Takes precedence over maxRetries if set. */
  retries?: number;
  maxRetries?: number;
  baseRetryDelay?: number;
  maxRetryDelay?: number;
  stealth?: boolean;
  requestType?: RequestType;
  /** p-limit function to cap intra-target concurrency. */
  intraLimit?: <T>(fn: () => Promise<T>) => Promise<T>;
  /** External abort signal (e.g. budget timeout). Combined with per-request timeout. */
  signal?: AbortSignal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/**
 * Parse Retry-After header. Handles both integer seconds and HTTP-date formats.
 * Returns milliseconds, capped at maxMs.
 */
function parseRetryAfter(header: string | null, maxMs = 60_000): number {
  if (!header) return 0;

  const seconds = parseInt(header, 10);
  if (!isNaN(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, maxMs);
  }

  try {
    const date = new Date(header);
    const diff = date.getTime() - Date.now();
    if (diff > 0) {
      return Math.min(diff, maxMs);
    }
  } catch {
    // ignore
  }

  return 0;
}

/**
 * Combine two abort signals into one that fires when either fires.
 * Uses AbortSignal.any when available (Node 20.3+), falls back to manual.
 */
function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([a, b]);
  }
  // Fallback for older Node versions
  const controller = new AbortController();
  const onAbort = (reason?: unknown) => controller.abort(reason);
  if (a.aborted) { controller.abort(a.reason); return controller.signal; }
  if (b.aborted) { controller.abort(b.reason); return controller.signal; }
  a.addEventListener('abort', () => onAbort(a.reason), { once: true });
  b.addEventListener('abort', () => onAbort(b.reason), { once: true });
  return controller.signal;
}

/**
 * Fetch a URL with browser-like headers, per-host throttling, status-aware
 * retry logic (including Retry-After), WAF detection, and budget support.
 */
export async function fetchUrl(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResult> {
  const {
    userAgent = DEFAULT_USER_AGENT,
    timeout = DEFAULT_TIMEOUT,
    stealth = false,
    requestType = 'fetch',
    baseRetryDelay = 1000,
    maxRetryDelay = 30_000,
  } = options;

  // retries (legacy) takes precedence over maxRetries
  const effectiveMaxRetries =
    options.retries !== undefined ? options.retries : (options.maxRetries ?? DEFAULT_MAX_RETRIES);

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  let lastError: Error | null = null;
  let retryAfterMs = 0;

  for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
    // Backoff before retry attempts
    if (attempt > 0) {
      const backoff =
        retryAfterMs > 0
          ? retryAfterMs
          : Math.min(baseRetryDelay * 2 ** (attempt - 1), maxRetryDelay) +
            Math.random() * 0.3 * baseRetryDelay;
      await sleep(backoff);
      retryAfterMs = 0;
    }

    try {
      const timeoutController = new AbortController();
      const timeoutTimer = setTimeout(() => timeoutController.abort(), timeout);

      const signal = options.signal
        ? combineSignals(timeoutController.signal, options.signal)
        : timeoutController.signal;

      const headers = buildHeaders(url, requestType, userAgent, stealth);

      const makeRequest = async (): Promise<Response> => {
        await hostThrottle.acquireSlot(hostname);
        return fetch(url, { headers, signal, redirect: 'follow' });
      };

      let response: Response;
      try {
        response = await (options.intraLimit
          ? options.intraLimit(makeRequest)
          : makeRequest());
      } finally {
        clearTimeout(timeoutTimer);
      }

      const body = await response.text();
      const contentType = response.headers.get('content-type');

      // WAF detection
      const wafResult = detectWaf(response.status, body, response.url, contentType);

      if (wafResult.signal === 'rate-limited') {
        retryAfterMs = parseRetryAfter(response.headers.get('Retry-After'));
        hostThrottle.increaseDelay(hostname, 2);
        lastError = new Error(`Rate limited (429) by ${hostname}`);
        continue; // retry
      }

      if (wafResult.shouldBlock) {
        hostThrottle.markBlocked(hostname, wafResult.signal!);
        throw new WafBlockedError(hostname, wafResult.signal!);
      }

      const result: FetchResult = {
        status: response.status,
        headers: response.headers,
        body,
        finalUrl: response.url,
        wafSignal: wafResult.signal ?? undefined,
      };

      // Retry on 503 and other 5xx server errors
      if (response.status === 503 || (response.status >= 500 && response.status < 600)) {
        lastError = new Error(`Server error ${response.status} from ${url}`);
        continue;
      }

      // 4xx (except 429 already handled): return as-is, no retry
      return result;
    } catch (err) {
      if (err instanceof WafBlockedError) throw err; // never retry WAF blocks
      if (isAbortError(err)) throw err; // never retry budget/timeout aborts

      lastError = err instanceof Error ? err : new Error(String(err));
      // Network/other errors: will retry on next iteration if attempts remain
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
