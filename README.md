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
defaulting to `qrLtBackend` (QR codes + Luby Transform fountain codes) —
today's only backend, but the same `TransferBackend` interface a future
Cimbar backend will implement. Omitting it is equivalent to passing
`qrLtBackend` explicitly.

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

## API stability

The public API is exactly what the package's root export (`import ... from
'screenferry'`) exposes: `encodeToFrames`, `DisplayDriver`, `Scanner`,
`Camera`, `StreamDecoder`, `ReceiverSession`, `IntegrityError`, `qrLtBackend`,
and their associated option/type exports (including the `TransferBackend`
interface, ahead of a pluggable v2 Cimbar backend). Internal modules
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
