# screenferry

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A standalone, framework-agnostic, zero-backend TypeScript library for
transferring files between devices via animated 2D barcodes (camera ↔
screen). Works fully offline — no server, no account, no network connection
between the two devices at all.

## How it works

The sender splits a file into a stream of QR codes and animates them on
screen. The receiver points a camera at the screen and scans continuously.
Under the hood, the file is [Luby Transform fountain-coded](https://en.wikipedia.org/wiki/Fountain_code) before being
split across QR frames: the sender doesn't need to know which frames the
receiver missed, and the receiver can reconstruct the original file from
*any* sufficiently large subset of frames, in any order, with duplicates —
which is exactly what an unreliable camera-and-screen link produces. See
[`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the fuller design rationale and
staged implementation history.

## ⚠️ Photosensitivity / seizure warning

Both backends render **rapidly changing, high-contrast visual patterns** on
screen — by design, that's how the data gets across. This carries a real
risk of triggering seizures in people with photosensitive epilepsy, even
without a prior diagnosis. This is a known, upstream-acknowledged risk for
this class of technology, not a hypothetical one — the reference Cimbar
implementation itself added an explicit epilepsy/seizure warning to its own
encoder for the same reason.

- The default `qrLtBackend` alternates black/white QR frames at a
  configurable rate (`DisplayDriver`'s `fps` option, default 10fps) — lower
  contrast and monochrome, but still a strobing pattern at a rate that can
  affect sensitive viewers.
- The optional `cimbarBackend` (v2, higher throughput — see below) uses
  rapidly cycling **color** patterns, which carries a materially higher
  photosensitivity risk than QR's black-and-white frames.
- **Any application built on this library should surface its own warning**
  before displaying the sender's animation — screenferry does not show a
  warning UI itself, since it has no UI layer at all (see Scope above).
  Consider offering a reduced-fps or reduced-contrast mode, and avoid
  auto-playing the animation without user intent.
- If you or a viewer are known to be affected by photosensitive epilepsy,
  do not view the sender's screen directly.

## Install

```sh
npm install screenferry
```

## Usage

### Sending a file

```ts
import { encodeToFrames, DisplayDriver } from 'screenferry';

const file = someFileInput.files[0]; // any Blob or File
const canvas = document.querySelector('canvas');

const driver = new DisplayDriver(encodeToFrames(file), canvas, {
  fps: 10,
  onFrameSent: (index) => console.log(`sent frame ${index}`),
});
driver.start();

// later, e.g. when the receiver signals completion out of band:
driver.stop();
```

`encodeToFrames` itself just yields an infinite stream of QR frame
contents (strings) — it's UI-agnostic. `DisplayDriver` is the batteries-included
canvas renderer/animator, but you can drive the stream yourself with any
QR rendering approach if you need more control.

Both `encodeToFrames` and `StreamDecoder` accept an optional `backend`,
defaulting to `qrLtBackend` (QR codes + Luby Transform fountain codes).
Omitting it is equivalent to passing `qrLtBackend` explicitly. The same
`TransferBackend` interface is also implemented by `cimbarBackend` — see
the dedicated section below before reaching for it.

### Receiving a file

```ts
import { ReceiverSession } from 'screenferry';

const video = document.querySelector('video'); // shows the live camera preview

const session = new ReceiverSession({
  onProgress: (p) => console.log(`~${Math.round(p * 100)}%`), // estimate, not exact
  onComplete: (file) => {
    // `file` is a real File — name and type recovered from the sender.
    const url = URL.createObjectURL(file);
    const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
    a.click();
  },
  onError: (err) => {
    // IntegrityError specifically means "checksum mismatch" — offer a
    // retry, rather than treating it as a generic failure.
    console.error(err);
  },
});

await session.start(video); // prompts for camera permission
// later:
session.stop();
```

`ReceiverSession` combines camera capture and decoding for the common case.
If you have frame data from somewhere other than a camera (a test harness,
a future screen-share receiver), use `StreamDecoder` directly — feed it
strings via `addFrame()`, check `.isComplete`, then `await .getResult()`.

**Scanning automatically prefers luminance-only capture when it's
available**, for both `qrLtBackend` and `qrBinLtBackend` — no option to set,
this just happens inside `Scanner`. Color carries no information for a QR
decode (unlike Cimbar's color-coded cells), so `Camera.grabLumaFrame()`
captures only a camera's native luminance plane (1 byte/pixel, straight off
the same WebCodecs `MediaStreamTrackProcessor` path `cimbarBackend`'s
`rawFrames` mode uses) instead of `grabFrame()`'s full `<canvas>`
`drawImage`/`getImageData` RGBA round trip — a real color-processing hop
that was pure waste for a decode that only ever reads grayscale. The decode
worker expands the captured luma plane back to a minimal grayscale RGBA
buffer right before handing it to zxing-wasm/jsQR (neither accepts raw
luminance through its public API), so this only saves the *capture* and
`postMessage` cost, not the decode itself — but capture (a full-resolution
canvas composite) is the more expensive half. Falls back to `grabFrame`'s
canvas/RGBA path automatically wherever the native capture path isn't
available (same fallback `cimbarBackend`'s `rawFrames` mode already relies
on), so this is safe everywhere with no behavior change beyond speed.

## Byte-mode QR backend (qr-bin-lt, opt-in)

`qrBinLtBackend` is the same Luby Transform fountain coding as
`qrLtBackend`, rendered as **byte-mode** QR data instead of bytewords text —
about **39% more payload per frame** at identical frame rate, ECC level, and
module count, with no extra runtime dependency (no WASM, no GPU — it works
anywhere `qrLtBackend` does).

**Why this is faster.** QR v40 at ECC L holds 2953 bytes in byte mode, but
only 4296 *characters* in alphanumeric mode. `qrLtBackend` renders its
fountain parts as [bc-ur](https://github.com/ngraveio/bc-ur) UR strings —
bytewords-encoded text, 2 characters per payload byte — so alphanumeric mode
recovers some of that gap but not all of it, landing at ~2111 usable payload
bytes per frame (`qrLtBackend`'s `DEFAULT_MAX_FRAGMENT_LENGTH`, see
`scripts/qr-capacity.mjs`). `qrBinLtBackend` skips bytewords and the `ur:`
URI wrapper entirely: it fountain-encodes with bc-ur's own `FountainEncoder`
directly (a deep import — `@ngraveio/bc-ur` has no `exports` map, so this is
legal, not a hack) and renders each part's raw CBOR bytes as byte-mode QR
data, landing at ~2931 bytes per frame instead (`qrBinLtBackend`'s own
`DEFAULT_MAX_FRAGMENT_LENGTH`, see `scripts/qr-bin-capacity.mjs`).

**A separate backend id, not a mode flag on `qrLtBackend`.** This is a wire
format change — a `qrBinLtBackend` frame (`Uint8Array`) can't be decoded by
anything expecting `qrLtBackend`'s UR text frames, or vice versa. The
existing header/beacon negotiation exists to make that safe:

```ts
import { encodeToFrames, DisplayDriver, NegotiatingReceiverSession } from 'screenferry';

// sending
const driver = new DisplayDriver(encodeToFrames(file, { preferredBackend: 'qr-bin-lt' }), canvas);
driver.start();

// receiving — never told which backend the sender picked
const session = new NegotiatingReceiverSession({ onComplete, onError });
await session.start(video);
```

`"auto"` (see "Backend negotiation" below) deliberately **never** resolves
to `qrBinLtBackend` on its own, even when Cimbar isn't available and
`qrBinLtBackend` would otherwise be a strict improvement — a sender on a
newer version of this library shouldn't silently become unreadable by a
receiver on an older one that doesn't recognize the `qr-bin-lt` header id
(`backendForId` returns `undefined` for it, and the receiver just keeps
waiting). Opt into it explicitly — `preferredBackend: 'qr-bin-lt'` above, or
pin it directly (`backend: qrBinLtBackend` / `new StreamDecoder(qrBinLtBackend)`,
mirroring `qrLtBackend`'s own pinned usage) — once you know your receivers
support it.

**Frame shape differs from `qrLtBackend`.** `Frame` for this backend is a
raw `Uint8Array` (a fountain part, meant to be rendered directly as
byte-mode QR data), not a UR part string. `DisplayDriver` already handles
this transparently (`renderQrToCanvas` accepts either a `string` or a
`Uint8Array`). A receiver using the *pinned* (non-negotiated) API needs to
tell `Scanner` to decode bytes instead of text explicitly, via
`decodeBytes: true`, and pass the matching `backend` to
`StreamDecoder`/`ReceiverSession` — nothing checks that the two agree
(`NegotiatingReceiverSession` handles this automatically once negotiated).

```ts
import { qrBinLtBackend, ReceiverSession } from 'screenferry';

const session = new ReceiverSession({ onComplete, onError }, qrBinLtBackend);
await session.start(video, { decodeBytes: true });
```

## Cimbar backend (v2, opt-in)

`cimbarBackend` wraps [libcimbar](https://github.com/sz3/libcimbar)'s
official WASM build (MPL-2.0, vendored — see
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md)) behind the same
`TransferBackend` interface as `qrLtBackend`, trading QR's black-and-white
frames for denser color-based ones.

**Read this before reaching for it:**

- **Higher throughput, far less battle-tested.** `qrLtBackend` has this
  project's full loopback/fault-injection/reliability-matrix test suite
  behind it; `cimbarBackend` does not.
- **Correctness: verified.** A full encode→decode round trip — byte-exact,
  through two genuinely independent WASM module instances (separate
  browser contexts, not a shared-memory false positive) — has been
  confirmed in a real browser (headless Chromium, software-rendered WebGL
  via `swiftshader`), at both 256×256 and the default 1024×1024
  `frameSize`. This took real debugging to get right, worth knowing about
  if you're extending this backend: libcimbar's decode is a **two-stage**
  pipeline undocumented anywhere in prose — `_cimbard_scan_extract_decode`
  (per-frame symbol extraction) only *looks* self-contained from the
  reference JS glue's worker-side half; the reference's separate
  main-thread half is what actually calls `_cimbard_fountain_decode` (the
  real completion signal) and `_cimbard_decompress_read` (Cimbar applies
  its own internal zstd compression in transit). Also needed: an explicit
  `_cimbard_configure_decode(mode)` call matching the encoder's mode,
  never called by the reference JS at all for the default case. Both are
  implemented and covered by this wrapper now (see
  `src/backends/cimbar/module.ts`'s doc comments for the full trail).
  **One real gotcha found along the way:** very small payloads (roughly
  under a few hundred bytes) can fail — Cimbar pads short input to fill a
  full fountain chunk, and if that padding is low-entropy, the symbol
  extractor may not reliably find tile boundaries. A normal file plus this
  project's own envelope overhead clears that easily in practice (this
  project's own default sample payload, ~2.4KB, round-trips reliably).
- **Performance: unverified on real hardware, confirmed slow under
  software rendering.** The full pipeline (`DisplayDriver` → canvas
  capture → `Scanner` → decode) did not complete within several minutes
  under `swiftshader` at the 1024×1024 default — `GL Driver Message: GPU
  stall due to ReadPixels` on every frame confirms this is a software
  -rendering-specific cost (`gl.readPixels` forces a full GPU pipeline
  sync), not a hang: a direct, non-UI encode/decode round trip at the same
  resolution completes in well under a second. A real GPU should be
  dramatically faster, but that's genuinely unconfirmed — this needs a
  real-device smoke test to know for sure. `examples/app.html` now exposes
  `frameSize` as a live control specifically so you can find a resolution
  that performs acceptably on your own device. The encoder also logs which
  renderer WebGL actually bound to (`console.info('[screenferry] cimbar GPU
  renderer:', ...)`, via `WEBGL_debug_renderer_info`) — if that logs
  `SwiftShader`/`llvmpipe`/`Software` on a device that should have a real
  GPU, treat frame timing as suspect independently of everything else here.
- **Real-camera scanning needs more pixels per cell than QR does.** Cimbar's
  grid (112×112 cells at every `frameSize` — see below) is far denser than
  QR's modules, so it's much more sensitive to things that barely affect QR:
  - The camera's actual capture resolution. Browsers commonly negotiate a
    low resolution (e.g. 640x480) when `getUserMedia` doesn't ask for
    anything specific — plenty for QR, not for Cimbar. `Camera`/`Scanner`
    now request 1920x1080 as an `ideal` `MediaTrackConstraint` by default
    (overridable via `CameraOptions.width`/`height`; still just a request,
    the browser can fall back lower), and both expose a `resolution` getter
    (also mirrored on `ReceiverSession`/`NegotiatingReceiverSession`) —
    `examples/app.html` displays it live during scanning.
  - Exposure/focus hunting and motion blur. `Camera.start()` also requests
    `aspectRatio` (matched to portrait/landscape), `exposureMode`/
    `focusMode: 'continuous'`, and `frameRate: { ideal: 15 }` — the same
    constraints `sz3/libcimbar`'s reference `recv.js` (`init_video`) uses,
    since Cimbar's fixed-threshold anchor detector is far less tolerant of
    a hunting exposure/focus loop than QR is. Browsers that don't recognize
    `exposureMode`/`focusMode` (not yet a standard `MediaTrackConstraints`
    field) just ignore them.
  - Which decode mode the sender actually used. `CimbarDecoder` no longer
    assumes mode `68` ("B") — it cycles through `[68, 67, 66, 4]` per
    frame (`_cimbard_configure_decode` before each attempt) and locks onto
    whichever one first decodes, mirroring the reference `recv.js`'s
    `on_frame`. `CimbarEncodeOptions.mode` exposes the same choice on the
    sending side — mode `67` ("Bm") is documented upstream as built
    specifically for broader camera compatibility, at ~30% less
    throughput than the default.
  - What's actually failing, frame to frame. Previously, a frame whose
    symbol was found but decoded zero cells (`extractedLen === 0` — a
    color/threshold problem) was silently indistinguishable from a frame
    where symbol extraction failed outright (`extractedLen < 0` — can't
    find/deskew it at all). Both now call `reportError()`, and
    `CimbarDecoder` logs a throttled (~once/second) `console.debug` count
    of extraction outcomes, so which failure mode is actually happening
    during a live scan is visible instead of guessed at.
  - The on-screen size of the *displayed* code — shrink it in CSS/layout
    and every cell shrinks with it. `examples/app.html` previously forced
    the sender canvas into a small (~260-480px) box regardless of its true
    1024×1024 resolution, using `image-rendering: pixelated` (nearest-
    neighbor) to scale it down — for QR's much lower native resolution that
    was harmless, but for Cimbar it meant every real-camera test was
    scanning an already visibly aliased/mangled downscale of the code,
    before the camera was even involved. Fixed: the canvas/video elements
    there now display at their native resolution by default (only capped by
    actual viewport width, not the page's narrow text column), and are
    still resizable if you want to adjust further.
  - **`frameSize` is a resolution knob, not a cell-density knob** — mode
    B's grid is fixed at 112×112 cells regardless of `frameSize`, so
    lowering it (e.g. to 512) does not yield fewer, bigger, easier cells;
    it renders that same 112×112 grid into fewer physical pixels, which
    only *hurts* real-camera legibility. If tuning it at all, raising it
    above the 1024 default (hardware permitting) is the direction that
    could help, not lowering it.

  These were real, identified bugs/misconceptions in this project's own
  test harness and docs, not hypotheticals — confirmed on real camera
  hardware (not just theorized), which is what motivated the mode-cycling,
  camera-constraint, and diagnostic-logging fixes above, plus the two
  below.
  - **The encode window was 16px too small.** `_cimbare_render()` shakes
    the rendered symbol by up to ±8px (a jitter libcimbar's own reference
    encoder always applies, cycling through four offsets, one per frame) —
    libcimbar's own default window size (`image_size + 16`) exists
    specifically to leave a border for that shake to move into. This
    project's encoder was sizing its window to exactly `frameSize`
    (no border), so on two of every four rendered frames, an 8px strip —
    including part of a corner anchor — was pushed off the canvas edge.
    Fixed: the render window is now always `frameSize + 16`, matching
    libcimbar's own default and giving the symbol a quiet zone too.
  - **The decoder could lock onto the wrong mode.** `CimbarDecoder`'s
    mode-cycling (above) locked onto the first candidate mode that
    returned `extractedLen >= 0` — but `0` means "symbol found and
    deskewed, zero cells decoded," which a *wrong* mode can also produce
    (anchor detection/deskew are geometric and largely mode-independent;
    cell decoding is not). Locking on `0` wedged the decoder onto the
    wrong mode permanently, and — since `_cimbard_configure_decode` resets
    the fountain sink on any actual mode change — silently discarded
    whatever had already been accumulated. Fixed: locking now requires
    `extractedLen > 0` (an actual decoded chunk).
  - **The very first rendered frame was blank.** The encode loop called
    `_cimbare_render()` before `_cimbare_next_frame()`, but `render()` only
    draws whatever `next_frame()` most recently prepared — right after
    finalizing the input, nothing had been prepared yet, so the first
    frame read back was an uninitialized/blank framebuffer. Fixed:
    `next_frame()` now runs before `render()` each iteration.
  - **Return codes were never checked.** Both the encoder (`_cimbare_init_encode`,
    `_cimbare_encode`, `_cimbare_render`, `_cimbare_next_frame`) and decoder
    (`_cimbard_fountain_decode`'s `-5`, specifically "chunk size doesn't
    match the configured mode") sides of the C ABI signal real failures via
    negative return codes that were previously discarded outright. The
    encoder now logs a throttled warning on any negative code instead of
    discarding it silently; the decoder logs `-5` distinctly from ordinary
    "not complete yet." Deliberately not thrown as a hard error on the
    encoder side — this project's reverse-engineered notes on which
    negative codes actually mean failure aren't exhaustively confirmed
    against the vendored WASM build (the finalizing zero-length
    `_cimbare_encode` call has been observed returning `-1` in otherwise-
    working sessions, which isn't one of its documented failure codes), so
    treating every negative return as fatal risked aborting a working
    transfer on a code that doesn't actually indicate failure.
  - **No receive-side progress signal.** `CimbarDecoder` didn't implement
    `BackendDecoder.progress`, so any UI reading it saw a flat 0% for an
    entire transfer regardless of actual progress — indistinguishable from
    a completely dead session. It now parses `_cimbard_get_report`'s
    bracketed per-file progress list after every `_cimbard_fountain_decode`
    call (the exact scale of the reported values isn't confirmed against
    this vendored WASM build, so this is a best-effort estimate, not an
    exact percentage).
  - **The payload was compressed twice.** screenferry's own envelope
    (`buildEnvelope`) always gzips; libcimbar's encoder separately
    zstd-compresses everything it's handed (`_cimbare_configure`'s second
    argument). Gzipped bytes don't compress further, so the second pass was
    pure wasted CPU, at a worse ratio than giving zstd the raw bytes
    directly. `cimbarBackend` now sets `compressesInternally: true`, which
    `buildEnvelope` respects by skipping its own gzip pass for this backend
    entirely.
  - **Native `VideoFrame` capture could hand libcimbar a mismatched
    buffer.** `Camera.grabNativeFrame()`'s WebCodecs path reported a
    captured frame's `codedWidth`/`codedHeight`, but `allocationSize()`/
    `copyTo()` both default to the frame's *visible* rect — on a camera
    where those differ (e.g. a 1080-tall visible frame inside a
    1088-tall H.264 macroblock-padded coded frame), the buffer and the
    reported dimensions desynced, corrupting the chroma-plane offsets
    libcimbar's raw pixel read assumes. Fixed: the visible rect's own
    dimensions are reported instead, and each plane's layout is validated
    as tightly packed before use — falling back to the canvas/RGBA path
    when it isn't, rather than handing libcimbar a buffer it would
    misread.
  - **Known limitation, not fixed: one WASM module instance can't safely
    serve both a sender and a receiver on the same page.**
    `_cimbare_configure`/`_cimbard_configure_decode` both write the same
    single C++-side static config — there's no per-role state. The
    same-device self-test below runs exactly this same-page loopback, so a
    receiver's mode-cycling can corrupt whatever a still-in-progress sender
    is rendering, with no visible symptom beyond "images appear, nothing
    ever decodes." A real two-party transfer (separate devices/processes)
    isn't affected — see `src/backends/cimbar/index.ts`'s doc comment on
    `cimbarBackend` for the full detail.
- **Frame capture skips the canvas/RGBA round trip when possible.**
  `Camera.grabNativeFrame()` (used by `Scanner`'s `rawFrames` mode) reads
  the camera's *native* pixel format — NV12 or I420 — directly off a
  `MediaStreamTrackProcessor`-backed `VideoFrame`, via WebCodecs, instead
  of always compositing through `<canvas>` `drawImage`/`getImageData` into
  RGBA first (a real color-processing hop for a format that only needs 2
  bits of color per cell). Falls back to the canvas/RGBA path
  automatically on a browser without `MediaStreamTrackProcessor`/
  `VideoFrame` support, or if the captured format isn't NV12/I420.
- **Test the pinned path before the negotiated one.** `examples/app.html`'s
  "pin cimbar" checkbox bypasses `preferredBackend`/
  `NegotiatingReceiverSession` entirely in favor of
  `encodeToFrames(file, { backend: cimbarBackend })` +
  `new ReceiverSession(callbacks, cimbarBackend).start(video, { rawFrames: true })`
  — removing `NegotiatingReceiverSession.switchToRawFrames()`'s camera
  stop/restart handoff as a variable. If Cimbar works pinned but not
  negotiated, the bug is in that handoff, not the codec.
- **More sensitive to camera/screen color accuracy** than QR's
  black-and-white frames — screen color calibration, camera white balance,
  and ambient lighting all matter more here.
- **Larger WASM payload** (~2MB, encoder and decoder both loaded from one
  binary) — lazy-loaded via a dynamic import exactly like the QR decode
  stack, so a consumer who never uses `cimbarBackend` doesn't pay for it,
  but a receiver that does still pays this cost up front.
- **Higher photosensitivity risk** — see the warning above.
- **~33.55MB file-size ceiling**, per libcimbar's own documentation of its
  (wirehair) fountain layer — `qrLtBackend`'s bc-ur/LT layer has no such
  documented limit. Not enforced by this wrapper; a transfer past that
  size may simply fail.
- This is why it stays opt-in, never the default.

Per libcimbar's default "mode B" (4-color, 6 bits/tile, Reed-Solomon
ecc=30/155) at its documented 1024×1024 grid: roughly 7,500 usable bytes
per frame, versus `qrLtBackend`'s ~2,111-byte QR fragment (at the
configured max QR version, ECC L) — the throughput gain is real, on the
order of 3-4x per frame, once performance on real hardware is confirmed.

`CimbarEncodeOptions.frameSize` lets you render at a resolution other than
the 1024×1024 default — useful for the performance tuning above. It's the
*symbol's* resolution; the actual render window is `frameSize + 16px`,
matching libcimbar's own default window sizing (see the encode-window fix
above). Pass it via `encodeToFrames`'s `backendOptions`:
`encodeToFrames(file, { backend: cimbarBackend, backendOptions: { frameSize: 256 } })`
(or `{ preferredBackend: 'cimbar', backendOptions: {...} }` in negotiated
mode) — `backendOptions` is forwarded to `backend.encode()` as-is, in
place of `{ maxFragmentLength }`; `qrLtBackend` doesn't understand it, so
this only matters when a `backend`/`preferredBackend` is also set.

**Lowering `frameSize` trades performance for scan reliability, not the
other way round.** Mode B's grid is always 112×112 cells regardless of
`frameSize` (confirmed against libcimbar's own `Conf8x8` config — see
`src/lib/cimb_translator/GridConf.h`), so a smaller `frameSize` renders
that same fixed grid into fewer physical pixels: faster to encode/decode,
but *less* forgiving for a real camera to resolve, not more. Raising it
above 1024 (hardware permitting) is the direction that could actually help
real-camera reliability.

**Frame shape differs.** `Frame` for this backend is rendered pixel data
(`ImageFrame: { data, width, height }`), not a string. `DisplayDriver`
already handles both shapes transparently. `Scanner` needs to be told
explicitly, via `rawFrames: true` in its options, to hand back raw camera
pixels instead of running its QR text-decode worker — pair that with
passing `backend: cimbarBackend` to `StreamDecoder`/`ReceiverSession`;
nothing checks that the two agree:

```ts
import { cimbarBackend, encodeToFrames, DisplayDriver, ReceiverSession } from 'screenferry';

// sending
const driver = new DisplayDriver(encodeToFrames(file, { backend: cimbarBackend }), canvas);

// receiving
const session = new ReceiverSession({ onComplete, onError }, cimbarBackend);
await session.start(video, { rawFrames: true });
```

**Runs on the main thread**, unlike the QR decode path — libcimbar's
encoder owns a WebGL-bound canvas directly (it isn't a pure function you
can call off-thread without transferring that canvas), and this wrapper
keeps the decoder on the main thread too for interface-contract simplicity
(`BackendDecoder.addFrame` is synchronous). Moving either off-thread is
possible future work, not done here.

## Backend negotiation ("fast mode")

Pinning `backend: cimbarBackend` (above) requires both sides to already
agree on it out of band — fine for a controlled setup, awkward for a
general "download this file" flow where you don't know the receiver's
browser in advance. `preferredBackend` solves that: pass it instead of
`backend`, and the sender negotiates automatically.

```ts
import { encodeToFrames, DisplayDriver, NegotiatingReceiverSession } from 'screenferry';

// sending — tries cimbarBackend, falls back to qrLtBackend if unavailable
const driver = new DisplayDriver(encodeToFrames(file, { preferredBackend: 'auto' }), canvas);
driver.start();

// receiving — never told which backend the sender picked
const session = new NegotiatingReceiverSession({
  onBackendResolved: (id) => console.log(`sender is using ${id}`),
  onComplete,
  onError,
});
await session.start(video);
```

**How it works.** There's no return channel (the design has never had
one — see "How it works" above), so the two sides can't literally ask each
other what they support. Instead, the sender always renders a small,
fixed *header frame* as **plain QR** first — regardless of which backend
it then switches to for the data — and repeats it periodically
(`headerIntervalFrames`, default every 10 data frames) so a receiver that
joins mid-stream or missed the first one still picks it up quickly. QR
decoders are universal, so that header is always readable; it tells the
receiver which backend to expect for everything after it.
`NegotiatingReceiverSession` always starts listening in plain-QR mode for
exactly this reason, and switches `Scanner` into `rawFrames` mode itself
the moment it sees a non-`qr-lt` announcement — you never pass `backend`
or `rawFrames` yourself in this mode.

**`preferredBackend` values:**

- `"auto"` — tries `cimbarBackend` (via `probeCimbarAvailable()`, which
  never throws); falls back to `qrLtBackend` if it's not usable here
  (unsupported browser, WASM blocked by CSP, non-browser host). Never
  resolves to `qrBinLtBackend` on its own — see its section above for why.
- `"qr-lt"` / `"qr-bin-lt"` / `"cimbar"` — pin one explicitly, but *still*
  negotiated (still sends the header frame) — useful if you want
  negotiation's receiver-side auto-detection without `"auto"`'s runtime
  capability probe (or, for `"qr-bin-lt"`, without its compatibility
  caveat).

If you don't need any of this — both ends are your own code and you
already know which backend to use — the plain `backend`/`rawFrames`
pinning documented above stays available and skips the header-frame
overhead entirely; `encodeToFrames`/`StreamDecoder`/`ReceiverSession`
never send or expect one.

**UX guidance.** Don't surface backend names to end users. Recommend
something like a "Fast mode" toggle or badge (needs a good camera; falls
back automatically) rather than "Cimbar" or "QR" — the whole point of
negotiation is that nobody using this needs to know backends exist. Call
`probeCimbarAvailable()` yourself ahead of time if you want to decide
whether to even offer that toggle, rather than waiting to find out via
`"auto"`.

**Caveat inherited from `cimbarBackend`:** negotiating *to* Cimbar carries
the same "not yet exercised against the real WASM binary in a browser"
caveat as pinning it directly — see above. The negotiation mechanics
themselves (header frame encode/decode, `NegotiatingStreamDecoder`'s
backend detection and switching, `"auto"`'s fallback logic) are covered by
this project's headless test suite and don't depend on Cimbar actually
working; only the "receiver's camera successfully switches mid-transfer
and decodes real Cimbar frames" path is unverified.

## Browser support

- Requires `getUserMedia`, Web Workers, WebAssembly, and `OffscreenCanvas`-adjacent
  2D canvas APIs — current Chrome, Firefox, Safari, and Edge.
- **Camera permissions** are requested lazily, inside `ReceiverSession.start()`
  / `Scanner.start()` — call it from a user gesture (a button click), not on
  page load, or browsers will block or auto-deny the prompt.
- **Safari** requires a secure context (`https://` or `localhost`) for
  `getUserMedia`, same as other browsers, but is stricter about camera
  access needing to originate from a direct user gesture — test on a real
  device, not just desktop Safari, before shipping.
- The QR decode stack (`zxing-wasm`, with a `jsQR` fallback) runs in a Web
  Worker and its WASM binary is self-hosted (bundled with the package, not
  fetched from a CDN) — nothing about receiving a file requires network
  access. That worker/WASM code is only downloaded when `Scanner`/`ReceiverSession`
  is actually used, so a sender-only integration (just `encodeToFrames`)
  never pays that cost.
- `cimbarBackend` additionally needs `OffscreenCanvas` and a working WebGL
  (or WebGL2) context, and — being a classic (non-ESM) Emscripten build —
  currently only works on the main thread, not inside a Worker. Its ~2MB
  WASM binary is self-hosted the same way and lazy-loaded the same way:
  nothing pays for it unless `cimbarBackend` is actually used.

## Manual testing

Live: **https://lukeafullard.github.io/screenferry/examples/app.html** —
GitHub Pages, deployed from `main`. Also runnable locally: `npm run demo`
builds the library and serves the whole repo on `http://localhost:5500` —
open `http://localhost:5500/examples/app.html`.

`examples/app.html` is a small, unstyled test page covering both backends
and negotiation: a same-device self-test (no camera needed — the fastest
way to check whether a backend works at all on a given browser/device) and
real sender/receiver sections for actual cross-device testing. It also
exposes live tuning controls — `fps`, `fragmentSize`, `scanHz` (see
"Backend negotiation" → speed tuning notes on the page itself), and
`frameSize` for `cimbarBackend` — so you can experiment directly on a
given device rather than editing code. The sender canvas and receiver video
are both resizable (drag the bottom-right corner) and the receiver shows the
camera's actual negotiated resolution live, which matters a lot for Cimbar
(see its tuning notes on the page, and the Cimbar backend section above).
Not part of the published package.

`examples/` also has narrower single-purpose demos from earlier stages
(`sender-demo.html`, `receiver-demo.html`, `loopback-demo.html`,
`scan-worker-check.html`) — same serving instructions, `qrLtBackend` only.

**Maintenance note:** unlike the rest of this repo, `dist/` is committed
(not gitignored) specifically so GitHub Pages — which serves files as-is,
with no build step — can resolve `examples/*.html`'s `../dist/index.js`
imports. It's built output, not source: **after any change under `src/`,
rebuild and recommit it** (`rm -rf dist && npm run build`, then commit
`dist/`), or the live demo silently keeps running the old code with no
error to signal it. Sourcemaps (`dist/**/*.map`) are excluded from git to
keep this manageable — they're still generated on disk and included in
npm publishes, just not committed.

## API stability

The public API is exactly what the package's root export (`import ... from
'screenferry'`) exposes: `encodeToFrames`, `DisplayDriver`, `Scanner`,
`Camera`, `StreamDecoder`, `ReceiverSession`, `IntegrityError`,
`qrLtBackend`, `qrBinLtBackend`, `cimbarBackend`, `NegotiatingStreamDecoder`,
`NegotiatingReceiverSession`, `probeCimbarAvailable`,
`resolvePreferredBackend`, and their associated option/type exports
(`TransferBackend`, `Frame`, `ImageFrame`, `CimbarEncodeOptions`,
`PreferredBackend`, `NegotiatedEncodeOptions`, ...). Internal modules
(anything under `src/codec`, `src/backends`, `src/scan` in the source) are
implementation details and can change in a minor or patch release.
Versioning follows semver strictly from 1.0.0.

## Non-goals

- No server or relay component of any kind — this must work fully offline.
- No RaptorQ fountain codes (patent exposure) — plain Luby Transform only.
- No multi-QR-per-frame tiling in v1/v2 (unresolved patent landscape).

See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the full list and rationale.

## License

MIT © [LukeAFullard](LICENSE)
