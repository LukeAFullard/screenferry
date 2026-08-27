import { encodeFileToParts } from './codec/transfer';

export interface EncodeOptions {
  /** Fragment size (payload bytes per frame). */
  fragmentSize?: number;
  /** Target frame rate in FPS. */
  fps?: number;
}

/**
 * Envelopes and fountain-encodes `file`, yielding raw UR part strings —
 * not rendered pixels. This layer is UI-agnostic; rendering the returned
 * strings is the caller's choice (see `DisplayDriver` for a canvas-based
 * one). The stream is infinite (fountain codes are rateless): the caller
 * decides when it has sent enough and stops pulling.
 */
export async function* encodeToFrames(file: Blob, opts?: EncodeOptions): AsyncIterable<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename = 'name' in file && typeof file.name === 'string' ? file.name : 'file';
  const mimeType = file.type || 'application/octet-stream';

  const parts = await encodeFileToParts(
    bytes,
    { filename, mimeType },
    { maxFragmentLength: opts?.fragmentSize },
  );
  yield* parts;
}

export { DisplayDriver } from './qr/display-driver';
export type { DisplayDriverOptions } from './qr/display-driver';

export { Scanner, Camera } from './scan/index';
export type { ScannerOptions, CameraOptions } from './scan/index';

export class StreamDecoder {
  addFrame(_data: string): void {
    throw new Error('Not implemented');
  }

  get progress(): number {
    return 0;
  }

  get isComplete(): boolean {
    return false;
  }

  async getResult(): Promise<Blob> {
    throw new Error('Not implemented');
  }
}
