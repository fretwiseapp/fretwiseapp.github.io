/**
 * Guitar effects chain.
 *
 * Signal flow: every note/chord from `synth.ts` runs through this chain before
 * hitting the destination. Each effect has a parallel wet/dry mixer so toggling
 * is glitch-free (no node creation/destruction on the fly).
 *
 *   input → distortion stage → chorus stage → delay stage → output → destination
 *
 * Lazy init: the chain is built on first access, after the AudioContext is live.
 * LFOs for the chorus run continuously (negligible CPU) — their contribution
 * only reaches the output when the chorus wet gain is > 0.
 *
 * Parameter choices favor classic-guitar sound over surgical accuracy:
 *   - Distortion: WaveShaper with ~40-unit soft-clip curve + makeup gain reduction
 *                 (distortion always raises perceived loudness; we pull output back).
 *   - Chorus: single short delay (25 ms) with an LFO at 0.8 Hz modulating ±3 ms.
 *             Mixed ~50/50 with dry for a subtle shimmer without "underwater".
 *   - Delay: 320 ms slapback with 35% feedback — tasteful echo without muddying.
 *
 * No per-parameter UI by design (yet): the user toggles each effect on/off and
 * gets a characterful preset. Keeps the surface area small.
 */

import { getAudioContext } from './context';

export type EffectName = 'chorus' | 'delay' | 'distortion';

interface EffectsChain {
  input: GainNode;
  // Per-effect wet gains (0 = bypass, 1 = on). Dry gains are fixed at 1 on the
  // modulation effects; the distortion stage crossfades between dry and wet.
  distDry: GainNode;
  distWet: GainNode;
  chorusWet: GainNode;
  delayWet: GainNode;
}

let chain: EffectsChain | null = null;

/**
 * Build a soft-clip waveshaping curve. The classic formula from the Web Audio
 * cookbook — produces tube-ish harmonic content without the brittle edges of
 * a hard-clip. `amount` controls aggression; 40 sits between "light crunch"
 * and "driven amp".
 */
function makeDistortionCurve(amount: number): Float32Array {
  const n = 2048;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function buildChain(): EffectsChain {
  const c = getAudioContext();

  // -------- Entry node --------
  const input = c.createGain();
  input.gain.value = 1;

  // -------- Distortion (in-series crossfade) --------
  // input → distDry ┐
  //        → shaper → makeup → distWet ┤→ distSum → next
  const distDry = c.createGain();
  distDry.gain.value = 1;
  const distWet = c.createGain();
  distWet.gain.value = 0;
  const shaper = c.createWaveShaper();
  // TS 5.7+ split Float32Array into Float32Array<ArrayBuffer | SharedArrayBuffer>,
  // and the WaveShaper curve setter requires the ArrayBuffer variant. `new Float32Array(n)`
  // is always ArrayBuffer-backed at runtime but types as the generic form, so we
  // widen via `unknown` — safe and localized to this one DOM API boundary.
  shaper.curve = makeDistortionCurve(40) as unknown as typeof shaper.curve;
  shaper.oversample = '4x';
  const distMakeup = c.createGain();
  distMakeup.gain.value = 0.45; // soft-clip adds ~6 dB loudness; pull it back
  const distSum = c.createGain();
  distSum.gain.value = 1;

  input.connect(distDry);
  input.connect(shaper);
  shaper.connect(distMakeup);
  distMakeup.connect(distWet);
  distDry.connect(distSum);
  distWet.connect(distSum);

  // -------- Chorus (parallel wet/dry) --------
  // distSum → chorusDry (1.0) ────────────────────┐
  //         → chorusDelay (LFO-modulated) → chorusWet ┤→ chorusSum → next
  const chorusDry = c.createGain();
  chorusDry.gain.value = 1;
  const chorusDelay = c.createDelay(0.1);
  chorusDelay.delayTime.value = 0.025; // 25 ms base
  const chorusLFO = c.createOscillator();
  chorusLFO.type = 'sine';
  chorusLFO.frequency.value = 0.8; // Hz
  const chorusLFODepth = c.createGain();
  chorusLFODepth.gain.value = 0.003; // ±3 ms
  chorusLFO.connect(chorusLFODepth);
  chorusLFODepth.connect(chorusDelay.delayTime);
  chorusLFO.start();
  const chorusWet = c.createGain();
  chorusWet.gain.value = 0;
  const chorusSum = c.createGain();
  chorusSum.gain.value = 1;

  distSum.connect(chorusDry);
  distSum.connect(chorusDelay);
  chorusDelay.connect(chorusWet);
  chorusDry.connect(chorusSum);
  chorusWet.connect(chorusSum);

  // -------- Delay (parallel wet with feedback) --------
  // chorusSum → delayDry (1.0) ────────────────────────┐
  //           → delayLine → delayWet ──────────────────┤→ delaySum → output
  //                       ↓ feedback ↑
  const delayDry = c.createGain();
  delayDry.gain.value = 1;
  const delayLine = c.createDelay(2.0);
  delayLine.delayTime.value = 0.32; // ~320 ms slapback
  const delayFeedback = c.createGain();
  delayFeedback.gain.value = 0.35;
  delayLine.connect(delayFeedback);
  delayFeedback.connect(delayLine);
  const delayWet = c.createGain();
  delayWet.gain.value = 0;
  const delaySum = c.createGain();
  delaySum.gain.value = 1;

  chorusSum.connect(delayDry);
  chorusSum.connect(delayLine);
  delayLine.connect(delayWet);
  delayDry.connect(delaySum);
  delayWet.connect(delaySum);

  // -------- Output --------
  const output = c.createGain();
  output.gain.value = 1;
  delaySum.connect(output);
  output.connect(c.destination);

  return { input, distDry, distWet, chorusWet, delayWet };
}

/** Returns the entry node of the effects chain, building it lazily. */
export function getEffectsInput(): AudioNode {
  if (!chain) chain = buildChain();
  return chain.input;
}

/**
 * Toggle an effect. Uses setTargetAtTime for a 20-ms smoothing ramp so the
 * change is audible but click-free. Idempotent — safe to spam.
 */
export function setEffectEnabled(name: EffectName, on: boolean): void {
  if (!chain) chain = buildChain();
  const c = getAudioContext();
  const now = c.currentTime;
  const tau = 0.02;
  switch (name) {
    case 'distortion':
      chain.distDry.gain.setTargetAtTime(on ? 0 : 1, now, tau);
      chain.distWet.gain.setTargetAtTime(on ? 1 : 0, now, tau);
      break;
    case 'chorus':
      chain.chorusWet.gain.setTargetAtTime(on ? 0.7 : 0, now, tau);
      break;
    case 'delay':
      chain.delayWet.gain.setTargetAtTime(on ? 0.5 : 0, now, tau);
      break;
  }
}
