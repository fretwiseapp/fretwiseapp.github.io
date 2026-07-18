import type { MidiNote, Strings, Tuning } from '../engine/types';
import { getAudioContext, tryResume } from './context';
import { getEffectsInput } from './effects';

const midiToFreq = (m: MidiNote): number => 440 * Math.pow(2, (m - 69) / 12);

/**
 * Play a single note using oscillator synthesis.
 *
 * Signal chain: triangle (fundamental) + sine (octave harmonic) → lowpass filter →
 * gain envelope (linear attack, exponential decay) → destination.
 *
 * Synchronous. Call tryResume() at top to ensure context is running. If not running
 * (first-call edge case), we still attempt to schedule — the resume() will resolve
 * microseconds later and the notes will play correctly at their scheduled times.
 */
export function playNote(
  midi: MidiNote,
  when = 0,
  duration = 1.5,
  gain = 0.35,
): void {
  tryResume();
  const c = getAudioContext();

  const f = midiToFreq(midi);
  const t0 = c.currentTime + Math.max(0.02, when);

  // Fundamental (triangle — warm, string-like)
  const osc1 = c.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.value = f;

  // Octave harmonic (sine — adds brightness without harshness)
  const osc2 = c.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = f * 2;
  const osc2Gain = c.createGain();
  osc2Gain.gain.value = 0.2;
  osc2.connect(osc2Gain);

  // Lowpass filter for warmth — sweeps down over the note's life
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(f * 8, t0);
  lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 2), t0 + duration * 0.7);
  lp.Q.value = 1;

  // ADSR envelope
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);                          // attack
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain * 0.4), t0 + 0.3); // initial decay
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);                 // release

  osc1.connect(lp);
  osc2Gain.connect(lp);
  lp.connect(g);
  // Route through the shared effects chain (chorus/delay/distortion). The chain
  // is lazily built on first call; when all effects are off, it's a transparent
  // unity-gain pass-through to destination.
  g.connect(getEffectsInput());

  osc1.start(t0);
  osc1.stop(t0 + duration + 0.05);
  osc2.start(t0);
  osc2.stop(t0 + duration + 0.05);
}

/** Play a chord shape as strum (~50ms between notes) or arpeggio (~300ms). */
export function playShape(
  strings: Strings,
  tuning: Tuning,
  mode: 'strum' | 'arp' = 'strum',
): void {
  tryResume();

  const delayBetween = mode === 'arp' ? 0.30 : 0.05;
  const duration = mode === 'arp' ? 0.55 : 1.6;
  const gain = 0.28;

  let i = 0;
  for (let s = 0; s < 6; s++) {
    const v = strings[s];
    if (v === 'muted' || v == null) continue;
    const midi = tuning[s]! + (v === 0 ? 0 : v);
    playNote(midi, i * delayBetween, duration, gain);
    i++;
  }
}
