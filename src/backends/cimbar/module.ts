/// <reference types="vite/client" />

/**
 * The subset of libcimbar's Emscripten-exported C ABI this backend calls.
 * There is no published TypeScript surface (or documentation) for this
 * build — these signatures are reverse-engineered from libcimbar's own
 * reference web glue (`send.js` / `recv-worker.js` / `main.js` inside the
 * v0.6.8 release tarball; see `THIRD_PARTY_LICENSES.md` for provenance),
 * not from an upstream spec. Treat this as "matches the reference
 * implementation's call pattern," not as a verified/stable ABI contract —
 * it has not been exercised against the real WASM binary in a browser.
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

  _cimbard_get_bufsize(): number;
  _cimbard_scan_extract_decode(
    imgPtr: number,
    width: number,
    height: number,
    pixelFormat: number,
    outPtr: number,
    outLen: number,
  ): number;
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
