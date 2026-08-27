import { qrLtBackend } from './qr-lt';
import { cimbarBackend } from './cimbar';
import { loadCimbarModule } from './cimbar/module';
import type { Frame, TransferBackend } from './types';

export type PreferredBackend = 'auto' | 'qr-lt' | 'cimbar';

/** Every backend `resolvePreferredBackend`/the header-frame protocol can name, keyed by its `TransferBackend.id`. */
const NEGOTIABLE_BACKENDS: Record<'qr-lt' | 'cimbar', TransferBackend<Frame>> = {
  'qr-lt': qrLtBackend,
  cimbar: cimbarBackend,
};

/**
 * There's no return channel (the sender never learns what the receiver
 * can decode), so the two sides agree on a backend without one: the
 * sender always renders this as a *plain QR code* first — regardless of
 * which backend it then switches to for the data itself — since a QR
 * decoder is universal and can always read it. `sf1:backend=<id>` can't
 * collide with a real `qrLtBackend` data frame (those are bc-ur UR parts,
 * always starting `ur:`).
 */
const HEADER_PREFIX = 'sf1:backend=';

/** Builds the plain-QR header/beacon frame announcing which backend the data frames use. */
export function encodeHeaderFrame(backendId: string): string {
  return `${HEADER_PREFIX}${backendId}`;
}

/**
 * Parses a received frame as a header/beacon frame, if it is one —
 * `undefined` otherwise (including for any non-string `Frame`).
 *
 * Lowercases before matching: `computeQrModules`'s alphanumeric-mode
 * optimization uppercases any case-insensitive-safe string before
 * rendering it (see `src/backends/qr-lt/encode.ts`), and this header
 * string — all-lowercase, so case-insensitive-safe — is no exception. A
 * real QR scan hands back `SF1:BACKEND=QR-LT`, not `sf1:backend=qr-lt`.
 * Safe as long as backend ids themselves are lowercase (`qr-lt`, `cimbar`
 * are).
 */
export function decodeHeaderFrame(frame: Frame): string | undefined {
  if (typeof frame !== 'string') return undefined;
  const lower = frame.toLowerCase();
  if (!lower.startsWith(HEADER_PREFIX)) return undefined;
  return lower.slice(HEADER_PREFIX.length);
}

/** Looks up a negotiable backend by the id a header frame announced. `undefined` for an id this build doesn't recognize (a newer sender, a typo, noise). */
export function backendForId(id: string): TransferBackend<Frame> | undefined {
  return Object.prototype.hasOwnProperty.call(NEGOTIABLE_BACKENDS, id)
    ? NEGOTIABLE_BACKENDS[id as 'qr-lt' | 'cimbar']
    : undefined;
}

/**
 * Best-effort capability probe: does `cimbarBackend` actually work in this
 * environment? Never throws — a failure (unsupported browser, WASM
 * blocked by CSP, no WebGL, a non-browser host like this project's own
 * Node-based test harness) resolves `false`, so callers can build a
 * fallback UI rather than crash. Only attempts to *load* the WASM module,
 * not a full encode/decode self-test — see the README's Cimbar section
 * for why a deeper self-test isn't done here.
 */
export async function probeCimbarAvailable(): Promise<boolean> {
  try {
    await loadCimbarModule();
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves `"auto" | "qr-lt" | "cimbar"` to a concrete backend. `"auto"`
 * probes Cimbar's availability and falls back to `qrLtBackend` if it
 * isn't usable here. `probe` is injectable (defaults to
 * `probeCimbarAvailable`) purely for testing the resolution logic itself
 * without depending on a real WASM/browser environment.
 */
export async function resolvePreferredBackend(
  preferred: PreferredBackend,
  probe: () => Promise<boolean> = probeCimbarAvailable,
): Promise<TransferBackend<Frame>> {
  if (preferred === 'qr-lt') return qrLtBackend;
  if (preferred === 'cimbar') return cimbarBackend;
  return (await probe()) ? cimbarBackend : qrLtBackend;
}
