# Implementation 03 — QR Encode/Render Layer

**Goal:** turn fountain-encoded fragment strings (Stage 2) into rendered,
camera-scannable QR codes, with empirically validated capacity/ECC settings.

**Depends on:** Implementation 02.

## Steps

1. **Install `uqr`** (MIT, zero-dependency, tree-shakable). It returns a raw
   2D boolean module array plus `version`/`size` — exactly what a custom
   canvas renderer needs, and it decouples rendering from the encoding
   library entirely. Note `nayuki-qr-code-generator` (MIT) as a fallback if
   finer segment-mode control is ever needed.

2. **Build the renderer** — `src/qr/render.ts`:
   `renderQrToCanvas(text: string, canvas: HTMLCanvasElement, opts)`. Use
   `uqr`'s `encode()` output and draw one filled rect per module. No
   anti-aliasing — crisp module edges matter for camera decode.

3. **Default ECC level: `L`** (~7% tolerance), not the common default `M`/`Q`.
   Rationale (already logged in `PROJECT_PLAN.md`): fountain codes already
   tolerate whole-frame loss, so spending capacity on per-frame redundancy is
   wasted — maximizing payload-per-frame matters more here.

4. **Capacity discovery script.** For ECC `L`, find the largest fragment
   length (bytes) that still fits QR version ≤ 20 (higher versions get too
   dense to read reliably at typical laptop-screen-to-phone-camera range).
   Feed this number back into Stage 2's `maxFragmentLength` default.

5. **Scanability constraints:** minimum 4-module quiet zone, pure black/white
   only (no branding/theming inside the code), configurable `moduleSizePx`.

6. **Frame content = the raw UR part string from Stage 2, unmodified.**
   No extra wrapping needed. Prefer QR alphanumeric mode where the part
   string's charset allows it (denser than byte mode); fall back to byte
   mode transparently otherwise.

7. **Unit tests:** render known strings, decode them back with `jsqr`
   (installed here as a dev-only sanity check, ahead of Stage 5) to catch
   encode/decode mismatches immediately rather than at Stage 6.

8. **No animation timing here** — that's Stage 4. This stage only proves
   "string in → correct, scannable QR out."

## Out of scope for this stage
Timing, looping, camera, decoding pipeline. Just encode-to-pixels.
