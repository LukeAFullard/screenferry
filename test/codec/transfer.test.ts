import { describe, expect, it } from 'vitest';
import { IntegrityError } from '../../src/codec/errors';
import {
  buildEnvelope,
  encodeFileToParts,
  TransferDecoder,
  unwrapEnvelope,
} from '../../src/codec/transfer';
import { decodeEnvelope } from '../../src/codec/envelope';
import { pseudoRandomBytes } from '../helpers/bytes';

async function decodeFully(
  bytes: Uint8Array,
  meta: { filename: string; mimeType: string },
  maxAttempts = 20_000,
) {
  const parts = await encodeFileToParts(bytes, meta, { maxFragmentLength: 150 });
  const decoder = new TransferDecoder();

  let attempts = 0;
  for await (const part of parts) {
    decoder.receivePart(part);
    attempts++;
    if (decoder.isComplete() || attempts > maxAttempts) break;
  }

  expect(decoder.isComplete()).toBe(true);
  return decoder.getResult();
}

describe('transfer envelope + fountain integration', () => {
  it('round-trips a highly compressible file end to end', async () => {
    const original = new TextEncoder().encode('hello world '.repeat(500));
    const result = await decodeFully(original, {
      filename: 'greeting.txt',
      mimeType: 'text/plain',
    });

    expect(result.filename).toBe('greeting.txt');
    expect(result.mimeType).toBe('text/plain');
    expect(result.bytes).toEqual(original);
  });

  it('round-trips incompressible (pre-random) bytes and skips compression', async () => {
    const original = pseudoRandomBytes(5000, 42);
    const envelope = await buildEnvelope(original, {
      filename: 'blob.bin',
      mimeType: 'application/octet-stream',
    });
    const { meta } = decodeEnvelope(envelope);

    expect(meta.compressed).toBe(false);
    expect(meta.size).toBe(original.length);

    const result = await decodeFully(original, {
      filename: 'blob.bin',
      mimeType: 'application/octet-stream',
    });
    expect(result.bytes).toEqual(original);
  });
});

describe('envelope integrity verification', () => {
  it('throws IntegrityError when the reassembled payload does not match the stored hash', async () => {
    const original = pseudoRandomBytes(2048, 7);
    const envelope = await buildEnvelope(original, {
      filename: 'file.bin',
      mimeType: 'application/octet-stream',
    });

    // Flip a bit inside the payload region (after the header) to simulate
    // corruption that made it past fountain reassembly.
    const corrupted = new Uint8Array(envelope);
    corrupted[corrupted.length - 1] ^= 0xff;

    await expect(unwrapEnvelope(corrupted)).rejects.toThrow(IntegrityError);
  });

  it('never returns corrupted bytes alongside the thrown error', async () => {
    const original = pseudoRandomBytes(2048, 8);
    const envelope = await buildEnvelope(original, {
      filename: 'file.bin',
      mimeType: 'application/octet-stream',
    });
    const corrupted = new Uint8Array(envelope);
    corrupted[corrupted.length - 1] ^= 0xff;

    await expect(unwrapEnvelope(corrupted)).rejects.toThrow();
  });
});
