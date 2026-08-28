import { Camera, type CameraOptions } from './camera';
import type { DecodeWorkerRequest, DecodeWorkerResponse } from './decode-logic';
import { DecodeWorkerPool } from './worker-pool';
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
  /**
   * When true (and `rawFrames` is false), the built-in QR decode worker
   * hands back each decoded symbol's raw bytes (`Uint8Array`) via
   * `onDecode` instead of its text — for a backend (e.g. `qrBinLtBackend`)
   * whose `Frame` is raw bytes rather than a UR part string. Pair this with
   * passing the matching `backend` to `StreamDecoder`/`ReceiverSession`;
   * nothing checks that the two agree. Defaults to `false` (text, v1
   * behavior, unchanged).
   */
  decodeBytes?: boolean;
  /**
   * Number of concurrent decode workers to spread captured frames across
   * (ignored when `rawFrames` is true — that path never touches the
   * decode-worker pool at all). Previously always 1: a 30fps camera fed a
   * single serialized zxing-wasm decoder, so raising `scanHz` past that
   * decoder's own throughput bought nothing — captured frames just piled
   * up waiting on the one worker.
   *
   * Defaults to 1, which is exactly the original single-worker behavior —
   * safe on any device, including one too slow to benefit from more.
   * Raising it lets that many frames decode in parallel (frames are
   * order-independent for a fountain-coded transfer, so out-of-order
   * completion is harmless), which is close to a linear yield increase up
   * to the sender's actual display rate.
   *
   * Not free: each worker instantiates its own zxing-wasm module (~1MB
   * plus a startup delay), and on a low-end device several concurrent
   * decodes can thrash the CPU rather than help. There's no safe universal
   * default above 1 — the right number depends on the device — so this is
   * opt-in and left to the caller (e.g. gate it on
   * `navigator.hardwareConcurrency`, or expose it as a user-facing
   * setting). `scanHz` should generally be raised alongside this: a single
   * worker's decode latency was the de facto ceiling on how much of
   * `scanHz` was actually usable, and that ceiling rises with worker
   * count. Clamped to at least 1.
   */
  decodeWorkers?: number;
}

type DecodeCallback = (frame: Frame) => void;
type Unsubscribe = () => void;

const DEFAULT_SCAN_HZ = 20;
const DEFAULT_DECODE_WORKERS = 1;

/**
 * Camera-facing scanner: captures frames and reports decoded content (QR
 * text or bytes by default, or raw pixels in `rawFrames` mode). Deliberately
 * knows nothing about fountain parts or transfer state — that's
 * `StreamDecoder`'s job (Stage 6) — so this stays testable without a camera
 * (worker protocol only) and swappable (e.g. screen-share frames instead of
 * a camera, later) without touching decode logic.
 */
export class Scanner {
  private camera: Camera | undefined;
  private pool: DecodeWorkerPool<Worker> | undefined;
  private timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  private nextRequestId = 0;
  /**
   * Guards re-entrant *capture* only, not decode -- deliberately separate
   * from the pool's own busy-tracking. Capture must stay serialized (one
   * `grabLumaFrame`/`grabFrame` call at a time; see `Camera`), but a
   * previous round's fix that folded capture and decode into a single
   * "pendingDecode" flag ended up holding that slot for the sum of both,
   * which meant the *next* capture couldn't even start until the current
   * frame had finished decoding -- gone now that decode gating lives in
   * `pool` instead, and needed as its own flag regardless of pool size.
   */
  private captureInFlight = false;
  private pendingRawFrame = false;
  private decodeBytes = false;
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
      this.startSampling(() => this.tickRaw(), scanHz);
      return;
    }

    this.decodeBytes = opts?.decodeBytes ?? false;

    const decodeWorkers = Math.max(1, Math.floor(opts?.decodeWorkers ?? DEFAULT_DECODE_WORKERS));
    this.pool = new DecodeWorkerPool(decodeWorkers, () => this.createDecodeWorker());

    this.startSampling(() => this.tick(), scanHz);
  }

  /** Creates one decode worker and wires its result handling — shared by every slot in `pool`, however large. */
  private createDecodeWorker(): Worker {
    const worker = new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<DecodeWorkerResponse>) => {
      this.pool?.release(worker);
      const message = event.data;

      if (message.type === 'result') {
        // `bytes` can be `null` even when `text` isn't (a decoder that
        // doesn't populate one) -- skip rather than emit a misleading
        // empty buffer in that case.
        if (this.decodeBytes) {
          if (message.bytes) for (const callback of this.callbacks) callback(message.bytes);
        } else {
          for (const callback of this.callbacks) callback(message.text);
        }
      } else if (message.type === 'error') {
        console.warn('[screenferry] decode worker error:', message.message);
      }
    };
    return worker;
  }

  /**
   * Schedules `tickFn` at roughly `1000 / scanHz` ms, via a self-rescheduling
   * `setTimeout` chain rather than a fixed-period `setInterval`. A few ms of
   * random jitter per cycle is added on top of the base interval: a
   * perfectly periodic sampler against a sender that redraws at its own
   * fixed period can phase-lock onto the display's transition window (e.g.
   * the `scanHz: 20` / `fps: 10` defaults sample at 0/50/100/150ms against
   * redraws at 0/100/200ms — every other sample lands mid-transition),
   * tanking read rate for the rest of the transfer. Jitter makes that lock
   * impossible for a couple of lines of code.
   */
  private startSampling(tickFn: () => void, scanHz: number): void {
    const baseMs = 1000 / scanHz;
    const jitterMs = Math.min(baseMs * 0.1, 5);

    const scheduleNext = (): void => {
      const delay = Math.max(0, baseMs + (Math.random() * 2 - 1) * jitterMs);
      this.timeoutHandle = setTimeout(() => {
        tickFn();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  stop(): void {
    if (this.timeoutHandle !== undefined) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }

    this.pool?.forEach((worker) => worker.terminate());
    this.pool = undefined;

    this.camera?.stop();
    this.camera = undefined;

    this.captureInFlight = false;
    this.pendingRawFrame = false;
    this.decodeBytes = false;
  }

  private tick(): void {
    if (this.captureInFlight || !this.camera || !this.pool) return;
    const camera = this.camera;
    const pool = this.pool;

    // Guards capture re-entrancy only -- cleared as soon as the capture
    // itself resolves, regardless of whether a free worker was available to
    // decode it. See `captureInFlight`'s field doc for why this is
    // deliberately not the same flag decode-busyness uses.
    this.captureInFlight = true;

    void camera
      .grabLumaFrame()
      .then((luma) => {
        this.captureInFlight = false;

        // Color carries no information for a QR decode -- the camera's
        // native luminance plane (1 byte/pixel) is preferred over
        // `grabFrame`'s full canvas/RGBA capture whenever it's available;
        // see `Camera.grabLumaFrame`'s doc comment.
        if (luma) {
          const worker = pool.acquireIdle();
          // Every worker is still decoding a previous frame -- drop this
          // one rather than queue it (see `DecodeWorkerPool`'s doc comment).
          if (!worker) return;
          const request: DecodeWorkerRequest = { id: this.nextRequestId++, luma };
          // Transfers `luma.data`'s backing buffer instead of structured-clone
          // copying it -- safe because `grabLumaFrame` hands back a fresh
          // `.slice()`'d buffer nothing else in `Camera` retains a reference
          // to.
          worker.postMessage(request, [luma.data.buffer]);
          return;
        }

        const imageData = camera.grabFrame();
        if (!imageData) return;
        const worker = pool.acquireIdle();
        if (!worker) return;
        const request: DecodeWorkerRequest = { id: this.nextRequestId++, imageData };
        // `grabFrame` returns a freshly allocated `ImageData` per call (via
        // `getImageData`), so transferring its buffer is equally safe here.
        worker.postMessage(request, [imageData.data.buffer]);
      })
      .catch((err: unknown) => {
        console.warn('[screenferry] frame capture failed:', err);
        this.captureInFlight = false;
      });
  }

  private tickRaw(): void {
    // `grabNativeFrame` is async (unlike `grabFrame`) -- guards re-entrancy
    // the same way `tick`/`captureInFlight` does, so a slow capture (or a
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
