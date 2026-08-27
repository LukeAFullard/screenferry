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
    return results.find((result) => result.isValid)?.text ?? null;
  },
  decodeWithJsQr: (imageData) =>
    jsQR(imageData.data, imageData.width, imageData.height)?.data ?? null,
});

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
  const { id, imageData } = event.data;

  decoder
    .decodeFrame(imageData)
    .then((result) => workerScope.postMessage(toDecodeResponse(id, result)))
    .catch((err: unknown) => workerScope.postMessage(toErrorResponse(id, err)));
};
