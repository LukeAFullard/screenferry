/**
 * Wire envelope prepended to file bytes before fountain-encoding, so the
 * receiver can rebuild a real file (name, type, integrity) from raw parts.
 *
 * Wire format: [4-byte big-endian header length][header bytes, UTF-8 JSON][payload bytes]
 */
export interface EnvelopeMeta {
  filename: string;
  mimeType: string;
  size: number;
  sha256: string;
  compressed: boolean;
}

const HEADER_LENGTH_BYTES = 4;

export function encodeEnvelope(meta: EnvelopeMeta, payload: Uint8Array): Uint8Array {
  const headerBytes = new TextEncoder().encode(JSON.stringify(meta));

  const envelope = new Uint8Array(HEADER_LENGTH_BYTES + headerBytes.length + payload.length);
  const view = new DataView(envelope.buffer);
  view.setUint32(0, headerBytes.length, false);
  envelope.set(headerBytes, HEADER_LENGTH_BYTES);
  envelope.set(payload, HEADER_LENGTH_BYTES + headerBytes.length);

  return envelope;
}

export function decodeEnvelope(envelope: Uint8Array): { meta: EnvelopeMeta; payload: Uint8Array } {
  if (envelope.length < HEADER_LENGTH_BYTES) {
    throw new Error('Envelope is too short to contain a header length');
  }

  const view = new DataView(envelope.buffer, envelope.byteOffset, envelope.byteLength);
  const headerLength = view.getUint32(0, false);

  const headerStart = HEADER_LENGTH_BYTES;
  const headerEnd = headerStart + headerLength;
  if (headerEnd > envelope.length) {
    throw new Error('Envelope header length exceeds available data');
  }

  const headerBytes = envelope.subarray(headerStart, headerEnd);
  const meta = JSON.parse(new TextDecoder().decode(headerBytes)) as EnvelopeMeta;
  const payload = envelope.subarray(headerEnd);

  return { meta, payload };
}
