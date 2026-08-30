import type { Frame } from '../backends/types';

/**
 * Helper to attach a `chunkId` byte to a data frame (Frame = string or Uint8Array)
 * and extract it on the receiving side ONLY when chunkCount > 1.
 *
 * For string frames (`qr-lt`):
 *   Prefix string frame with `c<chunkId>:` e.g. `c0:ur:bytes/...`
 * For Uint8Array frames (`qr-bin-lt`):
 *   Prepend a 1-byte header containing chunkId: [chunkId, ...data]
 */

export function tagFrameWithChunk(frame: string, chunkId: number): string;
export function tagFrameWithChunk(frame: Uint8Array, chunkId: number): Uint8Array;
export function tagFrameWithChunk(frame: Frame, chunkId: number): Frame {
  if (typeof frame === 'string') {
    return `c${chunkId}:${frame}`;
  } else {
    const tagged = new Uint8Array(frame.length + 1);
    tagged[0] = chunkId;
    tagged.set(frame, 1);
    return tagged;
  }
}

export interface UntaggedFrame {
  chunkId: number;
  frame: Frame;
}

export function untagFrameWithChunk(
  frame: Frame,
  isChunked: boolean,
  defaultChunkId = 0,
): UntaggedFrame {
  if (!isChunked) {
    return { chunkId: defaultChunkId, frame };
  }

  if (typeof frame === 'string') {
    if (frame.startsWith('c') && frame.includes(':')) {
      const colonIdx = frame.indexOf(':');
      const chunkStr = frame.slice(1, colonIdx);
      const chunkId = parseInt(chunkStr, 10);
      if (!isNaN(chunkId)) {
        return { chunkId, frame: frame.slice(colonIdx + 1) };
      }
    }
    return { chunkId: defaultChunkId, frame };
  } else {
    if (frame.length > 0) {
      const chunkId = frame[0];
      return { chunkId, frame: frame.subarray(1) };
    }
    return { chunkId: defaultChunkId, frame };
  }
}
