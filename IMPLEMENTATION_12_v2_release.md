# Implementation 12 — v2.0.0 Release

**Goal:** ship the multi-backend version.

**Depends on:** Implementation 09, 10, 11 — all complete and individually
tested.

## Steps

1. **Full regression pass:** re-run every Stage 7-style test (unit,
   loopback, fault-injection) for both backends *plus* the negotiation
   path — not just the new Cimbar-specific tests. Confirm the v1 `qr-lt`
   path is provably unchanged in behavior from the outside.

2. **Bump to `2.0.0`.** Technically the old calling convention (no
   `backend` option) still works identically, so this could arguably stay
   backward-compatible — but treat it as a major version anyway, since the
   public conceptual model changed (single-codec library → multi-backend
   library). Communicate this clearly in the CHANGELOG rather than relying
   on the version number alone.

3. **Update the README:** lead with the `"auto"` negotiation story for new
   users; keep the v1 single-backend example available for anyone who wants
   to pin `qr-lt` explicitly (max compatibility/predictability).

4. **Bundle size audit:** confirm the lazy-loading discipline from Stage 8
   still holds — a consumer using only `qr-lt` should download zero Cimbar
   WASM, and vice versa. Measure and document actual download sizes for
   each path in the README.

5. **Manual device-matrix pass covering both backends *and* the
   negotiation/fallback behavior together** — not just each backend in
   isolation. This is the first release where a real device might actually
   negotiate down from Cimbar to QR, and that path deserves direct human
   verification, not just unit-level mocking.

6. **Publish, tag `v2.0.0`,** post-publish smoke test (same discipline as
   Stage 8).

7. **Revisit `PROJECT_PLAN.md`'s "Fit with the Doco family" section.** With
   v2.0.0 stable, integrating into TimeDoco/NoteDoco is now in-scope — but
   define that as a new, separate plan rather than folding it into this one.
