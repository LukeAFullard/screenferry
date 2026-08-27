/** Thrown when a fully-reassembled transfer fails its SHA-256 integrity check. */
export class IntegrityError extends Error {
  constructor(message = 'Reassembled data failed integrity verification') {
    super(message);
    this.name = 'IntegrityError';
  }
}
