/**
 * Byte-accounting helpers shared by both fountain backends, so
 * `TransferMetrics` can report real wire bytes rather than a completion
 * heuristic.
 *
 * Kept in one place because the useful numbers sit just outside bc-ur's
 * public surface, and the workaround for that should be documented and
 * guarded exactly once — see `readExpectedMessageLength`.
 */

/**
 * The total length, in bytes, of the message a fountain stream is carrying —
 * bc-ur learns it from the first part it accepts (every fountain part's
 * header carries `messageLength`) and stores it on `FountainDecoder`, but
 * exposes no accessor for it: `expectedPartCount()` counts *fragments*, not
 * bytes, and nothing public converts between the two.
 *
 * TypeScript's `private` is erased at runtime, so the field is readable.
 * This reads it defensively rather than casting: if a future bc-ur release
 * renames it, changes its type, or drops it, this returns `undefined` and
 * the metrics layer degrades to "total not known yet" — a missing readout —
 * instead of throwing mid-transfer or reporting a confidently wrong number.
 *
 * `undefined` before the first part is accepted, which is also when bc-ur
 * still has this at its `0` initial value.
 */
export function readExpectedMessageLength(fountainDecoder: unknown): number | undefined {
  const length = (fountainDecoder as { expectedMessageLength?: unknown } | null | undefined)
    ?.expectedMessageLength;
  return typeof length === 'number' && length > 0 ? length : undefined;
}

/**
 * `URDecoder` delegates to an internal `FountainDecoder` — also a
 * TypeScript-private field, and the one `readExpectedMessageLength` needs.
 * Same defensive reasoning as above: `undefined` rather than a throw if the
 * shape ever changes.
 */
export function innerFountainDecoder(urDecoder: unknown): unknown {
  return (urDecoder as { fountainDecoder?: unknown } | null | undefined)?.fountainDecoder;
}

/**
 * Message length for a transfer that never went through the fountain
 * decoder at all.
 *
 * bc-ur's `UREncoder` emits a *single-part* UR (`ur:bytes/<body>`, with no
 * `seqNum-seqLength` path component) whenever the whole message fits one
 * fragment, and `URDecoder.receivePart` decodes that form directly into its
 * result — the fountain decoder is never fed a part, so it never learns the
 * message length and `readExpectedMessageLength` stays `undefined`. Not an
 * edge case in practice: a small or highly compressible file lands here
 * routinely.
 *
 * The decoded result's own CBOR length is the same figure the fountain
 * header would have carried, so it's the right answer once it exists —
 * which, on this path, is as soon as the transfer completes. `undefined`
 * before then, and on any unexpected decoder shape.
 */
export function singlePartMessageLength(urDecoder: unknown): number | undefined {
  const result = (urDecoder as { result?: { cbor?: { length?: unknown } } } | null | undefined)
    ?.result;
  const length = result?.cbor?.length;
  return typeof length === 'number' && length > 0 ? length : undefined;
}

/**
 * Envelope bytes recovered so far: the fraction of *distinct* fragments the
 * decoder holds, scaled by the total message length.
 *
 * Deliberately not derived from bc-ur's `estimatedPercentComplete()` (what
 * `progress`/`onProgress` reports). That figure divides by
 * `expectedPartCount * 1.75` — a deliberate fudge factor for the fountain
 * decoder's redundancy — and clamps at 0.99, so it is a good "how close am
 * I" hint for a progress bar and a bad basis for a byte count: a rate
 * derived from it would read ~1.75x low throughout and then flatten
 * entirely near the end. `receivedPartIndexes` is the count of distinct
 * fragments actually recovered, which maps to bytes directly.
 *
 * Accurate to within one fragment (only the last fragment can be short),
 * and monotonic, since distinct-fragment count only ever grows.
 */
export function recoveredByteCount(
  totalBytes: number | undefined,
  expectedPartCount: number,
  receivedPartCount: number,
): number {
  if (totalBytes === undefined || expectedPartCount <= 0) return 0;
  const fraction = Math.min(1, receivedPartCount / expectedPartCount);
  return Math.round(totalBytes * fraction);
}
