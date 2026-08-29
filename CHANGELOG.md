# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Prepped for a **2.0.0** release — not yet tagged or published. The major
version reflects the removed public exports below: this project's stated
policy is strict semver on the root export's surface, and that policy is
applied here regardless of the fact that no version has actually been
published to npm yet. See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) Stage 8 for
the remaining release steps (publish, git tag, manual device-matrix
attestation).

Also includes Stage 9's codec abstraction refactor, Stage 11's backend
negotiation, and Stage 13's Cimbar removal — see below. Stage 10's Cimbar
backend was built, shipped into this same unreleased line, and then removed
again; it never reached a published version.

### Added

- **`onMetrics` on `ReceiverSession`/`NegotiatingReceiverSession`** — live
  transfer throughput, fired alongside every `onProgress`:
  `{ bytesReceived, totalBytes, bytesPerSecond, elapsedMs }`
  (`TransferMetrics`, now exported). With Cimbar gone, throughput is the
  whole reason to choose `qr-bin-lt` over `qr-lt`, and it was previously
  unmeasurable from outside the library.

  A new callback rather than a widened `onProgress`, because the two answer
  different questions: `onProgress` is the fountain decoder's completion
  *estimate* (redundancy-adjusted, clamps near the end), while these are
  real bytes over real milliseconds. `bytesPerSecond` is measured over a
  short trailing window rather than cumulatively — a cumulative average
  never recovers from a stall, so it can't tell you whether the change you
  just made helped. The last event before `onComplete` carries the final
  elapsed time, so no second callback was needed for "how long did that
  take".
- `StreamDecoder.bytesReceived` / `.totalBytes` (and the same pair on
  `NegotiatingStreamDecoder` and `BackendDecoder`), the counters
  `onMetrics` is built from — useful directly for a non-camera receiver.
  Wire bytes, `undefined`/`0` until the first frame is accepted.
- A live KB/s and elapsed/remaining readout in `examples/app.html`, on both
  the self-test and the real-camera receiver.

### Removed

- **The Cimbar backend, entirely** — `cimbarBackend`, `CimbarEncodeOptions`,
  `probeCimbarAvailable`, `"cimbar"` as a `PreferredBackend` value, the
  vendored ~2MB MPL-2.0 libcimbar WASM build, and its entry in
  `THIRD_PARTY_LICENSES.md`. **Reason: real-device testing.** On Android the
  sender displayed correctly but the receiver never began decoding at all;
  on iPhone it worked but was slower than the QR backends it was supposed
  to beat. `qr-lt` was reliable on both platforms and `qr-bin-lt` reliable
  on both (slower on Android), so the two supported backends are now those,
  and nothing is lost that worked. The backend abstraction and the
  header-frame negotiation it originally motivated both stay — see
  `PROJECT_PLAN.md`'s "Cimbar removal" section for the full rationale.
- `ImageFrame`, and the image-frame arm of the `Frame` union — `Frame` is
  now `string | Uint8Array`. Nothing produces an image frame any more.
  **Breaking for a third-party image-based `TransferBackend`**, which is
  the only thing that could have relied on it.
- `Scanner`'s `rawFrames` capture mode (`ScannerOptions.rawFrames`) and
  `Camera.grabNativeFrame()`, both of which existed solely to feed raw
  pixels to Cimbar's decoder. `Camera.grabLumaFrame()` — the QR path's
  native luminance capture, and the one real-camera fast path — is
  unaffected, as is `grabFrame()`'s canvas/RGBA fallback.
  `ScannerOptions.decodeBytes` is a separate, unrelated flag and stays.
- `resolvePreferredBackend`'s second `probe` argument. There is no
  capability left to probe for.

### Changed

- `"auto"` (`PreferredBackend`) now resolves straight to `qrLtBackend` and
  is **deprecated**. It previously tried Cimbar and fell back; both
  remaining backends run anywhere this library runs, so there is no device
  capability left to detect, and resolving to `qrBinLtBackend`
  automatically would risk a receiver too old to recognize its header id.
  Name `"qr-lt"` or `"qr-bin-lt"` explicitly instead. The value stays in
  the union so existing callers keep compiling.
- `NegotiatingReceiverSession` now only ever switches `Scanner` between
  text and byte decoding (never into a raw-pixel capture mode), so the
  mid-transfer camera restart is the only remaining handoff on that path.

### Fixed

- **Real-camera scanning died after ~2 frames** — the code displayed
  normally but never decoded anything. `Camera.readLatestVideoFrame`
  drained the capture queue by racing each extra `reader.read()` against a
  timer, but losing a `Promise.race` does not cancel the losing promise:
  every capture left an orphaned `read()` pending, which later resolved
  with a real `VideoFrame` that nothing ever closed. WebCodecs frame pools
  are small and fixed (smaller the higher the resolution), so one leaked
  frame per capture exhausted the pool within a few frames, after which the
  track stopped producing and *every* subsequent `read()` hung forever —
  silently, with no error. `Scanner` then sat with `captureInFlight` stuck
  true and stopped sampling entirely. Measured at 1080p: dead after 2
  grabs. Replaced with a single long-lived frame pump that has exactly one
  `read()` outstanding and owns every frame it receives, closing each one
  either when superseded or after the consumer is done with it — verified
  in a real browser at 1080p: 40/40 grabs, zero leaked frames. As a bonus
  it no longer blocks a full camera frame interval per capture.
  This never showed up in CI or in `examples/app.html`'s self-test because
  both fake the camera with `canvas.captureStream()`, which yields `BGRA`
  frames and therefore only ever exercises the canvas/RGBA *fallback* —
  real camera hardware yields `NV12`/`I420` and takes the native path that
  was broken. New `examples/capture-diagnostics.html` covers exactly this
  gap.
- Three further ways the scan loop could wedge or die permanently, all
  found while fixing the above and each now covered by a regression test in
  `test/scan/scanner-lifecycle.test.ts`:
  - A **synchronous** throw out of `camera.grabLumaFrame()` left
    `captureInFlight` stuck true (the `.catch` that clears it is never
    attached in that case), so every later tick early-returned and scanning
    was dead for the session.
  - A throw anywhere in a tick killed the sampling chain outright.
    `setInterval` survived a throwing callback; the self-rescheduling
    `setTimeout` chain that replaced it did not, since the exception
    skipped the next `setTimeout`.
  - `stop()` could not stop a chain when called *from inside* a tick (which
    a completed transfer does): that tick's timer had already fired, so the
    chain rescheduled itself straight past the `clearTimeout` and then ran
    forever, outliving its `Scanner`. Now guarded by a generation counter.
- A decode worker that threw *synchronously* while unpacking a request
  (before `decodeFrame`'s own promise chain) posted no response at all, so
  `Scanner` held that pool slot open forever — at the default pool size of
  one, wedging scanning permanently. Every path out of the worker's
  `onmessage` now posts exactly one response.
- `Scanner` no longer performs a full capture (a 1080p `getImageData`, or a
  luma-plane copy) on ticks where every decode worker is already busy and
  the frame could only be thrown away.
- `Camera` now shuts its native capture path down for good the first time a
  frame's layout turns out to be unusable (a format like `BGRA`, or
  non-packed planes). Both are properties of the stream rather than of one
  frame, so the previous behavior decoded and discarded a full `VideoFrame`
  on every tick, forever, on top of the canvas capture it fell back to.
- `Scanner`'s single `pendingDecode` flag reserved the "one decode in
  flight" slot for the full duration of *capture plus decode*, so the next
  camera frame couldn't even start capturing until the current one had
  finished decoding — worse than the flag's own name implied, and worse
  than the pre-async-capture behavior it replaced. Capture re-entrancy
  (`captureInFlight`) and decode busyness (now the new `DecodeWorkerPool`,
  see Added below) are separate concerns tracked separately: a capture can
  start as soon as the previous one resolves, independent of whether a
  decode worker is free to take the result.
- `Scanner`'s decode-worker `postMessage` calls used no transfer list, so
  every captured frame was structured-clone *copied* into the worker
  rather than moved — and `Camera.grabLumaFrame` compounded it by handing
  back a `.subarray()` view onto its native NV12/I420 capture's full
  backing buffer, so the clone still carried 1.5 bytes/pixel even though
  the returned `LumaFrame` claimed 1. `grabLumaFrame` now `.slice()`s the
  luma plane into its own freshly allocated buffer (nothing else holds a
  reference to it), and `Scanner.tick` transfers that buffer (and
  `grabFrame`'s `ImageData` buffer, in the RGBA fallback path) via
  `postMessage`'s transfer list — a real 4× reduction against the old RGBA
  path, not 2.7×, with zero remaining copy.
- The receiver's fixed-period `setInterval` scan loop could phase-lock
  onto the sender's display refresh: with the library's own defaults
  (`scanHz: 20`, `fps: 10`), every other sample landed exactly on the
  display's transition window, since both are simple multiples of the
  same 50ms period. `Scanner` now schedules its camera-sampling loop via a
  self-rescheduling `setTimeout` chain with a few ms of random jitter per
  cycle, which makes that lock impossible for near-zero cost.
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

- `examples/capture-diagnostics.html` — a browser diagnostic for the
  **native camera capture path**, which no automated test and no other
  example page can reach: `app.html`'s self-test and the CI loopback
  harness both fake the camera with `canvas.captureStream()` (`BGRA`
  frames), which only exercises the canvas/RGBA fallback, while real camera
  hardware produces `NV12`/`I420` and takes an entirely different path.
  Reports the camera's actual pixel format, checks that repeated capture
  doesn't wedge, counts leaked `VideoFrame`s, and confirms the full
  `Scanner` pipeline keeps dispatching frames and stops cleanly. This is
  the check that would have caught the capture bug above; it also works
  headless under Chromium's `--use-fake-device-for-media-stream`, which
  produces `I420` like a real camera.
- **Decode worker pool.** `ScannerOptions` gained `decodeWorkers` (default
  1, unchanged from prior behavior): the number of camera frames that can
  be mid-decode at once, via a new `DecodeWorkerPool`
  (`src/scan/worker-pool.ts`) that dispatches each captured frame to
  whichever worker is idle and drops it (no queuing) if every worker is
  busy — safe because fountain-coded frames are order-independent and the
  sender keeps redrawing. Previously a 30fps camera always fed a single
  serialized zxing-wasm decoder, so raising `scanHz` past that one
  decoder's own throughput bought nothing. Left opt-in and manual (no
  `navigator.hardwareConcurrency`-based auto-default): each worker costs
  its own ~1MB zxing-wasm instance plus a startup delay, and there's no
  value above 1 that's safe on every device — a low-end phone can thrash
  rather than benefit. `examples/app.html` exposes it as a "decode
  workers" tuning control, readable against the `goodput` metric above to
  see whether a given value actually helps on a real device.
- **Goodput measurement.** `ReceiverSession`/`NegotiatingReceiverSession`
  gained a `goodput` getter — decoded (accepted) frames/sec over a
  trailing 2s window, via a new internal `GoodputTracker`
  (`src/scan/goodput.ts`). Previously nothing counted decoded frames per
  second anywhere in the project, so every `fps`/`scanHz` tuning decision
  was guesswork; this turns "is fps 10 or 20 better" into a number you can
  read off the demo page mid-transfer (`examples/app.html`'s sections 1
  and 3 now show it next to the progress percentage).
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
