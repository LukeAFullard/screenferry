import { describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for `Scanner`'s sampling chain. It is a self-rescheduling
 * `setTimeout` chain rather than a `setInterval`, which gives up two
 * properties `setInterval` had for free — a throwing tick used to be
 * survivable, and `clearInterval` used to be final. Both are re-established
 * in `startSampling`; these pin that behavior down.
 *
 * `Scanner` is exercised through a stubbed `Camera`/`Worker` rather than a
 * real one: what's under test is the scheduling logic, not capture.
 */

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(): void {}

  terminate(): void {
    this.terminated = true;
  }
}

let grabCalls = 0;
let grabImpl: () => Promise<unknown> = () => Promise.resolve(undefined);

class FakeCamera {
  async start(): Promise<void> {}
  stop(): void {}
  get resolution(): undefined {
    return undefined;
  }
  /**
   * Deliberately NOT `async`: an `async` method converts a synchronous throw
   * into a rejected promise, which `tick`'s own `.catch` swallows — that
   * would test nothing. A plain method lets `grabImpl` throw straight out of
   * `tick()`, which is the case `startSampling` has to survive.
   */
  grabLumaFrame(): Promise<unknown> {
    grabCalls++;
    return grabImpl();
  }
  grabFrame(): undefined {
    return undefined;
  }
  async grabNativeFrame(): Promise<undefined> {
    return undefined;
  }
}

vi.stubGlobal('Worker', FakeWorker);
vi.mock('../../src/scan/camera', () => ({ Camera: FakeCamera }));

const { Scanner } = await import('../../src/scan/index');

/** Real timers: the chain's jitter uses Math.random, and we only need a few short ticks. */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Scanner sampling chain', () => {
  it('keeps sampling after a tick throws, instead of dying silently', async () => {
    grabCalls = 0;
    let thrown = 0;
    grabImpl = () => {
      // Throws synchronously out of the tick for the first two samples.
      if (++thrown <= 2) throw new Error('camera exploded');
      return Promise.resolve(undefined);
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const scanner = new Scanner();
    await scanner.start(undefined, { scanHz: 60 });
    await wait(250);
    scanner.stop();

    // An unguarded chain stops dead at the first throw (grabCalls === 1).
    expect(grabCalls).toBeGreaterThan(3);
    warn.mockRestore();
  });

  it('a stop() from inside a tick leaves no timer still rescheduling itself', async () => {
    grabCalls = 0;
    const scanner = new Scanner();
    grabImpl = () => {
      // The hazardous moment: this tick's timer has already fired, so a chain
      // without a generation guard sails past the `clearTimeout` in `stop()`
      // and schedules itself again — a timer that then fires forever, with
      // no `Scanner` left to own it.
      scanner.stop();
      return Promise.resolve(undefined);
    };

    await scanner.start(undefined, { scanHz: 60 });
    await wait(120);

    // `startSampling` calls `Math.random()` exactly once per reschedule, so
    // it counts chain cycles directly. `tick()` itself early-returns once
    // `stop()` has cleared the camera, which is precisely why counting
    // captures instead would see nothing here.
    const randomSpy = vi.spyOn(Math, 'random');
    await wait(250);
    const reschedulesAfterStop = randomSpy.mock.calls.length;
    randomSpy.mockRestore();

    expect(reschedulesAfterStop).toBe(0);
  });

  it('stop() halts sampling permanently', async () => {
    grabCalls = 0;
    grabImpl = () => Promise.resolve(undefined);

    const scanner = new Scanner();
    await scanner.start(undefined, { scanHz: 60 });
    await wait(150);
    scanner.stop();
    const atStop = grabCalls;

    const randomSpy = vi.spyOn(Math, 'random');
    await wait(250);
    const reschedulesAfterStop = randomSpy.mock.calls.length;
    randomSpy.mockRestore();

    expect(grabCalls).toBe(atStop);
    expect(reschedulesAfterStop).toBe(0);
  });

  it('terminates every worker in the pool on stop()', async () => {
    FakeWorker.instances.length = 0;
    grabImpl = () => Promise.resolve(undefined);

    const scanner = new Scanner();
    await scanner.start(undefined, { scanHz: 60, decodeWorkers: 3 });
    expect(FakeWorker.instances).toHaveLength(3);

    scanner.stop();
    expect(FakeWorker.instances.every((w) => w.terminated)).toBe(true);
  });
});
