export type DecodeBackend = 'zxing' | 'jsqr';

/** A frame's luminance plane only, e.g. from `Camera.grabLumaFrame` — see `DecodeWorkerRequest`. */
export interface LumaFrame {
  data: Uint8Array;
  width: number;
  height: number;
}

/**
 * One request sent to the decode worker: sample a frame for a barcode.
 * Either a full RGBA frame (`Camera.grabFrame`'s canvas/RGBA path), or —
 * preferred, when the native capture path is available — just its
 * luminance plane (`Camera.grabLumaFrame`), which the worker expands to
 * RGBA itself right before decoding (see `decode.worker.ts`'s
 * `expandLumaToImageData`). Color carries no information for a QR decode,
 * so shipping only the luma plane here (1 byte/pixel vs. RGBA's 4) is a
 * straight bandwidth win over `postMessage`'s structured clone.
 */
export type DecodeWorkerRequest =
  { id: number; imageData: ImageData } | { id: number; luma: LumaFrame };

export type DecodeWorkerResponse =
  | { id: number; type: 'result'; text: string; bytes: Uint8Array | null; backend: DecodeBackend }
  | { id: number; type: 'no-result'; backend: DecodeBackend }
  | { id: number; type: 'error'; message: string };

/**
 * A decoded barcode's content in both forms a caller might want: `text`
 * (used by `qrLtBackend`'s UR parts and the negotiation header frame) and
 * `bytes` (used by `qrBinLtBackend`'s raw fountain parts — see
 * `Scanner`'s `decodeBytes` option). Computing both costs nothing extra:
 * zxing-wasm's `ReadResult` and jsQR's `QRCode` each already expose both
 * from the same decode.
 */
export interface DecodedBarcode {
  text: string | null;
  bytes: Uint8Array | null;
}

export interface FrameDecodeBackends {
  decodeWithZxing: (imageData: ImageData) => Promise<DecodedBarcode>;
  decodeWithJsQr: (imageData: ImageData) => DecodedBarcode;
}

export interface FrameDecodeResult extends DecodedBarcode {
  backend: DecodeBackend;
}

/**
 * Drives the zxing-wasm-first, jsQR-fallback decode strategy. zxing-wasm is
 * tried first (better read rate); if it throws — e.g. the host app's CSP
 * blocks WASM instantiation — that's treated as a permanent environment
 * failure: log a warning and fall back to jsQR for the rest of this
 * decoder's lifetime, rather than retrying zxing on every frame. A `null`
 * result (no barcode found in an otherwise successfully-decoded frame) is
 * normal and does *not* trigger the fallback.
 */
export function createFrameDecoder(backends: FrameDecodeBackends) {
  let zxingAvailable = true;

  async function decodeFrame(imageData: ImageData): Promise<FrameDecodeResult> {
    if (zxingAvailable) {
      try {
        const result = await backends.decodeWithZxing(imageData);
        return { ...result, backend: 'zxing' };
      } catch (err) {
        zxingAvailable = false;
        console.warn('[screenferry] zxing-wasm failed, falling back to jsQR:', err);
      }
    }

    return { ...backends.decodeWithJsQr(imageData), backend: 'jsqr' };
  }

  return {
    decodeFrame,
    get zxingAvailable(): boolean {
      return zxingAvailable;
    },
  };
}

/** Maps a decode result to the worker response message for request `id`. */
export function toDecodeResponse(id: number, result: FrameDecodeResult): DecodeWorkerResponse {
  return result.text !== null
    ? { id, type: 'result', text: result.text, bytes: result.bytes, backend: result.backend }
    : { id, type: 'no-result', backend: result.backend };
}

/** Maps a thrown error to the worker's error response message for request `id`. */
export function toErrorResponse(id: number, err: unknown): DecodeWorkerResponse {
  return { id, type: 'error', message: err instanceof Error ? err.message : String(err) };
}
