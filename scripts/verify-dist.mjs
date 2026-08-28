// Smoke-tests the actual built `dist/index.js` — not `src/` via vitest's
// dev-mode bundler. This exists because of a real bug that slipped past the
// full unit/e2e suite: `qrBinLtBackend` deep-imports `FountainEncoder`/
// `FountainDecoder` as default exports from `@ngraveio/bc-ur`'s internal
// CJS files, and Vite/Rollup's *production* build's CJS interop resolved
// that default import to the whole raw module object instead of the class
// (`new FountainEncoder(...)` threw `TypeError: ... is not a constructor`)
// — a bundler-interop difference vitest's dev-mode (esbuild-based) bundler
// doesn't reproduce, so every test passed while the shipped build was
// broken. Run automatically after every `npm run build` (see package.json's
// `postbuild` script) so a regression here fails the build, not a user's
// browser.
import assert from 'node:assert/strict';

const { qrLtBackend, qrBinLtBackend, encodeToFrames, StreamDecoder } =
  await import('../dist/index.js');

async function roundTrip(backend, label) {
  const bytes = new TextEncoder().encode(`verify-dist ${label} round trip payload`.repeat(50));
  const file = new File([bytes], `${label}.bin`, { type: 'application/octet-stream' });

  const decoder = new StreamDecoder(backend);
  let attempts = 0;
  for await (const frame of encodeToFrames(file, { backend })) {
    decoder.addFrame(frame);
    attempts++;
    if (decoder.isComplete || attempts > 2000) break;
  }

  assert.ok(decoder.isComplete, `${label}: did not complete within ${attempts} frames`);
  const result = await decoder.getResult();
  const resultBytes = new Uint8Array(await result.arrayBuffer());
  assert.deepEqual(resultBytes, bytes, `${label}: round-tripped bytes did not match`);
  console.log(`verify-dist: ${label} OK (${attempts} frames)`);
}

await roundTrip(qrLtBackend, 'qr-lt');
await roundTrip(qrBinLtBackend, 'qr-bin-lt');

console.log('verify-dist: all backends round-tripped successfully against the built dist/index.js');
