import { describe, expect, it } from 'vitest';
import { GoodputTracker } from '../../src/scan/goodput';

describe('GoodputTracker', () => {
  it('reports 0 with fewer than two samples', () => {
    const tracker = new GoodputTracker();
    expect(tracker.framesPerSecond).toBe(0);

    tracker.record(1000);
    expect(tracker.framesPerSecond).toBe(0);
  });

  it('computes frames/sec from the span between the oldest and newest sample', () => {
    const tracker = new GoodputTracker();
    // 5 samples spanning 1000ms == 4 intervals / 1s == 4 fps.
    tracker.record(0);
    tracker.record(250);
    tracker.record(500);
    tracker.record(750);
    tracker.record(1000);

    expect(tracker.framesPerSecond).toBe(4);
  });

  it('drops samples older than the trailing window', () => {
    const tracker = new GoodputTracker(1000);
    tracker.record(0);
    tracker.record(2000); // Falls outside record(0)'s window -- (0) is dropped.
    tracker.record(2500);

    // Only the last two samples (2000, 2500) remain: 1 interval / 0.5s == 2 fps.
    expect(tracker.framesPerSecond).toBe(2);
  });

  it('reset() clears all recorded samples', () => {
    const tracker = new GoodputTracker();
    tracker.record(0);
    tracker.record(100);
    expect(tracker.framesPerSecond).toBeGreaterThan(0);

    tracker.reset();
    expect(tracker.framesPerSecond).toBe(0);
  });
});
