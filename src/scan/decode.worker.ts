/// <reference types="vite/client" />
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
// `?url` makes Vite emit this as a standalone asset and gives us its final
// URL, so we can self-host it — a "no network required" tool shouldn't
// silently phone out to zxing-wasm's default jsDelivr CDN for the .wasm.
import zxingReaderWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import jsQR from 'jsqr';
import {
  createFrameDecoder,
  toDecodeResponse,
  toErrorResponse,
  type DecodeWorkerRequest,
  type DecodeWorkerResponse,
  type LumaFrame,
} from './decode-logic';

prepareZXingModule({
  overrides: {
    locateFile: (path: string) => (path.endsWith('.wasm') ? zxingReaderWasmUrl : path),
  },
});

const decoder = createFrameDecoder({
  decodeWithZxing: async (imageData) => {
    const results = await readBarcodes(imageData, {
      formats: ['QRCode'],
      maxNumberOfSymbols: 1,
    });
    const match = results.find((result) => result.isValid);
    // `ReadResult.bytes`: raw content with no charset conversion --
    // exactly what `qrBinLtBackend`'s byte-mode frames need back, as
    // opposed to `.text`, which is `.bytes` rendered to unicode/utf8.
    return { text: match?.text ?? null, bytes: match?.bytes ?? null };
  },
  decodeWithJsQr: (imageData) => {
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    return {
      text: result?.data ?? null,
      bytes: result ? new Uint8Array(result.binaryData) : null,
    };
  },
});

/**
 * Expands a single-channel luminance buffer (`DecodeWorkerRequest`'s `luma`
 * variant) to a minimal grayscale RGBA `ImageData` (R=G=B=Y, A=255) --
 * neither zxing-wasm's `readBarcodes` nor jsQR accepts raw luminance
 * through their public API, only RGBA-shaped input, so this is the
 * cheapest way to still avoid `Camera.grabFrame`'s full canvas `drawImage`/
 * `getImageData` round trip on the *capture* side (see
 * `Camera.grabLumaFrame`'s doc comment) while still handing both decoders
 * a shape they accept.
 */
function expandLumaToImageData(luma: LumaFrame): ImageData {
  const { data, width, height } = luma;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    const y = data[i];
    rgba[j] = y;
    rgba[j + 1] = y;
    rgba[j + 2] = y;
    rgba[j + 3] = 255;
  }
  return new ImageData(rgba, width, height);
}

/**
 * Typed enough to compile under this project's DOM lib without pulling in
 * the `webworker` lib globally (which conflicts with `DOM`'s `self` type) —
 * see the module comment in `src/env/polyfills.ts` for the analogous
 * Buffer/process problem this project already works around.
 */
interface DecodeWorkerScope {
  postMessage(message: DecodeWorkerResponse): void;
  onmessage: ((event: MessageEvent<DecodeWorkerRequest>) => void) | null;
}

const workerScope = globalThis as unknown as DecodeWorkerScope;

workerScope.onmessage = (event) => {
  const { id } = event.data;
  const imageData =
    'luma' in event.data ? expandLumaToImageData(event.data.luma) : event.data.imageData;

  decoder
    .decodeFrame(imageData)
    .then((result) => workerScope.postMessage(toDecodeResponse(id, result)))
    .catch((err: unknown) => workerScope.postMessage(toErrorResponse(id, err)));
};
