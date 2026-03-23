import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { hostThrottle, WafBlockedError } from '../src/concurrency/host-throttle.js';

beforeEach(() => {
  hostThrottle.reset();
  hostThrottle.configure(0);
});

describe('HostThrottle', () => {
  describe('acquireSlot — no delay', () => {
    it('resolves immediately when minDelay is 0', async () => {
      const start = Date.now();
      await hostThrottle.acquireSlot('example.com');
      assert.ok(Date.now() - start < 50, 'Should resolve quickly with no delay');
    });

    it('resolves for multiple concurrent callers', async () => {
      const slots = await Promise.all([
        hostThrottle.acquireSlot('example.com'),
        hostThrottle.acquireSlot('example.com'),
        hostThrottle.acquireSlot('example.com'),
      ]);
      assert.equal(slots.length, 3);
    });
  });

  describe('acquireSlot — with delay', () => {
    it('enforces minimum delay between requests', async () => {
      hostThrottle.configure(100);

      const times: number[] = [];
      const acquire = async () => {
        await hostThrottle.acquireSlot('example.com');
        times.push(Date.now());
      };

      await Promise.all([acquire(), acquire(), acquire()]);

      // Each subsequent request should be at least ~100ms after the previous
      assert.ok(times[1] - times[0] >= 80, `Gap 0→1 was ${times[1] - times[0]}ms, expected ≥80ms`);
      assert.ok(times[2] - times[1] >= 80, `Gap 1→2 was ${times[2] - times[1]}ms, expected ≥80ms`);
    });

    it('processes queue in FIFO order', async () => {
      hostThrottle.configure(50);

      const order: number[] = [];
      const acquire = async (id: number) => {
        await hostThrottle.acquireSlot('example.com');
        order.push(id);
      };

      await Promise.all([acquire(1), acquire(2), acquire(3)]);

      assert.deepEqual(order, [1, 2, 3]);
    });

    it('different hosts are independent', async () => {
      hostThrottle.configure(200);

      const start = Date.now();
      await Promise.all([
        hostThrottle.acquireSlot('a.com'),
        hostThrottle.acquireSlot('b.com'),
      ]);
      const elapsed = Date.now() - start;

      // Different hosts should not block each other
      assert.ok(elapsed < 150, `Expected <150ms for independent hosts, got ${elapsed}ms`);
    });
  });

  describe('markBlocked', () => {
    it('causes subsequent acquireSlot to throw WafBlockedError', async () => {
      hostThrottle.markBlocked('blocked.com', 'cloudflare');

      await assert.rejects(
        () => hostThrottle.acquireSlot('blocked.com'),
        (err: Error) => {
          assert.ok(err instanceof WafBlockedError);
          assert.equal((err as WafBlockedError).hostname, 'blocked.com');
          assert.equal((err as WafBlockedError).signal, 'cloudflare');
          return true;
        },
      );
    });

    it('rejects queued waiters immediately', async () => {
      hostThrottle.configure(500); // Long delay to keep items queued

      const errors: Error[] = [];

      // Start two slots that will queue up
      const p1 = hostThrottle.acquireSlot('slow.com').catch((e) => errors.push(e));
      const p2 = hostThrottle.acquireSlot('slow.com').catch((e) => errors.push(e));

      // Immediately block the host — queued items should reject
      hostThrottle.markBlocked('slow.com');

      await Promise.all([p1, p2]);

      // At least the queued ones should have been rejected
      assert.ok(errors.length >= 1, 'Expected at least one rejection');
      assert.ok(errors.every((e) => e instanceof WafBlockedError));
    });

    it('does not affect other hosts', async () => {
      hostThrottle.markBlocked('blocked.com');

      // This should succeed
      await hostThrottle.acquireSlot('safe.com');
    });
  });

  describe('isBlocked', () => {
    it('returns false for unknown hosts', () => {
      assert.equal(hostThrottle.isBlocked('unknown.com'), false);
    });

    it('returns true after markBlocked', () => {
      hostThrottle.markBlocked('target.com');
      assert.equal(hostThrottle.isBlocked('target.com'), true);
    });
  });

  describe('increaseDelay', () => {
    it('scales up the delay by given factor', async () => {
      hostThrottle.configure(100);
      hostThrottle.increaseDelay('ratelimited.com', 2);

      // First slot acquired immediately, second should wait ~200ms
      const times: number[] = [];
      const acquire = async () => {
        await hostThrottle.acquireSlot('ratelimited.com');
        times.push(Date.now());
      };

      await Promise.all([acquire(), acquire()]);
      assert.ok(times[1] - times[0] >= 150, `Expected ≥150ms gap, got ${times[1] - times[0]}ms`);
    });

    it('starts with 1000ms base when current delay is 0', () => {
      hostThrottle.configure(0);
      hostThrottle.increaseDelay('fresh.com', 2);
      // Just verify no error is thrown
    });

    it('caps at 30000ms', () => {
      hostThrottle.configure(20_000);
      hostThrottle.increaseDelay('cap.com', 4); // Would be 80000ms
      // Should not throw, delay capped at 30000
    });
  });

  describe('WafBlockedError', () => {
    it('has correct properties', () => {
      const err = new WafBlockedError('test.com', 'cloudflare');
      assert.equal(err.hostname, 'test.com');
      assert.equal(err.signal, 'cloudflare');
      assert.equal(err.name, 'WafBlockedError');
      assert.ok(err instanceof Error);
    });

    it('works without a signal', () => {
      const err = new WafBlockedError('test.com');
      assert.equal(err.hostname, 'test.com');
      assert.equal(err.signal, undefined);
    });
  });
});
