import { gzipSync, gunzipSync } from 'fflate';

export function compress(bytes: Uint8Array): Uint8Array {
  return gzipSync(bytes);
}

export function decompress(bytes: Uint8Array): Uint8Array {
  return gunzipSync(bytes);
}
