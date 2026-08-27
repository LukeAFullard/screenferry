import { Camera, type CameraOptions } from './camera';
import type { DecodeWorkerRequest, DecodeWorkerResponse } from './decode-logic';
import type { Frame } from '../backends/types';

export interface ScannerOptions extends CameraOptions {
  /**
   * How often to sample a frame for decoding, in Hz. Video runs ~30fps and
   * QR display typically runs ~10fps, so decoding every video frame is
   * wasteful — default is roughly 2x the expected sender fps.
   */
  scanHz?: number;
  /**
   * When true, skips the built-in QR text-decode worker entirely and
   * reports each captured camera frame's raw pixels via `onDecode` instead
   * (as an `ImageFrame`) — for a backend (e.g. Cimbar) whose own decoder
   * consumes pixels directly rather than pre-decoded text. Pair this with
   * passing the matching `backend` to `StreamDecoder`/`ReceiverSession`;
   * nothing checks that the two agree. Defaults to `false` (QR text decode,
   * v1 behavior, unchanged).
   */
  rawFrames?: boolean;
}

type DecodeCallback = (frame: Frame) => void;
type Unsubscribe = () => void;

const DEFAULT_SCAN_HZ = 20;

/**
 * Camera-facing scanner: captures frames and reports decoded content (QR
 * text by default, or raw pixels in `rawFrames` mode). Deliberately knows
 * nothing about fountain parts or transfer state — that's `StreamDecoder`'s
 * job (Stage 6) — so this stays testable without a camera (worker protocol
 * only) and swappable (e.g. screen-share frames instead of a camera, later)
 * without touching decode logic.
 */
export class Scanner {
  private camera: Camera | undefined;
  private worker: Worker | undefined;
  private intervalHandle: ReturnType<typeof setInterval> | undefined;
  private nextRequestId = 0;
  private pendingDecode = false;
  private pendingRawFrame = false;
  private readonly callbacks = new Set<DecodeCallback>();

  onDecode(callback: DecodeCallback): Unsubscribe {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /** Actual negotiated camera resolution, once known — see `Camera.resolution`. */
  get resolution(): { width: number; height: number } | undefined {
    return this.camera?.resolution;
  }

  async start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void> {
    this.stop();

    this.camera = new Camera(videoElement);
    await this.camera.start(opts);

    const scanHz = opts?.scanHz ?? DEFAULT_SCAN_HZ;

    if (opts?.rawFrames) {
      this.intervalHandle = setInterval(() => this.tickRaw(), 1000 / scanHz);
      return;
    }

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
    this.pendingRawFrame = false;
  }

  private tick(): void {
    if (this.pendingDecode || !this.camera || !this.worker) return;

    const imageData = this.camera.grabFrame();
    if (!imageData) return;

    this.pendingDecode = true;
    const request: DecodeWorkerRequest = { id: this.nextRequestId++, imageData };
    this.worker.postMessage(request);
  }

  private tickRaw(): void {
    // `grabNativeFrame` is async (unlike `grabFrame`) -- guards re-entrancy
    // the same way `tick`/`pendingDecode` does, so a slow capture (or a
    // scanHz higher than the capture path can keep up with) can't pile up
    // overlapping calls.
    if (this.pendingRawFrame || !this.camera) return;
    const camera = this.camera;

    this.pendingRawFrame = true;
    void camera
      .grabNativeFrame()
      .then((frame) => {
        if (!frame) return;
        for (const callback of this.callbacks) callback(frame);
      })
      .catch((err: unknown) => {
        console.warn('[screenferry] raw frame capture failed:', err);
      })
      .finally(() => {
        this.pendingRawFrame = false;
      });
  }
}

export { Camera } from './camera';
export type { CameraOptions } from './camera';
