import { Buffer as BufferPolyfill } from 'buffer';
import processPolyfill from 'process';

/**
 * Installs `Buffer`/`process` on `globalThis` for browsers, which have
 * neither. bc-ur (via its `assert` dependency) reads/writes both at module
 * *evaluation* time, not just inside functions — so this must run, and
 * finish running, before `@ngraveio/bc-ur` is imported anywhere in the
 * module graph. ES modules evaluate a module's own imports before its body,
 * so every file that (transitively) imports bc-ur must import this file
 * first and import nothing bc-ur-related before it.
 *
 * Node (incl. Vitest's test environment) already has both globally, so
 * installing is a no-op there.
 */
if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as typeof globalThis & { Buffer: typeof BufferPolyfill }).Buffer = BufferPolyfill;
}
if (typeof globalThis.process === 'undefined') {
  (globalThis as typeof globalThis & { process: typeof processPolyfill }).process = processPolyfill;
}
