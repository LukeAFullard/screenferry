import { describe, expect, it } from 'vitest';
import { encodeToFrames, StreamDecoder } from '../../src/index';
import type { BackendDecoder, TransferBackend } from '../../src/backends/types';
import { bytesEqual, pseudoRandomBytes } from '../helpers/bytes';

/**
 * A minimal, non-qr-lt `TransferBackend` whose `Frame` is a raw
 * `Uint8Array` carrying the whole envelope in one shot — no fountain
 * coding, no chunking. Proves the generic backend plumbing
 * (`encodeToFrames`/`StreamDecoder`/`TransferDecoder`, introduced by the
 * codec abstraction refactor) is genuinely backend-agnostic, independent of
 * whether any specific shipped backend is itself correctly implemented.
 */
function createFakeBytesBackend(): TransferBackend<Uint8Array> {
  return {
    id: 'fake-bytes',
    async *encode(bytes: Uint8Array): AsyncIterable<Uint8Array> {
      for (;;) yield bytes;
    },
    createDecoder(): BackendDecoder<Uint8Array> {
      let result: Uint8Array | undefined;
      return {
        addFrame(frame: Uint8Array) {
          result = frame;
        },
        get isComplete() {
          return result !== undefined;
        },
        getResult() {
          if (!result) throw new Error('fake-bytes backend: not complete');
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
  it('round-trips a file through a non-qr-lt, byte-frame backend end to end', async () => {
    const backend = createFakeBytesBackend();
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

  it('passes backendOptions through to backend.encode() verbatim, in place of maxFragmentLength', async () => {
    let receivedOpts: unknown;
    const backend: TransferBackend<Uint8Array> = {
      id: 'opts-spy',
      async *encode(bytes, opts) {
        receivedOpts = opts;
        yield bytes;
      },
      createDecoder: createFakeBytesBackend().createDecoder,
    };

    const file = new File([pseudoRandomBytes(64, 79)], 'opts.bin', {
      type: 'application/octet-stream',
    });
    const iterator = encodeToFrames(file, { backend, backendOptions: { custom: 42 } })[
      Symbol.asyncIterator
    ]();
    await iterator.next();

    expect(receivedOpts).toEqual({ custom: 42 });
  });
});
