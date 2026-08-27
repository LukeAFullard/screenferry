import { Camera, type CameraOptions } from './camera';
import type { DecodeWorkerRequest, DecodeWorkerResponse } from './decode-logic';

export interface ScannerOptions extends CameraOptions {
  /**
   * How often to sample a frame for decoding, in Hz. Video runs ~30fps and
   * QR display typically runs ~10fps, so decoding every video frame is
   * wasteful — default is roughly 2x the expected sender fps.
   */
  scanHz?: number;
}

type DecodeCallback = (text: string) => void;
type Unsubscribe = () => void;

const DEFAULT_SCAN_HZ = 20;

/**
 * Camera-facing scanner: captures frames and reports decoded barcode text.
 * Deliberately knows nothing about fountain parts or transfer state — that's
 * `StreamDecoder`'s job (Stage 6) — so this stays testable without a camera
 * (worker protocol only) and swappable (e.g. screen-share frames instead of
 * a camera, later) without touching decode logic.
 */
export class Scanner {
  private camera: Camera | undefined;
  private worker: Worker | undefined;
  private intervalHandle: ReturnType<typeof setInterval> | undefined;
  private nextRequestId = 0;
  private pendingDecode = false;
  private readonly callbacks = new Set<DecodeCallback>();

  onDecode(callback: DecodeCallback): Unsubscribe {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  async start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void> {
    this.stop();

    this.camera = new Camera(videoElement);
    await this.camera.start(opts);

    this.worker = new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<DecodeWorkerResponse>) => {
      this.pendingDecode = false;
      const message = event.data;

      if (message.type === 'result') {
        for (const callback of this.callbacks) callback(message.text);
      } else if (message.type === 'error') {
        console.warn('[screenferry] decode worker error:', message.message);
      }
    };

    const scanHz = opts?.scanHz ?? DEFAULT_SCAN_HZ;
    this.intervalHandle = setInterval(() => this.tick(), 1000 / scanHz);
  }

  stop(): void {
    if (this.intervalHandle !== undefined) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }

    this.worker?.terminate();
    this.worker = undefined;

    this.camera?.stop();
    this.camera = undefined;

    this.pendingDecode = false;
  }

  private tick(): void {
    if (this.pendingDecode || !this.camera || !this.worker) return;

    const imageData = this.camera.grabFrame();
    if (!imageData) return;

    this.pendingDecode = true;
    const request: DecodeWorkerRequest = { id: this.nextRequestId++, imageData };
    this.worker.postMessage(request);
  }
}

export { Camera } from './camera';
export type { CameraOptions } from './camera';
