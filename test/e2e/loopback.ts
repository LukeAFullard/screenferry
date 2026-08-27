// Drives the real sender -> render -> scan -> receiver pipeline entirely in
// Node, no camera/WASM/worker involved. `computeQrModules` + `rasterizeQrModules`
// (Stage 3's headless raster path) stand in for an OffscreenCanvas — same
// pixel computation `renderQrToCanvas` would draw, without needing a canvas
// implementation in a Node test process — and jsQR stands in for the camera
// scan (Stage 5's zxing-wasm/worker stack is deliberately skipped: this
// harness tests the *data protocol*, not the scan stack). See
// test/e2e/README.md for what this does and doesn't cover.
import jsQR from 'jsqr';
import { encodeToFrames, StreamDecoder } from '../../src/index';
import { computeQrModules, type EccLevel } from '../../src/backends/qr-lt/encode';
import { rasterizeQrModules } from '../../src/backends/qr-lt/raster';
import { createSeededRandom } from '../helpers/random';

export interface FaultConfig {
  /** Fraction of frames dropped before reaching the decoder, [0, 1). */
  dropRate?: number;
  /** Fraction of delivered frames additionally duplicated, [0, 1). */
  duplicateRate?: number;
  /** Buffer and shuffle frames in windows of this size before delivery (0/1 = no reorder). */
  reorderWindow?: number;
  /**
   * Overrides dropRate with a per-frame decision (0-based sent-frame index).
   * Return `true` to deliver, `false` to drop. Use for scripted patterns
   * (e.g. sustained loss then recovery) that a random rate can't express.
   */
  shouldDeliver?: (frameIndex: number) => boolean;
}

export interface LoopbackOptions {
  fragmentSize?: number;
  eccLevel?: EccLevel;
  /** Safety cap on frames sent, in case a fault config prevents completion. */
  maxFrames?: number;
  faults?: FaultConfig;
  /** Seeds the RNG driving random drop/duplicate/reorder decisions. */
  seed?: number;
}

export interface LoopbackResult {
  file: Blob;
  framesSent: number;
  framesDelivered: number;
  elapsedMs: number;
}

const DEFAULT_MAX_FRAMES = 20_000;

function shuffle<T>(items: T[], rng: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

/** Renders a part string to pixels and scans it back — the render+camera round trip, without a camera. */
function renderAndScan(text: string, eccLevel?: EccLevel): string | null {
  const { modules } = computeQrModules(text, { eccLevel });
  const { data, width, height } = rasterizeQrModules(modules);
  return jsQR(data, width, height)?.data ?? null;
}

/**
 * Runs `file` through encodeToFrames -> render -> jsQR scan -> StreamDecoder,
 * with configurable fault injection between scan and delivery. Throws if the
 * transfer doesn't complete within `maxFrames`.
 */
export async function runLoopback(file: Blob, opts: LoopbackOptions = {}): Promise<LoopbackResult> {
  const maxFrames = opts.maxFrames ?? DEFAULT_MAX_FRAMES;
  const rng = createSeededRandom(opts.seed ?? 1);
  const dropRate = opts.faults?.dropRate ?? 0;
  const duplicateRate = opts.faults?.duplicateRate ?? 0;
  const reorderWindow = opts.faults?.reorderWindow ?? 0;
  const shouldDeliver = opts.faults?.shouldDeliver;

  const decoder = new StreamDecoder();
  const start = Date.now();

  let framesSent = 0;
  let framesDelivered = 0;
  const reorderBuffer: string[] = [];

  function deliver(text: string): void {
    framesDelivered++;
    decoder.addFrame(text);
  }

  function flushReorderBuffer(): void {
    if (reorderBuffer.length === 0) return;
    shuffle(reorderBuffer, rng);
    for (const text of reorderBuffer.splice(0)) deliver(text);
  }

  for await (const part of encodeToFrames(file, { fragmentSize: opts.fragmentSize })) {
    const frameIndex = framesSent;
    framesSent++;

    const scanned = renderAndScan(part, opts.eccLevel);
    if (scanned !== null) {
      const dropped = shouldDeliver ? !shouldDeliver(frameIndex) : rng() < dropRate;
      if (!dropped) {
        if (reorderWindow > 1) {
          reorderBuffer.push(scanned);
          if (reorderBuffer.length >= reorderWindow) flushReorderBuffer();
        } else {
          deliver(scanned);
        }
        if (rng() < duplicateRate) deliver(scanned);
      }
    }

    if (decoder.isComplete || framesSent >= maxFrames) break;
  }
  flushReorderBuffer();

  if (!decoder.isComplete) {
    throw new Error(
      `Loopback did not complete within ${maxFrames} frames (sent ${framesSent}, delivered ${framesDelivered})`,
    );
  }

  const resultFile = await decoder.getResult();
  return { file: resultFile, framesSent, framesDelivered, elapsedMs: Date.now() - start };
}
