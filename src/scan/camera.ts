/**
 * One frame captured straight off the camera in its own native pixel
 * format (NV12/I420) — same shape as DOM `ImageData` but planar YUV, and
 * deliberately not typed against `ImageData`, which is RGBA-only. Internal
 * to `Camera`: the only thing that leaves this class is `grabLumaFrame`'s
 * luma plane.
 */
interface NativeFrame {
  data: Uint8Array;
  width: number;
  height: number;
  format: 'nv12' | 'i420';
}

/** Common "1080p" ideal — most webcams/phone cameras support at least this; browsers negotiate down if not. */
const DEFAULT_IDEAL_WIDTH = 1920;
const DEFAULT_IDEAL_HEIGHT = 1080;

/**
 * How long a native capture waits for the frame pump to deliver a frame
 * before giving up and letting the caller fall back to the canvas/RGBA
 * path. Comfortably longer than one frame interval at the 30fps we request
 * (~33ms), so an ordinary inter-frame gap never trips it, but short enough
 * that a genuinely stalled stream doesn't stall scanning with it.
 */
const NATIVE_FRAME_WAIT_MS = 120;

declare global {
  /**
   * Part of the "Insertable Streams for MediaStreamTrack" API — not yet in
   * TS's own DOM lib (unlike `VideoFrame`/`VideoPixelFormat`, which are).
   * Minimal ambient shape for what `Camera`'s native capture path uses: wrapping
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
   * to something like 640x480, which leaves too few pixels per module to
   * read a dense QR frame (a large `fragmentSize`, so a high QR version)
   * reliably, even when the code fills the frame.
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
  /** Freshest frame the pump has delivered and nobody has consumed yet — see `startFramePump`. */
  private latestFrame: VideoFrame | undefined;
  /** Set while the pump loop should keep reading; cleared by `stop()` to end it. */
  private pumpRunning = false;
  /** Resolver for a `takeLatestFrame` caller currently waiting on the next frame, if any. */
  private frameWaiter: (() => void) | undefined;

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
    // `exposureMode`/`focusMode` ask the camera to keep converging rather
    // than lock onto whatever it saw first: an autofocus or exposure hunt
    // across a changing high-contrast pattern is one of the main ways a
    // live transfer stalls mid-stream. They aren't part of the standard
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
   * Best-effort setup for `grabLumaFrame`'s WebCodecs path — silently
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
      this.startFramePump();
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

    // Ends the pump loop and releases anything it still holds. Waking a
    // pending `takeLatestFrame` caller matters: without it, an in-flight
    // capture would sit out its full timeout after `stop()`.
    this.disableNativeCapture();
    const waiter = this.frameWaiter;
    this.frameWaiter = undefined;
    waiter?.();

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
   * Captures one frame's luminance plane only, straight off a native
   * NV12/I420 `VideoFrame` — for a QR decode, where color carries no
   * information at all, capturing and shipping the other 3/4 of an RGBA
   * frame to the decode worker is pure waste. Y is always NV12/I420's first
   * plane,
   * tightly packed at offset 0 with stride === width (verified by
   * `videoFrameToNativeFrame`'s `planesArePacked` check before a frame ever
   * reaches here), so this needs no separate WebCodecs read — just the
   * leading `width * height` bytes of an already-captured native frame.
   *
   * Returns `undefined` when the native capture path itself is unavailable
   * (unsupported browser) or failed for any reason — the caller (`Scanner`)
   * falls back to `grabFrame`'s canvas/RGBA path in that case.
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

  /** The native-capture attempt behind `grabLumaFrame` — `undefined` on any failure or if the native path isn't available, with no RGBA fallback of its own (the caller applies that). */
  private async captureNativeFrame(): Promise<NativeFrame | undefined> {
    if (!this.frameReader) return undefined;

    let videoFrame: VideoFrame | undefined;
    try {
      videoFrame = await this.takeLatestFrame(NATIVE_FRAME_WAIT_MS);
      if (videoFrame) {
        const frame = await this.videoFrameToNativeFrame(videoFrame);
        if (frame) return frame;

        // The frame arrived fine but its layout isn't one we can use
        // (`videoFrameToNativeFrame` returned `undefined`: a format like
        // BGRA, or non-packed planes). Both are properties of the stream,
        // not of this frame, so they will hold for every frame this track
        // ever produces -- shut the native path down rather than decode and
        // discard a full frame on every tick for the rest of the session.
        this.disableNativeCapture();
      }
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

  /** Tears down the native capture path for the rest of this stream's life, leaving callers on the canvas/RGBA fallback. */
  private disableNativeCapture(): void {
    this.pumpRunning = false;
    this.latestFrame?.close();
    this.latestFrame = undefined;

    if (this.frameReader) {
      void this.frameReader.cancel().catch(() => {});
      this.frameReader = undefined;
    }
  }

  /**
   * Continuously drains `frameReader` in the background, keeping only the
   * most recent frame in `latestFrame` and closing whatever it replaces.
   *
   * This exists because the obvious alternative — reading on demand and
   * racing extra `read()`s against a timer to drain the backlog — *leaks
   * a `VideoFrame` on every capture*, and that leak is fatal rather than
   * merely wasteful. Losing a `Promise.race` does not cancel the losing
   * promise: the orphaned `read()` stays pending, later resolves with a
   * real `VideoFrame`, and nothing ever closes it. WebCodecs frame pools
   * are small and fixed (smaller the higher the resolution), so a leak of
   * one frame per capture exhausts the pool within a handful of frames, at
   * which point the track stops producing and *every* subsequent `read()`
   * hangs forever — the camera goes permanently silent, mid-transfer, with
   * no error anywhere. Measured on a 1080p capture: dead after 2 frames.
   *
   * A single long-lived reader loop has exactly one `read()` outstanding at
   * a time and owns every frame it receives, so nothing is ever orphaned:
   * each frame is either handed to a consumer (which closes it) or closed
   * here when a fresher one supersedes it. It also decouples "how fresh is
   * the frame" from "how long does a capture block" — `takeLatestFrame`
   * usually returns immediately with an already-arrived frame, instead of
   * blocking a full camera frame interval the way an on-demand read does.
   */
  private startFramePump(): void {
    const reader = this.frameReader;
    if (!reader) return;

    this.pumpRunning = true;
    void (async () => {
      try {
        while (this.pumpRunning) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          // Lost the race with `stop()` -- don't strand this frame.
          if (!this.pumpRunning) {
            value.close();
            break;
          }

          // Whatever was sitting unconsumed is now stale; closing it here is
          // what keeps the pool from draining.
          this.latestFrame?.close();
          this.latestFrame = value;

          const waiter = this.frameWaiter;
          this.frameWaiter = undefined;
          waiter?.();
        }
      } catch {
        // Reader cancelled by `stop()`, or the track ended — either way the
        // pump is done; `grabLumaFrame` returns `undefined` and its caller
        // falls back to the canvas/RGBA path from here.
      } finally {
        // However the loop ended, no further frames are coming. Clearing this
        // is what stops `takeLatestFrame` from waiting out its full timeout
        // on every subsequent capture against a dead stream.
        this.pumpRunning = false;
        const waiter = this.frameWaiter;
        this.frameWaiter = undefined;
        waiter?.();
      }
    })();
  }

  /**
   * Takes ownership of the freshest frame the pump has, waiting up to
   * `timeoutMs` if none has arrived yet. The caller must `close()` what it
   * gets back. Returns `undefined` on timeout (no frame arrived — a stalled
   * or not-yet-started stream), so callers fall back to the canvas path
   * rather than hanging.
   */
  private async takeLatestFrame(timeoutMs: number): Promise<VideoFrame | undefined> {
    if (!this.latestFrame && this.pumpRunning) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          if (this.frameWaiter === waiter) this.frameWaiter = undefined;
          resolve();
        }, timeoutMs);
        const waiter = (): void => {
          clearTimeout(timer);
          resolve();
        };
        this.frameWaiter = waiter;
      });
    }

    const frame = this.latestFrame;
    this.latestFrame = undefined;
    return frame;
  }

  /**
   * NV12 and I420 are the two layouts this path recognizes -- any other
   * native `VideoFrame.format` (e.g. `'RGBA'`/`'BGRA'` from a browser/camera
   * combo that doesn't expose YUV) returns `undefined` so the caller falls
   * back to the canvas/RGBA path instead of guessing at an unsupported
   * layout.
   *
   * Per the WebCodecs spec, `allocationSize()`/`copyTo()` both default
   * their `rect` option to the frame's *visible* rect, not its
   * `codedWidth`/`codedHeight` -- on cameras where those differ (e.g. a
   * 1080-tall visible frame inside a 1088-tall H.264 macroblock-padded
   * coded frame), reporting `codedWidth`/`codedHeight` alongside a buffer
   * sized for the visible rect desyncs the two: `grabLumaFrame` would then
   * slice a luma plane of the wrong length out of the captured buffer.
   * Report `visibleRect`'s dimensions instead, to match the buffer that was
   * actually captured.
   */
  private async videoFrameToNativeFrame(videoFrame: VideoFrame): Promise<NativeFrame | undefined> {
    const format =
      videoFrame.format === 'NV12' ? 'nv12' : videoFrame.format === 'I420' ? 'i420' : undefined;
    if (!format) return undefined;

    const rect = videoFrame.visibleRect;
    if (!rect) return undefined;
    const { width, height } = rect;

    const data = new Uint8Array(videoFrame.allocationSize());
    const planes = await videoFrame.copyTo(data);

    // `grabLumaFrame` slices the leading `width * height` bytes out of this
    // buffer, which is only the luma plane if that plane is tightly packed
    // (row stride equals width, offset 0) -- true for a typical capture, but
    // not guaranteed by the WebCodecs spec. When it isn't (row padding, a
    // driver that pads differently), fall back to the canvas/RGBA path
    // rather than ship the decoder a misread buffer.
    if (!planesArePacked(planes, width, height, format)) return undefined;

    return { data, width, height, format };
  }
}

/** See `Camera.videoFrameToNativeFrame`'s doc comment. */
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
