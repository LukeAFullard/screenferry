import { compress, decompress } from './compression';
import { decodeEnvelope, encodeEnvelope } from './envelope';
import { IntegrityError } from './errors';
import { createFountainEncoder, FountainDecoder } from './fountain';
import { sha256Hex } from './hash';

export interface FileMeta {
  filename: string;
  mimeType: string;
}

export interface DecodedFile extends FileMeta {
  bytes: Uint8Array;
}

/**
 * Builds the wire envelope for `bytes`: hashes the original bytes, compresses
 * if that's smaller, and prepends the metadata header. The result is what
 * gets fountain-encoded, not the raw file bytes.
 */
export async function buildEnvelope(bytes: Uint8Array, meta: FileMeta): Promise<Uint8Array> {
  const sha256 = await sha256Hex(bytes);
  const compressed = compress(bytes);

  const useCompressed = compressed.length < bytes.length;
  const payload = useCompressed ? compressed : bytes;

  return encodeEnvelope(
    {
      filename: meta.filename,
      mimeType: meta.mimeType,
      size: bytes.length,
      sha256,
      compressed: useCompressed,
    },
    payload,
  );
}

/** Envelopes `bytes` and returns an infinite stream of fountain-encoded UR parts. */
export async function encodeFileToParts(
  bytes: Uint8Array,
  meta: FileMeta,
  opts?: { maxFragmentLength?: number },
): Promise<AsyncIterable<string>> {
  const envelope = await buildEnvelope(bytes, meta);
  return createFountainEncoder(envelope, opts);
}

/**
 * Reassembles fountain-encoded parts back into the original file, verifying
 * integrity against the envelope's stored SHA-256 hash.
 */
export class TransferDecoder {
  private readonly fountainDecoder = new FountainDecoder();

  receivePart(part: string): void {
    this.fountainDecoder.receivePart(part);
  }

  isComplete(): boolean {
    return this.fountainDecoder.isComplete();
  }

  get progress(): number {
    return this.fountainDecoder.progress;
  }

  async getResult(): Promise<DecodedFile> {
    return unwrapEnvelope(this.fountainDecoder.getResult());
  }
}

/**
 * Decompresses (if flagged) and integrity-checks a fully-reassembled
 * envelope, throwing `IntegrityError` rather than returning bad bytes.
 * Exported separately from `TransferDecoder` so corruption handling can be
 * tested without depending on fountain-decoder completion timing.
 */
export async function unwrapEnvelope(envelope: Uint8Array): Promise<DecodedFile> {
  const { meta, payload } = decodeEnvelope(envelope);
  const bytes = meta.compressed ? decompress(payload) : new Uint8Array(payload);

  const actualSha256 = await sha256Hex(bytes);
  if (actualSha256 !== meta.sha256) {
    throw new IntegrityError(`Checksum mismatch: expected ${meta.sha256}, got ${actualSha256}`);
  }

  return { filename: meta.filename, mimeType: meta.mimeType, bytes };
}
