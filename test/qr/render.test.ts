import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { computeQrModules } from '../../src/backends/qr-lt/encode';
import { rasterizeQrModules } from '../../src/backends/qr-lt/raster';
import { createFountainEncoder, FountainDecoder } from '../../src/backends/qr-lt/fountain';
import {
  createFountainEncoder as createBinFountainEncoder,
  FountainByteDecoder,
} from '../../src/backends/qr-bin-lt/fountain';
import { bytesEqual } from '../helpers/bytes';

function decodeModulesWithJsQr(modules: boolean[][]): string | null {
  const { data, width, height } = rasterizeQrModules(modules);
  const result = jsQR(data, width, height);
  return result?.data ?? null;
}

describe('QR encode/render layer', () => {
  it('round-trips a short alphanumeric-safe string through raster + jsQR', () => {
    const text = 'HELLO SCREENFERRY 123';
    const { modules } = computeQrModules(text);
    expect(decodeModulesWithJsQr(modules)).toBe(text);
  });

  it('round-trips a lowercase UR-like part string (case-insensitive on decode)', () => {
    const text = 'ur:bytes/3-9/lpadaobncpftlaguisdlheghdefhskhtkkfeoyayaeahhdcx';
    const { modules } = computeQrModules(text);
    const decoded = decodeModulesWithJsQr(modules);

    // We uppercase for denser alphanumeric QR encoding; bc-ur's decoder
    // lowercases on receipt, so this is a lossless transformation for UR
    // strings specifically.
    expect(decoded).toBe(text.toUpperCase());
    expect(decoded?.toLowerCase()).toBe(text);
  });

  it('prefers alphanumeric mode by uppercasing case-insensitive text', () => {
    const text = 'ur:bytes/1-1/lpadaobncpft';
    const asProvided = computeQrModules(text);
    const preUppercased = computeQrModules(text.toUpperCase());

    // Same module grid either way confirms the uppercase optimization
    // already engaged internally for the lowercase input.
    expect(asProvided.version).toBe(preUppercased.version);
    expect(asProvided.modules).toEqual(preUppercased.modules);
  });

  it('does not corrupt case-sensitive text (falls back to byte mode)', () => {
    const text = 'Hello, screenferry!';
    const { modules } = computeQrModules(text);
    expect(decodeModulesWithJsQr(modules)).toBe(text);
  });

  it('renders a full fountain part stream that round-trips via jsQR alone (no camera)', async () => {
    const original = new TextEncoder().encode(
      'screenferry end-to-end QR loopback test payload'.repeat(20),
    );
    const encoder = createFountainEncoder(original, { maxFragmentLength: 150 });
    const decoder = new FountainDecoder();

    let attempts = 0;
    for await (const part of encoder) {
      const { modules } = computeQrModules(part);
      const scanned = decodeModulesWithJsQr(modules);
      expect(scanned).not.toBeNull();
      // No manual case-folding: URDecoder itself lowercases on receipt, so
      // this mirrors what a real camera-scan pipeline would pass straight in.
      decoder.receivePart(scanned!);

      attempts++;
      if (decoder.isComplete() || attempts > 200) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(decoder.getResult()).toEqual(original);
  });

  it('renders byte-mode data (a Uint8Array) directly, without text mode/case-folding', () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255, 65, 97]); // includes non-text bytes
    const { modules } = computeQrModules(bytes);
    const { data, width, height } = rasterizeQrModules(modules);
    const result = jsQR(data, width, height);

    expect(result).not.toBeNull();
    expect(new Uint8Array(result!.binaryData)).toEqual(bytes);
  });

  it('renders a full byte-mode fountain part stream (qr-bin-lt) that round-trips via jsQR alone', async () => {
    const original = new TextEncoder().encode(
      'screenferry end-to-end byte-mode QR loopback test payload'.repeat(20),
    );
    const encoder = createBinFountainEncoder(original, { maxFragmentLength: 150 });
    const decoder = new FountainByteDecoder();

    let attempts = 0;
    for await (const part of encoder) {
      const { modules } = computeQrModules(part);
      const { data, width, height } = rasterizeQrModules(modules);
      const scanned = jsQR(data, width, height);
      expect(scanned).not.toBeNull();
      decoder.receivePart(new Uint8Array(scanned!.binaryData));

      attempts++;
      if (decoder.isComplete() || attempts > 200) break;
    }

    expect(decoder.isComplete()).toBe(true);
    expect(bytesEqual(decoder.getResult(), original)).toBe(true);
  });

  it('applies at least a 4-module quiet zone by default', () => {
    const { modules, size } = computeQrModules('QUIET ZONE TEST');
    const { width } = rasterizeQrModules(modules);
    const moduleSizePx = 4; // DEFAULT_MODULE_SIZE_PX
    const totalModules = width / moduleSizePx;
    expect(totalModules - size).toBe(8); // 4 modules on each side
  });

  it('decodes correctly and produces valid payload when mask is pinned (maskPattern: 0)', () => {
    const text = 'MASK PINNING REGRESSION TEST';
    const pinned = computeQrModules(text, { maskPattern: 0 });
    const auto = computeQrModules(text, { maskPattern: -1 });

    const decodedPinned = decodeModulesWithJsQr(pinned.modules);
    const decodedAuto = decodeModulesWithJsQr(auto.modules);

    expect(decodedPinned).toBe(text);
    expect(decodedAuto).toBe(text);
  });
});
