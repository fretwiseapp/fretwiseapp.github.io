/**
 * Regression tests for the audio synthesis module.
 *
 * These tests exist because of a real bug in an earlier version:
 * the Karplus-Strong feedback loop started at i=period and accessed
 * data[i-period-1] = data[-1], which is undefined in JavaScript.
 * That poisoned 92% of the buffer with NaN, rendering the audio
 * effectively silent.
 *
 * We simulate the KS algorithm here rather than touching Web Audio
 * (which isn't available in Node) — we just need to verify the
 * math produces a valid signal.
 */
import { describe, it, expect } from 'vitest';

function karplusStrongBuffer(sampleRate: number, freq: number, duration: number): Float32Array {
  const bufLen = Math.max(256, Math.floor(sampleRate * duration));
  const data = new Float32Array(bufLen);
  const period = Math.max(2, Math.floor(sampleRate / freq));

  // CRITICAL: period+1 samples of noise, not just period.
  const initLen = Math.min(period + 1, bufLen);
  for (let i = 0; i < initLen; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }
  const decay = 0.9955;
  for (let i = period + 1; i < bufLen; i++) {
    data[i] = (data[i - period]! + data[i - period - 1]!) * 0.5 * decay;
  }
  return data;
}

describe('Karplus-Strong synthesis — buffer validity', () => {
  it('produces zero NaN values for A4 (440 Hz)', () => {
    const buf = karplusStrongBuffer(44100, 440, 1.6);
    let nanCount = 0;
    for (const sample of buf) {
      if (Number.isNaN(sample)) nanCount++;
    }
    expect(nanCount).toBe(0);
  });

  it('produces audible signal (RMS > 0.01) for A4', () => {
    const buf = karplusStrongBuffer(44100, 440, 1.6);
    let sumSq = 0;
    for (const s of buf) sumSq += s * s;
    const rms = Math.sqrt(sumSq / buf.length);
    expect(rms).toBeGreaterThan(0.01);
  });

  it('decays but remains audible at 1 second', () => {
    const buf = karplusStrongBuffer(44100, 440, 1.6);
    let peakAt1s = 0;
    for (let i = 44100; i < 44200; i++) {
      peakAt1s = Math.max(peakAt1s, Math.abs(buf[i]!));
    }
    expect(peakAt1s).toBeGreaterThan(0.005);
  });

  it('handles low and high frequencies without NaN', () => {
    for (const f of [82.4, 110, 220, 440, 880, 1760]) {
      const buf = karplusStrongBuffer(44100, f, 1.6);
      for (const s of buf) {
        expect(Number.isNaN(s)).toBe(false);
      }
    }
  });
});
