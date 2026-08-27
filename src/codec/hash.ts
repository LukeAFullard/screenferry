/** Hex-encoded SHA-256 digest, computed via the platform's WebCrypto implementation. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const view = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest('SHA-256', view);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
