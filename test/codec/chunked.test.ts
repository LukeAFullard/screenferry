import { describe, expect, it } from 'vitest';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import FountainEncoderImport from '@ngraveio/bc-ur/dist/fountainEncoder';
import {
  encodeToFrames,
  NegotiatingStreamDecoder,
  StreamDecoder,
  qrLtBackend,
} from '../../src/index';
import { computeAutoChunkCount } from '../../src/codec/chunked-transfer';
import { tagFrameWithChunk, untagFrameWithChunk } from '../../src/codec/frame-tag';
import {
  computeQrModules,
  DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED,
} from '../../src/backends/qr-lt';
import { DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED as DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED_BIN } from '../../src/backends/qr-bin-lt';
import { bytesEqual, pseudoRandomBytes } from '../helpers/bytes';

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('Chunked Fountain Codec Core & Tagging', () => {
  it('correctly tags and untags frames for string and Uint8Array', () => {
    const strFrame = 'ur:bytes/1-10/test';
    const taggedStr = tagFrameWithChunk(strFrame, 3);
    expect(taggedStr).toBe('c3:ur:bytes/1-10/test');
    const untaggedStr = untagFrameWithChunk(taggedStr, true);
    expect(untaggedStr.chunkId).toBe(3);
    expect(untaggedStr.frame).toBe(strFrame);

    const binFrame = new Uint8Array([10, 20, 30]);
    const taggedBin = tagFrameWithChunk(binFrame, 5);
    expect(taggedBin[0]).toBe(5);
    const untaggedBin = untagFrameWithChunk(taggedBin, true);
    expect(untaggedBin.chunkId).toBe(5);
    expect(bytesEqual(untaggedBin.frame as Uint8Array, binFrame)).toBe(true);
  });

  it('chunkCount = 1 produces wire-identical frames to unchunked', async () => {
    const bytes = pseudoRandomBytes(1024, 101);
    const file = new File([bytes], 'test-single.bin', { type: 'application/octet-stream' });

    const framesUnchunked: string[] = [];
    const framesChunked1: string[] = [];

    let count = 0;
    for await (const frame of encodeToFrames(file, {
      preferredBackend: 'qr-lt',
      fragmentSize: 200,
    })) {
      framesUnchunked.push(frame as string);
      if (++count >= 10) break;
    }

    count = 0;
    for await (const frame of encodeToFrames(file, {
      preferredBackend: 'qr-lt',
      fragmentSize: 200,
      chunked: true,
      chunkCount: 1,
    })) {
      framesChunked1.push(frame as string);
      if (++count >= 10) break;
    }

    expect(framesChunked1).toEqual(framesUnchunked);
  });

  it('computes auto chunk count properly', () => {
    expect(computeAutoChunkCount(1000, 2000)).toBe(1);
    expect(computeAutoChunkCount(3000 * 2000, 2000)).toBe(1);
    expect(computeAutoChunkCount(10000 * 2000, 2000)).toBe(4);
  });

  it('round-trips a chunked transfer (chunkCount = 3) with qr-lt backend', async () => {
    const bytes = pseudoRandomBytes(15_000, 102);
    const file = new File([bytes], 'chunked-lt.bin', { type: 'application/octet-stream' });

    const decoder = new StreamDecoder(qrLtBackend, 3);

    let attempts = 0;
    for await (const frame of encodeToFrames(file, {
      backend: qrLtBackend,
      fragmentSize: 300,
      chunked: true,
      chunkCount: 3,
    })) {
      decoder.addFrame(frame as string);
      attempts++;
      if (decoder.isComplete || attempts > 2000) break;
    }

    expect(decoder.isComplete).toBe(true);
    const resultBlob = await decoder.getResult();
    expect((resultBlob as File).name).toBe('chunked-lt.bin');
    expect(bytesEqual(await blobBytes(resultBlob), bytes)).toBe(true);
  });

  it('round-trips a negotiated chunked transfer (chunkCount = 4) with qr-bin-lt backend', async () => {
    const bytes = pseudoRandomBytes(20_000, 103);
    const file = new File([bytes], 'chunked-bin.bin', { type: 'application/octet-stream' });

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
      chunked: true,
      chunkCount: 4,
    })) {
      decoder.addFrame(frame);
      attempts++;
      if (decoder.isComplete || attempts > 2500) break;
    }

    expect(resolvedBackendId).toBe('qr-bin-lt');
    expect(decoder.chunkCount).toBe(4);
    expect(decoder.isComplete).toBe(true);
    const resultBlob = await decoder.getResult();
    expect((resultBlob as File).name).toBe('chunked-bin.bin');
    expect(bytesEqual(await blobBytes(resultBlob), bytes)).toBe(true);
  });

  it('handles dropped and out-of-order frames in multi-chunk mode', async () => {
    const bytes = pseudoRandomBytes(12_000, 104);
    const file = new File([bytes], 'chunked-faults.bin', { type: 'application/octet-stream' });

    const decoder = new StreamDecoder(qrLtBackend, 3);

    const allFrames: string[] = [];
    let count = 0;
    for await (const frame of encodeToFrames(file, {
      backend: qrLtBackend,
      fragmentSize: 250,
      chunked: true,
      chunkCount: 3,
    })) {
      allFrames.push(frame as string);
      if (++count >= 1200) break;
    }

    // Drop ~20% of frames and shuffle
    const filteredFrames = allFrames.filter((_, i) => i % 5 !== 0);
    // Reverse order to test out-of-order
    filteredFrames.reverse();

    for (const frame of filteredFrames) {
      decoder.addFrame(frame);
      if (decoder.isComplete) break;
    }

    expect(decoder.isComplete).toBe(true);
    const resultBlob = await decoder.getResult();
    expect(bytesEqual(await blobBytes(resultBlob), bytes)).toBe(true);
  });

  it(
    'worst-case tagged frames fit QR version 40 capacity for both backends',
    () => {
      // 1. qr-lt backend: worst-case UR part tagged with c254:
      const msgLt = Buffer.alloc(DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED * 50_000, 0xaa);
      const ur = UR.fromBuffer(msgLt);
      const encoderLt = new UREncoder(ur, DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED, 999_999 - 1);
      const rawPartLt = encoderLt.nextPart();
      const taggedLt = tagFrameWithChunk(rawPartLt, 254);

      expect(() => computeQrModules(taggedLt)).not.toThrow();

      // 2. qr-bin-lt backend: worst-case CBOR part tagged with 1-byte header (chunkId 254)
      const FountainEncoderClass =
        (FountainEncoderImport as unknown as { default?: typeof FountainEncoderImport }).default ??
        FountainEncoderImport;
      const msgBin = Buffer.alloc(DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED_BIN * 50_000, 0xaa);
      const encoderBin = new FountainEncoderClass(
        msgBin,
        DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED_BIN,
        999_999 - 1,
      );
      const rawPartBin = new Uint8Array(encoderBin.nextPart().cbor());
      const taggedBin = tagFrameWithChunk(rawPartBin, 254);

      expect(() => computeQrModules(taggedBin)).not.toThrow();
    },
    15_000,
  );
});
