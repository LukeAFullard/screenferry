import { qrLtBackend } from './qr-lt';
import { qrBinLtBackend } from './qr-bin-lt';
import { cimbarBackend } from './cimbar';
import { loadCimbarModule } from './cimbar/module';
import type { Frame, TransferBackend } from './types';

export type PreferredBackend = 'auto' | 'qr-lt' | 'qr-bin-lt' | 'cimbar';

type NegotiableBackendId = 'qr-lt' | 'qr-bin-lt' | 'cimbar';

/** Every backend `resolvePreferredBackend`/the header-frame protocol can name, keyed by its `TransferBackend.id`. */
const NEGOTIABLE_BACKENDS: Record<NegotiableBackendId, TransferBackend<Frame>> = {
  'qr-lt': qrLtBackend,
  'qr-bin-lt': qrBinLtBackend,
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
 * `undefined` otherwise (including for an `ImageFrame`, which can never be
 * one).
 *
 * A `Uint8Array` frame (from `Scanner` in `decodeBytes` mode, after
 * switching to `qrBinLtBackend`) is decoded as UTF-8 text first — the
 * header/beacon frame is always rendered as *plain* QR (alphanumeric mode,
 * not byte mode; see `encodeHeaderFrame`), so a receiver that has already
 * switched to byte-mode decoding still needs to recognize a repeated
 * beacon as one, not feed its bytes into `qrBinLtBackend`'s fountain
 * decoder as if it were real data.
 *
 * Lowercases before matching: `computeQrModules`'s alphanumeric-mode
 * optimization uppercases any case-insensitive-safe string before
 * rendering it (see `src/backends/qr-lt/encode.ts`), and this header
 * string — all-lowercase, so case-insensitive-safe — is no exception. A
 * real QR scan hands back `SF1:BACKEND=QR-LT`, not `sf1:backend=qr-lt`.
 * Safe as long as backend ids themselves are lowercase (all of them are).
 */
export function decodeHeaderFrame(frame: Frame): string | undefined {
  const text =
    typeof frame === 'string'
      ? frame
      : frame instanceof Uint8Array
        ? new TextDecoder().decode(frame)
        : undefined;
  if (text === undefined) return undefined;

  const lower = text.toLowerCase();
  if (!lower.startsWith(HEADER_PREFIX)) return undefined;
  return lower.slice(HEADER_PREFIX.length);
}

/** Looks up a negotiable backend by the id a header frame announced. `undefined` for an id this build doesn't recognize (a newer sender, a typo, noise). */
export function backendForId(id: string): TransferBackend<Frame> | undefined {
  return Object.prototype.hasOwnProperty.call(NEGOTIABLE_BACKENDS, id)
    ? NEGOTIABLE_BACKENDS[id as NegotiableBackendId]
    : undefined;
}

/**
 * Which `Scanner` capture mode a resolved backend's `Frame` needs —
 * `NegotiatingReceiverSession` uses this to restart `Scanner` correctly
 * once it knows which backend the sender picked, instead of hardcoding a
 * per-backend-id branch itself. `qrLtBackend` needs neither flag (its
 * `Frame` is text, `Scanner`'s default mode); `{}` covers it and any future
 * text-frame backend without a change here.
 */
export function scannerOptionsForBackend(id: string): {
  rawFrames?: boolean;
  decodeBytes?: boolean;
} {
  if (id === cimbarBackend.id) return { rawFrames: true };
  if (id === qrBinLtBackend.id) return { decodeBytes: true };
  return {};
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
 * Resolves `PreferredBackend` to a concrete backend. `"auto"` probes
 * Cimbar's availability and falls back to `qrLtBackend` if it isn't usable
 * here — deliberately never `qrBinLtBackend`, even though it has no extra
 * capability requirement over `qrLtBackend` and is strictly more
 * throughput: `"auto"` exists so a sender always degrades to something a
 * receiver on *any* version of this library can decode, and an older
 * receiver's `backendForId` won't recognize `qr-bin-lt`. Opt into it
 * explicitly (`preferredBackend: 'qr-bin-lt'`, or `backend: qrBinLtBackend`
 * pinned) once you know your receivers support it. `probe` is injectable
 * (defaults to `probeCimbarAvailable`) purely for testing the resolution
 * logic itself without depending on a real WASM/browser environment.
 */
export async function resolvePreferredBackend(
  preferred: PreferredBackend,
  probe: () => Promise<boolean> = probeCimbarAvailable,
): Promise<TransferBackend<Frame>> {
  if (preferred === 'qr-lt') return qrLtBackend;
  if (preferred === 'qr-bin-lt') return qrBinLtBackend;
  if (preferred === 'cimbar') return cimbarBackend;
  return (await probe()) ? cimbarBackend : qrLtBackend;
}
