import { createFountainEncoder, FountainByteDecoder } from './fountain';
import type { BackendDecoder, TransferBackend } from '../types';

class QrBinLtDecoder implements BackendDecoder<Uint8Array> {
  private readonly decoder = new FountainByteDecoder();

  addFrame(frame: Uint8Array): void {
    this.decoder.receivePart(frame);
  }

  get isComplete(): boolean {
    return this.decoder.isComplete();
  }

  get progress(): number {
    return this.decoder.progress;
  }

  getResult(): Uint8Array {
    return this.decoder.getResult();
  }
}

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
export const qrBinLtBackend: TransferBackend<Uint8Array> = {
  id: 'qr-bin-lt',
  encode(bytes, opts) {
    return createFountainEncoder(bytes, opts as { maxFragmentLength?: number } | undefined);
  },
  createDecoder(): BackendDecoder<Uint8Array> {
    return new QrBinLtDecoder();
  },
};

export { createFountainEncoder, FountainByteDecoder } from './fountain';
