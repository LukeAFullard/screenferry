// Empirically finds the largest bc-ur fountain fragment length (bytes) whose
// rendered UR part string still fits a QR code at version <= 40, ECC L.
// Re-run this (`npm run qr:capacity`) whenever the ECC level, max version,
// or the UR encoding scheme changes, and feed the printed number back into
// src/backends/qr-lt/fountain.ts's DEFAULT_MAX_FRAGMENT_LENGTH.
import { UR, UREncoder } from '@ngraveio/bc-ur';
import { encode as uqrEncode } from 'uqr';

const ECC_LEVEL = 'L';
const MAX_VERSION = 40;

// A large, multi-fragment message exercises realistic multi-part UR
// overhead (scheme + seqNum/seqLength + per-fragment checksum), not just
// the cheaper single-part case. Used only to get a fast starting estimate
// (phase 1 below) -- the real answer comes from the worst-case check.
const SAMPLE_MESSAGE_LENGTH = 200_000;

// A multi-part UR part string is `ur:<type>/<seqNum>-<seqLength>/<bytewords-body>`,
// and the body's CBOR array is `[seqNum, seqLength, messageLength, checksum, fragment]`.
// seqLength grows with file size (more fragments); seqNum grows with
// transfer duration (the fountain encoder cycles forever, so a long-running
// or heavily-retried transfer pushes seqNum past seqLength); messageLength
// grows with file size directly. All three are CBOR unsigned ints whose
// *encoded byte width* jumps at fixed thresholds (24, 256, 65536, ...), and
// seqNum/seqLength are also rendered as plain decimal digits in the URI
// path. A calibration against a small, low-seqNum sample drastically
// understates all of this -- see the regression this replaced, which
// fit real transfers only until seqNum ticked past 23. WORST_CASE_FRAGMENT_COUNT
// / WORST_CASE_SEQNUM comfortably cover any realistic file size
// (WORST_CASE_FRAGMENT_COUNT fragments at ~2KB/fragment is a >100MB file)
// and transfer length (WORST_CASE_SEQNUM frames is >27 hours even at 10fps).
const WORST_CASE_FRAGMENT_COUNT = 50_000;
const WORST_CASE_SEQNUM = 999_999;

function fitsQrVersion(text) {
  try {
    const result = uqrEncode(text.toUpperCase(), { ecc: ECC_LEVEL, maxVersion: MAX_VERSION });
    return { fits: true, version: result.version };
  } catch {
    return { fits: false, version: undefined };
  }
}

function samplePartForFragmentLength(fragmentLength) {
  const message = Buffer.alloc(SAMPLE_MESSAGE_LENGTH, 0xaa);
  const ur = UR.fromBuffer(message);
  const encoder = new UREncoder(ur, fragmentLength);
  // Part length is essentially constant across seqNum *within the same
  // digit-count/CBOR-byte-count band*, so any part after the first is
  // representative of that band -- but not of a much larger transfer, which
  // is exactly what phase 2 below re-checks for real.
  let part = encoder.nextPart();
  for (let i = 0; i < 5; i++) part = encoder.nextPart();
  return part;
}

// Builds a real worst-case-shaped part: a message big enough to actually
// partition into WORST_CASE_FRAGMENT_COUNT fragments of `fragmentLength`
// bytes each (so seqLength and messageLength are realistically large), with
// `firstSeqNum` seeded so the very first `nextPart()` call already has a
// WORST_CASE_SEQNUM-sized seqNum -- without cycling through a huge number of
// parts to get there.
function worstCasePartForFragmentLength(fragmentLength) {
  const message = Buffer.alloc(fragmentLength * WORST_CASE_FRAGMENT_COUNT, 0xaa);
  const ur = UR.fromBuffer(message);
  const encoder = new UREncoder(ur, fragmentLength, WORST_CASE_SEQNUM - 1);
  return encoder.nextPart();
}

// Phase 1: fast binary search over a small, cheap sample to get a good
// starting estimate (this alone is what the old, buggy version of this
// script shipped as the final answer).
let low = 20;
let high = 2500;
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

// Phase 2: starting from that estimate, decrement against the real
// worst-case-shaped part (expensive, so only run near the known-good
// neighborhood from phase 1) until it actually fits.
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
    throw new Error('qr-capacity: worst-case search underflowed below the minimum fragment length');
  }
}

console.log(`ECC level: ${ECC_LEVEL}, max QR version: ${MAX_VERSION}`);
console.log(`Phase 1 (small-sample) estimate: ${estimate} bytes`);
console.log(
  `Phase 2 (worst-case seqNum=${WORST_CASE_SEQNUM}, seqLength=${WORST_CASE_FRAGMENT_COUNT}) safe length: ${safeFragmentLength} bytes (QR version ${safeVersion})`,
);
console.log('Feed this into src/backends/qr-lt/fountain.ts DEFAULT_MAX_FRAGMENT_LENGTH.');
