import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TaskQueue } from '../src/concurrency/queue.js';

describe('TaskQueue', () => {
  it('respects concurrency limit', async () => {
    const queue = new TaskQueue(2);
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const tasks = Array.from({ length: 6 }, (_, i) =>
      queue.add(`task-${i}`, async () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise((r) => setTimeout(r, 50));
        currentConcurrent--;
        return i;
      }),
    );

    await Promise.all(tasks);
    assert.ok(maxConcurrent <= 2, `Max concurrent was ${maxConcurrent}, expected <= 2`);
  });

  it('tracks progress correctly', async () => {
    const queue = new TaskQueue(3);
    const progressUpdates: { completed: number; total: number }[] = [];

    queue.on('progress', (p) => {
      progressUpdates.push({ completed: p.completed, total: p.total });
    });

    const tasks = Array.from({ length: 4 }, (_, i) =>
      queue.add(`task-${i}`, async () => {
        await new Promise((r) => setTimeout(r, 10));
        return i;
      }),
    );

    await Promise.all(tasks);

    const final = progressUpdates[progressUpdates.length - 1];
    assert.equal(final.completed, 4);
    assert.equal(final.total, 4);
  });

  it('emits taskStart and taskComplete events', async () => {
    const queue = new TaskQueue(1);
    const started: string[] = [];
    const completed: string[] = [];

    queue.on('taskStart', (id) => started.push(id));
    queue.on('taskComplete', (id) => completed.push(id));

    await queue.add('test-1', async () => 'done');

    assert.deepEqual(started, ['test-1']);
    assert.deepEqual(completed, ['test-1']);
  });

  it('emits taskError on failure', async () => {
    const queue = new TaskQueue(1);
    const errors: string[] = [];

    queue.on('taskError', (id) => errors.push(id));

    try {
      await queue.add('fail-task', async () => {
        throw new Error('test error');
      });
    } catch {
      // Expected
    }

    assert.deepEqual(errors, ['fail-task']);
    assert.equal(queue.progress.failed, 1);
  });

  it('returns task results', async () => {
    const queue = new TaskQueue(2);

    const result = await queue.add('task', async () => 42);
    assert.equal(result, 42);
  });
});
