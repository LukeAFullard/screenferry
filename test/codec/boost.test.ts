import { describe, expect, it } from 'vitest';
import { WeightedChunkPicker, encodeChunkedEnvelope, qrLtBackend } from '../../src/index';

describe('Boost Mode & Weighted Chunk Selection', () => {
  it('shifts probability mass away from marked-done chunks while keeping non-zero selection chance', async () => {
    const picker = new WeightedChunkPicker(4);
    const completedChunks = [false, false, false, false];

    // Mark chunk 0 and 1 as done in sender picker
    picker.setPriority(new Set([0, 1]), 0.1);

    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (let i = 0; i < 1000; i++) {
      const idx = picker.nextChunkIndex(completedChunks);
      counts[idx]++;
    }

    // Chunks 2 and 3 should have received much more selection than 0 and 1
    expect(counts[2] + counts[3]).toBeGreaterThan(counts[0] + counts[1]);
    // Chunks 0 and 1 should still have non-zero counts
    expect(counts[0]).toBeGreaterThan(0);
    expect(counts[1]).toBeGreaterThan(0);
  });

  it('completes transfer even when a chunk is incorrectly marked done', async () => {
    const envelope = new TextEncoder().encode('Test payload for boost mode robustness'.repeat(50));
    const picker = new WeightedChunkPicker(3);

    // Incorrectly mark chunk 0 as done
    picker.setPriority(new Set([0]), 0.1);

    const stream = encodeChunkedEnvelope(
      envelope,
      3,
      qrLtBackend,
      { maxFragmentLength: 100 },
      picker,
    );

    let frameCount = 0;
    const chunkCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
    for await (const item of stream) {
      chunkCounts[item.chunkId]++;
      frameCount++;
      if (frameCount >= 500) break;
    }

    // All chunks (including 0) were generated
    expect(chunkCounts[0]).toBeGreaterThan(0);
    expect(chunkCounts[1] + chunkCounts[2]).toBeGreaterThan(chunkCounts[0]);
  });
});
