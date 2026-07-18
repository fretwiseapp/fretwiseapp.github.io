export * from './types';
export * from './constants';
export * from './qualities';
export * from './spell';
export * from './pcset';
export * from './voicings';
export * from './scales';
export * from './audit';

import { SHAPES } from '../data/shapes';
import { SHARP, FLAT } from './constants';
import type { PitchClass } from './types';

/**
 * Parse a chord name like "Cmaj7", "F#m7b5", "Bb13" into root + quality symbol.
 * Returns null if the name doesn't match a known quality.
 */
export function parseChordName(name: string): { pc: PitchClass; sym: string } | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  let root = trimmed[0]!.toUpperCase();
  let rest = trimmed.slice(1);
  if (rest[0] === '#' || rest[0] === 'b' || rest[0] === '♭') {
    root += rest[0] === '♭' ? 'b' : rest[0]!;
    rest = rest.slice(1);
  }
  let pc = SHARP.indexOf(root);
  if (pc < 0) pc = FLAT.indexOf(root);
  if (pc < 0) return null;
  const symsByLength = Object.keys(SHAPES).sort((a, b) => b.length - a.length);
  const sym = symsByLength.find((s) => rest === s);
  if (sym === undefined) return null;
  return { pc, sym };
}
