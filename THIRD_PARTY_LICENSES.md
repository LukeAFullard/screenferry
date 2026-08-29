# Third-party licenses

screenferry itself is MIT licensed (see [`LICENSE`](LICENSE)). This file
covers third-party code vendored directly into the repository (as opposed
to an npm dependency, which carries its own license via `node_modules` and
doesn't need duplicating here).

No third-party code is vendored into this repository today. The libcimbar
(MPL-2.0) WASM build that previously lived at `src/backends/cimbar/vendor/`
was removed along with the Cimbar backend — see `CHANGELOG.md` — so nothing
in this package is under any license other than its own MIT.
