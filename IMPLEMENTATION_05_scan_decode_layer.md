# Implementation 05 — Scan & Decode Layer

**Goal:** capture camera frames and decode QR strings from them, off the
main thread, fast and reliably.

**Depends on:** Implementation 01 (scaffold only — independent of 02–04).

## Steps

1. **Install `zxing-wasm`** (primary decoder, via the `zxing-wasm/reader`
   subpath) and **`jsqr`** (fallback/lightweight path).

2. **Self-host the WASM binary.** `zxing-wasm` defaults to fetching its
   `.wasm` from a jsDelivr CDN. Override with `prepareZXingModule({
   overrides: { locateFile } })` to serve it from this package's own
   `dist/` instead. This matters specifically for screenferry: a
   "no network required" transfer tool silently phoning out to a
   third-party CDN on first use undercuts the whole pitch.

3. **Camera capture** — `src/scan/camera.ts`: wrap
   `getUserMedia({ video: { facingMode: "environment" } })`, attach to a
   hidden `<video>`, expose `grabFrame()` that draws the current frame to an
   offscreen canvas and returns `ImageData`.

4. **Web Worker for decode.** Move the actual decode call (`readBarcodes`
   from `zxing-wasm/reader`, or `jsQR` as fallback) into
   `src/scan/decode.worker.ts`. Main thread only captures frames and posts
   `ImageData` to the worker — never decode on the main thread.

5. **Decode cadence:** don't decode every video frame (video runs ~30fps,
   QR display runs ~10fps — wasteful). Poll at roughly 2x the expected
   display fps as a starting heuristic; make it tunable.

6. **Fallback logic:** try `zxing-wasm` first; if WASM fails to load (e.g.
   host app's CSP blocks it), fall back to `jsqr` automatically with a
   logged warning, not a thrown error — this library will be embedded in
   other apps later, so degrade gracefully rather than failing hard on an
   environment quirk.

7. **Public shape** — `src/scan/index.ts`: a `Scanner` class —
   `start(videoElement)`, `stop()`, `onDecode(callback)`. Keep this
   deliberately separate from `StreamDecoder` (Stage 6), which only knows
   about fountain-part strings, never cameras.

8. **Tests:** CI has no camera, so cover the worker message protocol and the
   fallback-switch logic with mocked inputs. Real camera behavior is
   validated manually (Stage 7's device-matrix notes).

## Design note
`Scanner` (camera-facing) and `StreamDecoder` (data-facing) stay separate
classes on purpose: the data layer stays testable without any browser camera
API, and the camera layer stays swappable (e.g. screen-share frames instead
of a camera, later) without touching decode logic at all.
