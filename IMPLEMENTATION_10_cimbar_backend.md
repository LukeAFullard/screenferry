# Implementation 10 — Cimbar Backend Integration (v2)

**Goal:** implement the `TransferBackend` interface (Stage 9) using
libcimbar's WASM build, as an opt-in high-throughput alternative.

**Depends on:** Implementation 09.

## Steps

1. **Depend on libcimbar's WASM encoder/decoder build** (MPL-2.0). This is
   a dependency, not a fork, so no relicensing question — but keep its
   license notice/attribution in `THIRD_PARTY_LICENSES.md` per the
   licensing note in `PROJECT_PLAN.md`.

2. **Wrap it as `src/backends/cimbar/`**, implementing `encode`/
   `createDecoder` against the Stage 9 interface. `Frame` here is image
   data (a rendered Cimbar symbol), not a string — the sender's
   `DisplayDriver` (Stage 4) needs a small adjustment to draw arbitrary
   `ImageData`/canvas content, not just QR module grids. Confirm this
   doesn't break the `qr-lt` backend's rendering path.

3. **Decode-side:** libcimbar's own WASM decoder replaces `zxing-wasm`/
   `jsqr` entirely for this backend (they're QR-specific). `Scanner`
   (Stage 5) needs a pluggable decode-function slot rather than being
   hardcoded to QR decoders.

4. **Reuse Stage 2's envelope/checksum format unchanged.** Integrity
   verification (SHA-256, filename/mimetype metadata) is backend-agnostic —
   don't duplicate it per backend.

5. **Re-run Stage 7's fault-injection matrix against this backend.**
   Cimbar bundles its own fountain coding (wirehair, not LT) — don't assume
   Stage 2's LT-specific resilience assumptions carry over; verify fresh.

6. **Document the trade-off plainly in the README:** higher throughput but
   less battle-tested, more sensitive to camera/screen color accuracy,
   larger WASM payload (encoder + decoder both load). This is why it stays
   opt-in, not the default.

7. **Manual device-matrix pass** specifically for Cimbar (same structure as
   Stage 7's) — its optical requirements (color accuracy) differ
   meaningfully from QR's black/white requirements.
