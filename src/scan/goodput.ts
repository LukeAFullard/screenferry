/**
 * Tracks decoded-frame throughput as frames/sec over a trailing window —
 * "goodput" in the sense used by the project's tuning notes: frames that
 * made it past `StreamDecoder`/`NegotiatingStreamDecoder`'s `addFrame`
 * without throwing (a real scanned barcode, not camera noise), not raw
 * per-tick decode attempts. Without this, comparing `fps`/`scanHz` settings
 * was pure guesswork — this turns it into arithmetic.
 */
export class GoodputTracker {
  private readonly windowMs: number;
  private timestamps: number[] = [];

  constructor(windowMs = 2000) {
    this.windowMs = windowMs;
  }

  record(now: number = Date.now()): void {
    this.timestamps.push(now);
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }

  /**
   * Frames/sec over the trailing window, measured as (samples - 1) spans
   * rather than a raw count/windowMs division, so a burst of frames
   * arriving well inside the window isn't diluted by however much of the
   * window they didn't fill. Returns 0 with fewer than 2 samples — there's
   * no interval to measure yet.
   */
  get framesPerSecond(): number {
    if (this.timestamps.length < 2) return 0;
    const span = (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1000;
    return span > 0 ? (this.timestamps.length - 1) / span : 0;
  }

  reset(): void {
    this.timestamps = [];
  }
}
