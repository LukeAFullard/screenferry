import { describe, expect, it } from 'vitest';
import { TransferMetricsTracker } from '../../src/scan/metrics';

describe('TransferMetricsTracker', () => {
  it('reports elapsed time from start(), monotonically', () => {
    const tracker = new TransferMetricsTracker();
    tracker.start(1000);

    const elapsed = [1100, 1300, 1900, 2500].map(
      (now) => tracker.sample(0, undefined, now).elapsedMs,
    );

    expect(elapsed).toEqual([100, 300, 900, 1500]);
    for (let i = 1; i < elapsed.length; i++) {
      expect(elapsed[i]).toBeGreaterThan(elapsed[i - 1]);
    }
  });

  it('measures the controlled data rate exactly', () => {
    // 10 KB/s: 1000 bytes every 100ms.
    const tracker = new TransferMetricsTracker();
    tracker.start(0);

    let last;
    for (let i = 0; i <= 20; i++) {
      last = tracker.sample(i * 1000, 100_000, i * 100);
    }

    expect(last?.bytesPerSecond).toBeCloseTo(10_000, 6);
    expect(last?.bytesReceived).toBe(20_000);
    expect(last?.totalBytes).toBe(100_000);
    expect(last?.elapsedMs).toBe(2000);
  });

  it('is 0 bytes/sec until a second sample gives it a span to measure', () => {
    const tracker = new TransferMetricsTracker();
    tracker.start(0);

    expect(tracker.sample(500, 5000, 0).bytesPerSecond).toBe(0);
    expect(tracker.sample(1000, 5000, 100).bytesPerSecond).toBeCloseTo(5000, 6);
  });

  it('reports null totalBytes until the decoder knows it', () => {
    const tracker = new TransferMetricsTracker();
    tracker.start(0);

    expect(tracker.sample(0, undefined, 0).totalBytes).toBeNull();
    expect(tracker.sample(100, 4096, 100).totalBytes).toBe(4096);
  });

  it('tracks the *current* rate rather than a cumulative average after a stall', () => {
    // 1000 B/s for 2s, a 10s stall, then 10_000 B/s. A cumulative average
    // would still read ~1.3 KB/s here; the rolling window must not.
    const tracker = new TransferMetricsTracker(2000);
    tracker.start(0);

    let bytes = 0;
    for (let t = 0; t <= 2000; t += 100) tracker.sample((bytes += 100), 200_000, t);
    const duringStall = tracker.sample(bytes, 200_000, 12_000);
    expect(duringStall.bytesPerSecond).toBeLessThan(1000);

    let last;
    for (let t = 12_100; t <= 14_000; t += 100) last = tracker.sample((bytes += 1000), 200_000, t);

    expect(last?.bytesPerSecond).toBeCloseTo(10_000, 6);
    const cumulative = (last?.bytesReceived ?? 0) / ((last?.elapsedMs ?? 1) / 1000);
    expect(cumulative).toBeLessThan(3000);
  });

  it('keeps one pre-window sample so a slow trickle still has a span to measure', () => {
    // One sample per 3s against a 2s window: without retaining the previous
    // sample there would never be two to difference, and the rate would be
    // stuck at 0 for the whole transfer.
    const tracker = new TransferMetricsTracker(2000);
    tracker.start(0);

    tracker.sample(0, 90_000, 0);
    expect(tracker.sample(3000, 90_000, 3000).bytesPerSecond).toBeCloseTo(1000, 6);
    expect(tracker.sample(6000, 90_000, 6000).bytesPerSecond).toBeCloseTo(1000, 6);
  });

  it('start() clears the previous transfer, so a restart never reports its rate', () => {
    const tracker = new TransferMetricsTracker();
    tracker.start(0);
    tracker.sample(0, 5000, 0);
    tracker.sample(5000, 5000, 100);
    expect(tracker.bytesPerSecond).toBeGreaterThan(0);

    tracker.start(10_000);
    const fresh = tracker.sample(0, undefined, 10_000);
    expect(fresh.bytesPerSecond).toBe(0);
    expect(fresh.elapsedMs).toBe(0);
    expect(fresh.bytesReceived).toBe(0);
  });
});
