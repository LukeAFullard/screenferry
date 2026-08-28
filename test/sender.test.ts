import { describe, expect, it } from 'vitest';
import { encodeToFrames } from '../src/index';
import { TransferDecoder } from '../src/codec/transfer';
import { bytesEqual, pseudoRandomBytes } from './helpers/bytes';

async function decodeAllFrames(
  frames: AsyncIterable<string>,
  maxAttempts: number,
): Promise<TransferDecoder> {
  const decoder = new TransferDecoder();
  let attempts = 0;
  for await (const frame of frames) {
    decoder.receivePart(frame);
    attempts++;
    if (decoder.isComplete() || attempts > maxAttempts) break;
  }
  return decoder;
}

describe('encodeToFrames', () => {
  it('yields decodable frames for a 1 KB file', async () => {
    const bytes = pseudoRandomBytes(1024, 11);
    const file = new File([bytes], 'small.bin', { type: 'application/octet-stream' });

    const decoder = await decodeAllFrames(encodeToFrames(file), 2000);
    expect(decoder.isComplete()).toBe(true);

    const result = await decoder.getResult();
    expect(result.filename).toBe('small.bin');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(bytesEqual(result.bytes, bytes)).toBe(true);
  });

  it('yields decodable frames for a 100 KB file', async () => {
    const bytes = pseudoRandomBytes(100 * 1024, 12);
    const file = new File([bytes], 'medium.bin', { type: 'application/octet-stream' });

    const decoder = await decodeAllFrames(encodeToFrames(file), 2000);
    expect(decoder.isComplete()).toBe(true);

    const result = await decoder.getResult();
    expect(bytesEqual(result.bytes, bytes)).toBe(true);
  });

  it('yields decodable frames for a 5 MB file', async () => {
    const bytes = pseudoRandomBytes(5 * 1024 * 1024, 13);
    const file = new File([bytes], 'large.bin', { type: 'application/octet-stream' });

    // A larger fragment length keeps the fountain mixing algorithm's cost
    // (and this test's runtime) reasonable for a multi-MB payload; the
    // library's own QR-sized default is exercised by the smaller tests.
    const decoder = await decodeAllFrames(encodeToFrames(file, { fragmentSize: 5000 }), 5_000);
    expect(decoder.isComplete()).toBe(true);

    const result = await decoder.getResult();
    expect(bytesEqual(result.bytes, bytes)).toBe(true);
  }, 30_000);

  it('falls back to a generic filename for a plain Blob (no name)', async () => {
    const bytes = pseudoRandomBytes(512, 14);
    const blob = new Blob([bytes], { type: 'text/plain' });

    const decoder = await decodeAllFrames(encodeToFrames(blob), 2000);
    expect(decoder.isComplete()).toBe(true);

    const result = await decoder.getResult();
    expect(result.filename).toBe('file');
    expect(result.mimeType).toBe('text/plain');
    expect(bytesEqual(result.bytes, bytes)).toBe(true);
  });

  it('respects a custom fragmentSize', async () => {
    const bytes = pseudoRandomBytes(50_000, 15);
    const file = new File([bytes], 'custom.bin', { type: 'application/octet-stream' });

    const decoder = await decodeAllFrames(encodeToFrames(file, { fragmentSize: 100 }), 3000);
    expect(decoder.isComplete()).toBe(true);
    expect(bytesEqual((await decoder.getResult()).bytes, bytes)).toBe(true);
  });
});
