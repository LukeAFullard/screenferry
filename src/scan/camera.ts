export interface CameraOptions {
  /** Which physical camera to prefer. Defaults to the rear/environment-facing one. */
  facingMode?: 'environment' | 'user';
}

/**
 * Wraps `getUserMedia` and frame extraction. If no `<video>` element is
 * supplied, creates and manages a hidden one internally purely for frame
 * sampling; a caller that wants a live preview (e.g. `Scanner.start`) can
 * supply its own visible element instead, which then serves both purposes.
 */
export class Camera {
  private readonly video: HTMLVideoElement;
  private readonly ownsVideoElement: boolean;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private stream: MediaStream | undefined;

  constructor(videoElement?: HTMLVideoElement) {
    this.ownsVideoElement = videoElement === undefined;
    this.video = videoElement ?? Camera.createHiddenVideoElement();

    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Camera: failed to acquire a 2D rendering context');
    }
    this.ctx = ctx;
  }

  private static createHiddenVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.style.position = 'absolute';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);
    return video;
  }

  async start(opts?: CameraOptions): Promise<HTMLVideoElement> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: opts?.facingMode ?? 'environment' },
      audio: false,
    });

    this.video.srcObject = this.stream;
    this.video.playsInline = true;
    this.video.muted = true;
    await this.video.play();

    return this.video;
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.video.srcObject = null;

    if (this.ownsVideoElement) {
      this.video.remove();
    }
  }

  /** Draws the current video frame to an offscreen canvas and returns it as `ImageData`. */
  grabFrame(): ImageData | undefined {
    const { videoWidth, videoHeight } = this.video;
    if (videoWidth === 0 || videoHeight === 0) return undefined;

    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;
    this.ctx.drawImage(this.video, 0, 0, videoWidth, videoHeight);

    return this.ctx.getImageData(0, 0, videoWidth, videoHeight);
  }
}
