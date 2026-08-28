import type { ImageFrame } from '../backends/types';

/** Common "1080p" ideal — most webcams/phone cameras support at least this; browsers negotiate down if not. */
const DEFAULT_IDEAL_WIDTH = 1920;
const DEFAULT_IDEAL_HEIGHT = 1080;

declare global {
  /**
   * Part of the "Insertable Streams for MediaStreamTrack" API — not yet in
   * TS's own DOM lib (unlike `VideoFrame`/`VideoPixelFormat`, which are).
   * Minimal ambient shape for what `Camera.grabNativeFrame` uses: wrapping
   * a live camera track's `MediaStreamVideoTrack` as a `ReadableStream` of
   * `VideoFrame`s in the browser's *native* capture format (NV12/I420 on
   * most platforms), with no canvas/RGBA conversion in between.
   */
  class MediaStreamTrackProcessor<T = VideoFrame> {
    constructor(init: { track: MediaStreamTrack });
    readonly readable: ReadableStream<T>;
  }
}

export interface CameraOptions {
  /** Which physical camera to prefer. Defaults to the rear/environment-facing one. */
  facingMode?: 'environment' | 'user';
  /**
   * Requested capture resolution (`ideal`, not a hard minimum — the browser
   * still falls back to whatever the hardware supports). Defaults to a high
   * resolution: with no constraint at all, browsers commonly negotiate down
   * to something like 640x480, which is fine for QR's large modules but
   * leaves too few pixels per cell for `cimbarBackend`'s much finer grid to
   * resolve, even when the code fills the frame.
   */
  width?: number;
  height?: number;
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
  private frameReader: ReadableStreamDefaultReader<VideoFrame> | undefined;

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
    // `exposureMode`/`focusMode` match the constraints the only
    // known-working browser Cimbar receiver (`sz3/libcimbar`'s `recv.js`,
    // `init_video`) requests. Cimbar's fixed-threshold anchor detector
    // (`Scanner::test_pixel` in libcimbar) is far more sensitive than QR to
    // exposure/focus hunting and motion blur, and these are how that
    // reference implementation avoids it. They aren't part of the standard
    // `MediaTrackConstraints` TS type (still draft/experimental), but
    // browsers silently ignore constraint names they don't support, so
    // adding them unconditionally is safe even where they're unsupported.
    // `frameRate` is raised to give headroom for `qrLtBackend` senders that
    // push `DisplayDriverOptions.fps` above the ~13fps a 15fps capture would
    // cap them at; it's just an `ideal`, so browsers/hardware that can't
    // sustain 30fps still negotiate down.
    const videoConstraints: MediaTrackConstraints = {
      facingMode: opts?.facingMode ?? 'environment',
      width: { ideal: opts?.width ?? DEFAULT_IDEAL_WIDTH },
      height: { ideal: opts?.height ?? DEFAULT_IDEAL_HEIGHT },
      aspectRatio: matchMedia('all and (orientation: landscape)').matches ? 16 / 9 : 9 / 16,
      frameRate: { ideal: 30 },
    };
    Object.assign(videoConstraints, { exposureMode: 'continuous', focusMode: 'continuous' });

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    this.video.srcObject = this.stream;
    this.video.playsInline = true;
    this.video.muted = true;
    await this.video.play();

    this.setupNativeFrameReader();

    return this.video;
  }

  /**
   * Best-effort setup for `grabNativeFrame`'s WebCodecs path — silently
   * leaves `frameReader` unset (rather than throwing) on any unsupported
   * browser, so callers always have the canvas/RGBA fallback available.
   */
  private setupNativeFrameReader(): void {
    this.frameReader = undefined;
    if (typeof MediaStreamTrackProcessor === 'undefined' || !this.stream) return;

    const [track] = this.stream.getVideoTracks();
    if (!track) return;

    try {
      const processor = new MediaStreamTrackProcessor({ track });
      this.frameReader = processor.readable.getReader();
    } catch {
      this.frameReader = undefined;
    }
  }

  /** Actual negotiated capture resolution, e.g. for diagnosing a low-resolution fallback. `undefined` before the stream has produced its first frame. */
  get resolution(): { width: number; height: number } | undefined {
    const { videoWidth, videoHeight } = this.video;
    return videoWidth && videoHeight ? { width: videoWidth, height: videoHeight } : undefined;
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.video.srcObject = null;

    if (this.frameReader) {
      void this.frameReader.cancel().catch(() => {});
      this.frameReader = undefined;
    }

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

  /**
   * Captures one frame preferring the camera's *native* pixel format
   * (NV12/I420) straight off a `MediaStreamTrackProcessor`-backed
   * `VideoFrame`, skipping `grabFrame`'s video → `<canvas>` 2D `drawImage`
   * → `getImageData` RGBA round trip entirely — an unnecessary
   * color-processing hop for a format like Cimbar's that only needs 2 bits
   * of color per cell. Falls back to `grabFrame`'s canvas/RGBA path when
   * the native path is unavailable (unsupported browser) or the captured
   * `VideoFrame`'s format isn't one `cimbarBackend` recognizes.
   *
   * Unlike `grabFrame`, this is `async`: reading a `VideoFrame`'s pixel
   * planes (`copyTo`) is inherently asynchronous, and `frameReader` is a
   * push-model `ReadableStream` reader, not a "give me whatever's on
   * screen right now" pull like `<video>` + `drawImage`.
   */
  async grabNativeFrame(): Promise<ImageFrame | undefined> {
    const frame = await this.captureNativeFrame();
    if (frame) return frame;

    const imageData = this.grabFrame();
    if (!imageData) return undefined;

    return {
      data: new Uint8Array(
        imageData.data.buffer,
        imageData.data.byteOffset,
        imageData.data.byteLength,
      ),
      width: imageData.width,
      height: imageData.height,
      format: 'rgba',
    };
  }

  /**
   * Captures one frame's luminance plane only, straight off the same
   * native NV12/I420 capture `grabNativeFrame` uses — for a QR decode,
   * where color carries no information (unlike Cimbar's color-coded
   * cells), capturing and shipping the other 3/4 of an RGBA frame to the
   * decode worker is pure waste. Y is always NV12/I420's first plane,
   * tightly packed at offset 0 with stride === width (verified by
   * `videoFrameToImageFrame`'s `planesArePacked` check before a frame ever
   * reaches here), so this needs no separate WebCodecs read — just the
   * leading `width * height` bytes of an already-captured native frame.
   *
   * Returns `undefined` when the native capture path itself is unavailable
   * (unsupported browser) or failed for any reason, mirroring
   * `grabNativeFrame`'s own fallback — the caller (`Scanner`) falls back to
   * `grabFrame`'s canvas/RGBA path in that case.
   *
   * Uses `.slice()`, not `.subarray()`: a subarray stays a *view* onto
   * `frame.data`'s full NV12/I420 backing buffer, so `postMessage`'s
   * structured clone (even with a transfer list — see `Scanner.tick`)
   * would still serialize all 1.5 bytes/pixel of it, not the 1 this
   * method's return type implies. `.slice()` copies just the luma plane
   * into a fresh, appropriately-sized buffer that's safe for the caller to
   * transfer: nothing else in `Camera` holds a reference to it.
   */
  async grabLumaFrame(): Promise<{ data: Uint8Array; width: number; height: number } | undefined> {
    const frame = await this.captureNativeFrame();
    if (!frame) return undefined;

    return {
      data: frame.data.slice(0, frame.width * frame.height),
      width: frame.width,
      height: frame.height,
    };
  }

  /** Shared native-capture attempt behind `grabNativeFrame`/`grabLumaFrame` — `undefined` on any failure or if the native path isn't available, with no RGBA fallback of its own (each caller applies its own). */
  private async captureNativeFrame(): Promise<ImageFrame | undefined> {
    if (!this.frameReader) return undefined;

    let videoFrame: VideoFrame | undefined;
    try {
      videoFrame = await this.readLatestVideoFrame();
      if (videoFrame) return await this.videoFrameToImageFrame(videoFrame);
    } catch (err) {
      console.warn(
        '[screenferry] native VideoFrame capture failed, falling back to canvas/RGBA:',
        err,
      );
    } finally {
      videoFrame?.close();
    }
    return undefined;
  }

  /**
   * `frameReader.read()` resolves with the *next queued* frame, not "the
   * current one" -- if frames are produced faster than `grabNativeFrame`
   * is called (e.g. a 30fps camera sampled at a lower `scanHz`), a naive
   * single `read()` per call falls further and further behind real time.
   * Waits for at least one frame (so this still blocks like `grabFrame`
   * conceptually does), then drains any additional frames already sitting
   * in the queue -- bounded by racing each further `read()` against an
   * immediately-scheduled timer, so a queue that's caught up (no backlog)
   * doesn't block waiting on the *next* camera frame to arrive.
   */
  private async readLatestVideoFrame(): Promise<VideoFrame | undefined> {
    const reader = this.frameReader;
    if (!reader) return undefined;

    const first = await reader.read();
    if (first.done || !first.value) return undefined;
    let latest = first.value;

    for (;;) {
      const timedOut = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 0));
      const result = await Promise.race([reader.read(), timedOut]);
      if (result === 'timeout' || result.done || !result.value) break;
      latest.close();
      latest = result.value;
    }

    return latest;
  }

  /**
   * `format = 12` (NV12) / `format = 420` (I420) match the pixel-format
   * codes `_cimbard_scan_extract_decode` expects for those layouts (see
   * `module.ts`'s `PIXEL_FORMAT_*` constants) -- any other native
   * `VideoFrame.format` (e.g. `'RGBA'`/`'BGRA'` from a browser/camera combo
   * that doesn't expose YUV) returns `undefined` so the caller falls back
   * to the canvas/RGBA path instead of guessing at an unsupported layout.
   *
   * Per the WebCodecs spec, `allocationSize()`/`copyTo()` both default
   * their `rect` option to the frame's *visible* rect, not its
   * `codedWidth`/`codedHeight` -- on cameras where those differ (e.g. a
   * 1080-tall visible frame inside a 1088-tall H.264 macroblock-padded
   * coded frame), reporting `codedWidth`/`codedHeight` alongside a buffer
   * sized for the visible rect desyncs the two, corrupting the chroma-plane
   * offsets `_cimbard_scan_extract_decode`'s raw `cv::Mat` read assumes.
   * Report `visibleRect`'s dimensions instead, to match the buffer that was
   * actually captured.
   */
  private async videoFrameToImageFrame(videoFrame: VideoFrame): Promise<ImageFrame | undefined> {
    const format =
      videoFrame.format === 'NV12' ? 'nv12' : videoFrame.format === 'I420' ? 'i420' : undefined;
    if (!format) return undefined;

    const rect = videoFrame.visibleRect;
    if (!rect) return undefined;
    const { width, height } = rect;

    const data = new Uint8Array(videoFrame.allocationSize());
    const planes = await videoFrame.copyTo(data);

    // libcimbar's raw `cv::Mat` read over this buffer assumes each plane is
    // tightly packed (row stride equals plane width, no gaps between
    // planes) -- true for a typical capture, but not guaranteed by the
    // WebCodecs spec. When it isn't (row padding, a driver that pads
    // differently), fall back to the canvas/RGBA path rather than hand
    // libcimbar a buffer it will misread.
    if (!planesArePacked(planes, width, height, format)) return undefined;

    return { data, width, height, format };
  }
}

/** See `Camera.videoFrameToImageFrame`'s doc comment. */
function planesArePacked(
  planes: readonly { offset: number; stride: number }[],
  width: number,
  height: number,
  format: 'nv12' | 'i420',
): boolean {
  const chromaWidth = Math.ceil(width / 2);
  const chromaHeight = Math.ceil(height / 2);

  if (format === 'nv12') {
    if (planes.length !== 2) return false;
    const [y, uv] = planes;
    return (
      y.offset === 0 && y.stride === width && uv.offset === width * height && uv.stride === width
    );
  }

  if (planes.length !== 3) return false;
  const [y, u, v] = planes;
  const uOffset = width * height;
  const vOffset = uOffset + chromaWidth * chromaHeight;
  return (
    y.offset === 0 &&
    y.stride === width &&
    u.offset === uOffset &&
    u.stride === chromaWidth &&
    v.offset === vOffset &&
    v.stride === chromaWidth
  );
}
