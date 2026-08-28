import { computeQrModules, type QrEncodeOptions } from './encode';
import { rasterizeQrModules } from './raster';

export interface RenderQrOptions extends QrEncodeOptions {
  /** Pixels per module side. */
  moduleSizePx?: number;
  /** Quiet zone width, in modules. QR spec minimum is 4 — enforced as a floor. */
  quietZoneModules?: number;
}

/**
 * Renders `data` — a raw UR part string (`qrLtBackend`) or a raw fountain
 * part's bytes, rendered as byte-mode QR data (`qrBinLtBackend`) — as a QR
 * code onto `canvas`, sized to fit exactly. Rasterizes to a plain RGBA
 * buffer (`rasterizeQrModules`) and blits it in one `putImageData` call
 * rather than one `fillRect` per dark module — a QR v40 code has ~15,000
 * dark modules, so that was ~15,000 draw calls per frame; crisp module
 * edges still matter for camera decode, which `rasterizeQrModules`'s pure
 * pixel-buffer rasterization gives for free (no anti-aliasing to disable).
 */
export function renderQrToCanvas(
  qrData: string | Uint8Array,
  canvas: HTMLCanvasElement,
  opts?: RenderQrOptions,
): void {
  const { modules } = computeQrModules(qrData, opts);
  const { data, width, height } = rasterizeQrModules(modules, opts);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('renderQrToCanvas: failed to acquire a 2D rendering context');
  }

  // `rasterizeQrModules` always allocates a plain `ArrayBuffer`-backed
  // array (never `SharedArrayBuffer`) — see the analogous cast in
  // `DisplayDriver.renderImageFrame`.
  ctx.putImageData(new ImageData(data as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
}
