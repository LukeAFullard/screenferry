# Implementation 02 — Fountain Codec Core

**Goal:** a working, unit-tested Luby Transform fountain encoder/decoder,
wrapped behind an internal interface, with a compression + integrity
envelope. Not yet wired to the public API.

**Depends on:** Implementation 01 complete.

## Steps

1. **Install dependencies**
   - `@ngraveio/bc-ur` (MIT — Luby Transform + Uniform Resource encoding).
   - `fflate` (MIT — small, fast gzip/deflate) for pre-compression.

2. **Define the wire envelope**
   Before fountain-encoding, prepend a small metadata header to the file bytes
   so the receiver can rebuild a real file, not just raw bytes:
   - `filename: string`
   - `mimeType: string`
   - `size: number`
   - `sha256: string` (hex digest of the *original, uncompressed* bytes)
   - `compressed: boolean`

   Encode as: `[header length][header bytes][payload bytes]`.

3. **Compression step**
   `compress(bytes) -> Uint8Array` via `fflate`'s `gzipSync`. Compare
   compressed vs. original size; use whichever is smaller and set the
   envelope's `compressed` flag accordingly (some files, e.g. already-zipped
   formats, won't shrink).

4. **Internal module boundary**
   Create `src/codec/fountain.ts`. Do not leak `bc-ur` types outside this
   file — this boundary is what makes the Stage 9 (v2) backend swap possible
   later:
   ```ts
   export function createFountainEncoder(
     bytes: Uint8Array,
     opts?: { maxFragmentLength?: number }
   ): AsyncIterable<string>;

   export class FountainDecoder {
     receivePart(part: string): void;
     isComplete(): boolean;
     getResult(): Uint8Array; // envelope-encoded, not yet unwrapped
   }
   ```

5. **Wrap bc-ur**
   - `createFountainEncoder` builds a `UR` from the envelope buffer and drives
     `UREncoder.nextPart()` in a loop, yielding parts as an async generator
     until the caller stops pulling. The caller (Stage 4, sender pipeline)
     owns the stop condition — this function just supplies parts on demand.
   - `FountainDecoder.receivePart` forwards to an internal `URDecoder`.

6. **Checksum verification on decode**
   Once `FountainDecoder.isComplete()` is true: decompress if flagged,
   compute SHA-256 via `crypto.subtle.digest`, compare to the envelope's
   stored hash. On mismatch, throw a distinct `IntegrityError` — don't return
   the bad bytes. Callers need to tell "corrupted result" apart from "not
   enough frames yet."

7. **Configurable redundancy**
   Expose `maxFragmentLength` (maps to bc-ur's fragment size — controls
   payload per QR frame). Default to 100–150 bytes for now; this gets tuned
   empirically in Stage 3 once real QR capacity is measured against camera
   read reliability.

8. **Unit tests** — `test/codec/fountain.test.ts`
   - Round-trip: small buffer (few KB), single fragment.
   - Round-trip: large buffer (multi-MB), many fragments.
   - Resilience: feed parts to the decoder **out of order**.
   - Resilience: **drop** ~20% of parts at random; confirm it still completes
     once enough redundant parts arrive.
   - Corruption: flip bits in one part; confirm `IntegrityError` is thrown,
     never silent corruption.
   - Compression skip case: feed pre-compressed random bytes; confirm the
     envelope correctly flags `compressed: false` and still round-trips.

9. **Do not wire to `src/index.ts` yet**
   Keep this internal. Stages 4 and 6 expose it publicly once QR framing
   (Stage 3) determines real-world fragment sizing.

## Design notes
- CBOR/UR envelope chosen over a custom format because bc-ur already
  implements it correctly and it's a documented, interoperable spec — no
  need to reinvent framing.
- SHA-256 over a weaker checksum because a silently-wrong reconstructed file
  is worse than a slow or failed transfer.
- Fragment length is deliberately *not* hardcoded to a "QR-optimal" number
  yet — that number depends on QR version/ECC choices made in Stage 3.
