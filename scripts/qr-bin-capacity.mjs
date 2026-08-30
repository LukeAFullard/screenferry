// Empirically finds the largest raw-fountain-part fragment length (bytes)
// whose byte-mode-encoded QR code still fits within QR version <= 40, ECC L
// — the byte-mode analogue of qr-capacity.mjs (see that file's comments for
// why this needs a worst-case check, not just a small-sample one).
// Re-run this (`npm run qr-bin:capacity`) whenever the ECC level, max
// version, or the fountain part's CBOR shape changes, and feed the printed
// number back into src/backends/qr-bin-lt/fountain.ts's
// DEFAULT_MAX_FRAGMENT_LENGTH and DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED.
//
// Unlike qr-lt's UR part strings, a raw fountain part here has no bytewords
// text encoding (2 chars/byte) and no `ur:type/seqNum-seqLength/` URI
// wrapper — it's `FountainEncoderPart.cbor()`'s raw CBOR bytes, rendered
// directly as byte-mode QR data. `createRequire` is used (rather than a
// static import) because this is a plain Node script, not run through
// Vite/Rollup's CJS interop — the deep `dist/fountainEncoder.js` import has
// no `exports.default` special-casing under Node's own ESM loader.
import { createRequire } from 'module';
import { encode as uqrEncode } from 'uqr';

const require = createRequire(import.meta.url);
const FountainEncoder = require('@ngraveio/bc-ur/dist/fountainEncoder.js').default;

const ECC_LEVEL = 'L';
const MAX_VERSION = 40;

const SAMPLE_MESSAGE_LENGTH = 200_000;
const WORST_CASE_FRAGMENT_COUNT = 50_000;
const WORST_CASE_SEQNUM = 999_999;

function fitsQrVersion(bytes) {
  try {
    const result = uqrEncode(Array.from(bytes), { ecc: ECC_LEVEL, maxVersion: MAX_VERSION });
    return { fits: true, version: result.version };
  } catch {
    return { fits: false, version: undefined };
  }
}

function samplePartForFragmentLength(fragmentLength) {
  const message = Buffer.alloc(SAMPLE_MESSAGE_LENGTH, 0xaa);
  const encoder = new FountainEncoder(message, fragmentLength);
  let part;
  for (let i = 0; i < 5; i++) part = encoder.nextPart();
  return part.cbor();
}

function worstCasePartForFragmentLength(fragmentLength) {
  const message = Buffer.alloc(fragmentLength * WORST_CASE_FRAGMENT_COUNT, 0xaa);
  const encoder = new FountainEncoder(message, fragmentLength, WORST_CASE_SEQNUM - 1);
  return encoder.nextPart().cbor();
}

function worstCaseChunkedPartForFragmentLength(fragmentLength) {
  const cbor = worstCasePartForFragmentLength(fragmentLength);
  const tagged = new Uint8Array(cbor.length + 1);
  tagged[0] = 254;
  tagged.set(cbor, 1);
  return tagged;
}

// Phase 1: fast binary search over a small, cheap sample.
let low = 20;
let high = 3000;
let estimate = low;

while (low <= high) {
  const mid = Math.floor((low + high) / 2);
  const { fits } = fitsQrVersion(samplePartForFragmentLength(mid));

  if (fits) {
    estimate = mid;
    low = mid + 1;
  } else {
    high = mid - 1;
  }
}

// Phase 2: decrement from that estimate against the real worst-case-shaped
// part until it actually fits.
let safeFragmentLength = estimate;
let safeVersion = 0;
for (;;) {
  const { fits, version } = fitsQrVersion(worstCasePartForFragmentLength(safeFragmentLength));
  if (fits) {
    safeVersion = version;
    break;
  }
  safeFragmentLength--;
  if (safeFragmentLength < 20) {
    throw new Error(
      'qr-bin-capacity: worst-case search underflowed below the minimum fragment length',
    );
  }
}

// Phase 2 (chunked): decrement against the 1-byte chunk-tagged worst-case part until it fits.
let safeFragmentLengthChunked = safeFragmentLength;
let safeVersionChunked = 0;
for (;;) {
  const { fits, version } = fitsQrVersion(
    worstCaseChunkedPartForFragmentLength(safeFragmentLengthChunked),
  );
  if (fits) {
    safeVersionChunked = version;
    break;
  }
  safeFragmentLengthChunked--;
  if (safeFragmentLengthChunked < 20) {
    throw new Error(
      'qr-bin-capacity: chunked worst-case search underflowed below the minimum fragment length',
    );
  }
}

console.log(`ECC level: ${ECC_LEVEL}, max QR version: ${MAX_VERSION}`);
console.log(`Phase 1 (small-sample) estimate: ${estimate} bytes`);
console.log(
  `Phase 2 (worst-case seqNum=${WORST_CASE_SEQNUM}, seqLength=${WORST_CASE_FRAGMENT_COUNT}) safe length: ${safeFragmentLength} bytes (QR version ${safeVersion})`,
);
console.log(
  `Phase 2 (chunked 1-byte tagged worst-case seqNum=${WORST_CASE_SEQNUM}, seqLength=${WORST_CASE_FRAGMENT_COUNT}) safe length: ${safeFragmentLengthChunked} bytes (QR version ${safeVersionChunked})`,
);
console.log(
  'Feed these into src/backends/qr-bin-lt/fountain.ts DEFAULT_MAX_FRAGMENT_LENGTH and DEFAULT_MAX_FRAGMENT_LENGTH_CHUNKED.',
);
