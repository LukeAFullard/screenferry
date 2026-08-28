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

- `examples/app.html`'s Cimbar demo was unreadable by any real camera, and
  the previous round's own fix/guidance for this made it worse in two
  ways, found by reading libcimbar's actual C++ source (`GridConf.h`'s
  `Conf8x8`) against this project's assumptions instead of guessing:
  - The sender canvas/receiver video CSS (added last round to make them
    resizable) forced them into a small box (~260-480px) regardless of
    Cimbar's true 1024×1024 render, using `image-rendering: pixelated`
    (nearest-neighbor) to scale it down. Harmless for QR's much lower
    native resolution; for Cimbar it aliased/mangled the fine color grid
    before a camera was ever involved — likely the dominant cause of "not
    even starting to scan." Fixed: those elements now display at native
    resolution by default (capped by actual viewport width, not the page's
    narrow text column), with `image-rendering` back to the browser
    default (smooth) instead of nearest-neighbor.
  - The Cimbar tuning notes recommended *lowering* `frameSize` (e.g. to
    512) as the fix for scan failures, reasoning it would produce "fewer,
    larger cells." That's wrong: libcimbar's mode B grid is a fixed
    112×112 cells regardless of `frameSize` — lowering it renders that
    same grid into fewer physical pixels, which can only hurt real-camera
    legibility. Corrected in both `examples/app.html` and the README;
    raising `frameSize` above the 1024 default (hardware permitting) is
    the direction that could actually help, not lowering it.
  Still open: real-device confirmation that a real camera now actually
  decodes real Cimbar frames end to end (see the README's Cimbar section).
- GitHub Pages (serving `main` with no build step) couldn't run
  `examples/*.html` at all — they import `../dist/index.js`, and `dist/`
  was gitignored, so that import 404'd and every demo page's script
  silently failed to load. `dist/` (excluding sourcemaps) is now
  committed for this reason specifically; see the README's Manual testing
  section for the resulting "rebuild before committing" discipline this
  creates.
- `cimbarBackend`'s decode never actually worked — real-device testing
  against the live demo confirmed it (frames rendered and displayed, but
  no transfer ever completed). Root cause: libcimbar's decode is a
  **two-stage** pipeline that no single piece of the reference JS glue
  documents end to end — `_cimbard_scan_extract_decode` (what the
  original wrapper called) only extracts one frame's raw fountain chunk;
  actually reconstructing a file requires also calling
  `_cimbard_fountain_decode` (the real completion signal, returning a
  file id) and then `_cimbard_decompress_read` (Cimbar applies its own
  internal zstd compression in transit) — found by reading libcimbar's
  own C++ source (`cimbar_recv_js.cpp`) directly, since the JS glue alone
  doesn't show it. Also added a required `_cimbard_configure_decode(mode)`
  call matching the encoder's mode, never called by the reference JS for
  the default case. A full encode→decode round trip — byte-exact, through
  two genuinely independent WASM module instances (ruling out a
  shared-memory false positive) — is now verified working in a real
  browser at both 256×256 and the default 1024×1024 `frameSize`. See the
  README's Cimbar section for what's still open (real-hardware
  performance, a real camera round-trip, and a real minimum-payload-size
  gotcha this surfaced: very small payloads can fail decode due to
  low-entropy padding).
- `encodeFileToParts`/`encodeToFrames` gained a `backendOptions` passthrough
  so a specific backend's own encode options (e.g.
  `CimbarEncodeOptions.frameSize`) are actually reachable without calling
  `cimbarBackend.encode()` directly — closes a gap flagged (but not fixed)
  in the previous round.
- Real-camera Cimbar scanning sat idle and never decoded, even with frames
  visibly displaying: `Camera`'s `getUserMedia` call requested no
  resolution, so browsers commonly negotiated down to something like
  640x480 — plenty of pixels per module for QR's decode path, not nearly
  enough per cell for Cimbar's much denser grid, especially combined with
  `examples/app.html`'s sender canvas/receiver video both being fixed at a
  small ~260px CSS size regardless of viewport. `Camera`/`Scanner` now
  request 1920x1080 as an `ideal` constraint by default (configurable via
  new `CameraOptions.width`/`height`), and expose the actual negotiated
  resolution via a new `resolution` getter (also on `ReceiverSession` /
  `NegotiatingReceiverSession`). `examples/app.html`'s sender canvas and
  receiver video are now resizable and sized much larger by default, and
  the receive section shows the live negotiated resolution plus a new
  Cimbar-specific tuning-notes section covering both causes. Not yet
  confirmed against a real device end to end (see the README's Cimbar
  section) — this addresses the specific, identified cause, not a general
  guarantee.
- `examples/app.html`'s self-test captured its fake camera stream once and
  reused it, but `NegotiatingReceiverSession` correctly stops+restarts
  `Scanner` (and its `Camera`, which correctly stops the stream's tracks)
  when switching into `rawFrames` mode for a non-`qr-lt` backend — so the
  self-test's single reused stream went permanently dead right after that
  switch, and the cimbar self-test silently never received another frame,
  forever. A demo bug, not a library bug (a real camera's `getUserMedia()`
  legitimately returns a fresh stream each call); fixed by capturing a
  fresh stream per call instead.

### Changed

- Raised `qrLtBackend`'s default QR version ceiling from 20 to 40 (the
  highest version ISO/IEC 18004 defines), and recomputed
  `DEFAULT_MAX_FRAGMENT_LENGTH` (`src/backends/qr-lt/fountain.ts`) to match
  via `npm run qr:capacity` (580 → 2111 bytes at ECC L). Also raised gzip
  pre-compression to `level: 9` (`src/codec/compression.ts`, a one-time
  cost paid before the transfer starts) and the camera's requested capture
  `frameRate` from 15 to 30 (`src/scan/camera.ts`), so a sender pushing
  `DisplayDriverOptions.fps` above ~13 isn't immediately capped by an
  under-provisioned camera constraint. Plain Luby Transform fountain
  coding, single QR per frame, and standard ISO/IEC 18004 QR remain
  unchanged — no RaptorQ, no multi-QR tiling. `DEFAULT_FPS` (10) and
  `DEFAULT_SCAN_HZ` (20) are unchanged; real-camera scan reliability at QR
  version 40 has not yet been validated on physical hardware.
  `scripts/qr-capacity.mjs` was also fixed to size its search against a
  worst-case seqNum/seqLength (a long transfer of a large file), not just a
  small sample: a UR part's `seqNum`/`seqLength` are encoded both as plain
  decimal digits and as CBOR integers, both of which grow in steps as the
  values cross digit/byte-width boundaries, so a fragment length calibrated
  only against a small, low-seqNum sample fits initially but throws
  `RangeError: Data too long` on every part once a real transfer grows past
  that sample's band — a real regression caught after this landed, where
  transfers past a few hundred KB reliably hung the sender's display on
  whatever last rendered (usually the small periodic header-beacon frame,
  which looked like a stuck "default" QR code).
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
  Cimbar findings noted above. Also exposes live tuning controls (`fps`,
  `fragmentSize`, `scanHz` for qr-lt; `frameSize` for cimbar, via the new
  `backendOptions` passthrough) with an on-page explanation of what each
  one trades off, so real-device performance/reliability tuning doesn't
  require editing code.
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
