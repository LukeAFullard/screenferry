import { describe, it, expect } from 'vitest';
import { StreamDecoder, encodeToFrames } from '../src/index';

describe('Smoke test', () => {
  it('runs basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('exports public API stubs', () => {
    expect(typeof encodeToFrames).toBe('function');
    expect(typeof StreamDecoder).toBe('function');

    const decoder = new StreamDecoder();
    expect(decoder.progress).toBe(0);
    expect(decoder.isComplete).toBe(false);
  });
});
