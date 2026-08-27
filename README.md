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

## Cimbar backend (v2, opt-in)

`cimbarBackend` wraps [libcimbar](https://github.com/sz3/libcimbar)'s
official WASM build (MPL-2.0, vendored — see
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md)) behind the same
`TransferBackend` interface as `qrLtBackend`, trading QR's black-and-white
frames for denser color-based ones.

**Read this before reaching for it:**

- **Higher throughput, far less battle-tested.** `qrLtBackend` has this
  project's full loopback/fault-injection/reliability-matrix test suite
  behind it; `cimbarBackend` does not. It's been partially — not
  fully — verified in a real browser (headless Chromium, software-rendered
  WebGL via `swiftshader`, no real GPU or camera): the WASM module loads,
  the encoder genuinely binds a WebGL context and renders, `gl.readPixels`
  reads real (non-blank) frame data back, and the decoder's WASM calls run
  without crashing. What that session did **not** confirm: a full transfer
  actually completing. At the default 1024×1024 `frameSize`, each frame
  took long enough under *software* rendering that a full multi-frame
  transfer didn't finish in over two minutes (`swiftshader`-specific —
  `GL Driver Message: GPU stall due to ReadPixels` on every frame — a real
  GPU should be dramatically faster, but that's not yet confirmed on real
  hardware). At `frameSize: 64` the same pipeline rendered each frame in
  tens of milliseconds, confirming the slowdown scales with resolution
  rather than indicating a hang. Whether the *pixel content* is actually
  correct (not just non-blank) hasn't been checked — that needs an actual
  camera round-trip. Treat it as experimental until someone has
  smoke-tested a full transfer, at the real 1024×1024 size, on real
  hardware with a real GPU and camera. `examples/app.html`'s "Self-test"
  section (backend dropdown → "Run self-test") is the fastest way to check
  this on a given device — no second device or camera needed.
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
per frame, versus `qrLtBackend`'s ~580-byte QR fragment — the throughput
gain is real, on the order of 10x per frame, when it works.

`CimbarEncodeOptions.frameSize` lets you render at a resolution other than
the 1024×1024 default (useful for the performance testing above), but only
if you call `cimbarBackend.encode()` directly — `encodeToFrames`/
`encodeFileToParts` don't currently thread backend-specific options through
`opts.backend`, only `maxFragmentLength`. A known gap, not by design.

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
  (unsupported browser, WASM blocked by CSP, non-browser host).
- `"qr-lt"` / `"cimbar"` — pin one explicitly, but *still* negotiated
  (still sends the header frame) — useful if you want negotiation's
  receiver-side auto-detection without `"auto"`'s runtime capability
  probe.

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

`npm run demo` builds the library and serves the whole repo on
`http://localhost:5500` — open `http://localhost:5500/examples/app.html`
for a small, unstyled test page covering both backends and negotiation:
a same-device self-test (no camera needed — the fastest way to check
whether a backend works at all on a given browser/device) and real
sender/receiver sections for actual cross-device testing. Not part of the
published package.

`examples/` also has narrower single-purpose demos from earlier stages
(`sender-demo.html`, `receiver-demo.html`, `loopback-demo.html`,
`scan-worker-check.html`) — same serving instructions, `qrLtBackend` only.

## API stability

The public API is exactly what the package's root export (`import ... from
'screenferry'`) exposes: `encodeToFrames`, `DisplayDriver`, `Scanner`,
`Camera`, `StreamDecoder`, `ReceiverSession`, `IntegrityError`,
`qrLtBackend`, `cimbarBackend`, `NegotiatingStreamDecoder`,
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
