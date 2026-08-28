import { encodeFileToParts, TransferDecoder } from './codec/transfer';
import { Scanner, type ScannerOptions } from './scan/index';
import type { Frame, TransferBackend } from './backends/types';
import {
  backendForId,
  decodeHeaderFrame,
  encodeHeaderFrame,
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
   * Backend-specific encode options (e.g. `CimbarEncodeOptions`), passed
   * through as-is to `backend.encode()` instead of `{ maxFragmentLength:
   * fragmentSize }`. Only meaningful together with `backend`/`preferredBackend`
   * — `qrLtBackend` only understands `maxFragmentLength`.
   */
  backendOptions?: unknown;
}

/**
 * `encodeToFrames`'s negotiated mode (Stage 11): instead of pinning a
 * backend the receiver must already know, `preferredBackend` picks one —
 * `"auto"` tries `cimbarBackend` if it's usable here, falling back to
 * `qrLtBackend` otherwise — and the stream carries a plain-QR header/beacon
 * frame announcing that choice, so `NegotiatingStreamDecoder`/
 * `NegotiatingReceiverSession` on the receiving end never need to be told
 * which backend is in use. See the README's "Backend negotiation" section.
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
  /** Backend-specific encode options (e.g. `CimbarEncodeOptions`) for whichever backend gets resolved — see `EncodeOptions.backendOptions`. */
  backendOptions?: unknown;
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
): AsyncIterable<Frame> {
  const iterator = dataFrames[Symbol.asyncIterator]();
  const header = encodeHeaderFrame(backendId);
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
 * UR part strings for the default `qrLtBackend`, rendered pixel data
 * (`ImageFrame`) for `cimbarBackend` — not rendered-to-screen output. This
 * layer is UI-agnostic; rendering the returned frames is the caller's
 * choice (see `DisplayDriver` for a canvas-based one). The stream is
 * infinite (both backends are rateless): the caller decides when it has
 * sent enough and stops pulling.
 *
 * Passing `preferredBackend` instead of `backend` switches to negotiated
 * mode (Stage 11) — see `NegotiatedEncodeOptions`.
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

  if (opts && isNegotiatedEncodeOptions(opts)) {
    const backend = await resolvePreferredBackend(opts.preferredBackend);
    const parts = await encodeFileToParts(
      bytes,
      { filename, mimeType },
      { maxFragmentLength: opts.fragmentSize, backend, backendOptions: opts.backendOptions },
    );
    const intervalFrames = Math.max(1, opts.headerIntervalFrames ?? DEFAULT_HEADER_INTERVAL_FRAMES);
    yield* interleaveHeaderFrames(parts, backend.id, intervalFrames);
    return;
  }

  const parts = await encodeFileToParts(
    bytes,
    { filename, mimeType },
    {
      maxFragmentLength: opts?.fragmentSize,
      backend: opts?.backend,
      backendOptions: opts?.backendOptions,
    },
  );
  yield* parts;
}

export { DisplayDriver } from './backends/display-driver';
export type { DisplayDriverOptions } from './backends/display-driver';

export { qrLtBackend } from './backends/qr-lt';
export { qrBinLtBackend } from './backends/qr-bin-lt';
export { cimbarBackend } from './backends/cimbar';
export type { CimbarEncodeOptions } from './backends/cimbar';
export type { Frame, ImageFrame, TransferBackend } from './backends/types';
export { probeCimbarAvailable, resolvePreferredBackend } from './backends/negotiation';
export type { PreferredBackend } from './backends/negotiation';

export { Scanner, Camera } from './scan/index';
export type { ScannerOptions, CameraOptions } from './scan/index';

export { IntegrityError } from './codec/errors';

/**
 * Reassembles fountain-encoded UR part strings (from any source — camera
 * scan, screen-share frame, a test harness) back into the original file.
 * `getResult()` throws `IntegrityError` — distinctly from a generic
 * error — if the reassembled bytes fail their checksum; callers should
 * treat that as "offer a retry", not "something is broken."
 */
export class StreamDecoder<F extends Frame = string> {
  private readonly decoder: TransferDecoder<F>;

  constructor(backend?: TransferBackend<F>) {
    this.decoder = new TransferDecoder<F>(backend);
  }

  addFrame(data: F): void {
    this.decoder.receivePart(data);
  }

  /** bc-ur's estimated completion ratio (0-1) — an estimate, not a guarantee. */
  get progress(): number {
    return this.decoder.progress;
  }

  get isComplete(): boolean {
    return this.decoder.isComplete();
  }

  /**
   * Resolves to a `File` (a `Blob` with the envelope's recovered `name`) so
   * callers can trigger a real download without a separate filename
   * channel — e.g. `URL.createObjectURL(file)` + `<a download>`.
   */
  async getResult(): Promise<Blob> {
    const { filename, mimeType, bytes } = await this.decoder.getResult();
    // TS's DOM lib wants BlobPart's buffer typed as exactly ArrayBuffer, not
    // the wider ArrayBufferLike our Uint8Array pipeline carries — real bytes
    // here are always plain ArrayBuffer-backed (never SharedArrayBuffer).
    return new File([bytes as Uint8Array<ArrayBuffer>], filename, { type: mimeType });
  }
}

export interface ReceiverSessionCallbacks {
  /** Called after every frame that advances decode progress. */
  onProgress?: (progress: number) => void;
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
 * `cimbarBackend` transfer instead, pass `backend: cimbarBackend` here
 * *and* `rawFrames: true` in `start()`'s `ScannerOptions` — the two must
 * agree (nothing checks that for you); see `Scanner.rawFrames`.
 */
export class ReceiverSession<F extends Frame = string> {
  private readonly scanner = new Scanner();
  private readonly decoder: StreamDecoder<F>;
  private readonly callbacks: ReceiverSessionCallbacks;
  private unsubscribe: (() => void) | undefined;
  private settled = false;

  constructor(callbacks: ReceiverSessionCallbacks = {}, backend?: TransferBackend<F>) {
    this.callbacks = callbacks;
    this.decoder = new StreamDecoder<F>(backend);
  }

  async start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void> {
    this.settled = false;
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

  private handleFrame(frame: F): void {
    if (this.settled) return;

    try {
      this.decoder.addFrame(frame);
    } catch {
      // Not a screenferry part — stray QR code in frame, misread, etc.
      // Expected in live camera use; keep listening.
      return;
    }

    this.callbacks.onProgress?.(this.decoder.progress);

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
 * Receive-side counterpart to `encodeToFrames`'s `preferredBackend` mode
 * (Stage 11): consumes a heterogeneous `Frame` stream — the sender's
 * plain-QR header/beacon frames interleaved with its chosen backend's data
 * frames — auto-detects which backend is in use, and delegates to an
 * internal `StreamDecoder` for it. The caller never needs to know which
 * backend the sender picked; `StreamDecoder` itself stays useful when the
 * backend is already known/fixed (no negotiation overhead).
 */
export class NegotiatingStreamDecoder {
  private decoder: StreamDecoder<Frame> | undefined;
  private resolvedBackendId: string | undefined;
  private readonly callbacks: NegotiatingStreamDecoderCallbacks;

  constructor(callbacks: NegotiatingStreamDecoderCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /** The backend id announced by the header frame, once resolved — `undefined` until then. */
  get backendId(): string | undefined {
    return this.resolvedBackendId;
  }

  get progress(): number {
    return this.decoder?.progress ?? 0;
  }

  get isComplete(): boolean {
    return this.decoder?.isComplete ?? false;
  }

  addFrame(frame: Frame): void {
    const headerBackendId = decodeHeaderFrame(frame);
    if (headerBackendId !== undefined) {
      if (!this.resolvedBackendId) this.resolve(headerBackendId);
      return; // Header frames are a beacon, not payload -- never handed to a backend decoder.
    }

    if (!this.resolvedBackendId) {
      // The header frame itself can be lost like any other frame. A
      // qrLtBackend data frame (a bc-ur UR part) is indistinguishable from
      // "haven't seen the header yet" except by trying it — anything else
      // (an ImageFrame) can't be qrLtBackend data, so there's nothing
      // useful to do with it until a header arrives.
      if (typeof frame !== 'string') return;
      this.resolve(qrLtBackend.id);
    }

    this.decoder?.addFrame(frame);
  }

  async getResult(): Promise<Blob> {
    if (!this.decoder) {
      throw new Error(
        'NegotiatingStreamDecoder: cannot get result before a backend has been resolved',
      );
    }
    return this.decoder.getResult();
  }

  private resolve(backendId: string): void {
    const backend = backendForId(backendId);
    if (!backend) return; // Unrecognized id (a newer sender, noise) -- keep waiting.

    this.resolvedBackendId = backendId;
    this.decoder = new StreamDecoder<Frame>(backend);
    this.callbacks.onBackendResolved?.(backendId);
  }
}

export interface NegotiatingReceiverSessionCallbacks extends ReceiverSessionCallbacks {
  /** Called once the sender's backend has been detected. */
  onBackendResolved?: (backendId: string) => void;
}

/**
 * Camera-facing counterpart to `encodeToFrames`'s `preferredBackend` mode
 * (Stage 11) — the negotiated equivalent of `ReceiverSession`. Always
 * starts `Scanner` in its default QR text-decode mode (where the header
 * frame always lives); on detecting a non-`qr-lt` backend, restarts
 * `Scanner` in whichever capture mode that backend needs
 * (`scannerOptionsForBackend` — `rawFrames` for an image-based backend like
 * Cimbar, `decodeBytes` for a byte-mode QR backend like `qrBinLtBackend`)
 * and continues the transfer with the right decoder. The caller never
 * chooses a backend up front.
 *
 * The restart briefly stops and re-acquires the camera — unavoidable given
 * `Scanner`'s current design (see the README's Cimbar section on
 * `rawFrames`) — and, like `cimbarBackend` itself, this path has not been
 * exercised against a real camera in this project's test harness.
 */
export class NegotiatingReceiverSession {
  private readonly scanner = new Scanner();
  private readonly decoder: NegotiatingStreamDecoder;
  private readonly callbacks: NegotiatingReceiverSessionCallbacks;
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
    this.videoElement = videoElement;
    this.scannerOpts = opts;
    this.unsubscribe = this.scanner.onDecode((frame) => this.handleFrame(frame));
    await this.scanner.start(videoElement, { ...opts, rawFrames: false, decodeBytes: false });
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

  private handleFrame(frame: Frame): void {
    if (this.settled) return;

    try {
      this.decoder.addFrame(frame);
    } catch {
      // Not a screenferry part — stray QR code in frame, misread, etc.
      // Expected in live camera use; keep listening.
      return;
    }

    this.callbacks.onProgress?.(this.decoder.progress);

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
