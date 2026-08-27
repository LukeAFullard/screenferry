# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Prepped for a 1.0.0 release — not yet tagged or published. See
[`PROJECT_PLAN.md`](PROJECT_PLAN.md) Stage 8 for the remaining release
steps (publish, git tag, manual device-matrix attestation).

Also includes Stage 9's codec abstraction refactor and Stage 10's Cimbar
backend integration (both v2), landed ahead of the 1.0.0 publish since that
hasn't happened yet — see below.

### Changed

- Introduced a `TransferBackend` interface (`src/backends/types.ts`)
  behind which every transfer backend sits, so `encodeToFrames` and
  `StreamDecoder` are no longer hardwired to QR + Luby Transform fountain
  codes. `encodeToFrames`/`StreamDecoder` accept an optional `backend`,
  defaulting to the new `qrLtBackend` export — omitting it is behaviorally
  identical to v1.
- Relocated the existing QR + Luby Transform implementation (fountain
  encoder/decoder, QR module computation, canvas rasterization) under
  `src/backends/qr-lt/` as the `qrLtBackend` implementation of that
  interface. Pure relocation — no behavior change; the full loopback +
  fault-injection + reliability-matrix suite passes unmodified against the
  relocated code.
- Widened `Frame` (`src/backends/types.ts`) from `string | Uint8Array` to
  `string | ImageFrame`, where `ImageFrame` carries pixel dimensions
  alongside the buffer — an image-based backend's frame is meaningless
  without its width/height, which a bare `Uint8Array` couldn't express.
- `DisplayDriver` moved to `src/backends/display-driver.ts` (out of
  `qr-lt/`, since it's no longer QR-specific) and now renders either frame
  shape: QR strings via the existing raster path, `ImageFrame`s via
  `canvas.putImageData`. Also now releases the frame source's resources
  (calls the async iterator's `.return()`) on `stop()`.
- `Scanner` gained an opt-in `rawFrames` option: when set, it skips its
  built-in QR text-decode worker and reports raw captured pixels instead,
  for a backend (Cimbar) whose decoder consumes pixels directly. Default
  (`false`) behavior — and the QR decode path generally — is unchanged.
- `encodeToFrames`, `StreamDecoder`, `ReceiverSession`, and the internal
  `TransferDecoder`/`encodeFileToParts` are now generic over `Frame`,
  defaulting to `string` — omitting `backend` everywhere preserves v1's
  exact types and behavior.

### Added

- `cimbarBackend` — a `TransferBackend` implementation wrapping
  [libcimbar](https://github.com/sz3/libcimbar)'s official WASM build
  (MPL-2.0, vendored under `src/backends/cimbar/vendor/` — see
  `THIRD_PARTY_LICENSES.md`), as an opt-in, higher-throughput alternative
  to `qrLtBackend`. Lazy-loaded via a dynamic import (mirrors the QR decode
  stack), so importing `screenferry` doesn't cost anything unless it's
  actually used.
  **Written against libcimbar's reference JS glue, but not yet exercised
  against the real WASM binary in a browser** — this repo's headless test
  harness has no WebGL/camera to verify it with. Treat it as experimental
  pending real-device testing (see README's Cimbar section); the manual
  device-matrix pass this needs (`PROJECT_PLAN.md`/`IMPLEMENTATION_10`,
  step 7) is still outstanding.
- A `test/backends/plumbing.test.ts` round-trip test using a synthetic
  non-qr-lt, image-frame `TransferBackend`, proving the generic
  `encodeToFrames`/`StreamDecoder`/`TransferBackend` plumbing itself is
  backend-agnostic — independent of whether `cimbarBackend`'s own WASM
  calls are correct (which the above caveat covers separately).
- `THIRD_PARTY_LICENSES.md` — attribution and provenance (source URL,
  release tag, tarball SHA-256) for the vendored libcimbar build.
- A photosensitivity/seizure warning in the README and `PROJECT_PLAN.md`:
  both the QR and Cimbar backends are, functionally, controlled strobing
  patterns, and consumers integrating this library are expected to surface
  their own warning before displaying the sender's animation.
- `encodeToFrames(file, opts)` — envelopes and Luby Transform fountain-encodes
  a `Blob`/`File`, yielding an infinite stream of QR frame content strings.
- `DisplayDriver` — renders a frame stream onto a canvas via
  `requestAnimationFrame` at a configurable fps, pausing automatically while
  the tab is hidden.
- `Scanner` / `Camera` — camera capture and off-main-thread barcode
  decoding (`zxing-wasm`, self-hosted WASM, with an automatic `jsQR`
  fallback if WASM fails to load).
- `StreamDecoder` — reassembles fountain-encoded frame strings back into
  the original file, verifying a SHA-256 checksum and throwing
  `IntegrityError` (distinctly from a generic error) on mismatch.
- `ReceiverSession` — combines `Scanner` and `StreamDecoder` for the common
  camera-to-file case, with `onProgress`/`onComplete`/`onError` callbacks.
- QR encode/render layer (`uqr`-based), tuned for QR ECC level `L` and
  version ≤ 20 — fountain coding already tolerates whole-frame loss, so
  capacity is prioritized over per-frame redundancy.
- Gzip pre-compression and SHA-256 integrity verification in the wire
  envelope (filename, MIME type, size, hash, compression flag).
- An end-to-end loopback test harness (`npm run test:e2e`) covering frame
  drop/duplicate/reorder, a sustained-loss-then-recovery scenario, a
  file-size × drop-rate × ECC-level reliability matrix, and a performance
  regression trip-wire — all camera- and WASM-free, so it runs fast in CI.
- Manual smoke-test examples: `examples/sender-demo.html`,
  `examples/receiver-demo.html` (real camera), and
  `examples/loopback-demo.html` (full pipeline, no camera required).
