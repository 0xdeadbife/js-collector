import pLimit from 'p-limit';
import { EventEmitter } from 'node:events';

export interface QueueProgress {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export interface QueueEvents {
  progress: [QueueProgress];
  taskStart: [string];
  taskComplete: [string];
  taskError: [string, Error];
}

/**
 * Concurrency-limited task queue with progress tracking.
 */
export class TaskQueue extends EventEmitter {
  private limit: ReturnType<typeof pLimit>;
  private _queued = 0;
  private _active = 0;
  private _completed = 0;
  private _failed = 0;
  private _total = 0;

  constructor(concurrency: number) {
    super();
    this.limit = pLimit(concurrency);
  }

  get progress(): QueueProgress {
    return {
      queued: this._queued,
      active: this._active,
      completed: this._completed,
      failed: this._failed,
      total: this._total,
    };
  }

  private emitProgress(): void {
    this.emit('progress', this.progress);
  }

  /**
   * Add a task to the queue. Returns a promise that resolves with the task result.
   */
  async add<T>(id: string, fn: () => Promise<T>): Promise<T> {
    this._total++;
    this._queued++;
    this.emitProgress();

    return this.limit(async () => {
      this._queued--;
      this._active++;
      this.emit('taskStart', id);
      this.emitProgress();

      try {
        const result = await fn();
        this._active--;
        this._completed++;
        this.emit('taskComplete', id);
        this.emitProgress();
        return result;
      } catch (err) {
        this._active--;
        this._failed++;
        this.emit('taskError', id, err instanceof Error ? err : new Error(String(err)));
        this.emitProgress();
        throw err;
      }
    });
  }
}
