import { describe, it, expect } from 'vitest';
import { TUNINGS, SHARP, FLAT } from '../../src/engine/constants';
import { SHAPES } from '../../src/data/shapes';
import { pcsOf, identify, nameOf } from '../../src/engine/pcset';
import { buildVoicing } from '../../src/engine/voicings';
import type { Strings, Key } from '../../src/engine/types';

const topIdent = (shape: Strings, key: Key = 'auto'): string | null => {
  const { pcs, bassPc } = pcsOf(shape, TUNINGS.standard);
  const c = identify(pcs, bassPc);
  return c.length ? nameOf(c[0]!, key, bassPc) : null;
};

const ENHARMONIC_ROOTS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};
const QUALITY_EQUIV: Record<string, string> = {
  '7b5': '7#11', '7#11': '7b5',
  'maj7#5': 'maj7b13', 'maj7b13': 'maj7#5',
  '7#5': '7b13', '7b13': '7#5',
};

function sameChord(a: string | null, b: string): boolean {
  if (!a) return false;
  if (a === b) return true;
  const am = a.match(/^([A-G][#b]?)(.*)$/);
  const bm = b.match(/^([A-G][#b]?)(.*)$/);
  if (!am || !bm) return false;
  const rootsEq = am[1] === bm[1] || ENHARMONIC_ROOTS[am[1]!] === bm[1];
  if (!rootsEq) return false;
  if (am[2] === bm[2]) return true;
  if (QUALITY_EQUIV[am[2]!] === bm[2]) return true;
  const tensions = ['add9', 'add11', 'add13', 'b9', '#9', 'b13', '#11'];
  for (const t of tensions) {
    if (am[2]! + t === bm[2]) return true;
    if (bm[2]! + t === am[2]) return true;
  }
  return false;
}

describe('engine/identify — legacy chord shapes', () => {
  const cases: Array<{ shape: Strings; key: Key; expect: string; label: string }> = [
    { shape: ['muted', 3, 2, 0, 1, 0], key: 'auto', expect: 'C',       label: 'C open' },
    { shape: ['muted', 3, 2, 0, 0, 0], key: 'auto', expect: 'Cmaj7',   label: 'Cmaj7' },
    { shape: ['muted', 0, 2, 0, 1, 0], key: 'auto', expect: 'Am7',     label: 'Am7' },
    { shape: [0, 7, 6, 7, 8, 'muted'], key: 'auto', expect: 'E7#9',    label: 'Hendrix' },
    { shape: ['muted', 5, 3, 5, 5, 5], key: 'auto', expect: 'Dm9',     label: 'Dm9' },
    { shape: ['muted', 2, 3, 1, 3, 'muted'], key: 'auto', expect: 'Bdim7', label: 'Bdim7' },
    { shape: ['muted', 3, 2, 2, 1, 0], key: 'auto', expect: 'C6',      label: 'C6' },
    { shape: [0, 3, 2, 0, 1, 0],       key: 'auto', expect: 'C/E',     label: 'C/E' },
    { shape: [1, 3, 3, 2, 1, 1],       key: 'F',    expect: 'F',       label: 'F in F key' },
    { shape: ['muted', 6, 5, 3, 4, 3], key: 'Eb',   expect: 'Eb',      label: 'Eb in Eb key' },
  ];
  for (const c of cases) {
    it(c.label + ' → ' + c.expect, () => {
      const got = topIdent(c.shape, c.key);
      expect(sameChord(got, c.expect) || (got?.split('/')[0] === c.expect.split('/')[0])).toBe(true);
    });
  }
});

describe('engine/buildVoicing — all 12 roots × all qualities round-trip', () => {
  for (let root = 0; root < 12; root++) {
    for (const sym of Object.keys(SHAPES)) {
      it(SHARP[root] + sym + ' builds and identifies', () => {
        const v = buildVoicing(root, sym, 0);
        expect(v).not.toBeNull();
        const got = topIdent(v!);
        const expected = SHARP[root] + sym;
        const expectedFlat = FLAT[root] + sym;
        const ok = sameChord(got, expected) || sameChord(got, expectedFlat)
          || (got && (sameChord(got.split('/')[0]!, expected) || sameChord(got.split('/')[0]!, expectedFlat)));
        expect(ok, `got ${got}, expected ${expected}`).toBeTruthy();
      });
    }
  }
});
