import { describe, expect, it } from 'vitest';
import { runLoopback } from './loopback';
import { pseudoRandomBytes } from '../helpers/bytes';

// A regression trip-wire, not a benchmark: real throughput tuning happens on
// real devices, not in CI. Fixed size/fragmentSize/0% loss so the only thing
// that should make this drift is a genuine performance regression in the
// codec/render/scan path, not machine variance in what a "device frame rate"
// means (there's no real timing/animation here at all — see the harness).
const FILE_SIZE_BYTES = 30_000;
const FRAGMENT_SIZE = 300;
const CEILING_MS = 10_000;

describe('e2e performance smoke test', () => {
  it(
    `reconstructs a ${FILE_SIZE_BYTES}-byte file (0% loss) within ${CEILING_MS}ms`,
    async () => {
      const bytes = pseudoRandomBytes(FILE_SIZE_BYTES, 500);
      const file = new File([bytes], 'perf.bin', { type: 'application/octet-stream' });

      const result = await runLoopback(file, { fragmentSize: FRAGMENT_SIZE });

      expect(result.elapsedMs).toBeLessThan(CEILING_MS);
    },
    CEILING_MS + 5_000,
  );
});
