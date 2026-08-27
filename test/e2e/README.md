# End-to-end loopback harness

`test/e2e/loopback.ts` drives the real sender → render → scan → receiver
pipeline in Node, camera-free:

```
encodeToFrames()  →  computeQrModules() + rasterizeQrModules()  →  jsQR  →  StreamDecoder
   (Stage 4)              (Stage 3's headless raster path)      (scan)      (Stage 6)
```

`rasterizeQrModules` computes the exact same pixels `renderQrToCanvas` would
draw to an `HTMLCanvasElement`/`OffscreenCanvas` — it's the same module
computation and the same "one block per dark module, no anti-aliasing" fill,
just without needing a real canvas implementation in a Node test process.

Deliberately **not** covered here — that's the point:

- **Stage 5's scan stack** (`zxing-wasm`, the decode Web Worker, the
  jsQR fallback path) — this harness always decodes with `jsQR` directly,
  skipping the worker and WASM entirely, because this suite tests the *data
  protocol* (fountain coding + framing), not the scan stack. Worker
  protocol and fallback-switch logic are covered separately in
  `test/scan/decode-logic.test.ts`.
- **Camera capture** — `getUserMedia`, `Camera`, `Scanner`. See
  `examples/loopback-demo.html` for a browser-based (still camera-free, via
  a captured canvas stream) exercise of the real `Scanner`/`ReceiverSession`
  API, and `examples/receiver-demo.html` for real-hardware manual testing.

## What's NOT covered here, at all

Testing the *protocol* separately from the *optics* is deliberate —
conflating them makes failures hard to diagnose, since a dropped frame from
bad camera focus looks identical, at the data layer, to one dropped on
purpose. None of the following is automatable in CI, and none of it is
covered by this harness or any other automated test in this repo:

- Real camera autofocus, exposure, and motion blur.
- Real screen brightness, refresh rate, and screen/camera moiré interaction.
- Cross-device timing variance (slow phones, background app throttling).

**A manual device-matrix pass is required before tagging a release** — e.g.
2 Android phones + 1 iPhone, each scanning off 2 different laptop screens,
at a couple of real-world distances and lighting conditions. Track results
as a manual attestation (release notes), not a CI artifact.

## Running

- `npm run test:e2e` — this suite only. Separate from `npm test` (the fast
  unit suite) because full render+scan cycles per frame are meaningfully
  slower than the pure-codec unit tests; keeping them apart means the fast
  suite stays fast for local iteration.
- `fault-injection.test.ts` — drop / duplicate / reorder frames individually
  and in combination, plus a sustained total-loss-then-recovery scenario.
- `reliability-matrix.test.ts` — a small grid of file size × drop rate ×
  QR ECC level, asserting correct reconstruction in every cell. A
  correctness check, not a benchmark — kept small enough to run in seconds.
- `performance.test.ts` — a regression trip-wire: reconstructs a
  fixed-size file at 0% loss and asserts it stays under a generous time
  ceiling. Real throughput tuning happens on real devices, not in CI.
