/**
 * A small fixed-size pool of decode workers: dispatch a frame to whichever
 * worker is idle, and — same policy as the single-worker "one decode in
 * flight" design this generalizes — drop a frame outright when every
 * worker is currently busy, rather than queuing it. Fountain-coded frames
 * are order-independent and the sender keeps redrawing, so a dropped frame
 * costs nothing but that one frame's chance at a read; queuing it would
 * just mean decoding something stale once a slot frees up.
 *
 * Generic over the worker type (`W`) so the acquire/release bookkeeping is
 * unit-testable with plain objects, independent of `Worker`/WASM — see
 * `Scanner`, which instantiates this with real `Worker`s.
 */
export class DecodeWorkerPool<W> {
  private readonly slots: { worker: W; busy: boolean }[];

  constructor(size: number, createWorker: () => W) {
    const count = Math.max(1, Math.floor(size));
    this.slots = Array.from({ length: count }, () => ({ worker: createWorker(), busy: false }));
  }

  get size(): number {
    return this.slots.length;
  }

  /** Returns an idle worker and marks it busy, or `undefined` if every worker is currently decoding. */
  acquireIdle(): W | undefined {
    const slot = this.slots.find((s) => !s.busy);
    if (!slot) return undefined;
    slot.busy = true;
    return slot.worker;
  }

  /** Marks `worker` idle again — call once its decode result/error has been handled. No-op if `worker` isn't one of this pool's slots (already released, or foreign). */
  release(worker: W): void {
    const slot = this.slots.find((s) => s.worker === worker);
    if (slot) slot.busy = false;
  }

  /** Runs `fn` against every worker in the pool — e.g. `.terminate()` on shutdown. */
  forEach(fn: (worker: W) => void): void {
    for (const slot of this.slots) fn(slot.worker);
  }
}
