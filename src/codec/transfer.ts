import { compress, decompress } from './compression';
import { decodeEnvelope, encodeEnvelope } from './envelope';
import { IntegrityError } from './errors';
import { sha256Hex } from './hash';
import { qrLtBackend } from '../backends/qr-lt';
import type { BackendDecoder, Frame, TransferBackend } from '../backends/types';

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

/**
 * Envelopes `bytes` and returns an infinite stream of backend-encoded
 * frames — UR part strings for the default `qr-lt` backend, or whatever
 * `Frame` shape `opts.backend` produces. Omitting `backend` preserves v1
 * behavior exactly.
 */
export async function encodeFileToParts<F extends Frame = string>(
  bytes: Uint8Array,
  meta: FileMeta,
  opts?: { maxFragmentLength?: number; backend?: TransferBackend<F> },
): Promise<AsyncIterable<F>> {
  const envelope = await buildEnvelope(bytes, meta);
  const backend = (opts?.backend ?? qrLtBackend) as unknown as TransferBackend<F>;
  return backend.encode(envelope, { maxFragmentLength: opts?.maxFragmentLength });
}

/**
 * Reassembles backend-encoded frames back into the original file, verifying
 * integrity against the envelope's stored SHA-256 hash. Defaults to the
 * `qr-lt` backend (Luby Transform fountain codes over UR part strings).
 */
export class TransferDecoder<F extends Frame = string> {
  private readonly decoder: BackendDecoder<F>;

  constructor(backend: TransferBackend<F> = qrLtBackend as unknown as TransferBackend<F>) {
    this.decoder = backend.createDecoder();
  }

  receivePart(part: F): void {
    this.decoder.addFrame(part);
  }

  isComplete(): boolean {
    return this.decoder.isComplete;
  }

  get progress(): number {
    return this.decoder.progress ?? 0;
  }

  async getResult(): Promise<DecodedFile> {
    return unwrapEnvelope(this.decoder.getResult());
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
