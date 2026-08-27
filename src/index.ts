import { encodeFileToParts, TransferDecoder } from './codec/transfer';
import { Scanner, type ScannerOptions } from './scan/index';

export interface EncodeOptions {
  /** Fragment size (payload bytes per frame). */
  fragmentSize?: number;
  /** Target frame rate in FPS. */
  fps?: number;
}

/**
 * Envelopes and fountain-encodes `file`, yielding raw UR part strings —
 * not rendered pixels. This layer is UI-agnostic; rendering the returned
 * strings is the caller's choice (see `DisplayDriver` for a canvas-based
 * one). The stream is infinite (fountain codes are rateless): the caller
 * decides when it has sent enough and stops pulling.
 */
export async function* encodeToFrames(file: Blob, opts?: EncodeOptions): AsyncIterable<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename = 'name' in file && typeof file.name === 'string' ? file.name : 'file';
  const mimeType = file.type || 'application/octet-stream';

  const parts = await encodeFileToParts(
    bytes,
    { filename, mimeType },
    { maxFragmentLength: opts?.fragmentSize },
  );
  yield* parts;
}

export { DisplayDriver } from './qr/display-driver';
export type { DisplayDriverOptions } from './qr/display-driver';

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
export class StreamDecoder {
  private readonly decoder = new TransferDecoder();

  addFrame(data: string): void {
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
 */
export class ReceiverSession {
  private readonly scanner = new Scanner();
  private readonly decoder = new StreamDecoder();
  private readonly callbacks: ReceiverSessionCallbacks;
  private unsubscribe: (() => void) | undefined;
  private settled = false;

  constructor(callbacks: ReceiverSessionCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void> {
    this.settled = false;
    this.unsubscribe = this.scanner.onDecode((text) => this.handleFrame(text));
    await this.scanner.start(videoElement, opts);
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.scanner.stop();
  }

  private handleFrame(text: string): void {
    if (this.settled) return;

    try {
      this.decoder.addFrame(text);
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
