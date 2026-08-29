import { describe, expect, it, vi } from 'vitest';
import type { TransferMetrics } from '../src/scan/metrics';

type DecodeCallback = (text: string) => void;

class FakeScanner {
  static instances: FakeScanner[] = [];

  readonly callbacks = new Set<DecodeCallback>();
  started = false;
  stopped = false;
  startedWith: { videoElement: unknown; opts: unknown } | undefined;

  constructor() {
    FakeScanner.instances.push(this);
  }

  onDecode(callback: DecodeCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  async start(videoElement?: unknown, opts?: unknown): Promise<void> {
    this.started = true;
    this.startedWith = { videoElement, opts };
  }

  stop(): void {
    this.stopped = true;
  }

  emit(text: string): void {
    for (const callback of this.callbacks) callback(text);
  }
}

vi.mock('../src/scan/index', () => ({
  Scanner: FakeScanner,
  Camera: class {},
}));

// Imported after the mock so ReceiverSession picks up FakeScanner.
const { ReceiverSession, NegotiatingReceiverSession, encodeToFrames } =
  await import('../src/index');
const { pseudoRandomBytes } = await import('./helpers/bytes');

async function collectFrames(bytes: Uint8Array<ArrayBuffer>, count: number): Promise<string[]> {
  const file = new File([bytes], 'session.bin', { type: 'application/octet-stream' });
  const frames: string[] = [];
  for await (const frame of encodeToFrames(file, { fragmentSize: 150 })) {
    frames.push(frame);
    if (frames.length >= count) break;
  }
  return frames;
}

describe('ReceiverSession', () => {
  it('starts the underlying Scanner and forwards videoElement/opts', async () => {
    FakeScanner.instances.length = 0;
    const session = new ReceiverSession();
    const fakeVideo = {} as HTMLVideoElement;

    await session.start(fakeVideo, { scanHz: 5 });

    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];
    expect(scanner.started).toBe(true);
    expect(scanner.startedWith).toEqual({ videoElement: fakeVideo, opts: { scanHz: 5 } });
  });

  it('ignores stray non-screenferry scans without calling onError', async () => {
    FakeScanner.instances.length = 0;
    const onError = vi.fn();
    const onProgress = vi.fn();
    const session = new ReceiverSession({ onError, onProgress });

    await session.start();
    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];
    scanner.emit('not a ur part at all');

    expect(onError).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('reports progress and completion, then stops the scanner', async () => {
    FakeScanner.instances.length = 0;
    const bytes = pseudoRandomBytes(2000, 31);
    const frames = await collectFrames(bytes, 500);

    const onProgress = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();
    const session = new ReceiverSession({ onProgress, onComplete, onError });

    await session.start();
    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];

    for (const frame of frames) {
      scanner.emit(frame);
      if (scanner.stopped) break;
    }

    // onComplete resolves asynchronously (getResult() is a Promise).
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));

    expect(onProgress).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(scanner.stopped).toBe(true);

    const result = onComplete.mock.calls[0][0] as Blob;
    const resultBytes = new Uint8Array(await result.arrayBuffer());
    expect(resultBytes).toEqual(bytes);
  });

  it('stops listening once settled, ignoring further emitted frames', async () => {
    FakeScanner.instances.length = 0;
    const bytes = pseudoRandomBytes(1000, 32);
    const frames = await collectFrames(bytes, 500);

    const onComplete = vi.fn();
    const session = new ReceiverSession({ onComplete });
    await session.start();
    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];

    for (const frame of frames) {
      scanner.emit(frame);
      if (scanner.stopped) break;
    }
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));

    // Scanner.stop() only marks `stopped`; the fake doesn't clear
    // subscriptions itself, so this proves ReceiverSession's own
    // `settled` guard — not the mock — is what suppresses re-processing.
    scanner.emit(frames[0]);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('tracks goodput (decoded frames/sec) as valid frames are received', async () => {
    FakeScanner.instances.length = 0;
    const bytes = pseudoRandomBytes(2000, 33);
    const frames = await collectFrames(bytes, 500);

    const session = new ReceiverSession();
    await session.start();
    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];

    expect(session.goodput).toBe(0);

    scanner.emit(frames[0]);
    await new Promise((resolve) => setTimeout(resolve, 5));
    scanner.emit(frames[1]);

    expect(session.goodput).toBeGreaterThan(0);
  });

  it('reports transfer metrics alongside progress, at the controlled data rate', async () => {
    FakeScanner.instances.length = 0;
    const bytes = pseudoRandomBytes(4000, 34);
    const frames = await collectFrames(bytes, 500);

    // Frames are fed one per 100ms of fake clock, so the observed rate is
    // arithmetic rather than machine-speed-dependent: whatever the decoder
    // recovers per frame, divided by 0.1s.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);

      const seen: TransferMetrics[] = [];
      const session = new ReceiverSession({ onMetrics: (m) => seen.push(m) });
      await session.start();
      const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];

      for (const [index, frame] of frames.entries()) {
        vi.setSystemTime((index + 1) * 100);
        scanner.emit(frame);
        if (scanner.stopped) break;
      }

      expect(seen.length).toBeGreaterThan(2);

      // elapsedMs is monotonic and tracks the fake clock exactly.
      for (let i = 1; i < seen.length; i++) {
        expect(seen[i].elapsedMs).toBeGreaterThan(seen[i - 1].elapsedMs);
      }
      expect(seen[0].elapsedMs).toBe(100);

      // bytesReceived is monotonic, bounded by the total, and reaches it.
      const total = seen[seen.length - 1].totalBytes;
      expect(total).toBeGreaterThan(0);
      for (let i = 1; i < seen.length; i++) {
        expect(seen[i].bytesReceived).toBeGreaterThanOrEqual(seen[i - 1].bytesReceived);
        expect(seen[i].totalBytes).toBe(total);
        expect(seen[i].bytesReceived).toBeLessThanOrEqual(total!);
      }
      expect(seen[seen.length - 1].bytesReceived).toBe(total);

      // One frame per 100ms of fake clock, so the reported rate must equal
      // the bytes recovered across the tracker's own ~2s window divided by
      // that window's seconds — recomputed here from the emitted events
      // rather than assumed, since which sample anchors the window is the
      // thing being checked.
      const last = seen[seen.length - 1];
      const cutoff = last.elapsedMs - 2000;
      const anchor = [...seen].reverse().find((m) => m.elapsedMs <= cutoff) ?? seen[0];
      const spanSeconds = (last.elapsedMs - anchor.elapsedMs) / 1000;
      const expectedRate = (last.bytesReceived - anchor.bytesReceived) / spanSeconds;

      expect(last.bytesPerSecond).toBeCloseTo(expectedRate, 6);
      expect(last.bytesPerSecond).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fires onMetrics exactly as often as onProgress', async () => {
    FakeScanner.instances.length = 0;
    const bytes = pseudoRandomBytes(2000, 35);
    const frames = await collectFrames(bytes, 500);

    const onProgress = vi.fn();
    const onMetrics = vi.fn();
    const session = new ReceiverSession({ onProgress, onMetrics });
    await session.start();
    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];

    for (const frame of frames) {
      scanner.emit(frame);
      if (scanner.stopped) break;
    }

    expect(onMetrics).toHaveBeenCalledTimes(onProgress.mock.calls.length);
  });

  it('stop() unsubscribes and stops the scanner', async () => {
    FakeScanner.instances.length = 0;
    const session = new ReceiverSession();
    await session.start();
    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];

    session.stop();

    expect(scanner.stopped).toBe(true);
    expect(scanner.callbacks.size).toBe(0);
  });
});

describe('NegotiatingReceiverSession metrics', () => {
  it('reports metrics for a negotiated transfer, ignoring the header frames', async () => {
    FakeScanner.instances.length = 0;
    const bytes = pseudoRandomBytes(3000, 36);
    const file = new File([bytes], 'negotiated.bin', { type: 'application/octet-stream' });

    const frames: string[] = [];
    for await (const frame of encodeToFrames(file, {
      preferredBackend: 'qr-lt',
      fragmentSize: 150,
    })) {
      frames.push(frame as string);
      if (frames.length >= 500) break;
    }

    const seen: TransferMetrics[] = [];
    const onProgress = vi.fn();
    const session = new NegotiatingReceiverSession({
      onProgress,
      onMetrics: (m) => seen.push(m),
    });
    await session.start();
    const scanner = FakeScanner.instances[FakeScanner.instances.length - 1];

    for (const frame of frames) {
      scanner.emit(frame);
      if (scanner.stopped) break;
    }

    // Header/beacon frames are beacons, not payload — they advance neither
    // callback, so the two stay in lockstep here as well.
    expect(seen.length).toBe(onProgress.mock.calls.length);
    expect(seen.length).toBeGreaterThan(2);
    expect(seen[seen.length - 1].totalBytes).toBeGreaterThan(0);
    expect(seen[seen.length - 1].bytesReceived).toBe(seen[seen.length - 1].totalBytes);
  });
});
