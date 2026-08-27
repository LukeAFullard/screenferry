# Project Plan — screenferry

## Scope
Standalone, framework-agnostic, zero-backend TypeScript library for transferring
files between devices via animated 2D barcodes (camera ↔ screen). No network,
no server, no account. Must not depend on React or on TimeDoco/NoteDoco
internals — it is a dependency they will import later, not the other way round.

- **v1** — QR codes + Luby Transform fountain codes (proven, MIT-safe path).
- **v2** — pluggable Cimbar backend for higher throughput, behind the same API.

## Non-goals (deferred or rejected)
- **RaptorQ** fountain codes — Qualcomm patent exposure. Plain Luby Transform only.
- **Multi-QR-per-frame tiling** — unresolved patent landscape. Revisit only with
  legal review if this ever goes commercial.
- **JABCode backend** — technically strong (ISO standard, patent-free) but the
  JS/npm tooling is too immature to build on today. Revisit post-v2.
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

## Accessibility & safety

Both backends are, functionally, a controlled strobing pattern: QR frames
alternate black/white at a configurable fps; Cimbar (v2) alternates *color*
patterns, typically at a higher rate, for higher throughput. This carries a
real photosensitive-epilepsy/seizure risk — not hypothetical: libcimbar's
own upstream added an explicit epilepsy/seizure warning to its reference
encoder (v0.6.8, upstream issue #186) for exactly this reason. Since
screenferry has no UI layer of its own (see Scope), it cannot show a warning
directly — this is a hard requirement on any consumer's integration, not
an optional nicety:
- Surface a warning before the sender's animation is shown, every time.
- Never auto-play the animation without explicit user intent.
- Consider a reduced-fps/reduced-contrast mode for sensitive viewers.
- Weight this into backend selection/negotiation UX (Stage 11) — a
  consumer may want to default away from Cimbar's color strobing even when
  it's the faster option.

## Key decisions carried from research
- License: **MIT** for our code. Any MPL-2.0 code pulled in later (libcimbar)
  stays MPL-2.0 at the file level — does not relicense this package.
- Fountain coding: **plain Luby Transform only**, via `@ngraveio/bc-ur`. No RaptorQ.
- QR generation: `nayuki/QR-Code-generator` (MIT, native TS) preferred over the
  `qrcode` npm package — need direct control over version/ECC level.
- Decoding: WASM-first (`zxing-wasm`), JS fallback (`jsQR`), always off the main
  thread (Web Worker).
- No multi-QR-per-frame tiling in v1 or v2 without a fresh patent check.

## Sequencing rule
Each stage should be fully buildable and testable in isolation before the next
starts. No stage should require guessing at a future stage's API — where a
dependency exists (e.g. Stage 2's fragment size depends on Stage 3's QR
capacity), leave the relevant value configurable rather than hardcoded.

## Fit with the Doco family
Published as its own repo and npm package, versioned independently of
TimeDoco/NoteDoco. Integrating it into either Doco is explicitly out of scope
until v1.0.0 is stable — track that as a future stage, not part of this plan.
