import { loadCimbarModule, type CimbarModule } from './module';
import type { BackendDecoder, ImageFrame, TransferBackend } from '../types';

/**
 * `68` = libcimbar's default/reference encode mode ("mode B" — see
 * `main.js`'s `setMode('B')` fallthrough in the reference web app). Per
 * both the original `sz3/cimbar` Python research project's `README.md`
 * ("Mode B (8x8 grid): 4-color, 30/155 ecc, 6-bits-per-tile ... raw
 * capacity 9,300 bytes, ~7,500 with error correction") and libcimbar's own
 * `DETAILS.md` (independently citing the same 9,300-byte raw capacity for
 * its "6-bit cimbar" mode), mode B is the 4-color/6-bit-per-tile mode —
 * the balanced default, not the densest (8-color/7-bit "Mode 8C") option.
 * Other modes ("4C", "Bu", "Bm") trade throughput for reliability
 * differently — `CimbarEncodeOptions.mode` now exposes that choice (e.g.
 * `67`/"Bm", documented upstream as built specifically for broader
 * camera compatibility at ~30% less throughput than B); `CimbarDecoder`
 * separately cycles through candidate modes per frame rather than
 * assuming the sender used this default (see its `CANDIDATE_MODES`).
 */
const DEFAULT_MODE = 68;

/**
 * Encode/decode canvas resolution. `sz3/cimbar`'s `ABOUT.md` (the original
 * Python research project libcimbar is a from-scratch C++ rewrite of)
 * documents 1024x1024 as its own grid size, chosen "semi-arbitrarily" but
 * "under 1080x1080 (for monitor resolution reasons)" — libcimbar's WASM
 * build isn't confirmed to use the exact same figure, but this is a
 * sourced default rather than a blind guess. **Still needs real-device
 * confirmation** (see README's Cimbar section).
 */
const DEFAULT_FRAME_SIZE = 1024;

/** `type=4` in libcimbar's own reference glue — a raw 4-byte-per-pixel (RGBA) buffer, matching `ImageFrame.data` / canvas `ImageData`. */
const PIXEL_FORMAT_RGBA = 4;
/**
 * Native YUV pixel-format codes for `_cimbard_scan_extract_decode`'s
 * `pixelFormat` argument, per libcimbar's own reference glue
 * (`cimbar_recv_js.cpp`'s `get_rgb()`) — `12` for 4:2:0 semi-planar NV12,
 * `420` for 4:2:0 planar I420. Passing a `Camera.grabNativeFrame`-captured
 * `VideoFrame`'s pixels straight through in whichever of these two formats
 * it natively arrives in (see `ImageFrame.format`) skips `PIXEL_FORMAT_RGBA`'s
 * canvas-2D `drawImage`/`getImageData` conversion entirely.
 */
const PIXEL_FORMAT_NV12 = 12;
const PIXEL_FORMAT_I420 = 420;

export interface CimbarEncodeOptions {
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

/**
 * A `Module._malloc`'d buffer that's resized only when it needs to grow, and
 * re-viewed (not re-copied) if `HEAPU8`'s backing `ArrayBuffer` has been
 * replaced by WASM memory growth — mirrors libcimbar's own reference glue
 * (`compress_buff`/`mallocPlease` in `send.js`/`recv-worker.js`), which
 * relies on this exact pattern to keep views valid across memory growth.
 */
class GrowableWasmBuffer {
  private view: Uint8Array | undefined;
  private ptr = 0;

  constructor(private readonly module: CimbarModule) {}

  ensure(size: number): Uint8Array {
    if (!this.view || this.view.length < size || this.view.buffer !== this.module.HEAPU8.buffer) {
      if (this.ptr) this.module._free(this.ptr);
      this.ptr = this.module._malloc(size);
      this.view = new Uint8Array(this.module.HEAPU8.buffer, this.ptr, size);
    }
    return this.view;
  }

  get byteOffset(): number {
    return this.ptr;
  }
}

function getWebGlContext(canvas: OffscreenCanvas): WebGLRenderingContext | WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) {
    throw new Error(
      'screenferry cimbarBackend: could not acquire a WebGL context on the offscreen encode canvas',
    );
  }
  return gl as WebGLRenderingContext | WebGL2RenderingContext;
}

/**
 * Reads back the just-rendered frame as an `ImageFrame`. WebGL's row order
 * is bottom-up; `ImageFrame`/canvas `ImageData` is top-down, so this flips
 * vertically — a standard WebGL-screenshot gotcha, not backend-specific.
 */
function readCanvasPixels(
  canvas: OffscreenCanvas,
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): ImageFrame {
  const { width, height } = canvas;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  const rowBytes = width * 4;
  const flipped = new Uint8Array(pixels.length);
  for (let row = 0; row < height; row++) {
    const srcStart = row * rowBytes;
    const dstStart = (height - row - 1) * rowBytes;
    flipped.set(pixels.subarray(srcStart, srcStart + rowBytes), dstStart);
  }

  return { data: flipped, width, height };
}

/**
 * One-time encoder setup: bind an offscreen canvas. Idempotent per module
 * instance. Deliberately doesn't configure a mode here (that used to be a
 * single `_cimbare_configure(DEFAULT_MODE, -1)` call baked in at setup
 * time) — `encode()` calls `_cimbare_configure` itself on every invocation,
 * since the requested `mode` can now differ per call (`CimbarEncodeOptions.mode`)
 * even though this setup only ever runs once.
 */
let encoderReady:
  | Promise<{
      module: CimbarModule;
      canvas: OffscreenCanvas;
      gl: WebGLRenderingContext | WebGL2RenderingContext;
    }>
  | undefined;

/**
 * libcimbar's own `cimbare_init_window` sizes its window as
 * `image_size + 16` when given no explicit size — that extra 16px isn't
 * decoration. `cimbare_render()` calls `show()` followed by `shake()`,
 * which offsets the rendered symbol by up to ±8px (cycling through four
 * positions, one per rendered frame) as a texture-coordinate shift.
 * `CimbWriter` centres the symbol inside whatever canvas size it's given,
 * so a window sized to exactly `frameSize` (the symbol's own resolution)
 * leaves no border to absorb that shake: on two of every four frames, an
 * 8px strip — including part of a corner anchor — is pushed off the edge
 * and `GL_CLAMP_TO_EDGE` smears the opposite side in to fill it. Sizing
 * the window 16px larger than the symbol (matching libcimbar's own
 * default) restores the border the shake needs, and doubles as a quiet
 * zone around the symbol.
 */
const WINDOW_MARGIN_PX = 16;

function initEncoder(frameSize: number) {
  encoderReady ??= (async () => {
    const module = await loadCimbarModule();
    const windowSize = frameSize + WINDOW_MARGIN_PX;
    const canvas = new OffscreenCanvas(windowSize, windowSize);
    module.canvas = canvas;
    module._cimbare_init_window(windowSize, windowSize);
    const gl = getWebGlContext(canvas);
    logGlRenderer(gl);
    return { module, canvas, gl };
  })();
  return encoderReady;
}

/**
 * Surfaces which renderer WebGL actually bound to, so a software-rendering
 * fallback (SwiftShader, llvmpipe, ...) is visible instead of silent — this
 * has previously caused severe per-frame slowdowns via `gl.readPixels`
 * stalls (see README's Cimbar section on the swiftshader performance
 * caveat). Not every browser exposes `WEBGL_debug_renderer_info` (some
 * gate it behind a permission/flag); when it's unavailable, this is simply
 * a no-op rather than a hard failure.
 */
function logGlRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  if (dbg) {
    console.info(
      '[screenferry] cimbar GPU renderer:',
      gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL),
    );
  }
}

/**
 * The v2 backend: libcimbar's WASM encoder/decoder (MPL-2.0, vendored —
 * see `THIRD_PARTY_LICENSES.md`), wrapped behind `TransferBackend`. Higher
 * throughput than `qrLtBackend`, at the cost of being far less
 * battle-tested — `qrLtBackend` has this project's full test suite behind
 * it; this doesn't.
 *
 * A full encode→decode round trip (byte-exact, through two independent
 * WASM module instances, so not a shared-memory false positive) has been
 * verified in a real browser (headless Chromium, software-rendered WebGL —
 * see README's Cimbar section for the full detail and its real caveats:
 * unconfirmed on real GPU/camera hardware, and very small payloads, under
 * roughly a few hundred bytes, can fail — Cimbar pads them to fill a full
 * fountain chunk, and if that padding is low-entropy the symbol extractor
 * may not reliably find tile boundaries; this project's own envelope
 * overhead plus a normal file easily clears that in practice).
 *
 * **Known limitation: one sender and one receiver can't safely share a
 * module instance.** `loadCimbarModule` loads the WASM binary once per
 * process, and `_cimbare_configure`/`_cimbard_configure_decode` both write
 * the same single C++-side `Config::active_conf()` (see `module.ts`'s doc
 * comments on those two exports) — there's no per-role state. Running a
 * sender's still-in-progress `encode()` generator and a receiver's
 * `CimbarDecoder` in the same page/thread means the receiver's per-frame
 * mode-cycling (`_cimbard_configure_decode`) can clobber the encoder's
 * config between frames, corrupting everything it renders from that point
 * on — with no visible symptom beyond "images appear, nothing ever
 * decodes." `examples/app.html`'s cimbar section runs this exact
 * same-page loopback for convenience; its "pin cimbar" checkbox does not
 * work around this (it only skips header-frame negotiation, not the
 * shared module instance). A real two-party transfer (a phone camera
 * receiving from a laptop screen, as this backend is designed for) uses
 * two separate WASM module instances/processes and isn't affected.
 *
 * `Frame` for this backend is rendered pixel data (`ImageFrame`), not a
 * string — `DisplayDriver` and `Scanner` both need to be told to expect
 * that (see their respective option docs) when using this backend instead
 * of the default.
 *
 * libcimbar's `DETAILS.md` documents a ~33.55MB file-size ceiling on its
 * own (wirehair) fountain layer — unlike `qrLtBackend`'s bc-ur/LT layer,
 * which has no such documented limit. Not enforced here (unconfirmed
 * against this exact WASM build, and rejecting on an unverified number
 * risks false negatives); a transfer past that size may simply fail.
 */
export const cimbarBackend: TransferBackend<ImageFrame> = {
  id: 'cimbar',

  // libcimbar's own encoder already zstd-compresses (`_cimbare_configure`'s
  // second argument) — screenferry's usual gzip pass in `buildEnvelope`
  // would be pure wasted CPU on top of it (gzipped bytes don't compress
  // further) and gives up the better ratio zstd would get on the raw
  // bytes, so `buildEnvelope` skips its own compression for this backend.
  compressesInternally: true,

  async *encode(bytes: Uint8Array, opts?: CimbarEncodeOptions): AsyncIterable<ImageFrame> {
    const frameSize = opts?.frameSize ?? DEFAULT_FRAME_SIZE;
    const mode = opts?.mode ?? DEFAULT_MODE;
    const { module, canvas, gl } = await initEncoder(frameSize);
    module._cimbare_configure(mode, opts?.compressionLevel ?? -1);

    // Cimbar's own encoder wants a filename (it has no envelope layer of
    // its own) — irrelevant here since `buildEnvelope` already carries the
    // real filename/mimetype/hash inside `bytes`, so a placeholder is fine.
    const filenameBytes = new TextEncoder().encode('data.bin');
    const filenamePtr = module._malloc(filenameBytes.length);
    try {
      module.HEAPU8.set(filenameBytes, filenamePtr);
      const initResult = module._cimbare_init_encode(filenamePtr, filenameBytes.length, -1);
      if (initResult < 0) {
        throw new Error(`screenferry cimbarBackend: _cimbare_init_encode failed (${initResult})`);
      }
    } finally {
      module._free(filenamePtr);
    }

    const chunkSize = module._cimbare_encode_bufsize();
    const chunkBuffer = new GrowableWasmBuffer(module);

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, offset + chunkSize);
      const view = chunkBuffer.ensure(Math.max(chunk.length, 1));
      view.set(chunk);
      const encodeResult = module._cimbare_encode(chunkBuffer.byteOffset, chunk.length);
      if (encodeResult < 0) {
        throw new Error(`screenferry cimbarBackend: _cimbare_encode failed (${encodeResult})`);
      }
    }
    // A trailing zero-length call flushes/finalizes — mirrors the reference
    // `importFile`'s final `encode_bytes(nullBuff)` once the file is read.
    const finalizeResult = module._cimbare_encode(chunkBuffer.byteOffset, 0);
    if (finalizeResult < 0) {
      throw new Error(
        `screenferry cimbarBackend: _cimbare_encode (finalize) failed (${finalizeResult})`,
      );
    }

    // Rateless, like the LT backend: keeps rendering fresh frames forever.
    // The caller (`DisplayDriver`, a test harness, ...) decides when it has
    // sent enough and stops pulling from this generator.
    //
    // `next_frame()` must run *before* `render()`: `render()` only draws
    // whatever `next_frame()` most recently prepared, and right after
    // finalizing above there's nothing prepared yet (the finalizing
    // `encode()` call clears it) — rendering first would yield one blank
    // frame (an empty/garbage framebuffer) before the real data starts.
    for (;;) {
      const frameNum = module._cimbare_next_frame(0);
      if (frameNum < 0) {
        throw new Error(`screenferry cimbarBackend: _cimbare_next_frame failed (${frameNum})`);
      }
      const renderResult = module._cimbare_render();
      if (renderResult < 0) {
        throw new Error(`screenferry cimbarBackend: _cimbare_render failed (${renderResult})`);
      }
      if (renderResult === 0) {
        // No window/no encoder stream to draw — shouldn't happen right
        // after a successful `next_frame()`, but isn't fatal: the canvas
        // still holds the previously rendered frame, so warn and keep
        // going rather than tearing down an otherwise-working session.
        console.warn('[screenferry] cimbar encoder: _cimbare_render had nothing to draw');
      }
      yield readCanvasPixels(canvas, gl);
    }
  },

  createDecoder(): BackendDecoder<ImageFrame> {
    return new CimbarDecoder();
  },
};

/**
 * Cimbar's decode is a two-stage pipeline, not one call — this isn't
 * documented anywhere in prose; it only became clear from reading how the
 * reference tarball's *two* JS files split the work: `recv-worker.js`
 * (the per-frame, worker-side half) calls only `_cimbard_scan_extract_decode`,
 * which looks self-contained until you notice its result is just handed off
 * to `recv.js`'s main-thread-side `Sink.on_decode`, which is the half that
 * actually calls `_cimbard_fountain_decode` and, on completion,
 * `_cimbard_decompress_read`. This wrapper does all of it in one place
 * since (unlike the reference) it isn't split across a worker boundary.
 */
class CimbarDecoder implements BackendDecoder<ImageFrame> {
  /**
   * Candidate decode modes to cycle through per frame until one works — `68`
   * (B), `67` (Bm — added in libcimbar v0.6.3, present in this project's
   * vendored v0.6.8 build; documented upstream as built specifically for
   * broader camera compatibility at ~30% less throughput than B), `66`
   * (Bu), `4` (4C). Mirrors the reference `recv.js`'s `on_frame`:
   * `const modeVals = [66, 68, 67, 4]; let mode = _mode || modeVals[_counter
   * % modeVals.length];` — same pool, reordered here so the previous
   * hardcoded default (`68`) is still tried first.
   */
  private static readonly CANDIDATE_MODES = [68, 67, 66, 4];

  private module: CimbarModule | undefined;
  private imgBuffer: GrowableWasmBuffer | undefined;
  private chunkBuffer: GrowableWasmBuffer | undefined;
  private decompressBuffer: GrowableWasmBuffer | undefined;
  private errorBuffer: GrowableWasmBuffer | undefined;
  private readonly pending: ImageFrame[] = [];
  private result: Uint8Array | undefined;
  private loading = false;

  /** Index into `CANDIDATE_MODES`, advanced once per failed extraction attempt while unlocked. */
  private modeAttempt = 0;
  /** The mode that first produced `extractedLen >= 0` — once set, every later frame uses it directly, skipping the cycle. */
  private lockedMode: number | undefined;

  /** Running per-second `extractedLen` outcome counts, for `recordExtractStat`'s throttled `console.debug`. */
  private readonly extractStats = new Map<number, number>();
  private statsWindowStart = 0;

  /** See `updateProgress`'s doc comment. */
  private lastProgress = 0;

  get isComplete(): boolean {
    return this.result !== undefined;
  }

  get progress(): number {
    return this.isComplete ? 1 : this.lastProgress;
  }

  getResult(): Uint8Array {
    if (!this.result) {
      throw new Error('CimbarDecoder: cannot get result before decoding is complete');
    }
    return this.result;
  }

  addFrame(frame: ImageFrame): void {
    if (this.isComplete) return;

    if (!this.module) {
      this.pending.push(frame);
      if (!this.loading) {
        this.loading = true;
        void loadCimbarModule().then((module) => {
          // The decode mode must match the encoder's `_cimbare_configure`
          // mode, or every frame fails symbol extraction (len === -3) even
          // with genuine, correctly-rendered Cimbar image data — confirmed
          // by testing. Which mode that is isn't known yet here; the actual
          // `_cimbard_configure_decode` calls happen per frame in
          // `processFrame`, cycling through `CANDIDATE_MODES` until one
          // works (see its doc comment).
          this.module = module;
          this.imgBuffer = new GrowableWasmBuffer(module);
          this.chunkBuffer = new GrowableWasmBuffer(module);
          this.decompressBuffer = new GrowableWasmBuffer(module);
          this.errorBuffer = new GrowableWasmBuffer(module);
          this.drainPending();
        });
      }
      return;
    }

    this.processFrame(frame);
  }

  private drainPending(): void {
    // `addFrame` may have queued more frames while the module was loading.
    for (const frame of this.pending.splice(0)) {
      if (this.isComplete) break;
      this.processFrame(frame);
    }
  }

  private processFrame(frame: ImageFrame): void {
    const module = this.module;
    const imgBuffer = this.imgBuffer;
    const chunkBuffer = this.chunkBuffer;
    if (!module || !imgBuffer || !chunkBuffer) return;

    // While the mode is still unknown, cycle through candidates one frame
    // at a time (mirrors the reference `recv.js`'s `on_frame`, which reuses
    // the same modulo-cycling trick) — a wrong guess here isn't a dead end
    // like it was with a single hardcoded mode, just one skipped frame.
    const candidateMode =
      this.lockedMode ??
      CimbarDecoder.CANDIDATE_MODES[this.modeAttempt % CimbarDecoder.CANDIDATE_MODES.length];
    if (this.lockedMode === undefined) module._cimbard_configure_decode(candidateMode);

    const imgView = imgBuffer.ensure(frame.data.length);
    imgView.set(frame.data);

    const chunkCapacity = module._cimbard_get_bufsize();
    const chunkView = chunkBuffer.ensure(chunkCapacity);

    // `Camera.grabNativeFrame`'s WebCodecs path tags a frame with its
    // native NV12/I420 layout instead of always converting to RGBA first
    // (Fix 4) — pass the matching pixel-format code straight through
    // rather than assuming RGBA.
    const pixelFormat =
      frame.format === 'nv12'
        ? PIXEL_FORMAT_NV12
        : frame.format === 'i420'
          ? PIXEL_FORMAT_I420
          : PIXEL_FORMAT_RGBA;

    // Stage 1: does this frame contain a readable Cimbar symbol, and if
    // so, extract its raw fountain-coded chunk (not file content yet).
    const extractedLen = module._cimbard_scan_extract_decode(
      imgBuffer.byteOffset,
      frame.width,
      frame.height,
      pixelFormat,
      chunkBuffer.byteOffset,
      chunkView.length,
    );

    this.recordExtractStat(extractedLen);

    // Only `extractedLen > 0` (a real chunk, not just a found-and-deskewed
    // symbol) is trustworthy evidence that `candidateMode` is the sender's
    // actual mode -- anchor detection and deskew are geometric and largely
    // mode-independent, so a *wrong* candidate can still return `0`
    // (symbol found, zero cells decoded — see below). Locking on `0` would
    // wedge the decoder onto the wrong mode permanently (and, since
    // `_cimbard_configure_decode` resets the fountain sink on any actual
    // mode change, silently discard whatever this session had already
    // accumulated).
    if (extractedLen > 0 && this.lockedMode === undefined) {
      this.lockedMode = candidateMode;
    }

    if (extractedLen === 0) {
      // Symbol found and deskewed, but zero cells decoded -- a color/
      // threshold problem, not a "can't find it" problem. Previously silent
      // (identical to the < 0 case from the caller's perspective); logging
      // it is what makes the two failure modes distinguishable at all.
      this.reportError();
      if (this.lockedMode === undefined) this.modeAttempt++;
      return;
    }
    if (extractedLen < 0) {
      // Extraction failed for this frame — expected in live use (motion
      // blur, partial symbol in view, autofocus hunting), but also what a
      // wrong candidate mode looks like; advance to the next candidate for
      // the next frame either way.
      this.reportError();
      if (this.lockedMode === undefined) this.modeAttempt++;
      return;
    }

    // Stage 2: accumulate this chunk into the fountain decoder. A C
    // int64_t comes back as a JS bigint; > 0 once a complete file has
    // been reconstructed, with the file's id in the low 32 bits. `-5`
    // specifically means this chunk's length didn't match the configured
    // mode's expected chunk size — distinct from "not complete yet" (any
    // other `<= 0`), and a strong signal `candidateMode` is wrong (or the
    // extraction above was itself bogus).
    const decodeRes = module._cimbard_fountain_decode(chunkBuffer.byteOffset, extractedLen);
    this.updateProgress();
    if (decodeRes === -5n) {
      console.warn(
        '[screenferry] cimbar fountain_decode: chunk size mismatch (-5) — likely a wrong candidate mode',
      );
      return;
    }
    if (decodeRes <= 0n) return;

    const fileId = Number(decodeRes & 0xffffffffn);
    this.result = this.readDecompressedFile(fileId);
  }

  /** Stage 3: streams the completed file's bytes out (Cimbar applies its own zstd compression in transit; this undoes it). */
  private readDecompressedFile(fileId: number): Uint8Array {
    const module = this.module;
    const decompressBuffer = this.decompressBuffer;
    if (!module || !decompressBuffer) {
      throw new Error('CimbarDecoder: module not loaded');
    }

    const chunkSize = module._cimbard_get_decompress_bufsize();
    const chunkView = decompressBuffer.ensure(chunkSize);

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const n = module._cimbard_decompress_read(fileId, decompressBuffer.byteOffset, chunkSize);
      if (n <= 0) break;
      chunks.push(chunkView.slice(0, n));
      total += n;
    }

    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  /** Raw text from `_cimbard_get_report` — `undefined` if the module isn't loaded yet or there was nothing to report. */
  private readReport(): string | undefined {
    const module = this.module;
    if (!module || !this.errorBuffer) return undefined;
    const view = this.errorBuffer.ensure(256);
    const len = module._cimbard_get_report(this.errorBuffer.byteOffset, view.length);
    if (len <= 0) return undefined;
    return new TextDecoder().decode(view.subarray(0, len));
  }

  private reportError(): void {
    const report = this.readReport();
    if (report) console.warn('[screenferry] cimbar decode error:', report);
  }

  /**
   * Populates `progress` from `_cimbard_get_report`, called right after
   * `_cimbard_fountain_decode` — per libcimbar's own `cimbard_recv_js.cpp`,
   * that's the only point `_reporting` holds the fountain sink's bracketed
   * per-file progress list (`"[ 0.42, ... ]"`) rather than the unrelated
   * `"sce: <ms>, imgdec: <ms>"` per-frame timing string it holds before any
   * chunk has been accepted — recognized here by the `[...]` wrapper, which
   * only the progress form has. Without this, `progress` silently reads 0%
   * for an entire transfer no matter how far along it actually is.
   *
   * The exact units of each reported value aren't confirmed against this
   * vendored WASM build (no access to the wirehair sink's `get_progress()`
   * source) — treated as a 0-1 ratio, or a percentage (divided by 100) if
   * greater than 1, and the largest of a multi-file report is used as this
   * transfer's overall progress. Best-effort: a wrong scale here degrades
   * to a misleading percentage, not a functional failure.
   */
  private updateProgress(): void {
    const report = this.readReport();
    if (!report) return;

    const match = /\[([^\]]*)\]/.exec(report);
    if (!match) return;

    const values = match[1]
      .split(',')
      .map((v) => Number.parseFloat(v.trim()))
      .filter((v) => Number.isFinite(v));
    if (values.length === 0) return;

    const raw = Math.max(...values);
    this.lastProgress = Math.min(1, raw > 1 ? raw / 100 : raw);
  }

  /**
   * Tracks a running, once-per-second `console.debug` summary of
   * `_cimbard_scan_extract_decode`'s return values (bucketed: exact negative
   * codes, `0`, and `>0` lumped together) — visible confirmation, without
   * spamming the console every frame, of what fraction of frames are
   * failing extraction (`< 0`) vs. found-but-empty (`0`) vs. genuinely
   * decoding (`> 0`), so Fix 1's premise ("both failure modes currently
   * look identical") can actually be checked against a live scan session.
   */
  private recordExtractStat(extractedLen: number): void {
    const key = extractedLen > 0 ? Infinity : extractedLen;
    this.extractStats.set(key, (this.extractStats.get(key) ?? 0) + 1);

    const now = Date.now();
    if (this.statsWindowStart === 0) this.statsWindowStart = now;
    if (now - this.statsWindowStart < 1000) return;

    const summary = [...this.extractStats.entries()]
      .sort(([a], [b]) => a - b)
      .map(([len, count]) => `${len === Infinity ? '>0' : len}=${count}`)
      .join(', ');
    console.debug(`[screenferry] cimbar extractedLen outcomes (last ~1s): ${summary}`);

    this.extractStats.clear();
    this.statsWindowStart = now;
  }
}
