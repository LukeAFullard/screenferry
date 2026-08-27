export interface RasterOptions {
  /** Pixels per module side. */
  moduleSizePx?: number;
  /** Quiet zone width, in modules. QR spec minimum is 4. */
  quietZoneModules?: number;
}

export interface RasterResult {
  /** RGBA pixel buffer, row-major, opaque throughout. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export const DEFAULT_MODULE_SIZE_PX = 4;
export const MIN_QUIET_ZONE_MODULES = 4;

/**
 * Rasterizes a module grid into a plain RGBA pixel buffer — no `HTMLCanvasElement`
 * or DOM required. Used by `renderQrToCanvas` and directly by tests (jsQR
 * decodes a raw buffer, no canvas needed either).
 */
export function rasterizeQrModules(modules: boolean[][], opts?: RasterOptions): RasterResult {
  const moduleSizePx = opts?.moduleSizePx ?? DEFAULT_MODULE_SIZE_PX;
  const quietZoneModules = Math.max(
    opts?.quietZoneModules ?? MIN_QUIET_ZONE_MODULES,
    MIN_QUIET_ZONE_MODULES,
  );

  const size = modules.length;
  const totalModules = size + quietZoneModules * 2;
  const px = totalModules * moduleSizePx;

  // Opaque white everywhere (RGBA 255,255,255,255), then paint dark modules.
  const data = new Uint8ClampedArray(px * px * 4).fill(255);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!modules[row][col]) continue;

      const originX = (col + quietZoneModules) * moduleSizePx;
      const originY = (row + quietZoneModules) * moduleSizePx;

      for (let dy = 0; dy < moduleSizePx; dy++) {
        const rowStart = ((originY + dy) * px + originX) * 4;
        for (let dx = 0; dx < moduleSizePx; dx++) {
          const idx = rowStart + dx * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
    }
  }

  return { data, width: px, height: px };
}
