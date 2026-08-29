import { describe, expect, it } from 'vitest';
import {
  encodeToFrames,
  NegotiatingStreamDecoder,
  qrBinLtBackend,
  qrLtBackend,
  StreamDecoder,
} from '../../src/index';
import { buildEnvelope } from '../../src/codec/transfer';
import type { Frame, TransferBackend } from '../../src/backends/types';
import { pseudoRandomBytes } from '../helpers/bytes';

/**
 * The byte counters behind `TransferMetrics` reach into bc-ur for a figure
 * it doesn't expose publicly (see `src/backends/fountain-bytes.ts`), so
 * these check the numbers against an independently-computed envelope rather
 * than against the implementation's own arithmetic — a bc-ur upgrade that
 * moved that field would otherwise degrade the metrics silently.
 */
describe.each([
  ['qr-lt', qrLtBackend],
  ['qr-bin-lt', qrBinLtBackend],
])('%s byte progress', (_label, backend) => {
  it('reports the envelope size as totalBytes, and fills it exactly', async () => {
    const bytes = pseudoRandomBytes(5000, 61);
    const file = new File([bytes], 'progress.bin', { type: 'application/octet-stream' });
    const envelope = await buildEnvelope(bytes, {
      filename: 'progress.bin',
      mimeType: 'application/octet-stream',
    });

    const decoder = new StreamDecoder(backend as TransferBackend<Frame>);

    // Nothing to report before the first frame — the count travels in the
    // frames themselves, so there is no earlier moment it could be known.
    expect(decoder.totalBytes).toBeUndefined();
    expect(decoder.bytesReceived).toBe(0);

    const readings: number[] = [];
    let frames = 0;
    for await (const frame of encodeToFrames(file, {
      backend: backend as TransferBackend<Frame>,
      fragmentSize: 300,
    })) {
      decoder.addFrame(frame);
      readings.push(decoder.bytesReceived);
      frames++;
      if (decoder.isComplete || frames > 2000) break;
    }

    expect(decoder.isComplete).toBe(true);

    // The envelope plus whatever the backend frames it with: `qr-bin-lt`
    // fountain-encodes the envelope bytes as-is, while `qr-lt` hands them
    // to bc-ur, which CBOR-wraps them first (a few bytes of byte-string
    // header). Both are genuinely what crosses the link, which is what a
    // throughput number should count — hence a bound, not equality.
    expect(decoder.totalBytes).toBeGreaterThanOrEqual(envelope.length);
    expect(decoder.totalBytes).toBeLessThanOrEqual(envelope.length + 16);
    expect(decoder.bytesReceived).toBe(decoder.totalBytes);
    expect(readings[0]).toBeGreaterThan(0);
  });

  it('never goes backwards, and never overshoots the total', async () => {
    const bytes = pseudoRandomBytes(8000, 62);
    const file = new File([bytes], 'monotonic.bin', { type: 'application/octet-stream' });

    const decoder = new StreamDecoder(backend as TransferBackend<Frame>);
    let previous = 0;
    let frames = 0;

    for await (const frame of encodeToFrames(file, {
      backend: backend as TransferBackend<Frame>,
      fragmentSize: 250,
    })) {
      decoder.addFrame(frame);
      const current = decoder.bytesReceived;

      expect(current).toBeGreaterThanOrEqual(previous);
      expect(current).toBeLessThanOrEqual(decoder.totalBytes!);
      previous = current;

      frames++;
      if (decoder.isComplete || frames > 2000) break;
    }

    expect(decoder.isComplete).toBe(true);
  });
});

describe('single-fragment transfers', () => {
  /**
   * A small or highly compressible file fits one fragment, and bc-ur's
   * `UREncoder` then emits a *single-part* UR that `URDecoder` decodes
   * directly — the fountain decoder never sees a part, so it never learns
   * the message length. This is the demo page's own default payload, and it
   * reported no throughput at all until `singlePartMessageLength` covered
   * it; every unit test here used a payload large enough to miss it.
   */
  it.each([
    ['qr-lt', qrLtBackend],
    ['qr-bin-lt', qrBinLtBackend],
  ])('%s still reports bytes when the whole message fits one fragment', async (_l, backend) => {
    const text = 'a highly compressible sample payload\n'.repeat(50);
    const file = new File([text], 'small.txt', { type: 'text/plain' });

    const decoder = new StreamDecoder(backend as TransferBackend<Frame>);
    let frames = 0;
    for await (const frame of encodeToFrames(file, {
      backend: backend as TransferBackend<Frame>,
    })) {
      decoder.addFrame(frame);
      frames++;
      if (decoder.isComplete || frames > 50) break;
    }

    expect(decoder.isComplete).toBe(true);
    expect(frames).toBe(1);
    expect(decoder.totalBytes).toBeGreaterThan(0);
    expect(decoder.bytesReceived).toBe(decoder.totalBytes);
  });

  it('reports bytes through the negotiated path too, header frames included', async () => {
    const text = 'a highly compressible sample payload\n'.repeat(50);
    const file = new File([text], 'small.txt', { type: 'text/plain' });

    const decoder = new NegotiatingStreamDecoder();
    let frames = 0;
    for await (const frame of encodeToFrames(file, { preferredBackend: 'qr-lt' })) {
      decoder.addFrame(frame);
      frames++;
      if (decoder.isComplete || frames > 50) break;
    }

    expect(decoder.isComplete).toBe(true);
    expect(decoder.totalBytes).toBeGreaterThan(0);
    expect(decoder.bytesReceived).toBe(decoder.totalBytes);
  });
});
