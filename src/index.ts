export interface EncodeOptions {
  /** Fragment size (payload bytes per frame). */
  fragmentSize?: number;
  /** Target frame rate in FPS. */
  fps?: number;
}

export async function* encodeToFrames(_file: Blob, _opts?: EncodeOptions): AsyncIterable<string> {
  throw new Error('Not implemented');
}

export class StreamDecoder {
  addFrame(_data: string): void {
    throw new Error('Not implemented');
  }

  get progress(): number {
    return 0;
  }

  get isComplete(): boolean {
    return false;
  }

  async getResult(): Promise<Blob> {
    throw new Error('Not implemented');
  }
}
