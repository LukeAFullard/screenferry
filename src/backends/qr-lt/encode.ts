import { encode as uqrEncode } from 'uqr';

export type EccLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrEncodeOptions {
  /**
   * Error correction level. Defaults to `L` (~7% tolerance): fountain codes
   * already tolerate whole-frame loss, so spending capacity on per-frame
   * redundancy is wasted — maximizing payload-per-frame matters more here.
   */
  eccLevel?: EccLevel;
  /**
   * Highest QR version to allow. Higher versions pack more data but get too
   * dense to read reliably at typical laptop-screen-to-phone-camera range.
   * Defaults to `DEFAULT_MAX_QR_VERSION` (40, the highest version ISO/IEC
   * 18004 defines) — real-camera scan reliability at that ceiling has not
   * been validated on physical hardware; see `DEFAULT_MAX_QR_VERSION`.
   */
  maxVersion?: number;
}

export interface QrModuleGrid {
  /** `modules[row][col]`, `true` = dark module. No border/quiet zone included. */
  modules: boolean[][];
  /** Modules per side. */
  size: number;
  version: number;
}

export const DEFAULT_ECC_LEVEL: EccLevel = 'L';
export const DEFAULT_MAX_QR_VERSION = 40;

/**
 * bc-ur part strings are lowercase and case-insensitive on decode
 * (`URDecoder` lowercases its input before parsing). QR alphanumeric mode
 * only covers uppercase letters, so uppercasing here — when it's free,
 * i.e. the text carries no case-sensitive information — lets `uqr` pick the
 * denser alphanumeric segment mode instead of byte mode.
 */
function preferAlphanumericCasing(text: string): string {
  const upper = text.toUpperCase();
  return upper.toLowerCase() === text ? upper : text;
}

/** Computes the raw QR module grid for `text`. Pure — no canvas/DOM involved. */
export function computeQrModules(text: string, opts?: QrEncodeOptions): QrModuleGrid {
  const result = uqrEncode(preferAlphanumericCasing(text), {
    ecc: opts?.eccLevel ?? DEFAULT_ECC_LEVEL,
    maxVersion: opts?.maxVersion ?? DEFAULT_MAX_QR_VERSION,
    border: 0,
  });

  return { modules: result.data, size: result.size, version: result.version };
}
