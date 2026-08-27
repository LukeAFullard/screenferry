import { describe, expect, it } from 'vitest';
import { createFountainEncoder, FountainDecoder } from '../../src/codec/fountain';

/** Deterministic pseudo-random bytes so tests are reproducible across runs. */
function pseudoRandomBytes(length: number, seed = 1): Uint8Array {
  const bytes = new Uint8Array(length);
  let state = seed >>> 0;
  for (let i = 0; i < length; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    bytes[i] = (state >>> 24) & 0xff; // high bits: LCG low bits are weakly random
  }
  return bytes;
}

/** Pulls `count` parts from the (infinite) fountain part stream. */
async function takeParts(source: AsyncIterable<string>, count: number): Promise<string[]> {
  const parts: string[] = [];
  for await (const part of source) {
    parts.push(part);
    if (parts.length >= count) break;
  }
  return parts;
}

describe('fountain codec', () => {
  it('round-trips a small single-fragment buffer', async () => {
    const original = pseudoRandomBytes(64, 1);
    const encoder = createFountainEncoder(original, { maxFragmentLength: 150 });
    const decoder = new FountainDecoder();

    for await (const part of encoder) {
      decoder.receivePart(part);
      if (decoder.isComplete()) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(decoder.getResult()).toEqual(original);
  });

  it('round-trips a large multi-fragment buffer', async () => {
    const original = pseudoRandomBytes(1024 * 1024, 2);
    // A larger fragment length keeps the fragment count (and the fountain
    // mixing algorithm's cost) reasonable for a multi-MB payload; 100-150
    // bytes is QR-sized and only relevant once Stage 3 wires this to frames.
    const encoder = createFountainEncoder(original, { maxFragmentLength: 1000 });
    const decoder = new FountainDecoder();

    let attempts = 0;
    for await (const part of encoder) {
      decoder.receivePart(part);
      attempts++;
      if (decoder.isComplete() || attempts > 10_000) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(decoder.getResult()).toEqual(original);
  }, 20_000);

  it('completes when parts arrive out of order', async () => {
    const original = pseudoRandomBytes(20_000, 3);
    const encoder = createFountainEncoder(original, { maxFragmentLength: 150 });

    // Pull a generous, redundant batch of parts up front, then feed them to
    // the decoder in reverse order.
    const parts = await takeParts(encoder, 300);
    const decoder = new FountainDecoder();

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
    const decoder = new FountainDecoder();

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
    const decoder = new FountainDecoder();
    expect(() => decoder.getResult()).toThrow();
  });
});
