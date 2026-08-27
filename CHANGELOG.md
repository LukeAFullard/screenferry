# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Prepped for a 1.0.0 release — not yet tagged or published. See
[`PROJECT_PLAN.md`](PROJECT_PLAN.md) Stage 8 for the remaining release
steps (publish, git tag, manual device-matrix attestation).

Also includes Stage 9's codec abstraction refactor, Stage 10's Cimbar
backend integration, and Stage 11's backend negotiation (all v2), landed
ahead of the 1.0.0 publish since that hasn't happened yet — see below.

### Fixed

- GitHub Pages (serving `main` with no build step) couldn't run
  `examples/*.html` at all — they import `../dist/index.js`, and `dist/`
  was gitignored, so that import 404'd and every demo page's script
  silently failed to load. `dist/` (excluding sourcemaps) is now
  committed for this reason specifically; see the README's Manual testing
  section for the resulting "rebuild before committing" discipline this
  creates.

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

- **Backend negotiation (Stage 11).** `encodeToFrames` accepts
  `preferredBackend: "auto" | "qr-lt" | "cimbar"` instead of `backend` —
  `"auto"` probes `cimbarBackend`'s availability
  (`probeCimbarAvailable()`, which never throws) and falls back to
  `qrLtBackend` if it isn't usable here. In this mode the sender always
  renders a small, fixed header/beacon frame as plain QR first (repeated
  periodically via `headerIntervalFrames`), announcing which backend the
  data frames use — there's no return channel for the two sides to ask
  each other directly. `NegotiatingStreamDecoder` and
  `NegotiatingReceiverSession` are the receive-side counterparts: they
  auto-detect the backend from that header frame (switching `Scanner` into
  `rawFrames` mode itself if needed) so the receiver never has to be told
  which backend the sender picked. Plain `backend`/`rawFrames` pinning
  (Stage 9/10) stays available unchanged for callers that already know.
  Covered by `test/backends/negotiation.test.ts`: a real QR render+scan
  round-trip of the header frame (catching a real case-folding bug the
  QR layer's alphanumeric-mode optimization introduces), the header
  interleaving cadence, `resolvePreferredBackend`'s `"auto"` logic with
  injected capability probes (both available and unavailable), and a full
  negotiated qr-lt transfer end to end — the negotiation mechanics
  themselves don't depend on Cimbar actually working; only negotiating
  *to* Cimbar inherits its "unverified in a browser" caveat.
- `cimbarBackend` — a `TransferBackend` implementation wrapping
  [libcimbar](https://github.com/sz3/libcimbar)'s official WASM build
  (MPL-2.0, vendored under `src/backends/cimbar/vendor/` — see
  `THIRD_PARTY_LICENSES.md`), as an opt-in, higher-throughput alternative
  to `qrLtBackend`. Lazy-loaded via a dynamic import (mirrors the QR decode
  stack), so importing `screenferry` doesn't cost anything unless it's
  actually used.
  **Partially verified in a real browser** (headless Chromium,
  software-rendered WebGL, no real GPU/camera — see README's Cimbar
  section for the full detail): the WASM loads, the encoder binds a real
  WebGL context and renders, `gl.readPixels` returns real (non-blank)
  frame data, and the decoder's WASM calls run without crashing. A full
  transfer completing was **not** confirmed — at the default 1024×1024
  `frameSize` each frame was too slow under *software* rendering to
  finish within two minutes (confirmed resolution-dependent, not a hang:
  `frameSize: 64` rendered each frame in tens of ms). Real GPU/camera
  hardware and actual pixel-content correctness remain unverified; treat
  it as experimental pending that. The manual device-matrix pass this
  needs (`PROJECT_PLAN.md`/`IMPLEMENTATION_10`, step 7) is still
  outstanding.
- A `test/backends/plumbing.test.ts` round-trip test using a synthetic
  non-qr-lt, image-frame `TransferBackend`, proving the generic
  `encodeToFrames`/`StreamDecoder`/`TransferBackend` plumbing itself is
  backend-agnostic — independent of whether `cimbarBackend`'s own WASM
  calls are correct (which the above caveat covers separately).
- `THIRD_PARTY_LICENSES.md` — attribution and provenance (source URL,
  release tag, tarball SHA-256) for the vendored libcimbar build.
- `examples/app.html` and `npm run demo` — a basic manual test page (not
  part of the published package) covering both backends and negotiation:
  a same-device self-test (no camera needed) plus real sender/receiver
  sections for cross-device testing. Used to obtain the real-browser
  Cimbar findings noted above.
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
