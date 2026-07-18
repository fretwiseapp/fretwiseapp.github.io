import { SCALES } from '../data/scales';
import { deg } from './spell';
import type { PitchClass } from './types';

/**
 * Compute the scale degree label for a pitch class relative to a scale's root.
 * For diatonic/pentatonic scales, returns ordinal (1, 2, 3, ... up to scale length).
 * For chromatic notes outside the scale, falls back to chord-degree naming (b2, #4, etc.).
 *
 * This does NOT include upper extensions (9/11/13) — those are chord-context,
 * not scale-context. If you need those labels, use `deg()` directly with chord quality.
 */
export function degOfScale(pc: PitchClass, root: PitchClass, scaleName: string): string {
  const ivs = SCALES[scaleName];
  if (!ivs) return '';
  const iv = ((pc - root + 12) % 12);
  const idx = ivs.indexOf(iv);
  if (idx >= 0) return String(idx + 1);
  return deg(iv, '');
}
