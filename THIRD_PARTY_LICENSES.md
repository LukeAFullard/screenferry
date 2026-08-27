# Third-party licenses

screenferry itself is MIT licensed (see [`LICENSE`](LICENSE)). This file
covers third-party code vendored directly into the repository (as opposed
to an npm dependency, which carries its own license via `node_modules` and
doesn't need duplicating here).

## libcimbar (MPL-2.0)

`src/backends/cimbar/vendor/cimbar.js` and
`src/backends/cimbar/vendor/cimbar.wasm` are the official reproducible WASM
build of [libcimbar](https://github.com/sz3/libcimbar), used unmodified
(only renamed, dropping the upstream build's timestamp from the filename)
as the v2 Cimbar backend's encoder/decoder.

- **Source:** https://github.com/sz3/libcimbar
- **License:** Mozilla Public License 2.0 — full text vendored alongside the
  binaries at `src/backends/cimbar/vendor/LICENSE-MPL-2.0`.
- **Version:** [v0.6.8](https://github.com/sz3/libcimbar/releases/tag/v0.6.8)
  ("reproducible wasm build")
- **Downloaded from:**
  `https://github.com/sz3/libcimbar/releases/download/v0.6.8/cimbar.wasm.tar.gz`
- **Tarball SHA-256:**
  `0a14b63decd9404e7a319b4b0f5cd873eb6aa325f90df4e965305f523567c4a5`

Per the MPL-2.0's file-level copyleft, only these two vendored files (and
this notice) are covered — pulling them in does not relicense the rest of
this MIT-licensed package. See `PROJECT_PLAN.md`'s "Key decisions carried
from research" for the project's licensing stance on this.

Only `cimbar.js`/`cimbar.wasm` (the WASM binary and its Emscripten glue
script) were vendored — the release tarball also ships a full reference web
app (`send.js`, `recv.js`, `main.js`, HTML, service workers, etc.) that this
project does not use; `src/backends/cimbar/index.ts` is an independent
wrapper written against the same WASM ABI, calling it directly rather than
reusing that reference app's JS.
