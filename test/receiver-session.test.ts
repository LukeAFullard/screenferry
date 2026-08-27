import { describe, expect, it, vi } from 'vitest';

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
const { ReceiverSession, encodeToFrames } = await import('../src/index');
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
