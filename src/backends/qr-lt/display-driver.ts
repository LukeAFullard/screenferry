import { renderQrToCanvas, type RenderQrOptions } from './render';

export interface DisplayDriverOptions extends RenderQrOptions {
  /** Frames per second to display at. Default 10. */
  fps?: number;
  /**
   * Called after each frame is rendered, with a 0-based frame index. This is
   * a frame count, not a completion percentage — the sender has no way to
   * see the receiver's actual progress (no feedback channel, by design).
   */
  onFrameSent?: (index: number) => void;
}

const DEFAULT_FPS = 10;

/**
 * Drives an `AsyncIterable<string>` of QR frame contents onto a canvas at a
 * fixed rate, using `requestAnimationFrame` (not `setInterval`, whose timer
 * drift compounds badly over a multi-minute transfer). Pauses automatically
 * while the tab is hidden and resumes on return, to avoid burning CPU/battery
 * on an animation nobody is looking at.
 */
export class DisplayDriver {
  private readonly fps: number;
  private readonly onFrameSent?: (index: number) => void;

  private iterator: AsyncIterator<string> | undefined;
  private running = false;
  private rafHandle: number | undefined;
  private frameIndex = 0;
  private lastFrameTime = 0;
  private visibilityListener: (() => void) | undefined;

  constructor(
    private readonly source: AsyncIterable<string>,
    private readonly canvas: HTMLCanvasElement,
    private readonly opts?: DisplayDriverOptions,
  ) {
    this.fps = opts?.fps ?? DEFAULT_FPS;
    this.onFrameSent = opts?.onFrameSent;
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

    const intervalMs = 1000 / this.fps;
    if (now - this.lastFrameTime < intervalMs) {
      this.scheduleNextTick();
      return;
    }
    this.lastFrameTime = now;

    void this.renderNextFrame().finally(() => {
      if (this.running) this.scheduleNextTick();
    });
  }

  private async renderNextFrame(): Promise<void> {
    if (!this.iterator) return;

    const { value, done } = await this.iterator.next();
    if (done || value === undefined || !this.running) return;

    renderQrToCanvas(value, this.canvas, this.opts);
    this.onFrameSent?.(this.frameIndex);
    this.frameIndex++;
  }
}
