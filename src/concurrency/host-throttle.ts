import type { WafSignal } from '../types.js';

export class WafBlockedError extends Error {
  constructor(
    public readonly hostname: string,
    public readonly signal?: WafSignal,
  ) {
    super(`WAF blocked: ${signal ?? 'unknown'} on ${hostname}`);
    this.name = 'WafBlockedError';
  }
}

interface QueueItem {
  resolve: () => void;
  reject: (err: Error) => void;
}

interface HostState {
  lastRequestAt: number;
  minDelay: number;
  blocked: boolean;
  blockedSignal?: WafSignal;
  queue: QueueItem[];
  processing: boolean;
}

class HostThrottle {
  private hosts = new Map<string, HostState>();
  private globalMinDelay = 0;

  configure(minDelayMs: number): void {
    this.globalMinDelay = minDelayMs;
  }

  private getState(hostname: string): HostState {
    let state = this.hosts.get(hostname);
    if (!state) {
      state = {
        lastRequestAt: 0,
        minDelay: this.globalMinDelay,
        blocked: false,
        queue: [],
        processing: false,
      };
      this.hosts.set(hostname, state);
    }
    return state;
  }

  async acquireSlot(hostname: string): Promise<void> {
    const state = this.getState(hostname);

    if (state.blocked) {
      throw new WafBlockedError(hostname, state.blockedSignal);
    }

    if (state.minDelay === 0) {
      state.lastRequestAt = Date.now();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      state.queue.push({ resolve, reject });
      if (!state.processing) {
        void this.processQueue(hostname);
      }
    });
  }

  private async processQueue(hostname: string): Promise<void> {
    const state = this.getState(hostname);
    state.processing = true;

    while (state.queue.length > 0) {
      if (state.blocked) {
        const err = new WafBlockedError(hostname, state.blockedSignal);
        for (const item of state.queue) {
          item.reject(err);
        }
        state.queue = [];
        break;
      }

      const item = state.queue.shift()!;

      const now = Date.now();
      const elapsed = now - state.lastRequestAt;
      const jitter = Math.random() * 0.2 * state.minDelay;
      const waitTime = Math.max(0, state.minDelay + jitter - elapsed);

      if (waitTime > 0) {
        await new Promise((r) => setTimeout(r, waitTime));
      }

      // Re-check after wait
      if (state.blocked) {
        const err = new WafBlockedError(hostname, state.blockedSignal);
        item.reject(err);
        for (const remaining of state.queue) {
          remaining.reject(err);
        }
        state.queue = [];
        break;
      }

      state.lastRequestAt = Date.now();
      item.resolve();
    }

    state.processing = false;
  }

  markBlocked(hostname: string, signal?: WafSignal): void {
    const state = this.getState(hostname);
    state.blocked = true;
    state.blockedSignal = signal;
    const err = new WafBlockedError(hostname, signal);
    for (const item of state.queue) {
      item.reject(err);
    }
    state.queue = [];
  }

  isBlocked(hostname: string): boolean {
    return this.hosts.get(hostname)?.blocked ?? false;
  }

  increaseDelay(hostname: string, factor: number): void {
    const state = this.getState(hostname);
    if (state.minDelay === 0) {
      state.minDelay = 1000;
    }
    state.minDelay = Math.min(state.minDelay * factor, 30_000);
  }

  /** Reset all state (useful for tests). */
  reset(): void {
    this.hosts.clear();
  }
}

export const hostThrottle = new HostThrottle();
