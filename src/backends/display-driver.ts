import { renderQrToCanvas, type RenderQrOptions } from './qr-lt/render';
import type { Frame } from './types';

export interface DisplayDriverOptions extends RenderQrOptions {
  /** Frames per second to display at. Default 10. */
  fps?: number;
  /**
   * Called after each frame is rendered, with a 0-based frame index. This is
   * a frame count, not a completion percentage — the sender has no way to
   * see the receiver's actual progress (no feedback channel, by design).
   */
  onFrameSent?: (index: number) => void;
  /** Called if rendering a frame throws an error (e.g. QR code capacity overflow). */
  onError?: (error: unknown) => void;
}

const DEFAULT_FPS = 10;

/**
 * Drives an `AsyncIterable<Frame>` (QR frame strings, or a byte-mode
 * backend's raw fountain parts) onto a canvas at a fixed rate, using
 * `requestAnimationFrame` (not `setInterval`, whose timer drift compounds
 * badly over a multi-minute transfer). Pauses automatically while the tab
 * is hidden and resumes on return, to avoid burning CPU/battery on an
 * animation nobody is looking at.
 */
export class DisplayDriver {
  private readonly fps: number;
  private readonly onFrameSent?: (index: number) => void;
  private readonly onError?: (error: unknown) => void;

  private iterator: AsyncIterator<Frame> | undefined;
  private running = false;
  private rafHandle: number | undefined;
  private frameIndex = 0;
  private lastFrameTime = 0;
  private visibilityListener: (() => void) | undefined;
  /** Guards against a slow render overlapping the next tick's render on the same canvas — see `tick`. */
  private renderInFlight = false;

  constructor(
    private readonly source: AsyncIterable<Frame>,
    private readonly canvas: HTMLCanvasElement,
    private readonly opts?: DisplayDriverOptions,
  ) {
    this.fps = opts?.fps ?? DEFAULT_FPS;
    this.onFrameSent = opts?.onFrameSent;
    this.onError = opts?.onError;
  }

  start(): void {
    if (this.running) return;

    this.running = true;
    this.iterator = this.source[Symbol.asyncIterator]();
    this.lastFrameTime = 0;

    this.visibilityListener = () => {
      if (document.hidden) {
        this.cancelScheduledFrame();
      } else if (this.running && this.rafHandle === undefined) {
        this.scheduleNextTick();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);

    if (!document.hidden) {
      this.scheduleNextTick();
    }
  }

  stop(): void {
    this.running = false;
    this.cancelScheduledFrame();

    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = undefined;
    }

    // Lets a backend release resources tied to this stream via the
    // generator's `finally` block. A no-op for both backends shipped here,
    // whose encoders hold nothing to release.
    void this.iterator?.return?.(undefined);
  }

  private scheduleNextTick(): void {
    this.rafHandle = requestAnimationFrame((now) => this.tick(now));
  }

  private cancelScheduledFrame(): void {
    if (this.rafHandle !== undefined) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = undefined;
    }
  }

  private tick(now: number): void {
    if (!this.running) return;

    // Scheduled immediately, before doing any render work below -- awaiting
    // the render before scheduling the next `rAF` (as this used to, via
    // `renderNextFrame().finally()`) adds a full extra `rAF` of latency
    // after every frame, compounding badly over a multi-minute transfer.
    this.scheduleNextTick();

    const intervalMs = 1000 / this.fps;
    if (now - this.lastFrameTime < intervalMs) return;
    // A previous render is still in flight — skip this tick rather than
    // starting a second concurrent render onto the same canvas; the next
    // tick will pick it up.
    if (this.renderInFlight) return;
    this.lastFrameTime = now;

    this.renderInFlight = true;
    void this.renderNextFrame().finally(() => {
      this.renderInFlight = false;
    });
  }

  private async renderNextFrame(): Promise<void> {
    if (!this.iterator) return;

    let nextResult: IteratorResult<Frame>;
    try {
      nextResult = await this.iterator.next();
    } catch (err) {
      this.onError?.(err);
      return;
    }

    const { value, done } = nextResult;
    if (done || value === undefined || !this.running) return;

    // A string (`qrLtBackend`'s UR part text) or raw bytes
    // (`qrBinLtBackend`'s fountain part, rendered as byte-mode QR data)
    // both go through the same QR renderer — see `renderQrToCanvas`.
    try {
      renderQrToCanvas(value, this.canvas, this.opts);
      this.onFrameSent?.(this.frameIndex);
      this.frameIndex++;
    } catch (err) {
      this.onError?.(err);
    }
  }
}
