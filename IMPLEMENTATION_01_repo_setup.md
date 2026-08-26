# Implementation 01 — Repo & Tooling Scaffold

**Goal:** a buildable, linted, tested, empty-but-structured TypeScript package.
No feature logic yet — this stage is pure scaffolding.

**Depends on:** nothing (first stage).

## Steps

1. **Init repo**
   `npm init -y`, then set: `"name": "screenferry"`, `"private": true`
   (flip to `false` in Stage 8), `"license": "MIT"`, `"type": "module"`.

2. **Directory structure**
   ```
   src/
     index.ts     # public API surface — stubs only, filled in later stages
     codec/       # fountain codec — Stage 2
     qr/          # QR generation/rendering — Stage 3
     scan/        # camera + decode — Stage 5
   test/
   examples/
   ```

3. **TypeScript config**
   Add `tsconfig.json`: `strict: true`, `target: "ES2020"`,
   `module: "ESNext"`, `moduleResolution: "Bundler"`, `declaration: true`.
   Install `typescript` as a devDependency.

4. **Build tooling — Vite library mode**
   Install `vite`, `vite-plugin-dts`.
   In `vite.config.ts`: `build.lib` with `entry: src/index.ts`,
   `formats: ["es", "cjs"]`. Add the `dts` plugin so `.d.ts` files land in `dist/`.
   Don't externalize dependencies yet — bundle everything for now; revisit only
   if bundle size becomes a real problem later.

5. **package.json exports map**
   Add `"main"`, `"module"`, `"types"`, and an `"exports"` field pointing at the
   `dist/` ESM, CJS, and type outputs.

6. **Lint/format**
   Install `eslint`, `@typescript-eslint/*`, `prettier`. Minimal flat config —
   no framework-specific rules, this package has no React/JSX.

7. **Test runner**
   Install `vitest`. Add a `test` script. Add one placeholder test
   (`test/smoke.test.ts`) asserting `1 + 1 === 2` to confirm the runner works
   end to end before any real code exists.

8. **CI**
   Add `.github/workflows/ci.yml`: on push/PR, run `npm ci`, then
   `typecheck`, `lint`, `test`, `build` in that order. Mirror the workflow
   pattern already used in the NoteDoco repo's `.github/workflows` for
   consistency across the family of tools.

9. **Public API stub**
   In `src/index.ts`, export **type signatures only** — no implementation.
   This locks the contract before internals exist, so later stages build
   *to* it rather than discovering it ad hoc:
   ```ts
   export function encodeToFrames(file: Blob, opts?: EncodeOptions): AsyncIterable<string>;
   export class StreamDecoder {
     addFrame(data: string): void;
     get progress(): number;
     get isComplete(): boolean;
     getResult(): Promise<Blob>;
   }
   ```

10. **README skeleton**
    Title "screenferry", one-paragraph description, a
    "Status: pre-release, API unstable" banner, license badge.

11. **Verify stage complete**
    - `npm run build` produces `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`.
    - `npm test` passes.
    - CI runs green on a throwaway commit or PR.

## Explicitly out of scope for this stage
No fountain codec, no QR rendering, no camera code, no real logic in
`encodeToFrames`/`StreamDecoder` beyond the type signatures. Anything beyond
scaffolding belongs in Stage 2 onward.
