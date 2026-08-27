import { UR, UREncoder, URDecoder } from '@ngraveio/bc-ur';

// bc-ur reads/writes the Node `Buffer` global internally. That's fine under
// Vitest's Node test environment, but a browser bundle needs a `Buffer`
// polyfill on `globalThis` — deferred to Stage 4, where this module is
// first wired into browser-facing code.

/**
 * Fragment length (bytes) used when the caller doesn't specify one. Chosen
 * as a conservative starting point for QR payload capacity; tuned
 * empirically once Stage 3 measures real QR capacity vs. camera reliability.
 */
const DEFAULT_MAX_FRAGMENT_LENGTH = 150;

/**
 * Drives a Luby Transform fountain encoder over `bytes`, yielding UR-encoded
 * parts forever. Fountain codes are rateless — there is no natural end to
 * the stream, so the caller decides when it has sent enough parts and stops
 * pulling from the iterator.
 */
export async function* createFountainEncoder(
  bytes: Uint8Array,
  opts?: { maxFragmentLength?: number },
): AsyncIterable<string> {
  const ur = UR.fromBuffer(Buffer.from(bytes));
  const encoder = new UREncoder(ur, opts?.maxFragmentLength ?? DEFAULT_MAX_FRAGMENT_LENGTH);

  for (;;) {
    yield encoder.nextPart();
  }
}

/** Reassembles fountain-encoded UR parts back into the original byte buffer. */
export class FountainDecoder {
  private readonly decoder = new URDecoder();

  receivePart(part: string): void {
    this.decoder.receivePart(part);
  }

  isComplete(): boolean {
    return this.decoder.isComplete();
  }

  /** Envelope-encoded bytes — not yet decompressed or checksum-verified. */
  getResult(): Uint8Array {
    if (!this.decoder.isComplete()) {
      throw new Error('FountainDecoder: cannot get result before decoding is complete');
    }
    if (!this.decoder.isSuccess()) {
      throw new Error(`FountainDecoder: decode failed: ${this.decoder.resultError()}`);
    }

    return new Uint8Array(this.decoder.resultUR().decodeCBOR());
  }
}
