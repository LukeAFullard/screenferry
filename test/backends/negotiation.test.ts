import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import {
  encodeToFrames,
  NegotiatingStreamDecoder,
  qrLtBackend,
  qrBinLtBackend,
  resolvePreferredBackend,
} from '../../src/index';
import {
  decodeHeaderFrame,
  encodeHeaderFrame,
  scannerOptionsForBackend,
} from '../../src/backends/negotiation';
import type { Frame } from '../../src/backends/types';
import { computeQrModules } from '../../src/backends/qr-lt/encode';
import { rasterizeQrModules } from '../../src/backends/qr-lt/raster';
import { bytesEqual, pseudoRandomBytes } from '../helpers/bytes';

function decodeAsPlainQr(text: string): string | null {
  const { modules } = computeQrModules(text);
  const { data, width, height } = rasterizeQrModules(modules);
  return jsQR(data, width, height)?.data ?? null;
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('header/beacon frame', () => {
  it('round-trips through an actual QR render+scan cycle, for every backend id', () => {
    for (const backend of [qrLtBackend, qrBinLtBackend]) {
      const header = encodeHeaderFrame(backend.id);
      const scanned = decodeAsPlainQr(header);
      // Not necessarily case-identical to `header` — the QR layer
      // uppercases case-insensitive-safe text for denser encoding (see
      // `decodeHeaderFrame`'s doc comment) — but must still decode back to
      // the right backend id, which is what actually matters here.
      expect(scanned).not.toBeNull();
      expect(decodeHeaderFrame(scanned!)).toBe(backend.id);
    }
  });

  it('is never mistaken for a qrLtBackend data frame (a bc-ur UR part)', () => {
    // UR parts always start `ur:` — the header prefix is deliberately disjoint.
    expect(decodeHeaderFrame('ur:bytes/1-1/lpadaobncpft')).toBeUndefined();
  });

  it('is also recognized from a Uint8Array frame (post-switch to byte-mode decoding)', () => {
    const header = encodeHeaderFrame('qr-bin-lt');
    const asBytes = new TextEncoder().encode(header);
    expect(decodeHeaderFrame(asBytes)).toBe('qr-bin-lt');
  });

  it('is undefined for arbitrary bytes that are not a header frame', () => {
    expect(decodeHeaderFrame(new Uint8Array([1, 2, 3]))).toBeUndefined();
  });
});

describe('scannerOptionsForBackend', () => {
  it('maps qr-bin-lt to decodeBytes, and qr-lt to nothing', () => {
    expect(scannerOptionsForBackend('qr-bin-lt')).toEqual({ decodeBytes: true });
    expect(scannerOptionsForBackend('qr-lt')).toEqual({});
    expect(scannerOptionsForBackend('unknown')).toEqual({});
  });
});

describe('resolvePreferredBackend', () => {
  it('resolves each backend id to its backend', async () => {
    expect(await resolvePreferredBackend('qr-lt')).toBe(qrLtBackend);
    expect(await resolvePreferredBackend('qr-bin-lt')).toBe(qrBinLtBackend);
  });

  it('"auto" resolves to qr-lt — never qr-bin-lt (compatibility with older receivers)', async () => {
    expect(await resolvePreferredBackend('auto')).toBe(qrLtBackend);
  });
});

describe('encodeToFrames({ preferredBackend })', () => {
  it('always yields the header frame first, before any data frame', async () => {
    const bytes = pseudoRandomBytes(256, 90);
    const file = new File([bytes], 'first.bin', { type: 'application/octet-stream' });

    const iterator = encodeToFrames(file, { preferredBackend: 'qr-lt' })[Symbol.asyncIterator]();
    const first = (await iterator.next()).value;

    expect(decodeHeaderFrame(first as string)).toBe('qr-lt');
  });

  it("announces 'qr-bin-lt' as its first frame when explicitly preferred", async () => {
    const bytes = pseudoRandomBytes(64, 91);
    const file = new File([bytes], 'bin-header.bin', { type: 'application/octet-stream' });

    const iterator = encodeToFrames(file, { preferredBackend: 'qr-bin-lt' })[
      Symbol.asyncIterator
    ]();
    const first = (await iterator.next()).value;

    expect(decodeHeaderFrame(first as string)).toBe('qr-bin-lt');
  });

  it('round-trips a full negotiated qr-bin-lt transfer end to end', async () => {
    const bytes = pseudoRandomBytes(10_000, 96);
    const file = new File([bytes], 'bin-negotiated.bin', { type: 'application/octet-stream' });

    let resolvedBackendId: string | undefined;
    const decoder = new NegotiatingStreamDecoder({
      onBackendResolved: (id) => {
        resolvedBackendId = id;
      },
    });

    let attempts = 0;
    for await (const frame of encodeToFrames(file, {
      preferredBackend: 'qr-bin-lt',
      fragmentSize: 300,
    })) {
      decoder.addFrame(frame);
      attempts++;
      if (decoder.isComplete || attempts > 2000) break;
    }

    expect(resolvedBackendId).toBe('qr-bin-lt');
    expect(decoder.backendId).toBe('qr-bin-lt');
    expect(decoder.isComplete).toBe(true);
    const result = await decoder.getResult();
    expect((result as File).name).toBe('bin-negotiated.bin');
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  });

  it('repeats the header frame every N data frames', async () => {
    const bytes = pseudoRandomBytes(64, 92);
    const file = new File([bytes], 'interval.bin', { type: 'application/octet-stream' });

    const seen: Frame[] = [];
    let index = 0;
    for await (const frame of encodeToFrames(file, {
      preferredBackend: 'qr-lt',
      headerIntervalFrames: 3,
    })) {
      seen.push(frame);
      index++;
      if (index >= 9) break;
    }

    // headerIntervalFrames counts *data* frames between headers, so each
    // header+3-data block is 4 items in the combined stream: header at 0,
    // 3 data frames, header again at 4, and so on.
    const headerIndexes = seen
      .map((frame, i) => (decodeHeaderFrame(frame) !== undefined ? i : -1))
      .filter((i) => i >= 0);
    expect(headerIndexes).toEqual([0, 4, 8]);
  });

  it('"auto" resolves to qr-lt and still completes a full round trip', async () => {
    const bytes = pseudoRandomBytes(4096, 93);
    const file = new File([bytes], 'auto.bin', { type: 'application/octet-stream' });

    const decoder = new NegotiatingStreamDecoder();
    let attempts = 0;
    for await (const frame of encodeToFrames(file, { preferredBackend: 'auto' })) {
      decoder.addFrame(frame);
      attempts++;
      if (decoder.isComplete || attempts > 2000) break;
    }

    expect(decoder.backendId).toBe('qr-lt');
    expect(decoder.isComplete).toBe(true);
    const result = await decoder.getResult();
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  });
});

describe('NegotiatingStreamDecoder', () => {
  it('round-trips a full negotiated qr-lt transfer end to end', async () => {
    const bytes = pseudoRandomBytes(10_000, 94);
    const file = new File([bytes], 'negotiated.bin', { type: 'application/octet-stream' });

    let resolvedBackendId: string | undefined;
    const decoder = new NegotiatingStreamDecoder({
      onBackendResolved: (id) => {
        resolvedBackendId = id;
      },
    });

    let attempts = 0;
    for await (const frame of encodeToFrames(file, {
      preferredBackend: 'qr-lt',
      fragmentSize: 300,
    })) {
      decoder.addFrame(frame);
      attempts++;
      if (decoder.isComplete || attempts > 2000) break;
    }

    expect(resolvedBackendId).toBe('qr-lt');
    expect(decoder.backendId).toBe('qr-lt');
    expect(decoder.isComplete).toBe(true);
    const result = await decoder.getResult();
    expect((result as File).name).toBe('negotiated.bin');
    expect(bytesEqual(await blobBytes(result), bytes)).toBe(true);
  });

  it('ignores header frames as beacons, never treating them as payload', () => {
    const decoder = new NegotiatingStreamDecoder();
    decoder.addFrame(encodeHeaderFrame('qr-lt'));
    decoder.addFrame(encodeHeaderFrame('qr-lt'));
    expect(decoder.isComplete).toBe(false);
    expect(decoder.backendId).toBe('qr-lt');
  });

  it('resolves qr-bin-lt from its header frame alone, before any data frame', () => {
    let resolved: string | undefined;
    const decoder = new NegotiatingStreamDecoder({ onBackendResolved: (id) => (resolved = id) });
    decoder.addFrame(encodeHeaderFrame('qr-bin-lt'));
    expect(resolved).toBe('qr-bin-lt');
    expect(decoder.backendId).toBe('qr-bin-lt');
  });

  it('ignores the id of a backend this build no longer has (a sender on an older version)', () => {
    const decoder = new NegotiatingStreamDecoder();
    decoder.addFrame(encodeHeaderFrame('cimbar'));
    expect(decoder.backendId).toBeUndefined();
  });

  it('falls back to qr-lt if a qr-lt data frame arrives before any header (header frame lost)', async () => {
    const bytes = pseudoRandomBytes(2000, 95);
    const file = new File([bytes], 'lost-header.bin', { type: 'application/octet-stream' });

    const decoder = new NegotiatingStreamDecoder();
    let attempts = 0;
    for await (const frame of encodeToFrames(file, { preferredBackend: 'qr-lt' })) {
      if (decodeHeaderFrame(frame as string) !== undefined) continue; // simulate losing every header frame
      decoder.addFrame(frame);
      attempts++;
      if (decoder.isComplete || attempts > 2000) break;
    }

    expect(decoder.backendId).toBe('qr-lt');
    expect(decoder.isComplete).toBe(true);
    expect(bytesEqual(await blobBytes(await decoder.getResult()), bytes)).toBe(true);
  });

  it('ignores an unrecognized header backend id and keeps waiting', () => {
    const decoder = new NegotiatingStreamDecoder();
    decoder.addFrame(encodeHeaderFrame('some-future-backend'));
    expect(decoder.backendId).toBeUndefined();

    decoder.addFrame(encodeHeaderFrame('qr-lt'));
    expect(decoder.backendId).toBe('qr-lt');
  });

  it('throws if getResult is called before a backend has been resolved', async () => {
    const decoder = new NegotiatingStreamDecoder();
    await expect(decoder.getResult()).rejects.toThrow();
  });
});
