/// <reference types="vite/client" />

/**
 * The subset of libcimbar's Emscripten-exported C ABI this backend calls.
 * There is no published TypeScript surface for this build — these
 * signatures were reverse-engineered from three sources, in ascending
 * order of authority: libcimbar's reference web glue (`send.js`/
 * `recv-worker.js`/`main.js`/`recv.js` inside the v0.6.8 release tarball;
 * see `THIRD_PARTY_LICENSES.md` for provenance), which turned out to only
 * show *part* of the real call sequence (see `_cimbard_fountain_decode`'s
 * doc comment below); its own C++ source
 * (`src/lib/cimbar_js/cimbar_js.cpp`/`cimbar_recv_js.cpp` in
 * github.com/sz3/libcimbar), which is authoritative for behavior; and
 * direct testing against the vendored WASM binary itself, which is
 * authoritative for "does this actually work." A full encode→decode round
 * trip has been verified this way — see `cimbarBackend`'s doc comment.
 */
export interface CimbarModule {
  HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(ptr: number): void;

  /** Binds GLFW/WebGL rendering to `Module.canvas` (set before calling this). */
  _cimbare_init_window(width: number, height: number): void;
  /**
   * Selects the encode mode. `68` ("mode B", libcimbar's default/reference
   * mode — see `main.js`'s `setMode('B')` -> `modeVal = 68` fallthrough) is
   * what the reference web app uses unless the user picks something else in
   * its UI (4-color, "Bu", "Bm" variants). The second argument is always
   * `-1` in every reference call site observed; its meaning is unknown.
   */
  _cimbare_configure(mode: number, unused: number): void;
  _cimbare_init_encode(filenamePtr: number, filenameLen: number, unused: number): number;
  _cimbare_encode_bufsize(): number;
  _cimbare_encode(bytesPtr: number, bytesLen: number): number;
  _cimbare_render(): void;
  _cimbare_next_frame(colorBalance: number): number;

  /** Selects the decode mode — must match the encoder's `_cimbare_configure` mode, or extraction fails on every frame. */
  _cimbard_configure_decode(mode: number): void;
  _cimbard_get_bufsize(): number;
  /**
   * Per-frame step 1 of 2: scans `frame`'s pixels for a Cimbar symbol and,
   * if found, extracts that frame's *raw fountain-coded chunk* into
   * `outPtr` — **not** the final file. Returns the chunk's length (0 = no
   * data this frame, negative = symbol extraction failed this frame,
   * positive = got a chunk, pass it to `_cimbard_fountain_decode` next).
   * Despite the name, this alone never yields decoded file content — see
   * `recv.js`'s `Sink.on_decode` in the reference tarball, which is the
   * only place that pattern is actually documented (not in any prose
   * doc): the worker-side `recv-worker.js` (which this call pattern was
   * originally modeled on) only *looks* self-contained because it hands
   * its result to a separate, main-thread `Sink` that does the rest.
   */
  _cimbard_scan_extract_decode(
    imgPtr: number,
    width: number,
    height: number,
    pixelFormat: number,
    outPtr: number,
    outLen: number,
  ): number;
  /**
   * Per-frame step 2 of 2: accumulates one frame's extracted chunk (from
   * `_cimbard_scan_extract_decode`) into the fountain-decode state.
   * Emscripten returns a C `int64_t` as a JS `bigint`. `> 0` once enough
   * chunks have accumulated to reconstruct a complete file — the low
   * 32 bits (truncate: `Number(res & 0xFFFFFFFFn)`) are that file's `id`,
   * used with `_cimbard_get_filesize`/`_cimbard_decompress_read`. `<= 0`
   * means "not complete yet, keep feeding it frames."
   */
  _cimbard_fountain_decode(ptr: number, len: number): bigint;
  _cimbard_get_filesize(id: number): number;
  _cimbard_get_filename(id: number, bufPtr: number, bufLen: number): number;
  /** Chunk size for `_cimbard_decompress_read`. */
  _cimbard_get_decompress_bufsize(): number;
  /**
   * Streams the completed file's bytes out in chunks (Cimbar applies its
   * own internal zstd compression in transit — this undoes it): call
   * repeatedly until it returns `<= 0` (no more data), concatenating each
   * chunk of the returned length written to `bufPtr`.
   */
  _cimbard_decompress_read(id: number, bufPtr: number, bufLen: number): number;
  _cimbard_get_report(bufPtr: number, bufLen: number): number;

  canvas?: unknown;
}

interface CimbarModuleConfig {
  canvas?: unknown;
  locateFile?: (path: string) => string;
  onRuntimeInitialized?: () => void;
}

declare global {
  var Module: CimbarModuleConfig | undefined;
}

let modulePromise: Promise<CimbarModule> | undefined;

/**
 * Lazily loads and instantiates libcimbar's WASM module exactly once,
 * sharing that single instance across every encode/decode call in this
 * process — both C ABIs (`_cimbare_*`/`_cimbard_*`) live in the one binary,
 * and libcimbar's glue script is a classic (non-ESM, unmodularized)
 * Emscripten build that attaches itself to one global `Module`, not a
 * factory that can be invoked per instance.
 *
 * Only works on the main thread: the glue script is loaded via `<script>`
 * injection (it needs `document`), since it isn't a valid ES module and a
 * module Worker (as used elsewhere in this project, e.g. the QR decode
 * worker) can't `importScripts`.
 *
 * The `.wasm`/`.js` asset URLs are obtained via a dynamic `import()`
 * (rather than a static top-level one), so bundlers code-split them out of
 * the main entry chunk — a consumer who never touches `cimbarBackend`
 * shouldn't pay this ~2MB download cost just for importing `screenferry`,
 * mirroring how the QR decode stack is already lazy-loaded (Stage 8).
 */
export function loadCimbarModule(): Promise<CimbarModule> {
  if (modulePromise) return modulePromise;

  modulePromise = (async () => {
    if (typeof document === 'undefined') {
      throw new Error(
        'screenferry cimbarBackend: requires a DOM (`document`) to load its WASM module — must run on the main thread, not a worker',
      );
    }

    const [{ default: cimbarWasmUrl }, { default: cimbarJsUrl }] = await Promise.all([
      import('./vendor/cimbar.wasm?url'),
      import('./vendor/cimbar.js?url'),
    ]);

    return new Promise<CimbarModule>((resolve, reject) => {
      globalThis.Module = {
        locateFile: (path: string) => (path.endsWith('.wasm') ? cimbarWasmUrl : path),
        onRuntimeInitialized: () => resolve(globalThis.Module as unknown as CimbarModule),
      };

      const script = document.createElement('script');
      script.src = cimbarJsUrl;
      script.onerror = () =>
        reject(
          new Error('screenferry cimbarBackend: failed to load the vendored WASM glue script'),
        );
      document.head.appendChild(script);
    });
  })();

  return modulePromise;
}
