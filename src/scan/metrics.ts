/**
 * Wall-clock throughput for a receive in progress: how fast bytes are
 * actually arriving, and how long it has taken so far.
 *
 * Deliberately separate from `onProgress`, which reports the fountain
 * decoder's own completion *estimate*. The two answer different questions —
 * "how close am I to done" vs. "how fast is this link" — and mixing them
 * would make both worse: `onProgress` is a redundancy-adjusted heuristic
 * that clamps near the end, while these numbers are real bytes over real
 * milliseconds. See `src/backends/fountain-bytes.ts`.
 */
export interface TransferMetrics {
  /**
   * Envelope bytes recovered so far. These are *wire* bytes — the (usually
   * gzipped) payload plus the envelope header, as the backend frames it —
   * not the reconstructed file's size, which is only known once the
   * transfer completes and can be either larger (compression) or a little
   * smaller (framing overhead) than this. Monotonic.
   */
  bytesReceived: number;
  /**
   * Total envelope bytes the sender is transmitting. `null` until the first
   * frame is accepted, since the count comes from the frames themselves —
   * there is no out-of-band channel to learn it any earlier. Same wire-byte
   * caveat as `bytesReceived`.
   */
  totalBytes: number | null;
  /**
   * Instantaneous rate over a short trailing window (~2s), not a cumulative
   * average. A cumulative average never recovers from a stall — an
   * autofocus hunt or a few seconds of a badly-aimed camera drags it down
   * for the rest of the transfer, which makes it useless for the thing a
   * live readout is for: telling whether what you just changed (moving
   * closer, raising `fps`, switching backend) is helping *now*. Divide
   * `bytesReceived` by `elapsedMs` yourself for the cumulative figure —
   * that is the honest number for a final "took N seconds at M KB/s"
   * summary.
   *
   * `0` until at least two samples exist. Also note this only updates when
   * a frame is accepted: during a total stall the last value persists
   * rather than decaying toward zero, and the drop shows up on the first
   * frame that gets through.
   */
  bytesPerSecond: number;
  /** Milliseconds since `start()` on the session that owns this tracker. */
  elapsedMs: number;
}

const DEFAULT_WINDOW_MS = 2000;

/** One `(timestamp, cumulative bytes)` reading. */
interface Sample {
  at: number;
  bytes: number;
}

/**
 * Builds `TransferMetrics` from successive readings of a decoder's byte
 * counters, keeping a short trailing window of samples for the rate.
 *
 * `now` is injectable on every method purely so tests can drive it
 * deterministically; production callers let it default to `Date.now()`.
 */
export class TransferMetricsTracker {
  private readonly windowMs: number;
  private samples: Sample[] = [];
  private startedAt = 0;

  constructor(windowMs: number = DEFAULT_WINDOW_MS) {
    this.windowMs = windowMs;
  }

  /** Marks t=0 and clears any previous transfer's samples. */
  start(now: number = Date.now()): void {
    this.startedAt = now;
    this.samples = [];
  }

  /** Records a reading and returns the snapshot to hand to `onMetrics`. */
  sample(
    bytesReceived: number,
    totalBytes: number | undefined,
    now: number = Date.now(),
  ): TransferMetrics {
    this.samples.push({ at: now, bytes: bytesReceived });
    this.trim(now);

    return {
      bytesReceived,
      totalBytes: totalBytes ?? null,
      bytesPerSecond: this.bytesPerSecond,
      elapsedMs: Math.max(0, now - this.startedAt),
    };
  }

  /** Rate across the retained window — see `TransferMetrics.bytesPerSecond`. */
  get bytesPerSecond(): number {
    if (this.samples.length < 2) return 0;

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const spanMs = last.at - first.at;
    if (spanMs <= 0) return 0;

    return ((last.bytes - first.bytes) / spanMs) * 1000;
  }

  /**
   * Drops samples that have aged out, keeping exactly one that is already
   * at or older than the cutoff. That retained sample is what the rate is
   * measured *from* — without it the window would shrink to only the
   * samples strictly inside it, and a slow transfer (fewer samples than the
   * window holds) would report from a span much shorter than the window, or
   * from nothing at all.
   *
   * The comparison is `<=`, not `<`: with `<`, a sample landing exactly on
   * the cutoff kept its own predecessor alive too, so a stall long enough
   * to push samples apart left an anchor far outside the window and the
   * "rolling" rate silently became a cumulative one — the exact failure
   * this window exists to avoid.
   */
  private trim(now: number): void {
    const cutoff = now - this.windowMs;
    let stale = 0;
    while (stale + 1 < this.samples.length && this.samples[stale + 1].at <= cutoff) {
      stale++;
    }
    if (stale > 0) this.samples.splice(0, stale);
  }
}
