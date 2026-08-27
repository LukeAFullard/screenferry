import { describe, expect, it } from 'vitest';
import { runLoopback } from './loopback';
import type { EccLevel } from '../../src/backends/qr-lt/encode';
import { bytesEqual, pseudoRandomBytes } from '../helpers/bytes';

async function fileBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

// Sizes chosen to keep the whole grid in the "seconds, not minutes" budget
// (this is a correctness check, not a benchmark) — nominal fragment counts
// stay small via a size-scaled fragmentSize, while still spanning roughly an
// order of magnitude in file size and drop rate. fragmentSize is capped
// well under ECC Q's ~324-byte QR-version-20 ceiling (vs. L's ~600) so every
// cell in the grid, at every ECC level under test, fits in a single frame.
const SIZES = [
  { label: '2 KB', bytes: 2_000, fragmentSize: 100 },
  { label: '20 KB', bytes: 20_000, fragmentSize: 300 },
];
const DROP_RATES = [0, 0.1, 0.3];
const ECC_LEVELS: EccLevel[] = ['L', 'Q'];

describe('e2e reliability matrix: size x drop rate x ECC', () => {
  let seed = 200;

  for (const size of SIZES) {
    for (const dropRate of DROP_RATES) {
      for (const eccLevel of ECC_LEVELS) {
        const label = `${size.label} / ${(dropRate * 100).toFixed(0)}% drop / ECC ${eccLevel}`;

        it(`reconstructs correctly: ${label}`, async () => {
          const currentSeed = seed++;
          const bytes = pseudoRandomBytes(size.bytes, currentSeed);
          const file = new File([bytes], 'matrix.bin', { type: 'application/octet-stream' });

          const result = await runLoopback(file, {
            fragmentSize: size.fragmentSize,
            eccLevel,
            faults: dropRate > 0 ? { dropRate } : undefined,
            seed: currentSeed,
            maxFrames: 4_000,
          });

          expect(bytesEqual(await fileBytes(result.file), bytes)).toBe(true);
        }, 10_000);
      }
    }
  }
});
