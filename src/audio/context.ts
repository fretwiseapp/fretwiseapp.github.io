/**
 * AudioContext manager.
 *
 * Strategy: synchronous priming via capture-phase event listeners.
 * - Listeners attached at module init (document-level, capture phase)
 * - On first user click/tap/keypress, resume() fires SYNCHRONOUSLY in the gesture
 * - A one-sample silent buffer is ALSO played on first gesture to force the audio
 *   graph to connect to the output device. Without this, the first scheduled note
 *   is often dropped because the audio thread is still warming up when the
 *   bubble-phase click handler calls playNote(). (Classic WebAudio first-click bug.)
 * - No async/await anywhere — preserves user gesture for browser autoplay policy.
 */

let ac: AudioContext | null = null;
let primed = false;

type GlobalWithWebkit = typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export function getAudioContext(): AudioContext {
  if (!ac) {
    const Ctor = typeof AudioContext !== 'undefined'
      ? AudioContext
      : (globalThis as GlobalWithWebkit).webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio API not supported');
    ac = new Ctor();
  }
  return ac;
}

/**
 * Play a zero-amplitude 1-sample buffer to force the audio graph to connect
 * to the output device. Runs once per session, synchronously within a user
 * gesture. Fixes "first click silent, second click plays" on Chrome/Safari.
 */
function primeOutput(c: AudioContext): void {
  if (primed) return;
  try {
    const buf = c.createBuffer(1, 1, c.sampleRate);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
    primed = true;
  } catch (e) {
    console.error('[audio] prime failed:', e);
  }
}

export function tryResume(): void {
  const c = getAudioContext();
  if (c.state === 'suspended') {
    // Fire-and-forget, must be called synchronously within a user gesture
    c.resume().catch((e) => console.error('[audio] resume failed:', e));
  }
  primeOutput(c);
}

// Attach capture-phase listeners at module load
if (typeof document !== 'undefined') {
  const handler = (): void => tryResume();
  const opts: AddEventListenerOptions = { capture: true };
  document.addEventListener('click', handler, opts);
  document.addEventListener('touchstart', handler, opts);
  document.addEventListener('keydown', handler, opts);
}

// Back-compat (still exported for consumers)
export function attachAudioPriming(): void { /* already attached at module init */ }
export function ensureRunning(): Promise<AudioContext> { tryResume(); return Promise.resolve(getAudioContext()); }
export function primeAudio(): Promise<AudioContext> { return ensureRunning(); }
