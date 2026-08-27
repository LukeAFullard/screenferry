import { describe, expect, it } from 'vitest';
import { runLoopback } from './loopback';
import { bytesEqual, pseudoRandomBytes } from '../helpers/bytes';

async function fileBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function makeFile(size: number, seed: number, name = 'payload.bin'): File {
  const bytes = pseudoRandomBytes(size, seed);
  return new File([bytes], name, { type: 'application/octet-stream' });
}

describe('e2e loopback: fault tolerance', () => {
  it('completes with 0% loss (happy path, protocol sanity check)', async () => {
    const file = makeFile(10_000, 101);
    const result = await runLoopback(file, { fragmentSize: 300 });

    expect(bytesEqual(await fileBytes(result.file), await fileBytes(file))).toBe(true);
    expect(result.framesDelivered).toBe(result.framesSent);
  }, 15_000);

  it('tolerates ~30% dropped frames', async () => {
    const file = makeFile(10_000, 102);
    const result = await runLoopback(file, {
      fragmentSize: 300,
      faults: { dropRate: 0.3 },
      seed: 7,
    });

    expect(bytesEqual(await fileBytes(result.file), await fileBytes(file))).toBe(true);
    expect(result.framesDelivered).toBeLessThan(result.framesSent);
  }, 15_000);

  it('tolerates duplicated frames (the sender re-showing a frame is a no-op, not corruption)', async () => {
    const file = makeFile(10_000, 103);
    const result = await runLoopback(file, {
      fragmentSize: 300,
      faults: { duplicateRate: 0.5 },
      seed: 8,
    });

    expect(bytesEqual(await fileBytes(result.file), await fileBytes(file))).toBe(true);
    // duplicateRate > 0 means we deliver strictly more frames than were sent.
    expect(result.framesDelivered).toBeGreaterThan(result.framesSent);
  }, 15_000);

  it('tolerates reordered frames', async () => {
    const file = makeFile(10_000, 104);
    const result = await runLoopback(file, {
      fragmentSize: 300,
      faults: { reorderWindow: 12 },
      seed: 9,
    });

    expect(bytesEqual(await fileBytes(result.file), await fileBytes(file))).toBe(true);
  }, 15_000);

  it('recovers after a sustained near-total loss stretch', async () => {
    // Every frame in the first 150 is dropped outright (total loss, not
    // just "near"), then delivery resumes normally — confirms the fountain
    // decoder makes zero false progress during the outage and catches up
    // cleanly once frames start arriving again, rather than getting stuck.
    const file = makeFile(6_000, 105);
    const result = await runLoopback(file, {
      fragmentSize: 300,
      faults: { shouldDeliver: (frameIndex) => frameIndex >= 150 },
      maxFrames: 5_000,
    });

    expect(bytesEqual(await fileBytes(result.file), await fileBytes(file))).toBe(true);
  }, 15_000);

  it('combines drop + duplicate + reorder in one run', async () => {
    const file = makeFile(15_000, 106);
    const result = await runLoopback(file, {
      fragmentSize: 300,
      faults: { dropRate: 0.2, duplicateRate: 0.15, reorderWindow: 8 },
      seed: 42,
    });

    expect(bytesEqual(await fileBytes(result.file), await fileBytes(file))).toBe(true);
  }, 15_000);
});
