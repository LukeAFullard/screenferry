import { describe, expect, it } from 'vitest';
import { encodeToFrames, StreamDecoder } from '../../src/index';
import type { BackendDecoder, ImageFrame, TransferBackend } from '../../src/backends/types';
import { bytesEqual, pseudoRandomBytes } from '../helpers/bytes';

/**
 * A minimal, non-qr-lt `TransferBackend` whose `Frame` is `ImageFrame` (the
 * same shape `cimbarBackend` uses) carrying the whole envelope in one shot
 * — no fountain coding, no chunking. Proves the generic backend plumbing
 * (`encodeToFrames`/`StreamDecoder`/`TransferDecoder`, introduced across
 * Stage 9's refactor and Stage 10's `Frame` widening) is genuinely
 * backend-agnostic, independent of whether any specific backend (qr-lt or
 * the WASM-dependent cimbar) is itself correctly implemented.
 */
function createFakeImageBackend(): TransferBackend<ImageFrame> {
  return {
    id: 'fake-image',
    async *encode(bytes: Uint8Array): AsyncIterable<ImageFrame> {
      for (;;) yield { data: bytes, width: 1, height: 1 };
    },
    createDecoder(): BackendDecoder<ImageFrame> {
      let result: Uint8Array | undefined;
      return {
        addFrame(frame: ImageFrame) {
          result = frame.data;
        },
        get isComplete() {
          return result !== undefined;
        },
        getResult() {
          if (!result) throw new Error('fake-image backend: not complete');
          return result;
        },
      };
    },
  };
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('TransferBackend plumbing (backend-agnostic encode/decode path)', () => {
  it('round-trips a file through a non-qr-lt, image-frame backend end to end', async () => {
    const backend = createFakeImageBackend();
    const bytes = pseudoRandomBytes(4096, 77);
    const file = new File([bytes], 'plumbing.bin', { type: 'application/octet-stream' });

    const decoder = new StreamDecoder(backend);
    for await (const frame of encodeToFrames(file, { backend })) {
      decoder.addFrame(frame);
      if (decoder.isComplete) break;
    }

    expect(decoder.isComplete).toBe(true);
    const result = await decoder.getResult();
    expect((result as File).name).toBe('plumbing.bin');
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  });

  it('omitting backend still defaults to qrLtBackend (string frames)', async () => {
    const bytes = pseudoRandomBytes(512, 78);
    const file = new File([bytes], 'default.bin', { type: 'application/octet-stream' });

    const decoder = new StreamDecoder();
    let sawStringFrame = false;
    for await (const frame of encodeToFrames(file)) {
      sawStringFrame ||= typeof frame === 'string';
      decoder.addFrame(frame);
      if (decoder.isComplete) break;
    }

    expect(sawStringFrame).toBe(true);
    expect(decoder.isComplete).toBe(true);
  });
});
