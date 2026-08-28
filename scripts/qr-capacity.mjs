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
// the cheaper single-part case.
const SAMPLE_MESSAGE_LENGTH = 200_000;

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
  // Part length is essentially constant across seqNum for a fixed fragment
  // length, so any part after the first (which sometimes differs slightly
  // in seqNum digit count) is representative. Take a part from partway
  // through the sequence.
  let part = encoder.nextPart();
  for (let i = 0; i < 5; i++) part = encoder.nextPart();
  return part;
}

let low = 20;
let high = 2500;
let bestFragmentLength = low;
let bestVersion = 0;

// Binary search the largest fragment length that still fits.
while (low <= high) {
  const mid = Math.floor((low + high) / 2);
  const part = samplePartForFragmentLength(mid);
  const { fits, version } = fitsQrVersion(part);

  if (fits) {
    bestFragmentLength = mid;
    bestVersion = version;
    low = mid + 1;
  } else {
    high = mid - 1;
  }
}

console.log(`ECC level: ${ECC_LEVEL}, max QR version: ${MAX_VERSION}`);
console.log(
  `Largest fragment length that fits: ${bestFragmentLength} bytes (QR version ${bestVersion})`,
);
console.log('Feed this into src/backends/qr-lt/fountain.ts DEFAULT_MAX_FRAGMENT_LENGTH.');
