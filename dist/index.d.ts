/** Reassembles a stream of `Frame`s back into the original envelope bytes. */
declare interface BackendDecoder<F extends Frame = Frame> {
    addFrame(frame: F): void;
    readonly isComplete: boolean;
    /** Estimated completion ratio (0-1), if the backend can produce one. */
    readonly progress?: number;
    /** Envelope-encoded bytes — not yet decompressed or checksum-verified. */
    getResult(): Uint8Array;
}

/**
 * Wraps `getUserMedia` and frame extraction. If no `<video>` element is
 * supplied, creates and manages a hidden one internally purely for frame
 * sampling; a caller that wants a live preview (e.g. `Scanner.start`) can
 * supply its own visible element instead, which then serves both purposes.
 */
export declare class Camera {
    private readonly video;
    private readonly ownsVideoElement;
    private readonly canvas;
    private readonly ctx;
    private stream;
    private frameReader;
    constructor(videoElement?: HTMLVideoElement);
    private static createHiddenVideoElement;
    start(opts?: CameraOptions): Promise<HTMLVideoElement>;
    /**
     * Best-effort setup for `grabNativeFrame`'s WebCodecs path — silently
     * leaves `frameReader` unset (rather than throwing) on any unsupported
     * browser, so callers always have the canvas/RGBA fallback available.
     */
    private setupNativeFrameReader;
    /** Actual negotiated capture resolution, e.g. for diagnosing a low-resolution fallback. `undefined` before the stream has produced its first frame. */
    get resolution(): {
        width: number;
        height: number;
    } | undefined;
    stop(): void;
    /** Draws the current video frame to an offscreen canvas and returns it as `ImageData`. */
    grabFrame(): ImageData | undefined;
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
    grabNativeFrame(): Promise<ImageFrame | undefined>;
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
    grabLumaFrame(): Promise<{
        data: Uint8Array;
        width: number;
        height: number;
    } | undefined>;
    /** Shared native-capture attempt behind `grabNativeFrame`/`grabLumaFrame` — `undefined` on any failure or if the native path isn't available, with no RGBA fallback of its own (each caller applies its own). */
    private captureNativeFrame;
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
    private readLatestVideoFrame;
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
    private videoFrameToImageFrame;
}

export declare interface CameraOptions {
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

export declare const cimbarBackend: TransferBackend<ImageFrame>;

export declare interface CimbarEncodeOptions {
    /**
     * Symbol resolution (square). Defaults to `DEFAULT_FRAME_SIZE`. The
     * actual render window/canvas is `frameSize + WINDOW_MARGIN_PX` — see
     * `initEncoder` — matching libcimbar's own default window sizing.
     */
    frameSize?: number;
    /**
     * libcimbar encode mode (`_cimbare_configure`'s first argument). Defaults
     * to `DEFAULT_MODE` (`68`, "mode B") — unchanged from before this field
     * existed. Set to `67` ("Bm") to trade ~30% throughput for the broader
     * camera compatibility it's documented upstream as built for; the
     * receiving `CimbarDecoder` doesn't need to be told which mode was used —
     * it cycles through candidates per frame until one decodes.
     */
    mode?: number;
    /**
     * zstd compression level (0-22) for libcimbar's own internal compression
     * (`_cimbare_configure`'s second argument) — out of that range (the
     * default, matching every prior call site's hardcoded `-1`) selects
     * libcimbar's own default level. `cimbarBackend` skips screenferry's own
     * gzip pass for this backend (see `compressesInternally` on the exported
     * `TransferBackend`) since gzipped bytes are incompressible and would
     * make this internal pass pure wasted CPU, so this is the only
     * compression the payload gets.
     */
    compressionLevel?: number;
}

declare type DecodeCallback = (frame: Frame) => void;

/**
 * Drives an `AsyncIterable<Frame>` (QR frame strings, or an image-based
 * backend's rendered pixel data) onto a canvas at a fixed rate, using
 * `requestAnimationFrame` (not `setInterval`, whose timer drift compounds
 * badly over a multi-minute transfer). Pauses automatically while the tab
 * is hidden and resumes on return, to avoid burning CPU/battery on an
 * animation nobody is looking at.
 */
export declare class DisplayDriver {
    private readonly source;
    private readonly canvas;
    private readonly opts?;
    private readonly fps;
    private readonly onFrameSent?;
    private iterator;
    private running;
    private rafHandle;
    private frameIndex;
    private lastFrameTime;
    private visibilityListener;
    /** Guards against a slow render (e.g. Cimbar's WebGL readback) overlapping the next tick's render on the same canvas — see `tick`. */
    private renderInFlight;
    constructor(source: AsyncIterable<Frame>, canvas: HTMLCanvasElement, opts?: DisplayDriverOptions | undefined);
    start(): void;
    stop(): void;
    private scheduleNextTick;
    private cancelScheduledFrame;
    private tick;
    private renderNextFrame;
    private renderImageFrame;
}

export declare interface DisplayDriverOptions extends RenderQrOptions {
    /** Frames per second to display at. Default 10. */
    fps?: number;
    /**
     * Called after each frame is rendered, with a 0-based frame index. This is
     * a frame count, not a completion percentage — the sender has no way to
     * see the receiver's actual progress (no feedback channel, by design).
     */
    onFrameSent?: (index: number) => void;
}

declare type EccLevel = 'L' | 'M' | 'Q' | 'H';

export declare interface EncodeOptions<F extends Frame = string> {
    /** Fragment size (payload bytes per frame). Ignored if `backendOptions` is set. */
    fragmentSize?: number;
    /** Target frame rate in FPS. */
    fps?: number;
    /** Which transfer backend to use. Defaults to `qrLtBackend` (QR + Luby Transform fountain codes). */
    backend?: TransferBackend<F>;
    /**
     * Backend-specific encode options (e.g. `CimbarEncodeOptions`), passed
     * through as-is to `backend.encode()` instead of `{ maxFragmentLength:
     * fragmentSize }`. Only meaningful together with `backend`/`preferredBackend`
     * — `qrLtBackend` only understands `maxFragmentLength`.
     */
    backendOptions?: unknown;
}

/**
 * Envelopes and encodes `file` via the chosen backend, yielding raw frames —
 * UR part strings for the default `qrLtBackend`, rendered pixel data
 * (`ImageFrame`) for `cimbarBackend` — not rendered-to-screen output. This
 * layer is UI-agnostic; rendering the returned frames is the caller's
 * choice (see `DisplayDriver` for a canvas-based one). The stream is
 * infinite (both backends are rateless): the caller decides when it has
 * sent enough and stops pulling.
 *
 * Passing `preferredBackend` instead of `backend` switches to negotiated
 * mode (Stage 11) — see `NegotiatedEncodeOptions`.
 */
export declare function encodeToFrames(file: Blob, opts: NegotiatedEncodeOptions): AsyncIterable<Frame>;

export declare function encodeToFrames<F extends Frame = string>(file: Blob, opts?: EncodeOptions<F>): AsyncIterable<F>;

/**
 * A single unit of transmitted data. `qrLtBackend`'s frame is a string (a
 * bytewords-text UR part, meant to be rendered as a QR code); `qrBinLtBackend`'s
 * is a raw `Uint8Array` (a fountain part meant to be rendered as *byte-mode*
 * QR data instead — see its doc comment); an image-based backend (e.g.
 * Cimbar) hands back rendered pixel data (`ImageFrame`) instead — kept
 * generic here so the interface doesn't bake in "frames are always text."
 */
export declare type Frame = string | ImageFrame | Uint8Array;

/**
 * Raw pixel data for one rendered/captured frame — same layout as DOM
 * `ImageData` (RGBA, row-major, opaque), but not typed against `ImageData`
 * itself so this module stays usable somewhere without the DOM lib (a
 * decode worker, a future non-browser host).
 */
export declare interface ImageFrame {
    data: Uint8Array;
    width: number;
    height: number;
    /**
     * Pixel layout `data` is in. Defaults to `'rgba'` when omitted — every
     * producer except `Camera.grabNativeFrame`'s WebCodecs path (this
     * project's own encoders, `DisplayDriver`'s canvas-based sender path,
     * `Camera.grabFrame`'s canvas/`getImageData` fallback) always emits RGBA,
     * so only that one native-capture path needs to set this explicitly.
     */
    format?: 'rgba' | 'nv12' | 'i420';
}

/** Thrown when a fully-reassembled transfer fails its SHA-256 integrity check. */
export declare class IntegrityError extends Error {
    constructor(message?: string);
}

/**
 * `encodeToFrames`'s negotiated mode (Stage 11): instead of pinning a
 * backend the receiver must already know, `preferredBackend` picks one —
 * `"auto"` tries `cimbarBackend` if it's usable here, falling back to
 * `qrLtBackend` otherwise — and the stream carries a plain-QR header/beacon
 * frame announcing that choice, so `NegotiatingStreamDecoder`/
 * `NegotiatingReceiverSession` on the receiving end never need to be told
 * which backend is in use. See the README's "Backend negotiation" section.
 */
export declare interface NegotiatedEncodeOptions {
    /** Fragment size (payload bytes per frame), passed through to the resolved backend. Ignored if `backendOptions` is set. */
    fragmentSize?: number;
    fps?: number;
    preferredBackend: PreferredBackend;
    /**
     * How often (in data frames) to repeat the header/beacon frame, so a
     * receiver that joins mid-stream — or missed the first one — still picks
     * it up quickly. The very first frame is always the header regardless of
     * this value. Default 10.
     */
    headerIntervalFrames?: number;
    /** Backend-specific encode options (e.g. `CimbarEncodeOptions`) for whichever backend gets resolved — see `EncodeOptions.backendOptions`. */
    backendOptions?: unknown;
}

/**
 * Camera-facing counterpart to `encodeToFrames`'s `preferredBackend` mode
 * (Stage 11) — the negotiated equivalent of `ReceiverSession`. Always
 * starts `Scanner` in its default QR text-decode mode (where the header
 * frame always lives); on detecting a non-`qr-lt` backend, restarts
 * `Scanner` in whichever capture mode that backend needs
 * (`scannerOptionsForBackend` — `rawFrames` for an image-based backend like
 * Cimbar, `decodeBytes` for a byte-mode QR backend like `qrBinLtBackend`)
 * and continues the transfer with the right decoder. The caller never
 * chooses a backend up front.
 *
 * The restart briefly stops and re-acquires the camera — unavoidable given
 * `Scanner`'s current design (see the README's Cimbar section on
 * `rawFrames`) — and, like `cimbarBackend` itself, this path has not been
 * exercised against a real camera in this project's test harness.
 */
export declare class NegotiatingReceiverSession {
    private readonly scanner;
    private readonly decoder;
    private readonly callbacks;
    private readonly goodputTracker;
    private unsubscribe;
    private settled;
    private videoElement;
    private scannerOpts;
    constructor(callbacks?: NegotiatingReceiverSessionCallbacks);
    start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void>;
    stop(): void;
    /** Actual negotiated camera resolution, once known — see `Camera.resolution`. */
    get resolution(): {
        width: number;
        height: number;
    } | undefined;
    /** Decoded (accepted) frames/sec over a trailing window — see `GoodputTracker`. */
    get goodput(): number;
    private handleFrame;
    private switchCaptureMode;
}

export declare interface NegotiatingReceiverSessionCallbacks extends ReceiverSessionCallbacks {
    /** Called once the sender's backend has been detected. */
    onBackendResolved?: (backendId: string) => void;
}

/**
 * Receive-side counterpart to `encodeToFrames`'s `preferredBackend` mode
 * (Stage 11): consumes a heterogeneous `Frame` stream — the sender's
 * plain-QR header/beacon frames interleaved with its chosen backend's data
 * frames — auto-detects which backend is in use, and delegates to an
 * internal `StreamDecoder` for it. The caller never needs to know which
 * backend the sender picked; `StreamDecoder` itself stays useful when the
 * backend is already known/fixed (no negotiation overhead).
 */
export declare class NegotiatingStreamDecoder {
    private decoder;
    private resolvedBackendId;
    private readonly callbacks;
    constructor(callbacks?: NegotiatingStreamDecoderCallbacks);
    /** The backend id announced by the header frame, once resolved — `undefined` until then. */
    get backendId(): string | undefined;
    get progress(): number;
    get isComplete(): boolean;
    addFrame(frame: Frame): void;
    getResult(): Promise<Blob>;
    private resolve;
}

export declare interface NegotiatingStreamDecoderCallbacks {
    /** Called once, as soon as the sender's backend is known — either from its header frame, or (see `addFrame`) inferred. */
    onBackendResolved?: (backendId: string) => void;
}

export declare type PreferredBackend = 'auto' | 'qr-lt' | 'qr-bin-lt' | 'cimbar';

/**
 * Best-effort capability probe: does `cimbarBackend` actually work in this
 * environment? Never throws — a failure (unsupported browser, WASM
 * blocked by CSP, no WebGL, a non-browser host like this project's own
 * Node-based test harness) resolves `false`, so callers can build a
 * fallback UI rather than crash. Only attempts to *load* the WASM module,
 * not a full encode/decode self-test — see the README's Cimbar section
 * for why a deeper self-test isn't done here.
 */
export declare function probeCimbarAvailable(): Promise<boolean>;

/**
 * The byte-mode QR backend: the same Luby Transform fountain coding as
 * `qrLtBackend`, but rendered as byte-mode QR data (raw bytes) instead of
 * bytewords text. `Frame` for this backend is always a `Uint8Array` — a raw
 * fountain part, meant to be rendered directly as a byte-mode QR code (see
 * `qr-lt/render.ts`'s `renderQrToCanvas`, which accepts either a `string`
 * (for `qrLtBackend`) or a `Uint8Array` (for this backend)) and read back
 * via a decoder's raw-bytes output (`ReadResult.bytes` for zxing-wasm,
 * `QRCode.binaryData` for jsQR — see `Scanner`'s `decodeBytes` option).
 *
 * QR v40 at ECC L holds 2953 bytes in byte mode versus 4296 *characters* in
 * alphanumeric mode — bc-ur's bytewords encoding (what `qrLtBackend` uses)
 * spends 2 characters per payload byte, so alphanumeric mode only recovers
 * some of that gap, not all of it. Skipping bytewords entirely and using
 * byte mode directly gets roughly 2931 bytes of payload per frame (see
 * `fountain.ts`'s `DEFAULT_MAX_FRAGMENT_LENGTH`) versus `qrLtBackend`'s
 * 2111 — about 39% more payload per frame, at identical frame rate,
 * ECC, and module count.
 *
 * A separate backend id from `qrLtBackend` (rather than a mode flag on it)
 * deliberately, since this is a wire-format change — the existing header/
 * beacon negotiation (`negotiation.ts`) already exists to make that safe: a
 * sender and receiver on different versions degrade to `qrLtBackend`
 * (whose header frame is always plain text, universally readable) instead
 * of silently failing to decode.
 */
export declare const qrBinLtBackend: TransferBackend<Uint8Array>;

declare interface QrEncodeOptions {
    /**
     * Error correction level. Defaults to `L` (~7% tolerance): fountain codes
     * already tolerate whole-frame loss, so spending capacity on per-frame
     * redundancy is wasted — maximizing payload-per-frame matters more here.
     */
    eccLevel?: EccLevel;
    /**
     * Highest QR version to allow. Higher versions pack more data but get too
     * dense to read reliably at typical laptop-screen-to-phone-camera range.
     * Defaults to `DEFAULT_MAX_QR_VERSION` (40, the highest version ISO/IEC
     * 18004 defines) — real-camera scan reliability at that ceiling has not
     * been validated on physical hardware; see `DEFAULT_MAX_QR_VERSION`.
     */
    maxVersion?: number;
}

/**
 * The v1 backend: Luby Transform fountain codes (Stage 2), rendered as QR
 * frame strings (Stage 3). `Frame` for this backend is always a UR part
 * string — see `src/backends/types.ts` for why the interface stays generic.
 */
export declare const qrLtBackend: TransferBackend<string>;

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
export declare class ReceiverSession<F extends Frame = string> {
    private readonly scanner;
    private readonly decoder;
    private readonly callbacks;
    private readonly goodputTracker;
    private unsubscribe;
    private settled;
    constructor(callbacks?: ReceiverSessionCallbacks, backend?: TransferBackend<F>);
    start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void>;
    stop(): void;
    /** Actual negotiated camera resolution, once known — see `Camera.resolution`. */
    get resolution(): {
        width: number;
        height: number;
    } | undefined;
    /** Decoded (accepted) frames/sec over a trailing window — see `GoodputTracker`. */
    get goodput(): number;
    private handleFrame;
}

export declare interface ReceiverSessionCallbacks {
    /** Called after every frame that advances decode progress. */
    onProgress?: (progress: number) => void;
    onComplete?: (file: Blob) => void;
    /** Includes `IntegrityError` on checksum failure — see `StreamDecoder`. */
    onError?: (error: unknown) => void;
}

declare interface RenderQrOptions extends QrEncodeOptions {
    /** Pixels per module side. */
    moduleSizePx?: number;
    /** Quiet zone width, in modules. QR spec minimum is 4 — enforced as a floor. */
    quietZoneModules?: number;
}

/**
 * Resolves `PreferredBackend` to a concrete backend. `"auto"` probes
 * Cimbar's availability and falls back to `qrLtBackend` if it isn't usable
 * here — deliberately never `qrBinLtBackend`, even though it has no extra
 * capability requirement over `qrLtBackend` and is strictly more
 * throughput: `"auto"` exists so a sender always degrades to something a
 * receiver on *any* version of this library can decode, and an older
 * receiver's `backendForId` won't recognize `qr-bin-lt`. Opt into it
 * explicitly (`preferredBackend: 'qr-bin-lt'`, or `backend: qrBinLtBackend`
 * pinned) once you know your receivers support it. `probe` is injectable
 * (defaults to `probeCimbarAvailable`) purely for testing the resolution
 * logic itself without depending on a real WASM/browser environment.
 */
export declare function resolvePreferredBackend(preferred: PreferredBackend, probe?: () => Promise<boolean>): Promise<TransferBackend<Frame>>;

/**
 * Camera-facing scanner: captures frames and reports decoded content (QR
 * text or bytes by default, or raw pixels in `rawFrames` mode). Deliberately
 * knows nothing about fountain parts or transfer state — that's
 * `StreamDecoder`'s job (Stage 6) — so this stays testable without a camera
 * (worker protocol only) and swappable (e.g. screen-share frames instead of
 * a camera, later) without touching decode logic.
 */
export declare class Scanner {
    private camera;
    private pool;
    private timeoutHandle;
    private nextRequestId;
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
    private captureInFlight;
    private pendingRawFrame;
    private decodeBytes;
    private readonly callbacks;
    onDecode(callback: DecodeCallback): Unsubscribe;
    /** Actual negotiated camera resolution, once known — see `Camera.resolution`. */
    get resolution(): {
        width: number;
        height: number;
    } | undefined;
    start(videoElement?: HTMLVideoElement, opts?: ScannerOptions): Promise<void>;
    /** Creates one decode worker and wires its result handling — shared by every slot in `pool`, however large. */
    private createDecodeWorker;
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
    private startSampling;
    stop(): void;
    private tick;
    private tickRaw;
}

export declare interface ScannerOptions extends CameraOptions {
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

/**
 * Reassembles fountain-encoded UR part strings (from any source — camera
 * scan, screen-share frame, a test harness) back into the original file.
 * `getResult()` throws `IntegrityError` — distinctly from a generic
 * error — if the reassembled bytes fail their checksum; callers should
 * treat that as "offer a retry", not "something is broken."
 */
export declare class StreamDecoder<F extends Frame = string> {
    private readonly decoder;
    constructor(backend?: TransferBackend<F>);
    addFrame(data: F): void;
    /** bc-ur's estimated completion ratio (0-1) — an estimate, not a guarantee. */
    get progress(): number;
    get isComplete(): boolean;
    /**
     * Resolves to a `File` (a `Blob` with the envelope's recovered `name`) so
     * callers can trigger a real download without a separate filename
     * channel — e.g. `URL.createObjectURL(file)` + `<a download>`.
     */
    getResult(): Promise<Blob>;
}

/**
 * Shared interface behind which every transfer backend (QR+LT today, Cimbar
 * later) sits, so `encodeToFrames`/`StreamDecoder` can be backend-agnostic.
 * `encode`/`createDecoder` operate on envelope bytes and `Frame`s only — they
 * know nothing about rendering frames to a screen or scanning them off a
 * camera; that stays a backend-specific concern above this interface.
 */
export declare interface TransferBackend<F extends Frame = Frame> {
    readonly id: string;
    /**
     * When true, `buildEnvelope` skips its own gzip pass for this backend —
     * for a backend (e.g. Cimbar) that already compresses internally, gzip
     * on top is wasted CPU on already-incompressible bytes. Defaults to
     * `false`/unset (gzip as before) for any backend that doesn't set it.
     */
    readonly compressesInternally?: boolean;
    encode(bytes: Uint8Array, opts?: unknown): AsyncIterable<F>;
    createDecoder(): BackendDecoder<F>;
}

declare type Unsubscribe = () => void;

export { }


declare global {
    var Module: CimbarModuleConfig | undefined;
}


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
        constructor(init: {
            track: MediaStreamTrack;
        });
        readonly readable: ReadableStream<T>;
    }
}
