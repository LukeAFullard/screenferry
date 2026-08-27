/**
 * Raw pixel data for one rendered/captured frame — same layout as DOM
 * `ImageData` (RGBA, row-major, opaque), but not typed against `ImageData`
 * itself so this module stays usable somewhere without the DOM lib (a
 * decode worker, a future non-browser host).
 */
export interface ImageFrame {
  data: Uint8Array;
  width: number;
  height: number;
}

/**
 * A single unit of transmitted data. A QR/LT backend's frame is a string (a
 * UR part, meant to be rendered as a QR code); an image-based backend (e.g.
 * Cimbar) hands back rendered pixel data instead — kept generic here so the
 * interface doesn't bake in "frames are always text."
 */
export type Frame = string | ImageFrame;

/** Reassembles a stream of `Frame`s back into the original envelope bytes. */
export interface BackendDecoder<F extends Frame = Frame> {
  addFrame(frame: F): void;
  readonly isComplete: boolean;
  /** Estimated completion ratio (0-1), if the backend can produce one. */
  readonly progress?: number;
  /** Envelope-encoded bytes — not yet decompressed or checksum-verified. */
  getResult(): Uint8Array;
}

/**
 * Shared interface behind which every transfer backend (QR+LT today, Cimbar
 * later) sits, so `encodeToFrames`/`StreamDecoder` can be backend-agnostic.
 * `encode`/`createDecoder` operate on envelope bytes and `Frame`s only — they
 * know nothing about rendering frames to a screen or scanning them off a
 * camera; that stays a backend-specific concern above this interface.
 */
export interface TransferBackend<F extends Frame = Frame> {
  readonly id: string;
  encode(bytes: Uint8Array, opts?: unknown): AsyncIterable<F>;
  createDecoder(): BackendDecoder<F>;
}
