# Implementation 08 — Packaging & v1.0.0 Release

**Goal:** ship a real, installable, documented npm package.

**Depends on:** all prior v1 stages (02–07).

## Steps

1. **Flip `package.json`:** `"private": false`, bump to `1.0.0`, fill in
   `repository`, `homepage`, `bugs`, `keywords` (`qr-code`, `file-transfer`,
   `fountain-code`, `air-gap`, `offline`).

2. **Test-install for real.** `npm pack` + install the tarball into a
   throwaway project, rather than trusting the monorepo/symlink path — this
   catches `exports`-map mistakes (Stage 1) that only surface on a real
   install.

3. **Verify WASM asset packaging:** confirm `zxing-wasm`'s self-hosted
   binary (Stage 5) is included in the published `files` array and resolves
   at runtime from `node_modules`, not a dev-only relative path.

4. **Lazy-load the decode stack:** dynamic `import()` the `Scanner`/
   decode-worker module so a consumer who only needs `encodeToFrames` (a
   pure "sender kiosk" use case) never pays the WASM download cost. Confirm
   this actually code-splits in the built output, not just in source.

5. **README:** real usage examples for `encodeToFrames`/`DisplayDriver` and
   `ReceiverSession`, a short "how it works" paragraph (fountain codes + QR,
   link to `PROJECT_PLAN.md` if published alongside), browser support notes
   (camera permissions, Safari `getUserMedia` quirks), license.

6. **Start a CHANGELOG** (Keep a Changelog format) even at 1.0.0 — future
   consumers, including future integration into TimeDoco/NoteDoco, will
   want it.

7. **Version policy:** semver strictly from 1.0.0. Public API surface is
   exactly what `src/index.ts` exports (Stage 1's locked contract);
   `src/codec`, `src/qr`, `src/scan` internals are not part of the public
   contract and can change without a major bump.

8. **Publish** as `screenferry`. Tag `v1.0.0` in git; attach the manual
   device-matrix results (Stage 7) as release notes — a manual attestation,
   not a CI artifact.

9. **Post-publish smoke test:** install the *published* package (not the
   local working tree) into a fresh scratch project and run the loopback
   example against it — confirms what's actually on the registry works.
