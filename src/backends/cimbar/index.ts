import { loadCimbarModule, type CimbarModule } from './module';
import type { BackendDecoder, ImageFrame, TransferBackend } from '../types';

/**
 * `68` = libcimbar's default/reference encode mode ("mode B" — see
 * `main.js`'s `setMode('B')` fallthrough in the reference web app). Other
 * modes (4-color, "Bu", "Bm") trade throughput for reliability differently;
 * exposing that choice is future work, not this pass.
 */
const DEFAULT_MODE = 68;

/**
 * Encode/decode canvas resolution. Unlike the reference web app (which
 * lets the browser's own `<canvas>` sizing drive this), nothing observed
 * in the reference glue pins down a specific default — this is a starting
 * guess for a phone-camera-to-laptop-screen distance, not a verified value.
 * **Needs real-device tuning** (see README's Cimbar section).
 */
const DEFAULT_FRAME_SIZE = 1024;

/** `type=4` in libcimbar's own reference glue — a raw 4-byte-per-pixel (RGBA) buffer, matching `ImageFrame.data` / canvas `ImageData`. */
const PIXEL_FORMAT_RGBA = 4;

export interface CimbarEncodeOptions {
  /** Encode/render resolution (square). Defaults to `DEFAULT_FRAME_SIZE`. */
  frameSize?: number;
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

/** One-time encoder setup: bind an offscreen canvas and the default mode. Idempotent per module instance. */
let encoderReady:
  | Promise<{
      module: CimbarModule;
      canvas: OffscreenCanvas;
      gl: WebGLRenderingContext | WebGL2RenderingContext;
    }>
  | undefined;

function initEncoder(frameSize: number) {
  encoderReady ??= (async () => {
    const module = await loadCimbarModule();
    const canvas = new OffscreenCanvas(frameSize, frameSize);
    module.canvas = canvas;
    module._cimbare_init_window(frameSize, frameSize);
    module._cimbare_configure(DEFAULT_MODE, -1);
    const gl = getWebGlContext(canvas);
    return { module, canvas, gl };
  })();
  return encoderReady;
}

/**
 * The v2 backend: libcimbar's WASM encoder/decoder (MPL-2.0, vendored —
 * see `THIRD_PARTY_LICENSES.md`), wrapped behind `TransferBackend`. Higher
 * throughput than `qrLtBackend`, at the cost of being far less
 * battle-tested here — this wrapper has been written against libcimbar's
 * reference JS glue but **not exercised against the real WASM binary in a
 * browser** (this repo's test harness has no WebGL/camera available). See
 * the README's Cimbar section before relying on it.
 *
 * `Frame` for this backend is rendered pixel data (`ImageFrame`), not a
 * string — `DisplayDriver` and `Scanner` both need to be told to expect
 * that (see their respective option docs) when using this backend instead
 * of the default.
 */
export const cimbarBackend: TransferBackend<ImageFrame> = {
  id: 'cimbar',

  async *encode(bytes: Uint8Array, opts?: CimbarEncodeOptions): AsyncIterable<ImageFrame> {
    const frameSize = opts?.frameSize ?? DEFAULT_FRAME_SIZE;
    const { module, canvas, gl } = await initEncoder(frameSize);

    // Cimbar's own encoder wants a filename (it has no envelope layer of
    // its own) — irrelevant here since `buildEnvelope` already carries the
    // real filename/mimetype/hash inside `bytes`, so a placeholder is fine.
    const filenameBytes = new TextEncoder().encode('data.bin');
    const filenamePtr = module._malloc(filenameBytes.length);
    try {
      module.HEAPU8.set(filenameBytes, filenamePtr);
      module._cimbare_init_encode(filenamePtr, filenameBytes.length, -1);
    } finally {
      module._free(filenamePtr);
    }

    const chunkSize = module._cimbare_encode_bufsize();
    const chunkBuffer = new GrowableWasmBuffer(module);

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, offset + chunkSize);
      const view = chunkBuffer.ensure(Math.max(chunk.length, 1));
      view.set(chunk);
      module._cimbare_encode(chunkBuffer.byteOffset, chunk.length);
    }
    // A trailing zero-length call flushes/finalizes — mirrors the reference
    // `importFile`'s final `encode_bytes(nullBuff)` once the file is read.
    module._cimbare_encode(chunkBuffer.byteOffset, 0);

    // Rateless, like the LT backend: keeps rendering fresh frames forever.
    // The caller (`DisplayDriver`, a test harness, ...) decides when it has
    // sent enough and stops pulling from this generator.
    for (;;) {
      module._cimbare_render();
      module._cimbare_next_frame(0);
      yield readCanvasPixels(canvas, gl);
    }
  },

  createDecoder(): BackendDecoder<ImageFrame> {
    return new CimbarDecoder();
  },
};

class CimbarDecoder implements BackendDecoder<ImageFrame> {
  private module: CimbarModule | undefined;
  private imgBuffer: GrowableWasmBuffer | undefined;
  private fountainBuffer: GrowableWasmBuffer | undefined;
  private errorBuffer: GrowableWasmBuffer | undefined;
  private readonly pending: ImageFrame[] = [];
  private result: Uint8Array | undefined;
  private loading = false;

  get isComplete(): boolean {
    return this.result !== undefined;
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
          this.module = module;
          this.imgBuffer = new GrowableWasmBuffer(module);
          this.fountainBuffer = new GrowableWasmBuffer(module);
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
    const fountainBuffer = this.fountainBuffer;
    if (!module || !imgBuffer || !fountainBuffer) return;

    const imgView = imgBuffer.ensure(frame.data.length);
    imgView.set(frame.data);

    const outSize = module._cimbard_get_bufsize();
    const outView = fountainBuffer.ensure(outSize);

    const len = module._cimbard_scan_extract_decode(
      imgBuffer.byteOffset,
      frame.width,
      frame.height,
      PIXEL_FORMAT_RGBA,
      fountainBuffer.byteOffset,
      outView.length,
    );

    if (len > 0) {
      this.result = outView.slice(0, len);
    } else if (len < 0) {
      // Extraction failed for this frame — expected in live use (motion
      // blur, partial symbol in view, autofocus hunting); keep listening,
      // same tolerance `Scanner` already applies to a QR miss.
      this.reportError();
    }
    // len === 0: no new data yet, nothing to do.
  }

  private reportError(): void {
    const module = this.module;
    if (!module || !this.errorBuffer) return;
    const errView = this.errorBuffer.ensure(256);
    const errLen = module._cimbard_get_report(this.errorBuffer.byteOffset, errView.length);
    if (errLen > 0) {
      console.warn(
        '[screenferry] cimbar decode error:',
        new TextDecoder().decode(errView.subarray(0, errLen)),
      );
    }
  }
}
