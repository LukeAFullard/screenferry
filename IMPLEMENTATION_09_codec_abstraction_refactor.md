# Implementation 09 — Codec Abstraction Refactor (v2 prep)

**Goal:** extract a shared backend interface so QR+LT (v1) and Cimbar (v2,
Stage 10) can sit behind one API, without breaking v1 consumers.

**Depends on:** Implementation 08 (v1.0.0 shipped). This is deliberately a
post-1.0 refactor stage, not pre-work done before v1 ships.

## Steps

1. **Define a `TransferBackend` interface:**
   ```ts
   interface TransferBackend {
     encode(bytes: Uint8Array, opts?: unknown): AsyncIterable<Frame>;
     createDecoder(): {
       addFrame(frame: Frame): void;
       isComplete: boolean;
       getResult(): Uint8Array;
     };
   }
   ```
   `Frame` is deliberately generic — could be a QR string, could be Cimbar
   image data. Do not type it as `string`.

2. **Relocate, don't rewrite.** Move the existing Stage 2+3 QR/LT
   implementation behind this interface as `src/backends/qr-lt/`, with zero
   behavior change. The existing Stage 7 test suite must pass unmodified
   against the relocated code.

3. **Update the public API:** `encodeToFrames`/`StreamDecoder` accept an
   optional `backend` parameter, defaulting to `qr-lt`. Existing v1 callers
   who don't pass it see no change in behavior or output.

4. **Re-run Stage 7's full loopback + fault-injection matrix** against the
   refactored `qr-lt` backend specifically, to confirm the extraction
   didn't regress anything.

5. **Bump to `1.1.0`** (backward-compatible interface addition) and publish
   before starting Stage 10 — isolates "did the refactor break v1" from
   "does the new backend work" as two separately verifiable steps.

## Design note
This stage does **no** Cimbar work. Mixing "extract an interface" with
"implement a second backend" in one pass makes it hard to tell which change
caused a regression if something breaks.
