import { encodeFileToParts, TransferDecoder } from './codec/transfer';
import { Scanner, type ScannerOptions } from './scan/index';
import type { Frame, TransferBackend } from './backends/types';

export interface EncodeOptions<F extends Frame = string> {
  /** Fragment size (payload bytes per frame). */
  fragmentSize?: number;
  /** Target frame rate in FPS. */
  fps?: number;
  /** Which transfer backend to use. Defaults to `qrLtBackend` (QR + Luby Transform fountain codes). */
  backend?: TransferBackend<F>;
}

/**
 * Envelopes and encodes `file` via the chosen backend, yielding raw frames —
 * UR part strings for the default `qrLtBackend`, rendered pixel data
 * (`ImageFrame`) for `cimbarBackend` — not rendered-to-screen output. This
 * layer is UI-agnostic; rendering the returned frames is the caller's
 * choice (see `DisplayDriver` for a canvas-based one). The stream is
 * infinite (both backends are rateless): the caller decides when it has
 * sent enough and stops pulling.
 */
export async function* encodeToFrames<F extends Frame = string>(
  file: Blob,
  opts?: EncodeOptions<F>,
): AsyncIterable<F> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename = 'name' in file && typeof file.name === 'string' ? file.name : 'file';
  const mimeType = file.type || 'application/octet-stream';

  const parts = await encodeFileToParts<F>(
    bytes,
    { filename, mimeType },
    { maxFragmentLength: opts?.fragmentSize, backend: opts?.backend },
  );
  yield* parts;
}

export { DisplayDriver } from './backends/display-driver';
export type { DisplayDriverOptions } from './backends/display-driver';

export { qrLtBackend } from './backends/qr-lt';
export { cimbarBackend } from './backends/cimbar';
export type { CimbarEncodeOptions } from './backends/cimbar';
export type { Frame, ImageFrame, TransferBackend } from './backends/types';

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
