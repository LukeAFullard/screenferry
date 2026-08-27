import { computeQrModules, type QrEncodeOptions } from './encode';
import { DEFAULT_MODULE_SIZE_PX, MIN_QUIET_ZONE_MODULES } from './raster';

export interface RenderQrOptions extends QrEncodeOptions {
  /** Pixels per module side. */
  moduleSizePx?: number;
  /** Quiet zone width, in modules. QR spec minimum is 4 — enforced as a floor. */
  quietZoneModules?: number;
}

/**
 * Renders `text` (a raw UR part string, unmodified in meaning) as a QR code
 * onto `canvas`, sized to fit exactly. Draws one filled rect per dark
 * module with anti-aliasing disabled — crisp module edges matter for
 * camera decode, pure black/white only, no theming.
 */
export function renderQrToCanvas(
  text: string,
  canvas: HTMLCanvasElement,
  opts?: RenderQrOptions,
): void {
  const { modules, size } = computeQrModules(text, opts);

  const moduleSizePx = opts?.moduleSizePx ?? DEFAULT_MODULE_SIZE_PX;
  const quietZoneModules = Math.max(
    opts?.quietZoneModules ?? MIN_QUIET_ZONE_MODULES,
    MIN_QUIET_ZONE_MODULES,
  );
  const totalModules = size + quietZoneModules * 2;
  const px = totalModules * moduleSizePx;

  canvas.width = px;
  canvas.height = px;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('renderQrToCanvas: failed to acquire a 2D rendering context');
  }

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, px, px);

  ctx.fillStyle = '#000000';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!modules[row][col]) continue;
      ctx.fillRect(
        (col + quietZoneModules) * moduleSizePx,
        (row + quietZoneModules) * moduleSizePx,
        moduleSizePx,
        moduleSizePx,
      );
    }
  }
}
