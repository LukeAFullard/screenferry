export type DecodeBackend = 'zxing' | 'jsqr';

/** One request sent to the decode worker: sample a frame for a barcode. */
export interface DecodeWorkerRequest {
  id: number;
  imageData: ImageData;
}

export type DecodeWorkerResponse =
  | { id: number; type: 'result'; text: string; backend: DecodeBackend }
  | { id: number; type: 'no-result'; backend: DecodeBackend }
  | { id: number; type: 'error'; message: string };

export interface FrameDecodeBackends {
  decodeWithZxing: (imageData: ImageData) => Promise<string | null>;
  decodeWithJsQr: (imageData: ImageData) => string | null;
}

export interface FrameDecodeResult {
  text: string | null;
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
        const text = await backends.decodeWithZxing(imageData);
        return { text, backend: 'zxing' };
      } catch (err) {
        zxingAvailable = false;
        console.warn('[screenferry] zxing-wasm failed, falling back to jsQR:', err);
      }
    }

    return { text: backends.decodeWithJsQr(imageData), backend: 'jsqr' };
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
  return result.text
    ? { id, type: 'result', text: result.text, backend: result.backend }
    : { id, type: 'no-result', backend: result.backend };
}

/** Maps a thrown error to the worker's error response message for request `id`. */
export function toErrorResponse(id: number, err: unknown): DecodeWorkerResponse {
  return { id, type: 'error', message: err instanceof Error ? err.message : String(err) };
}
