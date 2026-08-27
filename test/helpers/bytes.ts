/** Deterministic pseudo-random bytes so tests are reproducible across runs. */
export function pseudoRandomBytes(length: number, seed = 1): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length);
  let state = seed >>> 0;
  for (let i = 0; i < length; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    bytes[i] = (state >>> 24) & 0xff; // high bits: LCG low bits are weakly random
  }
  return bytes;
}

/**
 * Fast byte-for-byte equality via `Buffer.compare` (native, O(n) with a low
 * constant). Vitest's `expect(...).toEqual(...)` walks large `Uint8Array`s
 * element-by-element with generic structural-equality overhead — fine for
 * kilobyte buffers, but multi-MB comparisons can dominate a test's runtime
 * and cause spurious timeouts.
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return Buffer.compare(a, b) === 0;
}
