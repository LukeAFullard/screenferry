# Project Plan — screenferry

## Scope
Standalone, framework-agnostic, zero-backend TypeScript library for transferring
files between devices via animated 2D barcodes (camera ↔ screen). No network,
no server, no account. Must not depend on React or on TimeDoco/NoteDoco
internals — it is a dependency they will import later, not the other way round.

- **v1** — QR codes + Luby Transform fountain codes (proven, MIT-safe path).
- **v2** — pluggable Cimbar backend for higher throughput, behind the same API.
  **Reverted** (2026-08-29, see "Cimbar removal" below); the backend
  abstraction it forced is kept and now carries `qrBinLtBackend` instead.

## Non-goals (deferred or rejected)
- **RaptorQ** fountain codes — Qualcomm patent exposure. Plain Luby Transform only.
- **Multi-QR-per-frame tiling** — unresolved patent landscape. Revisit only with
  legal review if this ever goes commercial.
- **JABCode backend** — technically strong (ISO standard, patent-free) but the
  JS/npm tooling is too immature to build on today. Revisit post-v2.
- **Cimbar backend** — shipped as v2 and then removed; see "Cimbar removal"
  below. Any future colour/high-density symbology needs real-device
  evidence *before* it goes in, not after.
- **Any server/relay component.** Must work fully offline.

## V1 stages
| # | Stage | Output |
|---|-------|--------|
| 1 | Repo & tooling scaffold | Buildable, tested, empty package | → `IMPLEMENTATION_01` |
| 2 | Fountain codec core | Wrapped bc-ur, envelope, checksum | → `IMPLEMENTATION_02` |
| 3 | QR encode/render layer | nayuki QR generator + canvas/SVG render |
| 4 | Sender pipeline | Public `encodeToFrames()`, animation loop |
| 5 | Scan & decode layer | Camera capture, Web Worker, WASM decoder |
| 6 | Receiver pipeline | Public `StreamDecoder`, progress events |
| 7 | Test harness & CI | Canvas-based loopback tests, no camera needed |
| 8 | Packaging & v1.0.0 | ESM+CJS build, types, README, npm publish |

## V2 stages
| # | Stage | Output |
|---|-------|--------|
| 9 | Codec abstraction refactor | Shared backend interface (QR+LT and Cimbar) |
| 10 | Cimbar backend integration | libcimbar WASM wrapped behind that interface |
| 11 | Backend negotiation/UX | Capability detection, fast-mode toggle, fallback |
| 12 | v2.0.0 release | Published, documented, both backends selectable |
| 13 | Cimbar removal + receiver metrics | Two QR backends only; live transfer-speed callback |

## Cimbar removal (2026-08-29)

Stage 13 removes the Cimbar backend (Stages 10-12) outright. The decision
rests on real-device testing, which is the evidence Stage 10 never had —
its implementation was verified only against headless round trips and a
same-device canvas self-test:

| Backend | iPhone | Android |
|---|---|---|
| `qr-lt` | reliable | reliable |
| `qr-bin-lt` | reliable | reliable, slower |
| `cimbar` | slow | **sender displays, receiver never starts decoding** |

A backend that cannot decode on one of the two platforms it exists to serve
is not an opt-in cost, it is a liability: ~2MB of vendored MPL-2.0 WASM, a
main-thread-only GPU render path, a `rawFrames` capture mode, an
`ImageFrame` type in the public `Frame` union, and a capability probe — all
carried for something that does not work. Removing it collapses the
supported surface to two backends that share one render path, one capture
path, and one frame shape.

What is deliberately **kept**:

- **The backend abstraction** (Stage 9). It earns its place independently —
  `qrBinLtBackend` is a second real backend behind it.
- **Header-frame negotiation** (Stage 11). Its original justification was
  probing for Cimbar, but the surviving justification is stronger: it is the
  only safe way to offer `qr-bin-lt` to a receiver whose library version the
  sender does not control. `"auto"` now resolves straight to `qrLtBackend`
  and is deprecated — there is no capability left to probe.

Stage 13 also adds receiver-side transfer metrics (`onMetrics`: bytes/sec
over a rolling window, elapsed time), since throughput is now the main
axis on which `qr-bin-lt` is chosen over `qr-lt` and it was previously
unmeasurable from outside the library.

`IMPLEMENTATION_10/11/12` are left in place as history — they record what
was built and why, not what is currently true. This section is the record
of the reversal.

## Accessibility & safety

Both backends are, functionally, a controlled strobing pattern: QR frames
alternate black/white at a configurable fps. This carries a real
photosensitive-epilepsy/seizure risk — not hypothetical; it is a known,
upstream-acknowledged risk across this class of technology. Since
screenferry has no UI layer of its own (see Scope), it cannot show a warning
directly — this is a hard requirement on any consumer's integration, not
an optional nicety:
- Surface a warning before the sender's animation is shown, every time.
- Never auto-play the animation without explicit user intent.
- Consider a reduced-fps/reduced-contrast mode for sensitive viewers.
- Weight this into backend selection UX — a higher fps is the main
  throughput lever, and it is also the one that raises this risk.

## Key decisions carried from research
- License: **MIT** for our code, with nothing third-party vendored in as of
  Stage 13 (the MPL-2.0 libcimbar build went with the Cimbar backend). Any
  such code pulled in later stays under its own license at the file level —
  it does not relicense this package.
- Fountain coding: **plain Luby Transform only**, via `@ngraveio/bc-ur`. No RaptorQ.
- QR generation: `nayuki/QR-Code-generator` (MIT, native TS) preferred over the
  `qrcode` npm package — need direct control over version/ECC level.
- Decoding: WASM-first (`zxing-wasm`), JS fallback (`jsQR`), always off the main
  thread (Web Worker).
- No multi-QR-per-frame tiling without a fresh patent check.

## Sequencing rule
Each stage should be fully buildable and testable in isolation before the next
starts. No stage should require guessing at a future stage's API — where a
dependency exists (e.g. Stage 2's fragment size depends on Stage 3's QR
capacity), leave the relevant value configurable rather than hardcoded.

## Fit with the Doco family
Published as its own repo and npm package, versioned independently of
TimeDoco/NoteDoco. Integrating it into either Doco is explicitly out of scope
until v1.0.0 is stable — track that as a future stage, not part of this plan.
