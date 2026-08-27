// Must be imported before `@ngraveio/bc-ur` — see src/env/polyfills.ts for why.
import '../env/polyfills';
import { UR, UREncoder, URDecoder } from '@ngraveio/bc-ur';

/**
 * Fragment length (bytes) used when the caller doesn't specify one.
 * Empirically measured by `npm run qr:capacity` (see `scripts/qr-capacity.mjs`)
 * as the largest fragment whose rendered UR part still fits QR version <= 20
 * at ECC L — Stage 3's chosen ceiling for reliable camera-scan density.
 * Given a small safety margin below the measured 595-byte cutoff.
 */
const DEFAULT_MAX_FRAGMENT_LENGTH = 580;

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
    // bc-ur's URDecoder.isComplete() returns `undefined` (not `false`) before
    // any result exists yet — coerce so this method keeps its boolean contract.
    return Boolean(this.decoder.isComplete());
  }

  /**
   * bc-ur's estimated completion ratio (0-1), as-is — fountain codes have no
   * fixed "exactly N parts needed" number, so this is an estimate to
   * surface to callers, not a guarantee.
   */
  get progress(): number {
    return this.decoder.estimatedPercentComplete();
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
