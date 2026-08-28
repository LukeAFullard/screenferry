import { describe, expect, it } from 'vitest';
import { createFountainEncoder, FountainByteDecoder } from '../../src/backends/qr-bin-lt/fountain';
import { bytesEqual, pseudoRandomBytes } from '../helpers/bytes';

/** Pulls `count` parts from the (infinite) fountain part stream. */
async function takeParts(source: AsyncIterable<Uint8Array>, count: number): Promise<Uint8Array[]> {
  const parts: Uint8Array[] = [];
  for await (const part of source) {
    parts.push(part);
    if (parts.length >= count) break;
  }
  return parts;
}

describe('byte-mode fountain codec (qr-bin-lt)', () => {
  it('round-trips a small single-fragment buffer', async () => {
    const original = pseudoRandomBytes(64, 1);
    const encoder = createFountainEncoder(original, { maxFragmentLength: 150 });
    const decoder = new FountainByteDecoder();

    for await (const part of encoder) {
      decoder.receivePart(part);
      if (decoder.isComplete()) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(decoder.getResult()).toEqual(original);
  });

  it('round-trips a large multi-fragment buffer', async () => {
    const original = pseudoRandomBytes(1024 * 1024, 2);
    const encoder = createFountainEncoder(original, { maxFragmentLength: 1000 });
    const decoder = new FountainByteDecoder();

    let attempts = 0;
    for await (const part of encoder) {
      decoder.receivePart(part);
      attempts++;
      if (decoder.isComplete() || attempts > 10_000) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(bytesEqual(decoder.getResult(), original)).toBe(true);
  }, 20_000);

  it('completes when parts arrive out of order', async () => {
    const original = pseudoRandomBytes(20_000, 3);
    const encoder = createFountainEncoder(original, { maxFragmentLength: 150 });

    const parts = await takeParts(encoder, 300);
    const decoder = new FountainByteDecoder();

    for (const part of [...parts].reverse()) {
      decoder.receivePart(part);
      if (decoder.isComplete()) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(decoder.getResult()).toEqual(original);
  });

  it('completes when ~20% of parts are dropped', async () => {
    const original = pseudoRandomBytes(20_000, 4);
    const encoder = createFountainEncoder(original, { maxFragmentLength: 150 });
    const decoder = new FountainByteDecoder();

    let index = 0;
    for await (const part of encoder) {
      index++;
      const isDropped = index % 5 === 0; // drop every 5th part (~20%)
      if (!isDropped) {
        decoder.receivePart(part);
      }
      if (decoder.isComplete() || index > 2000) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(decoder.getResult()).toEqual(original);
  });

  it('throws when getResult is called before completion', () => {
    const decoder = new FountainByteDecoder();
    expect(() => decoder.getResult()).toThrow();
  });

  it('yields parts as raw bytes, not text — larger payload per part than qr-lt at the same QR capacity', async () => {
    const maxFragmentLength = 2931; // DEFAULT_MAX_FRAGMENT_LENGTH, see fountain.ts
    // An exact multiple of maxFragmentLength: FountainEncoder.findNominalFragmentLength
    // balances fragment sizes evenly across the whole message, so a size
    // that doesn't divide evenly can pick a smaller nominal fragment
    // length than the cap -- an exact multiple guarantees max-size
    // fragments instead.
    const original = pseudoRandomBytes(maxFragmentLength * 20, 5);
    const encoder = createFountainEncoder(original, { maxFragmentLength });
    const { value: part } = await encoder[Symbol.asyncIterator]().next();

    expect(part).toBeInstanceOf(Uint8Array);
    // Fragment length plus a few bytes of CBOR part-header overhead --
    // nowhere near qr-lt's 2x-per-byte bytewords inflation for the same
    // ~2900-2950 byte QR v40/ECC L capacity.
    expect(part!.length).toBeLessThanOrEqual(maxFragmentLength + 30);
    expect(part!.length).toBeGreaterThan(maxFragmentLength);
  });
});
