import { unwrapEnvelope, type DecodedFile } from './transfer';
import { qrLtBackend, DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED } from '../backends/qr-lt';
import { DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED as DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED_BIN } from '../backends/qr-bin-lt';
import type { BackendDecoder, Frame, TransferBackend } from '../backends/types';
import { tagFrameWithChunk, untagFrameWithChunk } from './frame-tag';

export interface ChunkPicker {
  nextChunkIndex(completedChunks: boolean[]): number;
}

export class RoundRobinChunkPicker implements ChunkPicker {
  private currentIndex = 0;

  nextChunkIndex(completedChunks: boolean[]): number {
    const n = completedChunks.length;
    if (n === 0) return 0;
    // Round robin over incomplete chunks if possible, or all chunks if all complete
    for (let i = 0; i < n; i++) {
      const idx = (this.currentIndex + i) % n;
      if (!completedChunks[idx]) {
        this.currentIndex = (idx + 1) % n;
        return idx;
      }
    }
    const idx = this.currentIndex % n;
    this.currentIndex = (idx + 1) % n;
    return idx;
  }
}

export class WeightedChunkPicker implements ChunkPicker {
  private currentIndex = 0;
  private weights: number[] = [];

  constructor(chunkCount: number) {
    this.weights = new Array(chunkCount).fill(1.0);
  }

  setPriority(doneChunkIds: Set<number>, doneWeight = 0.1): void {
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = doneChunkIds.has(i) ? doneWeight : 1.0;
    }
  }

  nextChunkIndex(completedChunks: boolean[]): number {
    const n = completedChunks.length;
    if (n === 0) return 0;

    // Calculate sum of weights for incomplete chunks if any exist, or all
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (!completedChunks[i]) {
        sum += this.weights[i] ?? 1.0;
      }
    }

    if (sum === 0) {
      // Fallback round robin
      const idx = this.currentIndex % n;
      this.currentIndex = (idx + 1) % n;
      return idx;
    }

    let rnd = Math.random() * sum;
    for (let i = 0; i < n; i++) {
      if (!completedChunks[i]) {
        const w = this.weights[i] ?? 1.0;
        if (rnd < w) {
          return i;
        }
        rnd -= w;
      }
    }

    return 0;
  }
}

export function computeAutoChunkCount(envelopeLength: number, fragmentSize?: number): number {
  const frag = fragmentSize ?? 2000;
  const K = Math.ceil(envelopeLength / frag);
  if (K <= 3000) {
    return 1;
  }
  const chunks = Math.ceil(K / 2500);
  return Math.min(chunks, 255);
}

/**
 * Splits envelope into `N` equal-sized byte slices (the last chunk receives any remainder).
 * Each chunk runs its own independent fountain encoder.
 */
export async function* encodeChunkedEnvelope<F extends Frame = Frame>(
  envelope: Uint8Array,
  chunkCount: number,
  backend: TransferBackend<F>,
  opts?: { maxFragmentLength?: number; backendOptions?: unknown },
  picker?: ChunkPicker,
): AsyncIterable<{ rawFrame: F; taggedFrame: F; chunkId: number }> {
  if (chunkCount <= 1) {
    const stream = backend.encode(
      envelope,
      opts?.backendOptions ?? { maxFragmentLength: opts?.maxFragmentLength },
    );
    for await (const frame of stream) {
      yield { rawFrame: frame, taggedFrame: frame, chunkId: 0 };
    }
    return;
  }

  const defaultChunkedMaxFragment =
    backend.id === 'qr-bin-lt'
      ? DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED_BIN
      : DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED;

  const maxFragmentLength = opts?.maxFragmentLength ?? defaultChunkedMaxFragment;

  const envelopeLen = envelope.length;
  const chunkSize = Math.ceil(envelopeLen / chunkCount);
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, envelopeLen);
    chunks.push(envelope.subarray(start, end));
  }

  const iterators = await Promise.all(
    chunks.map((chunkBytes) => {
      const stream = backend.encode(
        chunkBytes,
        opts?.backendOptions ?? { maxFragmentLength },
      );
      return stream[Symbol.asyncIterator]();
    }),
  );

  const activePicker = picker ?? new RoundRobinChunkPicker();
  const completedState = new Array(chunkCount).fill(false);

  for (;;) {
    const chunkIdx = activePicker.nextChunkIndex(completedState);
    const result = await iterators[chunkIdx].next();
    if (!result.done && result.value !== undefined) {
      const rawFrame = result.value;
      let taggedFrame: F;
      if (chunkCount > 1) {
        if (typeof rawFrame === 'string') {
          taggedFrame = tagFrameWithChunk(rawFrame, chunkIdx) as F;
        } else {
          taggedFrame = tagFrameWithChunk(rawFrame as Uint8Array, chunkIdx) as F;
        }
      } else {
        taggedFrame = rawFrame;
      }
      yield { rawFrame, taggedFrame, chunkId: chunkIdx };
    }
  }
}

/**
 * Receives and reassembles multi-chunk fountain transfers.
 *
 * Note: Fountain peeling decode (`receiveTaggedFrame` / `addFrame`) executes
 * serially on the main thread for each chunk rather than in parallel across
 * workers. Multi-chunk transfer still improves performance by reducing total
 * peeling computation complexity (O(K log(K/N)) vs O(K log K)) and bounding
 * per-chunk memory overhead during high-symbol transfers.
 */
export class ChunkedTransferDecoder<F extends Frame = Frame> {
  private readonly decoders: BackendDecoder<F>[];
  private readonly chunkCount: number;

  constructor(
    chunkCount: number,
    backend: TransferBackend<F> = qrLtBackend as unknown as TransferBackend<F>,
  ) {
    this.chunkCount = Math.max(1, chunkCount);
    this.decoders = Array.from({ length: this.chunkCount }, () => backend.createDecoder());
  }

  get numChunks(): number {
    return this.chunkCount;
  }

  receiveTaggedFrame(frame: F, defaultChunkId = 0): { chunkId: number; newlyCompleted: boolean } {
    if (this.chunkCount === 1) {
      const wasComplete = this.decoders[0].isComplete;
      this.decoders[0].addFrame(frame);
      const nowComplete = this.decoders[0].isComplete;
      return { chunkId: 0, newlyCompleted: !wasComplete && nowComplete };
    }

    const untagged = untagFrameWithChunk(frame, true, defaultChunkId);
    const chunkId = untagged.chunkId;
    if (chunkId >= 0 && chunkId < this.chunkCount) {
      const wasComplete = this.decoders[chunkId].isComplete;
      this.decoders[chunkId].addFrame(untagged.frame as F);
      const nowComplete = this.decoders[chunkId].isComplete;
      return { chunkId, newlyCompleted: !wasComplete && nowComplete };
    }
    return { chunkId, newlyCompleted: false };
  }

  isChunkComplete(chunkId: number): boolean {
    if (chunkId < 0 || chunkId >= this.chunkCount) return false;
    return this.decoders[chunkId].isComplete;
  }

  get completedChunks(): boolean[] {
    return this.decoders.map((d) => d.isComplete);
  }

  get isComplete(): boolean {
    return this.decoders.every((d) => d.isComplete);
  }

  get progress(): number {
    if (this.chunkCount === 0) return 0;
    const sum = this.decoders.reduce((acc, d) => acc + (d.progress ?? 0), 0);
    return sum / this.chunkCount;
  }

  get totalBytes(): number | undefined {
    let sum = 0;
    for (const d of this.decoders) {
      if (d.totalBytes === undefined) return undefined;
      sum += d.totalBytes;
    }
    return sum;
  }

  get bytesReceived(): number {
    return this.decoders.reduce((acc, d) => acc + (d.bytesReceived ?? 0), 0);
  }

  async getResult(): Promise<DecodedFile> {
    if (!this.isComplete) {
      throw new Error('ChunkedTransferDecoder: cannot get result before all chunks complete');
    }

    const chunkBuffers: Uint8Array[] = [];
    for (const d of this.decoders) {
      chunkBuffers.push(d.getResult());
    }

    // Merge chunks in order
    const totalLen = chunkBuffers.reduce((acc, buf) => acc + buf.length, 0);
    const mergedEnvelope = new Uint8Array(totalLen);
    let offset = 0;
    for (const buf of chunkBuffers) {
      mergedEnvelope.set(buf, offset);
      offset += buf.length;
    }

    return unwrapEnvelope(mergedEnvelope);
  }
}
