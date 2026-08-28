import { describe, expect, it } from 'vitest';
import { DecodeWorkerPool } from '../../src/scan/worker-pool';

describe('DecodeWorkerPool', () => {
  it('creates `size` workers via the factory', () => {
    let created = 0;
    const pool = new DecodeWorkerPool(3, () => ({ id: created++ }));

    expect(pool.size).toBe(3);
    expect(created).toBe(3);
  });

  it('clamps size to at least 1, and rounds down a fractional size', () => {
    expect(new DecodeWorkerPool(0, () => ({})).size).toBe(1);
    expect(new DecodeWorkerPool(-5, () => ({})).size).toBe(1);
    expect(new DecodeWorkerPool(2.9, () => ({})).size).toBe(2);
  });

  it('acquireIdle returns a distinct worker per call until the pool is exhausted', () => {
    const pool = new DecodeWorkerPool(2, () => ({}));

    const first = pool.acquireIdle();
    const second = pool.acquireIdle();
    const third = pool.acquireIdle();

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
    expect(third).toBeUndefined();
  });

  it('release() frees a worker up for reacquisition', () => {
    const pool = new DecodeWorkerPool(1, () => ({}));

    const worker = pool.acquireIdle();
    expect(worker).toBeDefined();
    expect(pool.acquireIdle()).toBeUndefined();

    pool.release(worker!);
    expect(pool.acquireIdle()).toBe(worker);
  });

  it('release() on an already-idle or foreign worker is a harmless no-op', () => {
    const pool = new DecodeWorkerPool(1, () => ({}));
    const worker = pool.acquireIdle()!;
    pool.release(worker);

    expect(() => pool.release(worker)).not.toThrow();
    expect(() => pool.release({})).not.toThrow();
    // Still idle -- neither no-op release corrupted the slot.
    expect(pool.acquireIdle()).toBe(worker);
  });

  it('forEach visits every worker exactly once, regardless of busy state', () => {
    const pool = new DecodeWorkerPool(3, () => ({ terminated: false }));
    pool.acquireIdle(); // Leave one busy -- forEach should still reach it.

    const visited: unknown[] = [];
    pool.forEach((worker) => visited.push(worker));

    expect(visited).toHaveLength(3);
  });
});
