// Must be imported before `@ngraveio/bc-ur` — see src/env/polyfills.ts for why.
import '../../env/polyfills';
import FountainEncoderImport, { FountainEncoderPart } from '@ngraveio/bc-ur/dist/fountainEncoder';
import FountainDecoderImport from '@ngraveio/bc-ur/dist/fountainDecoder';

/**
 * `@ngraveio/bc-ur`'s `dist/fountain{Encoder,Decoder}.js` are compiled
 * CommonJS with `exports.default = <class>`. A default `import` of a CJS
 * module is ambiguous across bundlers/targets: it can resolve either to
 * that class directly (correct), or — seen specifically in this project's
 * production Vite/Rollup build, though *not* under vitest's dev-mode
 * bundler, which is why the test suite didn't catch it — to the whole raw
 * CJS module object (`{ default: <class>, ... }`), because the bundler
 * forces default-interop for this import regardless of the module's own
 * (correct) `__esModule`/`.default` shape. `new FountainEncoderImport(...)`
 * in that broken case throws `TypeError: ... is not a constructor`, since
 * the module object itself obviously isn't one.
 *
 * `imported.default ?? imported` resolves both cases without depending on
 * which one a given bundler/build picked: a real class has no `.default`
 * property of its own (falls through to `imported` itself); the wrongly-
 * forwarded module object's own `.default` is the real class.
 */
function resolveDefaultExport<T>(imported: T): T {
  return ((imported as unknown as { default?: T }).default ?? imported) as T;
}

const FountainEncoder = resolveDefaultExport(FountainEncoderImport);
const FountainDecoder = resolveDefaultExport(FountainDecoderImport);

/**
 * Fragment length (bytes) used when the caller doesn't specify one.
 * Empirically measured by `npm run qr-bin:capacity` (see
 * `scripts/qr-bin-capacity.mjs`) as the largest fragment whose raw fountain
 * part still fits a byte-mode QR code at version <= 40, ECC L, even in the
 * worst case for a long-running/large transfer — see
 * `qr-lt/fountain.ts`'s `DEFAULT_MAX_FRAGMENT_LENGTH` for why a worst-case
 * check (not just a small-sample one) matters here.
 *
 * Deliberately larger than `qr-lt`'s 2111: a raw fountain part
 * (`FountainEncoderPart.cbor()`) is rendered directly as byte-mode QR data
 * here, with no bytewords text encoding (2 characters per byte) and no
 * `ur:type/seqNum-seqLength/` URI wrapper — this is the whole point of this
 * backend existing alongside `qr-lt`.
 */
const DEFAULT_MAX_FRAGMENT_LENGTH = 2931;

/**
 * Drives a Luby Transform fountain encoder over `bytes`, yielding raw
 * fountain-part bytes forever — the byte-mode counterpart to `qr-lt`'s
 * `createFountainEncoder`, which yields UR (bytewords-text) part strings
 * instead. Each yielded part is `FountainEncoderPart.cbor()`'s raw CBOR
 * bytes: `[seqNum, seqLength, messageLength, checksum, fragment]`, meant to
 * be rendered directly as byte-mode QR data (see `qr-lt/render.ts`'s
 * `renderQrToCanvas`, which accepts `Uint8Array` for exactly this). Fountain
 * codes are rateless — there is no natural end to the stream, so the caller
 * decides when it has sent enough parts and stops pulling from the
 * iterator.
 */
export async function* createFountainEncoder(
  bytes: Uint8Array,
  opts?: { maxFragmentLength?: number },
): AsyncIterable<Uint8Array> {
  const encoder = new FountainEncoder(
    Buffer.from(bytes),
    opts?.maxFragmentLength ?? DEFAULT_MAX_FRAGMENT_LENGTH,
  );

  for (;;) {
    const part = encoder.nextPart();
    // Copies into a tightly-sized `Uint8Array` — `part.cbor()`'s `Buffer`
    // may be a view into a larger shared pool allocation (Node `Buffer`'s
    // usual allocation strategy), and structured-cloning a typed array
    // across `postMessage` clones its *entire* backing `ArrayBuffer`, not
    // just the view's slice. Handing that shared pool across would waste
    // exactly the bandwidth this backend exists to save.
    yield new Uint8Array(part.cbor());
  }
}

/** Reassembles byte-mode fountain parts back into the original byte buffer. */
export class FountainByteDecoder {
  private readonly decoder = new FountainDecoder();

  receivePart(part: Uint8Array): void {
    // `Buffer.from(part)` here is a view, not a copy, when `part` is a
    // plain `Uint8Array` backed by a real `ArrayBuffer` — matches
    // `FountainEncoderPart.fromCBOR`'s own `Buffer.isBuffer(fragment)`
    // assertion, which a bare `Uint8Array` wouldn't satisfy on its own.
    const encoderPart = FountainEncoderPart.fromCBOR(
      Buffer.from(part.buffer, part.byteOffset, part.byteLength),
    );
    this.decoder.receivePart(encoderPart);
  }

  isComplete(): boolean {
    return this.decoder.isComplete();
  }

  /**
   * bc-ur's estimated completion ratio (0-1), as-is — fountain codes have no
   * fixed "exactly N parts needed" number, so this is an estimate to
   * surface to callers, not a guarantee.
   */
  get progress(): number {
    return this.decoder.estimatedPercentComplete();
  }

  /** Envelope-encoded bytes — not yet decompressed or checksum-verified. */
  getResult(): Uint8Array {
    if (!this.decoder.isComplete()) {
      throw new Error('FountainByteDecoder: cannot get result before decoding is complete');
    }
    if (!this.decoder.isSuccess()) {
      throw new Error(`FountainByteDecoder: decode failed: ${this.decoder.resultError()}`);
    }

    return new Uint8Array(this.decoder.resultMessage());
  }
}
