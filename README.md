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
this class of technology, not a hypothetical one.

- Both `qrLtBackend` and `qrBinLtBackend` alternate black/white QR frames at
  a configurable rate (`DisplayDriver`'s `fps` option, default 10fps) —
  monochrome, but still a strobing pattern at a rate that can affect
  sensitive viewers.
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
`TransferBackend` interface is also implemented by `qrBinLtBackend` — the
faster, opt-in byte-mode variant; see its section below.

### Receiving a file

```ts
import { ReceiverSession } from 'screenferry';

const video = document.querySelector('video'); // shows the live camera preview

const session = new ReceiverSession({
  onProgress: (p) => console.log(`~${Math.round(p * 100)}%`), // estimate, not exact
  onMetrics: ({ bytesReceived, totalBytes, bytesPerSecond, elapsedMs }) => {
    // Wall-clock throughput, fired alongside every onProgress.
    console.log(`${(bytesPerSecond / 1024).toFixed(1)} KB/s, ${(elapsedMs / 1000).toFixed(0)}s in`);
    if (totalBytes) {
      const secondsLeft = (totalBytes - bytesReceived) / bytesPerSecond;
      console.log(`~${secondsLeft.toFixed(0)}s remaining`);
    }
  },
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
It also exposes the same `.bytesReceived` / `.totalBytes` counters
`onMetrics` is built from.

**`onProgress` and `onMetrics` answer different questions**, which is why
they're separate callbacks rather than one widened signature:

- `onProgress` is the fountain decoder's own completion *estimate* — a
  redundancy-adjusted heuristic that clamps just short of 1 until the
  transfer actually completes. Right for a progress bar, wrong for
  arithmetic.
- `onMetrics` is real bytes over real milliseconds. `bytesPerSecond` is
  measured over a short trailing window (~2s), not cumulatively: a
  cumulative average never recovers from a stall (one autofocus hunt drags
  it down for the rest of the transfer), which makes it useless for judging
  whether a change you just made is helping. For the final "took N seconds
  at M KB/s" summary, divide `bytesReceived` by `elapsedMs` from the last
  event before `onComplete` — that's the honest cumulative figure, and it's
  why no separate completion-time callback exists.

`bytesReceived`/`totalBytes` count *wire* bytes — the gzipped payload plus
the envelope header, as the backend frames it — so they won't match the
delivered file's size exactly. `totalBytes` is `null` until the first frame
is accepted, since the size travels in the frames themselves.

**Scanning automatically prefers luminance-only capture when it's
available**, for both `qrLtBackend` and `qrBinLtBackend` — no option to set,
this just happens inside `Scanner`. Color carries no information for a QR
decode, so `Camera.grabLumaFrame()` captures only a camera's native
luminance plane (1 byte/pixel, straight off a WebCodecs
`MediaStreamTrackProcessor`) instead of `grabFrame()`'s full `<canvas>`
`drawImage`/`getImageData` RGBA round trip — a real color-processing hop
that was pure waste for a decode that only ever reads grayscale. The decode
worker expands the captured luma plane back to a minimal grayscale RGBA
buffer right before handing it to zxing-wasm/jsQR (neither accepts raw
luminance through its public API), so this only saves the *capture* and
`postMessage` cost, not the decode itself — but capture (a full-resolution
canvas composite) is the more expensive half. Falls back to `grabFrame`'s
canvas/RGBA path automatically wherever the native capture path isn't
available, so this is safe everywhere with no behavior change beyond speed.

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
to `qrBinLtBackend` on its own, even though `qrBinLtBackend` is otherwise a
strict improvement over `qrLtBackend` — a sender on a
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

## Backend negotiation ("fast mode")

Pinning `backend: qrBinLtBackend` (above) requires both sides to already
agree on it out of band — fine for a controlled setup, awkward for a
general "download this file" flow where you don't know what version of this
library the receiver is running. `preferredBackend` solves that: pass it
instead of `backend`, and the sender announces its choice in-band.

```ts
import { encodeToFrames, DisplayDriver, NegotiatingReceiverSession } from 'screenferry';

// sending — announces qr-bin-lt in a plain-QR header frame
const driver = new DisplayDriver(encodeToFrames(file, { preferredBackend: 'qr-bin-lt' }), canvas);
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
`NegotiatingReceiverSession` always starts listening in plain-QR text mode
for exactly this reason, and switches `Scanner` into byte-decode mode
itself the moment it sees a `qr-bin-lt` announcement — you never pass
`backend` or `decodeBytes` yourself in this mode.

**`preferredBackend` values:**

- `"qr-lt"` — the default backend, decodable by every version of this
  library that has ever shipped.
- `"qr-bin-lt"` — the faster byte-mode backend (see its section above).
  Still negotiated: the header frame is what makes it safe to offer to a
  receiver whose library version you don't control. A receiver too old to
  recognize the `qr-bin-lt` id simply keeps waiting rather than misreading
  the data frames.
- `"auto"` — **deprecated.** It resolves straight to `qrLtBackend` and
  cannot do better: both remaining backends run anywhere this library runs,
  so there is no device capability left to probe for, and picking
  `qrBinLtBackend` automatically would risk an older receiver (see above).
  Name the backend you want instead. It stays in the `PreferredBackend`
  union only so existing callers keep compiling.

If you don't need any of this — both ends are your own code and you
already know which backend to use — the plain `backend`/`decodeBytes`
pinning documented above stays available and skips the header-frame
overhead entirely; `encodeToFrames`/`StreamDecoder`/`ReceiverSession`
never send or expect one.

**UX guidance.** Don't surface backend names to end users. Recommend
something like a "Fast mode" toggle or badge rather than "qr-bin-lt" — the
whole point of negotiation is that nobody using this needs to know backends
exist.

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
- Both backends have identical runtime requirements — `qrBinLtBackend` adds
  no WASM, GPU, or browser capability over `qrLtBackend`. Anywhere one
  works, so does the other.

## Manual testing

Live: **https://lukeafullard.github.io/screenferry/examples/app.html** —
GitHub Pages, deployed from `main`. Also runnable locally: `npm run demo`
builds the library and serves the whole repo on `http://localhost:5500` —
open `http://localhost:5500/examples/app.html`.

`examples/app.html` is a small, unstyled test page covering both backends
and negotiation: a same-device self-test (no camera needed — the fastest
way to check whether a backend works at all on a given browser/device) and
real sender/receiver sections for actual cross-device testing. It also
exposes live tuning controls — `fps`, `fragmentSize`, `scanHz`, and decode
worker count (see the speed tuning notes on the page itself) — so you can
experiment directly on a given device rather than editing code, plus a live
throughput readout (KB/s, bytes transferred, and elapsed/remaining time,
wired to `onMetrics`) for comparing the two backends on real hardware. The
sender canvas and receiver video are both resizable (drag the bottom-right corner) and the
receiver shows the camera's actual negotiated resolution live. Not part of
the published package.

`examples/capture-diagnostics.html` checks the **native camera capture
path** specifically, and is worth running on a real device after any change
under `src/scan/`. Nothing else covers it: `app.html`'s self-test and the
whole CI suite fake the camera with `canvas.captureStream()`, which
produces `BGRA` frames and so only ever exercises `Camera`'s canvas/RGBA
*fallback*, while real camera hardware produces `NV12`/`I420` and takes the
native luma path instead. A capture bug that killed real-camera scanning
after two frames once shipped green through every automated test and
through the self-test for exactly this reason. The page reports the
camera's actual pixel format, verifies repeated capture doesn't wedge,
counts leaked `VideoFrame`s, and confirms the `Scanner` pipeline keeps
dispatching and stops cleanly.

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
`qrLtBackend`, `qrBinLtBackend`, `NegotiatingStreamDecoder`,
`NegotiatingReceiverSession`, `resolvePreferredBackend`, and their
associated option/type exports (`TransferBackend`, `Frame`,
`TransferMetrics`, `PreferredBackend`, `NegotiatedEncodeOptions`, ...).
Internal modules
(anything under `src/codec`, `src/backends`, `src/scan` in the source) are
implementation details and can change in a minor or patch release.
Versioning follows semver strictly: removing or renaming anything in that
list is a major bump, which is what 2.0.0 is (see `CHANGELOG.md`).

## Non-goals

- No server or relay component of any kind — this must work fully offline.
- No RaptorQ fountain codes (patent exposure) — plain Luby Transform only.
- No multi-QR-per-frame tiling (unresolved patent landscape).
- No colour/high-density symbologies (the removed Cimbar backend) — see
  `CHANGELOG.md` for why that experiment was reverted.

See [`PROJECT_PLAN.md`](PROJECT_PLAN.md) for the full list and rationale.

## License

MIT © [LukeAFullard](LICENSE)
