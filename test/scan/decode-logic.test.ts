import { describe, expect, it, vi } from 'vitest';
import { createFrameDecoder, toDecodeResponse, toErrorResponse } from '../../src/scan/decode-logic';

function fakeImageData(): ImageData {
  // Node has no ImageData global; the decoder never inspects the shape
  // beyond passing it straight to the injected backend functions.
  return { data: new Uint8ClampedArray(4), width: 1, height: 1 } as ImageData;
}

describe('createFrameDecoder', () => {
  it('returns a zxing result without touching jsQR', async () => {
    const decodeWithZxing = vi.fn().mockResolvedValue('ur:bytes/1-1/lpadaobncpft');
    const decodeWithJsQr = vi.fn();

    const decoder = createFrameDecoder({ decodeWithZxing, decodeWithJsQr });
    const result = await decoder.decodeFrame(fakeImageData());

    expect(result).toEqual({ text: 'ur:bytes/1-1/lpadaobncpft', backend: 'zxing' });
    expect(decodeWithJsQr).not.toHaveBeenCalled();
    expect(decoder.zxingAvailable).toBe(true);
  });

  it('reports "no result" via zxing without falling back when nothing is found', async () => {
    const decodeWithZxing = vi.fn().mockResolvedValue(null);
    const decodeWithJsQr = vi.fn();

    const decoder = createFrameDecoder({ decodeWithZxing, decodeWithJsQr });
    const result = await decoder.decodeFrame(fakeImageData());

    expect(result).toEqual({ text: null, backend: 'zxing' });
    expect(decodeWithJsQr).not.toHaveBeenCalled();
    expect(decoder.zxingAvailable).toBe(true);
  });

  it('falls back to jsQR when zxing throws, and logs a warning', async () => {
    const decodeWithZxing = vi.fn().mockRejectedValue(new Error('WASM blocked by CSP'));
    const decodeWithJsQr = vi.fn().mockReturnValue('FALLBACK-TEXT');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const decoder = createFrameDecoder({ decodeWithZxing, decodeWithJsQr });
    const result = await decoder.decodeFrame(fakeImageData());

    expect(result).toEqual({ text: 'FALLBACK-TEXT', backend: 'jsqr' });
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(decoder.zxingAvailable).toBe(false);

    warnSpy.mockRestore();
  });

  it('latches the fallback: later frames skip zxing entirely once it has failed', async () => {
    const decodeWithZxing = vi.fn().mockRejectedValue(new Error('module init failed'));
    const decodeWithJsQr = vi.fn().mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const decoder = createFrameDecoder({ decodeWithZxing, decodeWithJsQr });

    await decoder.decodeFrame(fakeImageData());
    expect(decodeWithZxing).toHaveBeenCalledTimes(1);

    await decoder.decodeFrame(fakeImageData());
    await decoder.decodeFrame(fakeImageData());

    // zxing is never retried once it has failed once.
    expect(decodeWithZxing).toHaveBeenCalledTimes(1);
    expect(decodeWithJsQr).toHaveBeenCalledTimes(3);

    vi.restoreAllMocks();
  });

  it('reports "no result" via jsQR after the fallback has latched', async () => {
    const decodeWithZxing = vi.fn().mockRejectedValue(new Error('nope'));
    const decodeWithJsQr = vi.fn().mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const decoder = createFrameDecoder({ decodeWithZxing, decodeWithJsQr });
    await decoder.decodeFrame(fakeImageData());
    const result = await decoder.decodeFrame(fakeImageData());

    expect(result).toEqual({ text: null, backend: 'jsqr' });

    vi.restoreAllMocks();
  });
});

describe('worker message protocol', () => {
  it('maps a successful decode to a "result" message', () => {
    expect(toDecodeResponse(7, { text: 'ur:bytes/1-1/lpadaobncpft', backend: 'zxing' })).toEqual({
      id: 7,
      type: 'result',
      text: 'ur:bytes/1-1/lpadaobncpft',
      backend: 'zxing',
    });
  });

  it('maps a miss to a "no-result" message carrying which backend was tried', () => {
    expect(toDecodeResponse(3, { text: null, backend: 'jsqr' })).toEqual({
      id: 3,
      type: 'no-result',
      backend: 'jsqr',
    });
  });

  it('maps a thrown Error to an "error" message with its message text', () => {
    expect(toErrorResponse(1, new Error('boom'))).toEqual({
      id: 1,
      type: 'error',
      message: 'boom',
    });
  });

  it('maps a non-Error throw to an "error" message via String()', () => {
    expect(toErrorResponse(2, 'plain string failure')).toEqual({
      id: 2,
      type: 'error',
      message: 'plain string failure',
    });
  });
});
