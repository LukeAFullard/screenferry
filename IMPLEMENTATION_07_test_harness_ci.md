# Implementation 07 — Test Harness & CI

**Goal:** an automated, camera-free way to validate the full sender→receiver
pipeline under realistic loss/corruption conditions, wired into CI.

**Depends on:** Implementation 04, 06.

## Steps

1. **Build `test/e2e/loopback.ts`:** drive Stage 4's `encodeToFrames`,
   render each with Stage 3's renderer to an `OffscreenCanvas`, decode with
   `jsqr` directly against the canvas's `ImageData` (skip `zxing-wasm`/
   camera/worker entirely here — this harness tests the *data protocol*,
   not the scan stack, and needs to run fast in CI), feed results into
   Stage 6's `StreamDecoder`.

2. **Fault injection:** wrap the loop with configurable fault modes —
   drop frames at a given rate, duplicate frames, reorder frames, and one
   test simulating sustained near-total loss followed by recovery, to
   confirm the fountain coding genuinely tolerates loss rather than merely
   happening to work in the happy path.

3. **Reliability matrix:** run the loopback across a small grid of
   {file size} × {drop rate} × {ECC level} — e.g. 10 KB / 1 MB / 10 MB ×
   0% / 10% / 30% drop × L / M — and assert correct reconstruction in every
   cell. Keep it small enough to run in seconds; this is a correctness
   check, not a benchmark.

4. **Performance smoke test** (separate from correctness): time full
   reconstruction of a fixed-size file at a fixed simulated frame rate with
   0% loss, assert it stays under a generous ceiling. This is a regression
   trip-wire — real throughput tuning happens on real devices, not in CI.

5. **Wire into `.github/workflows/ci.yml`** as `npm run test:e2e`, separate
   from fast unit tests so a slower e2e run doesn't block quick local
   iteration.

6. **Document what this harness deliberately doesn't cover**
   (`test/e2e/README.md`): real camera autofocus/exposure/motion blur, real
   screen brightness/refresh-rate interaction, cross-device timing
   variance. State plainly that a manual device-matrix pass (e.g. 2 Android
   phones + 1 iPhone, scanning off 2 different laptop screens) is required
   before tagging a release — not automatable, out of scope for CI.

## Design note
Testing the *protocol* (fountain + framing) separately from the *optics*
(camera/lighting/focus) is deliberate. Conflating them makes failures hard
to diagnose — a dropped frame from bad camera focus looks identical, at the
data layer, to one dropped on purpose.
