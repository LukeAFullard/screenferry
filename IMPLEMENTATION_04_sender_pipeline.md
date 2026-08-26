# Implementation 04 — Sender Pipeline

**Goal:** wire Stage 2 (fountain encoder) + Stage 3 (QR renderer) into the
public `encodeToFrames()` API and a display/animation loop, with tunable
timing.

**Depends on:** Implementation 02, 03.

## Steps

1. **Implement `encodeToFrames(file, opts)`** in `src/index.ts`: read the
   `Blob` into `Uint8Array`, build the envelope (Stage 2), create the
   fountain encoder, and yield the raw **part strings** — not rendered
   pixels. Keep this layer UI-agnostic; rendering is the caller's choice
   (canvas, `<img>`, anything), consistent with "no React dependency."

2. **Add a `DisplayDriver` helper** (separate from the core API): takes an
   `AsyncIterable<string>`, renders each with Stage 3's `renderQrToCanvas`,
   and drives timing with `requestAnimationFrame`, not `setInterval` — timer
   drift under `setInterval` compounds badly over a multi-minute transfer.

3. **Expose `fps`** (default 10). Fountain codes are rateless, so the sender
   can loop/generate new parts indefinitely — let the caller decide when to
   stop (receiver-side completion signal, or a fixed duration default when
   there's no feedback channel at all).

4. **Pause on tab hide:** stop the `requestAnimationFrame` loop on
   `document.visibilitychange` (hidden), resume automatically when visible —
   avoids burning CPU/battery when nobody's looking at the screen.

5. **Progress telemetry:** emit `onFrameSent(index)`. Document clearly that
   this is a frame count, not completion percentage — the sender has no way
   to see the receiver's actual progress.

6. **Unit tests:** verify `encodeToFrames` yields valid, decodable strings
   across file sizes (1 KB, 100 KB, 5 MB), headless — no DOM/canvas calls in
   this test file. Canvas rendering is exercised separately in Stage 7.

7. **Manual smoke test only** at this stage (no receiver exists yet):
   `examples/sender-demo.html` renders to an on-screen canvas; visually
   confirm the animation cycles cleanly.

## Design note
No feedback channel by design — this is intentionally one-way, camera-only.
A bidirectional/acknowledged protocol is a different, larger project; don't
let it creep in here.
