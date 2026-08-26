# Implementation 06 — Receiver Pipeline

**Goal:** connect Stage 5's decoded strings to Stage 2's `FountainDecoder`,
complete the public `StreamDecoder` API, and turn the result back into a
real file.

**Depends on:** Implementation 02, 05.

## Steps

1. **Implement `StreamDecoder`** (stubbed in Stage 1): holds a Stage 2
   `FountainDecoder` internally. `addFrame(data: string)` forwards to
   `receivePart`. `progress` exposes bc-ur's estimated completion ratio
   as-is — don't invent a smarter estimate. `isComplete` and
   `getResult(): Promise<Blob>` complete the contract.

2. **`getResult()`** should: wait for completion, decompress if the
   envelope flags it, verify the SHA-256 checksum (Stage 2), and build a
   `Blob` using the envelope's stored `mimeType`. This is where Stage 2's
   `IntegrityError` surfaces — document it as a distinct catch case (e.g.
   "offer retry" vs. generic error handling).

3. **`ReceiverSession` convenience wrapper** (sits above `StreamDecoder`):
   combines Stage 5's `Scanner` + `StreamDecoder` for the common case —
   point a camera at a screen, get a `Blob`, with `onProgress`/`onComplete`/
   `onError` callbacks. This is what a consuming app (NoteDoco, later)
   actually reaches for; `StreamDecoder` alone stays useful for non-camera
   inputs (testing, a future screen-share receiver).

4. **Duplicate-frame handling:** a fast sender loop shows the same frame to
   the camera many times before moving on. Confirm bc-ur already deduplicates
   by part index (it does, by fountain-decoder design). Add a test asserting
   feeding the same part 50 times causes no memory growth or slowdown.

5. **Filename/mimetype recovery:** confirm the `Blob` + suggested filename
   (from the envelope) round-trip into a real downloadable file
   (`URL.createObjectURL` + `<a download>`). Put this in
   `examples/receiver-demo.html` as an example, not library code — the
   library shouldn't decide how to trigger a download.

6. **Unit tests:** feed a full, valid set of Stage 4-generated parts into
   `StreamDecoder` (headless) and assert the resulting `Blob` matches the
   original file byte-for-byte, across the same size range as Stage 4.

7. **First real end-to-end milestone** —
   `examples/loopback-demo.html`: Stage 4's sender renders to a canvas,
   Stage 5's scanner reads from a second canvas fed the same pixels (no
   real camera yet), Stage 6 reconstructs the file. First point the full
   pipeline runs together.

## Design note
`progress` is an estimate, not a guarantee — fountain codes have no fixed
"exactly N parts needed" number. Any progress bar built on this should be
communicated to end users as approximate.
