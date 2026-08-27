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
  behind it; `cimbarBackend` does not — this repo's headless test harness
  has no WebGL or camera available to exercise it against. It has been
  written against libcimbar's own reference implementation but **not
  verified against the real WASM binary in an actual browser.** Treat it as
  experimental until someone has smoke-tested it on real devices.
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

## API stability

The public API is exactly what the package's root export (`import ... from
'screenferry'`) exposes: `encodeToFrames`, `DisplayDriver`, `Scanner`,
`Camera`, `StreamDecoder`, `ReceiverSession`, `IntegrityError`,
`qrLtBackend`, `cimbarBackend`, and their associated option/type exports
(`TransferBackend`, `Frame`, `ImageFrame`, `CimbarEncodeOptions`, ...).
Internal modules (anything under `src/codec`, `src/backends`, `src/scan` in
the source) are implementation details and can change in a minor or patch
release. Versioning follows semver strictly from 1.0.0.

## Non-goals

- No server or relay component of any kind — this must work fully offline.
- No RaptorQ fountain codes (patent exposure) — plain Luby Transform only.
- No multi-QR-per-frame tiling in v1/v2 (unresolved patent landscape).

See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the full list and rationale.

## License

MIT © [LukeAFullard](LICENSE)
