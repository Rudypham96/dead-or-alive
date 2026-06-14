// Tiny in-process event bus. The engine emits domain events (bet, price,
// resolution, challenge…); the SSE endpoint in index.js subscribes and forwards
// them to connected browsers. Keeps engine.js decoupled from the transport.

const listeners = new Set();

export function onEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitEvent(evt) {
  for (const fn of listeners) {
    try {
      fn(evt);
    } catch {
      /* a bad listener must never break the emitter */
    }
  }
}
