import { describe, expect, it } from 'vitest';
import { encodeToFrames, IntegrityError, StreamDecoder } from '../src/index';
import { encodeEnvelope } from '../src/codec/envelope';
import { createFountainEncoder } from '../src/codec/fountain';
import { sha256Hex } from '../src/codec/hash';
import { bytesEqual, pseudoRandomBytes } from './helpers/bytes';

async function decodeFully(
  frames: AsyncIterable<string>,
  maxAttempts: number,
): Promise<StreamDecoder> {
  const decoder = new StreamDecoder();
  let attempts = 0;
  for await (const frame of frames) {
    decoder.addFrame(frame);
    attempts++;
    if (decoder.isComplete || attempts > maxAttempts) break;
  }
  return decoder;
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('StreamDecoder', () => {
  it('starts incomplete with zero progress', () => {
    const decoder = new StreamDecoder();
    expect(decoder.isComplete).toBe(false);
    expect(decoder.progress).toBe(0);
  });

  it('reconstructs a 1 KB file byte-for-byte', async () => {
    const bytes = pseudoRandomBytes(1024, 21);
    const file = new File([bytes], 'small.bin', { type: 'application/octet-stream' });

    const decoder = await decodeFully(encodeToFrames(file), 2000);
    expect(decoder.isComplete).toBe(true);

    const result = await decoder.getResult();
    expect(result.type).toBe('application/octet-stream');
    expect((result as File).name).toBe('small.bin');
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  });

  it('reconstructs a 100 KB file byte-for-byte', async () => {
    const bytes = pseudoRandomBytes(100 * 1024, 22);
    const file = new File([bytes], 'medium.bin', { type: 'application/octet-stream' });

    const decoder = await decodeFully(encodeToFrames(file), 2000);
    expect(decoder.isComplete).toBe(true);

    const result = await decoder.getResult();
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  });

  it('reconstructs a 5 MB file byte-for-byte', async () => {
    const bytes = pseudoRandomBytes(5 * 1024 * 1024, 23);
    const file = new File([bytes], 'large.bin', { type: 'application/octet-stream' });

    const decoder = await decodeFully(encodeToFrames(file, { fragmentSize: 5000 }), 5_000);
    expect(decoder.isComplete).toBe(true);

    const result = await decoder.getResult();
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  }, 30_000);

  it('reports a monotonically non-decreasing progress estimate that reaches 1 (via isComplete)', async () => {
    const bytes = pseudoRandomBytes(20_000, 24);
    const file = new File([bytes], 'progress.bin', { type: 'application/octet-stream' });

    const decoder = new StreamDecoder();
    let lastProgress = 0;
    let attempts = 0;

    for await (const frame of encodeToFrames(file, { fragmentSize: 150 })) {
      decoder.addFrame(frame);
      expect(decoder.progress).toBeGreaterThanOrEqual(lastProgress);
      lastProgress = decoder.progress;
      attempts++;
      if (decoder.isComplete || attempts > 2000) break;
    }

    expect(decoder.isComplete).toBe(true);
  });

  it('tolerates the same frame arriving 50 times with no ill effect', async () => {
    const bytes = pseudoRandomBytes(2000, 25);
    const file = new File([bytes], 'dup.bin', { type: 'application/octet-stream' });

    const iterator = encodeToFrames(file, { fragmentSize: 150 })[Symbol.asyncIterator]();
    const firstFrame = (await iterator.next()).value as string;

    const decoder = new StreamDecoder();
    const start = Date.now();
    for (let i = 0; i < 50; i++) {
      decoder.addFrame(firstFrame);
    }
    const duplicateHandlingMs = Date.now() - start;

    // 50 duplicates of one frame is nowhere near enough to complete a
    // multi-fragment message — this asserts no crash/growth, not completion.
    expect(decoder.isComplete).toBe(false);
    expect(duplicateHandlingMs).toBeLessThan(1000);

    // Decoding can still proceed normally afterwards.
    let attempts = 0;
    for await (const frame of encodeToFrames(file, { fragmentSize: 150 })) {
      decoder.addFrame(frame);
      attempts++;
      if (decoder.isComplete || attempts > 2000) break;
    }
    expect(decoder.isComplete).toBe(true);

    const result = await decoder.getResult();
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  });

  it('throws when getResult is called before completion', async () => {
    const decoder = new StreamDecoder();
    await expect(decoder.getResult()).rejects.toThrow();
  });

  it('rejects with IntegrityError, distinctly, on a checksum mismatch', async () => {
    const payload = pseudoRandomBytes(500, 26);
    const wrongHash = await sha256Hex(pseudoRandomBytes(500, 999));
    const badEnvelope = encodeEnvelope(
      {
        filename: 'bad.bin',
        mimeType: 'application/octet-stream',
        size: payload.length,
        sha256: wrongHash,
        compressed: false,
      },
      payload,
    );

    const decoder = new StreamDecoder();
    let attempts = 0;
    for await (const part of createFountainEncoder(badEnvelope, { maxFragmentLength: 150 })) {
      decoder.addFrame(part);
      attempts++;
      if (decoder.isComplete || attempts > 1000) break;
    }

    expect(decoder.isComplete).toBe(true);
    await expect(decoder.getResult()).rejects.toThrow(IntegrityError);
  });
});
