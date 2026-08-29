// Must be imported before `@ngraveio/bc-ur` — see src/env/polyfills.ts for why.
import '../../env/polyfills';
import { UR, UREncoder, URDecoder } from '@ngraveio/bc-ur';
import {
  innerFountainDecoder,
  readExpectedMessageLength,
  recoveredByteCount,
  singlePartMessageLength,
} from '../fountain-bytes';

/**
 * Fragment length (bytes) used when the caller doesn't specify one.
 * Empirically measured by `npm run qr:capacity` (see `scripts/qr-capacity.mjs`)
 * as the largest fragment that keeps a rendered UR part fitting QR version
 * <= 40 at ECC L — the highest version ISO/IEC 18004 defines — even in the
 * worst case for a long-running/large transfer.
 *
 * A UR part string encodes `seqNum` and `seqLength` both as plain decimal
 * digits (in the `ur:type/seqNum-seqLength/...` path) and as CBOR integers
 * (in the bytewords-encoded body), and both encodings grow in fixed steps
 * as the values cross digit/byte-width boundaries. `seqLength` grows with
 * file size (more fragments); `seqNum` grows with transfer duration (the
 * fountain encoder cycles forever, so a long-running or heavily-retried
 * transfer pushes it arbitrarily high). A fragment length calibrated only
 * against a small sample (few fragments, low seqNum) fits initially but
 * throws `RangeError: Data too long` once real usage grows past that
 * sample's digit/byte-width band — every subsequent part then fails the
 * same way, since seqNum only increases, hanging the display on whatever
 * last rendered successfully. `qr-capacity.mjs` accounts for this
 * directly, so 2111 already includes that margin — don't bump it back up
 * to whatever a naive single-sample search reports.
 */
const DEFAULT_MAX_FRAGMENT_LENGTH = 2111;

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

  /**
   * Total bytes this stream is carrying, announced by every fountain part's
   * header — `undefined` until the first part is accepted.
   *
   * These are *wire* bytes: the envelope (gzipped payload plus metadata
   * header), as bc-ur frames it — `UR.fromBuffer` CBOR-wraps the envelope
   * before fountain-encoding, so this runs a few bytes over the envelope's
   * own length. Not the original file's size, which is only readable once
   * the envelope is reassembled and decompressed.
   */
  get totalBytes(): number | undefined {
    return (
      readExpectedMessageLength(innerFountainDecoder(this.decoder)) ??
      singlePartMessageLength(this.decoder)
    );
  }

  /**
   * Envelope bytes recovered so far — see `recoveredByteCount`, which is
   * accurate to within one fragment. Once complete, everything arrived by
   * definition, so report the total exactly rather than that rounding (and
   * so a single-part transfer, which never populates the fragment counts at
   * all, still reports its bytes).
   */
  get bytesReceived(): number {
    if (this.isComplete()) return this.totalBytes ?? 0;
    return recoveredByteCount(
      this.totalBytes,
      this.decoder.expectedPartCount(),
      this.decoder.receivedPartIndexes().length,
    );
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
