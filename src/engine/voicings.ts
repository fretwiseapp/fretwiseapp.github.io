import type { Strings, ShapeStrings, PitchClass, Voicing, VoicingFamily, Tuning, Key } from './types';
import { SHAPES } from '../data/shapes';
import { qBySymbol } from './qualities';
import { spell } from './spell';
import { FRET_COUNT } from './constants';

function applyShift(shape: ShapeStrings, shift: number): Strings {
  return shape.map((v) => (v === 'x' ? 'muted' : v + shift)) as Strings;
}

function fitsInRange(strings: Strings, maxFret: number): boolean {
  for (const v of strings) {
    if (v === 'muted') continue;
    if (v > maxFret) return false;
  }
  return true;
}

/**
 * Build a voicing for a given root + quality + shape index.
 * If the requested shape doesn't fit in fret range, falls back to first playable shape.
 *
 * The optional `octave` parameter shifts the shape an additional 12 frets up — so a
 * voicing that plays at fret 2 can also be played at fret 14. This is what lets the
 * UI map the same chord across the whole neck (the CAGED idea taken literally). When
 * the requested (idx, octave) pair doesn't fit, we fall back to octave 0 of the same
 * shape, then to any shape that fits.
 */
export function buildVoicing(rootPc: PitchClass, qSym: string, idx = 0, octave = 0): Strings | null {
  const shapes = SHAPES[qSym];
  if (!shapes || shapes.length === 0) return null;

  const tryBuild = (shapeIdx: number, oct: number): Strings | null => {
    const s = shapes[shapeIdx];
    if (!s) return null;
    const shift = ((rootPc - s.baseRoot) % 12 + 12) % 12 + oct * 12;
    const v = applyShift(s.shape, shift);
    return fitsInRange(v, FRET_COUNT) ? v : null;
  };

  // Exact match first.
  if (idx >= 0 && idx < shapes.length) {
    const exact = tryBuild(idx, octave);
    if (exact) return exact;
    // Same shape, octave 0 fallback.
    if (octave !== 0) {
      const base = tryBuild(idx, 0);
      if (base) return base;
    }
  }

  // Any shape that fits at octave 0.
  for (let i = 0; i < shapes.length; i++) {
    const v = tryBuild(i, 0);
    if (v) return v;
  }

  // Last resort: first shape even if out of range (no clamping — caller sees the overflow).
  const first = shapes[0]!;
  const shift = ((rootPc - first.baseRoot) % 12 + 12) % 12;
  return applyShift(first.shape, shift);
}

/**
 * List every available voicing for a chord, derived from SHAPES.
 *
 * For each shape we emit:
 *   - octave 0: the first playable position (if it fits)
 *   - octave 1: the same shape 12 frets higher (if that also fits)
 *
 * This gives the user a complete neck map — e.g. A major appears both at fret 0/5
 * (E-shape, A-shape, C-shape at fret 9, D-shape at fret 7, G-shape at fret 14) AND
 * one octave higher where the math allows. Essential for fretboard position mastery.
 *
 * Each entry carries:
 *   - inversion label ('raíz', '1ra inv.', '2da inv.', '3ra inv.') from bass-interval lookup
 *   - family ('caged' | 'drop2' | 'drop3' | 'invHigh') from the shape metadata
 *   - octave (0 or 1) for octave-up disambiguation
 */
export function listVoicings(rootPc: PitchClass, qSym: string, tuning: Tuning, key: Key = 'auto'): Voicing[] {
  const shapes = SHAPES[qSym];
  const q = qBySymbol(qSym);
  if (!shapes || !q) return [];

  const invLabels = ['raíz', '1ra inv.', '2da inv.', '3ra inv.', '4ta inv.'];
  const invName = (iv: number): string => {
    const idx = q.req.indexOf(iv);
    if (idx < 0) return 'ext';
    return invLabels[idx] ?? 'inv.';
  };

  const out: Voicing[] = [];
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i]!;
    const family: VoicingFamily = s.family ?? 'caged';
    const baseShift = ((rootPc - s.baseRoot) % 12 + 12) % 12;

    for (const octave of [0, 1]) {
      const shift = baseShift + octave * 12;
      const strings = applyShift(s.shape, shift);
      if (!fitsInRange(strings, FRET_COUNT)) continue;

      // Skip octave-0 duplicates: if baseShift is small and octave-0 already fit,
      // octave 1 might produce the same strings when the shape spans a wide range
      // of open frets — but since we anchor to the baseRoot, shift+12 is always
      // distinct from shift. No dedup needed here.

      let bassPc: PitchClass | null = null;
      for (let st = 0; st < 6; st++) {
        const vv = strings[st];
        if (vv === 'muted') continue;
        bassPc = (tuning[st]! + (vv === 0 ? 0 : vv)) % 12;
        break;
      }
      const iv = bassPc !== null ? ((bassPc - rootPc + 12) % 12) : 0;

      const label = octave === 0 ? s.label : `${s.label} +12`;

      out.push({
        idx: i,
        label,
        strings,
        inversion: invName(iv),
        bassName: bassPc !== null ? spell(bassPc, key, qSym) : '',
        bassPc,
        family,
        octave,
      });
    }
  }

  // Sort by lowest fretted position ascending (open = 0 first, then up the neck).
  // This lets the UI present voicings as a map of how the chord lives across the neck.
  return out.sort((a, b) => minFret(a.strings) - minFret(b.strings));
}

function minFret(s: Strings): number {
  let m = Infinity;
  for (const v of s) {
    if (v === 'muted') continue;
    if (v < m) m = v;
  }
  return m === Infinity ? 0 : m;
}
