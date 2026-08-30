import './env/polyfills';
import { buildEnvelope } from './codec/transfer';
import {
  ChunkedTransferDecoder,
  computeAutoChunkCount,
  encodeChunkedEnvelope,
  type ChunkPicker,
} from './codec/chunked-transfer';
import { Scanner, type ScannerOptions } from './scan/index';
import { GoodputTracker } from './scan/goodput';
import { TransferMetricsTracker, type TransferMetrics } from './scan/metrics';
import type { Frame, TransferBackend } from './backends/types';
import {
  backendForId,
  encodeHeaderFrame,
  parseHeaderFrame,
  resolvePreferredBackend,
  scannerOptionsForBackend,
  type PreferredBackend,
} from './backends/negotiation';
import { qrLtBackend } from './backends/qr-lt';

export interface EncodeOptions<F extends Frame = string> {
  /** Fragment size (payload bytes per frame). Ignored if `backendOptions` is set. */
  fragmentSize?: number;
  /** Target frame rate in FPS. */
  fps?: number;
  /** Which transfer backend to use. Defaults to `qrLtBackend` (QR + Luby Transform fountain codes). */
  backend?: TransferBackend<F>;
  /**
   * Backend-specific encode options, passed through as-is to
   * `backend.encode()` instead of `{ maxFragmentLength: fragmentSize }`.
   * Only meaningful for a custom `backend` — both backends shipped here
   * only understand `maxFragmentLength`.
   */
  backendOptions?: unknown;
  chunked?: boolean;
  chunkCount?: number | 'auto';
  picker?: ChunkPicker;
}

/**
 * `encodeToFrames`'s negotiated mode: instead of pinning a backend the
 * receiver must already know, `preferredBackend` names one — and the stream
 * carries a plain-QR header/beacon frame announcing that choice, so
 * `NegotiatingStreamDecoder`/`NegotiatingReceiverSession` on the receiving
 * end never need to be told which backend is in use. This is what makes it
 * safe to offer `qr-bin-lt` to a receiver whose library version you don't
 * control: it either recognizes the announcement or keeps waiting, rather
 * than silently misreading the data frames. See the README's "Backend
 * negotiation" section.
 */
export interface NegotiatedEncodeOptions {
  /** Fragment size (payload bytes per frame), passed through to the resolved backend. Ignored if `backendOptions` is set. */
  fragmentSize?: number;
  fps?: number;
  preferredBackend: PreferredBackend;
  /**
   * How often (in data frames) to repeat the header/beacon frame, so a
   * receiver that joins mid-stream — or missed the first one — still picks
   * it up quickly. The very first frame is always the header regardless of
   * this value. Default 10.
   */
  headerIntervalFrames?: number;
  /** Backend-specific encode options for whichever backend gets resolved — see `EncodeOptions.backendOptions`. */
  backendOptions?: unknown;
  chunked?: boolean;
  chunkCount?: number | 'auto';
  picker?: ChunkPicker;
}

const DEFAULT_HEADER_INTERVAL_FRAMES = 10;

function isNegotiatedEncodeOptions(
  opts: EncodeOptions<Frame> | NegotiatedEncodeOptions,
): opts is NegotiatedEncodeOptions {
  return 'preferredBackend' in opts;
}

/** Interleaves a repeating header/beacon frame ahead of each pull from `dataFrames` — see `NegotiatedEncodeOptions`. */
async function* interleaveHeaderFrames(
  dataFrames: AsyncIterable<Frame>,
  backendId: string,
  intervalFrames: number,
  chunkCount?: number,
): AsyncIterable<Frame> {
  const iterator = dataFrames[Symbol.asyncIterator]();
  const header = encodeHeaderFrame(backendId, { chunkCount });
  let index = 0;

  for (;;) {
    if (index % intervalFrames === 0) yield header;
    const { value, done } = await iterator.next();
    if (done) return;
    yield value;
    index++;
  }
}

/**
 * Envelopes and encodes `file` via the chosen backend, yielding raw frames —
 * UR part strings for the default `qrLtBackend`, raw `Uint8Array` fountain
 * parts for `qrBinLtBackend` — not rendered-to-screen output. This layer is
 * UI-agnostic; rendering the returned frames is the caller's choice (see
 * `DisplayDriver` for a canvas-based one). The stream is infinite (both
 * backends are rateless): the caller decides when it has sent enough and
 * stops pulling.
 *
 * Passing `preferredBackend` instead of `backend` switches to negotiated
 * mode — see `NegotiatedEncodeOptions`.
 */
export function encodeToFrames(file: Blob, opts: NegotiatedEncodeOptions): AsyncIterable<Frame>;
export function encodeToFrames<F extends Frame = string>(
  file: Blob,
  opts?: EncodeOptions<F>,
): AsyncIterable<F>;
export async function* encodeToFrames(
  file: Blob,
  opts?: EncodeOptions<Frame> | NegotiatedEncodeOptions,
): AsyncIterable<Frame> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename = 'name' in file && typeof file.name === 'string' ? file.name : 'file';
  const mimeType = file.type || 'application/octet-stream';

  const backend =
    opts && isNegotiatedEncodeOptions(opts)
      ? await resolvePreferredBackend(opts.preferredBackend)
      : (opts?.backend ?? qrLtBackend);

  const envelope = await buildEnvelope(
    bytes,
    { filename, mimeType },
    { skipCompression: backend.compressesInternally },
  );

  let effectiveChunkCount = 1;
  if (opts?.chunked) {
    if (typeof opts.chunkCount === 'number') {
      effectiveChunkCount = Math.max(1, Math.floor(opts.chunkCount));
    } else {
      effectiveChunkCount = computeAutoChunkCount(envelope.length, opts.fragmentSize);
    }
  }

  const chunkStream = encodeChunkedEnvelope(
    envelope,
    effectiveChunkCount,
    backend as TransferBackend<Frame>,
    { maxFragmentLength: opts?.fragmentSize, backendOptions: opts?.backendOptions },
    opts?.picker,
  );

  async function* taggedFrames(): AsyncIterable<Frame> {
    for await (const item of chunkStream) {
      yield item.taggedFrame;
    }
  }

  if (opts && isNegotiatedEncodeOptions(opts)) {
    const intervalFrames = Math.max(1, opts.headerIntervalFrames ?? DEFAULT_HEADER_INTERVAL_FRAMES);
    yield* interleaveHeaderFrames(taggedFrames(), backend.id, intervalFrames, effectiveChunkCount);
    return;
  }

  yield* taggedFrames();
}

export { DisplayDriver } from './backends/display-driver';
export type { DisplayDriverOptions } from './backends/display-driver';

export {
  RoundRobinChunkPicker,
  WeightedChunkPicker,
  computeAutoChunkCount,
  encodeChunkedEnvelope,
  ChunkedTransferDecoder,
} from './codec/chunked-transfer';
export type { ChunkPicker } from './codec/chunked-transfer';

export { qrLtBackend } from './backends/qr-lt';
export { qrBinLtBackend } from './backends/qr-bin-lt';
export type { Frame, TransferBackend } from './backends/types';
export { resolvePreferredBackend } from './backends/negotiation';
export type { PreferredBackend } from './backends/negotiation';

export { Scanner, Camera } from './scan/index';
export type { ScannerOptions, CameraOptions } from './scan/index';

export { IntegrityError } from './codec/errors';

export type { TransferMetrics } from './scan/metrics';

/**
 * Reassembles fountain-encoded UR part strings (from any source — camera
 * scan, screen-share frame, a test harness) back into the original file.
 * `getResult()` throws `IntegrityError` — distinctly from a generic
 * error — if the reassembled bytes fail their checksum; callers should
 * treat that as "offer a retry", not "something is broken."
 */
export class StreamDecoder<F extends Frame = string> {
  private readonly decoder: ChunkedTransferDecoder<F>;

  constructor(backend?: TransferBackend<F>, chunkCount = 1) {
    this.decoder = new ChunkedTransferDecoder<F>(chunkCount, backend);
  }

  addFrame(data: F): { chunkId: number; newlyCompleted: boolean } {
    return this.decoder.receiveTaggedFrame(data);
  }

  get completedChunks(): boolean[] {
    return this.decoder.completedChunks;
  }

  get numChunks(): number {
    return this.decoder.numChunks;
  }

  /** bc-ur's estimated completion ratio (0-1) — an estimate, not a guarantee. */
  get progress(): number {
    return this.decoder.progress;
  }

  get isComplete(): boolean {
    return this.decoder.isComplete;
  }

  /**
   * Total envelope bytes the sender is transmitting — `undefined` until the
   * first accepted frame announces it. Wire bytes, not the reconstructed
   * file's size; see `TransferMetrics`.
   */
  get totalBytes(): number | undefined {
    return this.decoder.totalBytes;
  }

  /** Envelope bytes recovered so far. Monotonic; see `TransferMetrics`. */
  get bytesReceived(): number {
    return this.decoder.bytesReceived;
  }

  /**
   * Resolves to a `File` (a `Blob` with the envelope's recovered `name`) so
   * callers can trigger a real download without a separate filename
   * channel — e.g. `URL.createObjectURL(file)` + `<a download>`.
   */
  async getResult(): Promise<Blob> {
    const { filename, mimeType, bytes } = await this.decoder.getResult();
    return new File([bytes as Uint8Array<ArrayBuffer>], filename, { type: mimeType });
  }
}

export interface ReceiverSessionCallbacks {
  /** Called after every frame that advances decode progress. */
  onProgress?: (progress: number) => void;
  onChunkProgress?: (state: {
    chunkCount: number;
    complete: number[];
    completedChunks: boolean[];
  }) => void;
  /**
   * Wall-clock throughput, fired alongside every `onProgress`. Separate
   * from `onProgress` on purpose: that one reports the fountain decoder's
   * completion *estimate*, this one reports real bytes over real time —
   * see `TransferMetrics`. The last event before `onComplete` carries the
   * transfer's final elapsed time, so there's no separate "how long did
   * that take" callback to wait for.
   */
  onMetrics?: (metrics: TransferMetrics) => void;
  onComplete?: (file: Blob) => void;
  /** Includes `IntegrityError` on checksum failure — see `StreamDecoder`. */
  onError?: (error: unknown) => void;
}

/**
 * Convenience wrapper combining `Scanner` (camera) and `StreamDecoder`
 * (data) for the common case: point a camera at a screen, get a `Blob`.
 * `StreamDecoder` alone stays useful for non-camera inputs (tests, a future
 * screen-share receiver) — this class is the camera-specific shortcut.
 *
 * Defaults to the QR text-decode path (`qrLtBackend`). To receive a
 * `qrBinLtBackend` transfer instead, pass `backend: qrBinLtBackend` here
 * *and* `decodeBytes: true` in `start()`'s `ScannerOptions` — the two must
 * agree (nothing checks that for you); see `ScannerOptions.decodeBytes`.
 */
export class ReceiverSession<F extends Frame = string> {
  private readonly scanner = new Scanner();
  private readonly decoder: StreamDecoder<F>;
  private readonly callbacks: ReceiverSessionCallbacks;
  private readonly goodputTracker = new GoodputTracker();
  private readonly metricsTracker = new TransferMetricsTracker();
  private unsubscribe: (() => void) | undefined;
  private settled = false;

  constructor(
    callbacks: ReceiverSessionCallbacks = {},
    backend?: TransferBackend<F>,
    chunkCount = 1,
  ) {
    this.callbacks = callbacks;
    this.decoder = new StreamDecoder<F>(backend, chunkCount);
  }

  async start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void> {
    this.settled = false;
    this.goodputTracker.reset();
    this.metricsTracker.start();
    this.unsubscribe = this.scanner.onDecode((frame) => this.handleFrame(frame as F));
    await this.scanner.start(videoElement, opts);
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.scanner.stop();
  }

  /** Actual negotiated camera resolution, once known — see `Camera.resolution`. */
  get resolution(): { width: number; height: number } | undefined {
    return this.scanner.resolution;
  }

  /** Decoded (accepted) frames/sec over a trailing window — see `GoodputTracker`. */
  get goodput(): number {
    return this.goodputTracker.framesPerSecond;
  }

  private handleFrame(frame: F): void {
    if (this.settled) return;

    let res: { chunkId: number; newlyCompleted: boolean };
    try {
      res = this.decoder.addFrame(frame);
    } catch {
      // Not a screenferry part — stray QR code in frame, misread, etc.
      // Expected in live camera use; keep listening.
      return;
    }

    this.goodputTracker.record();
    this.callbacks.onProgress?.(this.decoder.progress);
    if (res.newlyCompleted || this.decoder.completedChunks.some(Boolean)) {
      const completedIndices = this.decoder.completedChunks
        .map((done, idx) => (done ? idx : -1))
        .filter((idx) => idx >= 0);
      this.callbacks.onChunkProgress?.({
        chunkCount: this.decoder.numChunks,
        complete: completedIndices,
        completedChunks: this.decoder.completedChunks,
      });
    }

    if (this.callbacks.onMetrics) {
      this.callbacks.onMetrics(
        this.metricsTracker.sample(this.decoder.bytesReceived, this.decoder.totalBytes),
      );
    }

    if (this.decoder.isComplete) {
      this.settled = true;
      this.decoder
        .getResult()
        .then((file) => {
          this.stop();
          this.callbacks.onComplete?.(file);
        })
        .catch((err: unknown) => {
          this.stop();
          this.callbacks.onError?.(err);
        });
    }
  }
}

export interface NegotiatingStreamDecoderCallbacks {
  /** Called once, as soon as the sender's backend is known — either from its header frame, or (see `addFrame`) inferred. */
  onBackendResolved?: (backendId: string) => void;
}

/**
 * Receive-side counterpart to `encodeToFrames`'s `preferredBackend` mode:
 * consumes a heterogeneous `Frame` stream — the sender's
 * plain-QR header/beacon frames interleaved with its chosen backend's data
 * frames — auto-detects which backend is in use, and delegates to an
 * internal `StreamDecoder` for it. The caller never needs to know which
 * backend the sender picked; `StreamDecoder` itself stays useful when the
 * backend is already known/fixed (no negotiation overhead).
 */
export class NegotiatingStreamDecoder {
  private decoder: StreamDecoder<Frame> | undefined;
  private resolvedBackendId: string | undefined;
  private resolvedChunkCount = 1;
  private readonly callbacks: NegotiatingStreamDecoderCallbacks;

  constructor(callbacks: NegotiatingStreamDecoderCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /** The backend id announced by the header frame, once resolved — `undefined` until then. */
  get backendId(): string | undefined {
    return this.resolvedBackendId;
  }

  get chunkCount(): number {
    return this.resolvedChunkCount;
  }

  get completedChunks(): boolean[] {
    return this.decoder?.completedChunks ?? [];
  }

  get numChunks(): number {
    return this.decoder?.numChunks ?? 1;
  }

  get progress(): number {
    return this.decoder?.progress ?? 0;
  }

  get isComplete(): boolean {
    return this.decoder?.isComplete ?? false;
  }

  /** See `StreamDecoder.totalBytes` — `undefined` until a backend is resolved and its first frame accepted. */
  get totalBytes(): number | undefined {
    return this.decoder?.totalBytes;
  }

  /** See `StreamDecoder.bytesReceived` — `0` until a backend is resolved. */
  get bytesReceived(): number {
    return this.decoder?.bytesReceived ?? 0;
  }

  addFrame(frame: Frame): { chunkId: number; newlyCompleted: boolean } | undefined {
    const headerInfo = parseHeaderFrame(frame);
    if (headerInfo !== undefined) {
      if (!this.resolvedBackendId) {
        this.resolve(headerInfo.backendId, headerInfo.chunkCount ?? 1);
      }
      return undefined; // Header frames are a beacon, not payload -- never handed to a backend decoder.
    }

    if (!this.resolvedBackendId) {
      if (typeof frame !== 'string') return undefined;
      this.resolve(qrLtBackend.id, 1);
    }

    return this.decoder?.addFrame(frame);
  }

  async getResult(): Promise<Blob> {
    if (!this.decoder) {
      throw new Error(
        'NegotiatingStreamDecoder: cannot get result before a backend has been resolved',
      );
    }
    return this.decoder.getResult();
  }

  private resolve(backendId: string, chunkCount = 1): void {
    const backend = backendForId(backendId);
    if (!backend) return; // Unrecognized id (a newer sender, noise) -- keep waiting.

    this.resolvedBackendId = backendId;
    this.resolvedChunkCount = chunkCount;
    this.decoder = new StreamDecoder<Frame>(backend, chunkCount);
    this.callbacks.onBackendResolved?.(backendId);
  }
}

export interface NegotiatingReceiverSessionCallbacks extends ReceiverSessionCallbacks {
  /** Called once the sender's backend has been detected. */
  onBackendResolved?: (backendId: string) => void;
}

/**
 * Camera-facing counterpart to `encodeToFrames`'s `preferredBackend` mode —
 * the negotiated equivalent of `ReceiverSession`. Always starts `Scanner`
 * in its default QR text-decode mode (where the header frame always
 * lives); on detecting a non-`qr-lt` backend, restarts `Scanner` in
 * whichever decode mode that backend needs (`scannerOptionsForBackend` —
 * `decodeBytes` for a byte-mode QR backend like `qrBinLtBackend`) and
 * continues the transfer with the right decoder. The caller never chooses a
 * backend up front.
 *
 * The restart briefly stops and re-acquires the camera — unavoidable given
 * `Scanner`'s current design, since the decode mode is fixed at
 * `Scanner.start()`.
 */
export class NegotiatingReceiverSession {
  private readonly scanner = new Scanner();
  private readonly decoder: NegotiatingStreamDecoder;
  private readonly callbacks: NegotiatingReceiverSessionCallbacks;
  private readonly goodputTracker = new GoodputTracker();
  private readonly metricsTracker = new TransferMetricsTracker();
  private unsubscribe: (() => void) | undefined;
  private settled = false;
  private videoElement: HTMLVideoElement | undefined;
  private scannerOpts: ScannerOptions | undefined;

  constructor(callbacks: NegotiatingReceiverSessionCallbacks = {}) {
    this.callbacks = callbacks;
    this.decoder = new NegotiatingStreamDecoder({
      onBackendResolved: (backendId) => {
        this.callbacks.onBackendResolved?.(backendId);
        if (backendId !== qrLtBackend.id) void this.switchCaptureMode(backendId);
      },
    });
  }

  async start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void> {
    this.settled = false;
    this.goodputTracker.reset();
    this.metricsTracker.start();
    this.videoElement = videoElement;
    this.scannerOpts = opts;
    this.unsubscribe = this.scanner.onDecode((frame) => this.handleFrame(frame));
    await this.scanner.start(videoElement, { ...opts, decodeBytes: false });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.scanner.stop();
  }

  /** Actual negotiated camera resolution, once known — see `Camera.resolution`. */
  get resolution(): { width: number; height: number } | undefined {
    return this.scanner.resolution;
  }

  /** Decoded (accepted) frames/sec over a trailing window — see `GoodputTracker`. */
  get goodput(): number {
    return this.goodputTracker.framesPerSecond;
  }

  private handleFrame(frame: Frame): void {
    if (this.settled) return;

    let res: { chunkId: number; newlyCompleted: boolean } | undefined;
    try {
      res = this.decoder.addFrame(frame);
    } catch {
      // Not a screenferry part — stray QR code in frame, misread, etc.
      // Expected in live camera use; keep listening.
      return;
    }

    if (res !== undefined) {
      this.goodputTracker.record();
      this.callbacks.onProgress?.(this.decoder.progress);
      if (res.newlyCompleted || this.decoder.completedChunks.some(Boolean)) {
        const completedIndices = this.decoder.completedChunks
          .map((done, idx) => (done ? idx : -1))
          .filter((idx) => idx >= 0);
        this.callbacks.onChunkProgress?.({
          chunkCount: this.decoder.numChunks,
          complete: completedIndices,
          completedChunks: this.decoder.completedChunks,
        });
      }

      if (this.callbacks.onMetrics) {
        this.callbacks.onMetrics(
          this.metricsTracker.sample(this.decoder.bytesReceived, this.decoder.totalBytes),
        );
      }

      if (this.decoder.isComplete) {
        this.settled = true;
        this.decoder
          .getResult()
          .then((file) => {
            this.stop();
            this.callbacks.onComplete?.(file);
          })
          .catch((err: unknown) => {
            this.stop();
            this.callbacks.onError?.(err);
          });
      }
    }
  }

  private async switchCaptureMode(backendId: string): Promise<void> {
    this.scanner.stop();
    try {
      await this.scanner.start(this.videoElement, {
        ...this.scannerOpts,
        ...scannerOptionsForBackend(backendId),
      });
    } catch (err) {
      this.callbacks.onError?.(err);
    }
  }
}
