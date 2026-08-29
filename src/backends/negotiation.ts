import { qrLtBackend } from './qr-lt';
import { qrBinLtBackend } from './qr-bin-lt';
import type { Frame, TransferBackend } from './types';

/**
 * Which backend a sender asks `encodeToFrames` to negotiate with.
 *
 * `"auto"` is retained only so existing callers keep compiling; it now
 * resolves straight to `qrLtBackend`. Prefer naming one explicitly — see
 * `resolvePreferredBackend`.
 *
 * @deprecated `"auto"` — pick `"qr-lt"` (universally decodable) or
 * `"qr-bin-lt"` (faster, needs a receiver that recognizes it) instead.
 * There is no longer any device capability left to probe for, so `"auto"`
 * cannot make a better choice than you can.
 */
export type PreferredBackend = 'auto' | 'qr-lt' | 'qr-bin-lt';

type NegotiableBackendId = 'qr-lt' | 'qr-bin-lt';

/** Every backend `resolvePreferredBackend`/the header-frame protocol can name, keyed by its `TransferBackend.id`. */
const NEGOTIABLE_BACKENDS: Record<NegotiableBackendId, TransferBackend<Frame>> = {
  'qr-lt': qrLtBackend,
  'qr-bin-lt': qrBinLtBackend,
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
 * `undefined` otherwise.
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
  const text = typeof frame === 'string' ? frame : new TextDecoder().decode(frame);

  const lower = text.toLowerCase();
  if (!lower.startsWith(HEADER_PREFIX)) return undefined;
  return lower.slice(HEADER_PREFIX.length);
}

/** Looks up a negotiable backend by the id a header frame announced. `undefined` for an id this build doesn't recognize (a newer sender, a removed backend, a typo, noise). */
export function backendForId(id: string): TransferBackend<Frame> | undefined {
  return Object.prototype.hasOwnProperty.call(NEGOTIABLE_BACKENDS, id)
    ? NEGOTIABLE_BACKENDS[id as NegotiableBackendId]
    : undefined;
}

/**
 * Which `Scanner` capture mode a resolved backend's `Frame` needs —
 * `NegotiatingReceiverSession` uses this to restart `Scanner` correctly
 * once it knows which backend the sender picked, instead of hardcoding a
 * per-backend-id branch itself. `qrLtBackend` needs no flag (its `Frame`
 * is text, `Scanner`'s default mode); `{}` covers it and any future
 * text-frame backend without a change here.
 */
export function scannerOptionsForBackend(id: string): { decodeBytes?: boolean } {
  if (id === qrBinLtBackend.id) return { decodeBytes: true };
  return {};
}

/**
 * Resolves `PreferredBackend` to a concrete backend.
 *
 * Both supported backends run anywhere the library itself does (no WASM
 * beyond the QR decoder, no GPU, no per-device capability), so this is now
 * a pure mapping with nothing to probe: `"auto"` resolves to `qrLtBackend`,
 * the one every version of this library can decode. It is deliberately
 * never `qrBinLtBackend` — that's strictly more throughput, but an older
 * receiver's `backendForId` won't recognize the `qr-bin-lt` header id, so
 * it must be opted into explicitly (`preferredBackend: 'qr-bin-lt'`, or
 * `backend: qrBinLtBackend` pinned) once you know your receivers support
 * it.
 */
export async function resolvePreferredBackend(
  preferred: PreferredBackend,
): Promise<TransferBackend<Frame>> {
  if (preferred === 'qr-bin-lt') return qrBinLtBackend;
  return qrLtBackend;
}
