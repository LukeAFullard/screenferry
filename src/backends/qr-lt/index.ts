import { createFountainEncoder, FountainDecoder } from './fountain';
import type { BackendDecoder, TransferBackend } from '../types';

class QrLtDecoder implements BackendDecoder<string> {
  private readonly decoder = new FountainDecoder();

  addFrame(frame: string): void {
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
 * The v1 backend: Luby Transform fountain codes (Stage 2), rendered as QR
 * frame strings (Stage 3). `Frame` for this backend is always a UR part
 * string — see `src/backends/types.ts` for why the interface stays generic.
 */
export const qrLtBackend: TransferBackend<string> = {
  id: 'qr-lt',
  encode(bytes, opts) {
    return createFountainEncoder(bytes, opts as { maxFragmentLength?: number } | undefined);
  },
  createDecoder(): BackendDecoder<string> {
    return new QrLtDecoder();
  },
};

export { createFountainEncoder, FountainDecoder } from './fountain';

export { computeQrModules, DEFAULT_ECC_LEVEL, DEFAULT_MAX_QR_VERSION } from './encode';
export type { EccLevel, QrEncodeOptions, QrModuleGrid } from './encode';

export { rasterizeQrModules, DEFAULT_MODULE_SIZE_PX, MIN_QUIET_ZONE_MODULES } from './raster';
export type { RasterOptions, RasterResult } from './raster';

export { renderQrToCanvas } from './render';
export type { RenderQrOptions } from './render';

export { DisplayDriver } from './display-driver';
export type { DisplayDriverOptions } from './display-driver';
