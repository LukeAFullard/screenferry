/**
 * A single unit of transmitted data. `qrLtBackend`'s frame is a string (a
 * bytewords-text UR part, meant to be rendered as a QR code);
 * `qrBinLtBackend`'s is a raw `Uint8Array` (a fountain part meant to be
 * rendered as *byte-mode* QR data instead — see its doc comment). Both
 * supported backends render through the same QR layer; the union stays a
 * union so a backend's frame shape remains its own concern rather than
 * something `encodeToFrames`/`StreamDecoder` bake in.
 */
export type Frame = string | Uint8Array;

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
 * Shared interface behind which every transfer backend sits, so
 * `encodeToFrames`/`StreamDecoder` can be backend-agnostic.
 * `encode`/`createDecoder` operate on envelope bytes and `Frame`s only — they
 * know nothing about rendering frames to a screen or scanning them off a
 * camera; that stays a backend-specific concern above this interface.
 */
export interface TransferBackend<F extends Frame = Frame> {
  readonly id: string;
  /**
   * When true, `buildEnvelope` skips its own gzip pass for this backend —
   * for a backend that already compresses internally, gzip on top is wasted
   * CPU on already-incompressible bytes. Defaults to `false`/unset (gzip as
   * before) for any backend that doesn't set it; neither backend shipped
   * here sets it today.
   */
  readonly compressesInternally?: boolean;
  encode(bytes: Uint8Array, opts?: unknown): AsyncIterable<F>;
  createDecoder(): BackendDecoder<F>;
}
