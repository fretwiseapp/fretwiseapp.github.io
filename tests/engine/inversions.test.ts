import { describe, it, expect } from 'vitest';
import { TUNINGS } from '../../src/engine/constants';
import { SHAPES } from '../../src/data/shapes';
import { buildVoicing } from '../../src/engine/voicings';
import type { PitchClass, Strings } from '../../src/engine/types';

const bassOf = (strings: Strings): PitchClass | null => {
  for (let s = 0; s < 6; s++) {
    const v = strings[s];
    if (v === 'muted' || v == null) continue;
    return ((TUNINGS.standard[s]! + (v === 0 ? 0 : v)) % 12) as PitchClass;
  }
  return null;
};

const pcsSet = (strings: Strings): Set<PitchClass> => {
  const out = new Set<PitchClass>();
  for (let s = 0; s < 6; s++) {
    const v = strings[s];
    if (v === 'muted' || v == null) continue;
    out.add(((TUNINGS.standard[s]! + (v === 0 ? 0 : v)) % 12) as PitchClass);
  }
  return out;
};

const EXPECTED_PCS: Record<string, number[]> = {
  maj7:  [0, 4, 7, 11],
  '7':   [0, 4, 7, 10],
  m7:    [0, 3, 7, 10],
  m7b5:  [0, 3, 6, 10],
  dim7:  [0, 3, 6, 9],
};

interface InvBassMap { third: number; fifth: number; seventh: number }
const INV_BASS: Record<string, InvBassMap> = {
  maj7: { third: 4,  fifth: 7, seventh: 11 },
  '7':  { third: 4,  fifth: 7, seventh: 10 },
  m7:   { third: 3,  fifth: 7, seventh: 10 },
  m7b5: { third: 3,  fifth: 6, seventh: 10 },
  dim7: { third: 3,  fifth: 6, seventh: 9  },
};

const LABEL_TO_BASS: Record<string, keyof InvBassMap | 'root'> = {
  'Drop-2 raíz':    'root',
  'Drop-2 1ra inv': 'third',
  'Drop-2 2da inv': 'fifth',
  'Drop-2 3ra inv': 'seventh',
};

describe('drop-2 inversions — pcs and bass correctness at C', () => {
  for (const [q, pcsArr] of Object.entries(EXPECTED_PCS)) {
    const expPcs = new Set(pcsArr);
    const shapes = SHAPES[q]!.map((s, i) => ({ ...s, idx: i })).filter((s) => s.label.startsWith('Drop-2'));
    for (const s of shapes) {
      it(`C${q} ${s.label}`, () => {
        const v = buildVoicing(0, q, s.idx);
        expect(v).not.toBeNull();
        const pcs = pcsSet(v!);
        expect(pcs.size).toBe(expPcs.size);
        for (const p of expPcs) expect(pcs.has(p as PitchClass)).toBe(true);

        const b = bassOf(v!);
        const label = LABEL_TO_BASS[s.label];
        if (label === 'root') expect(b).toBe(0);
        else if (label) expect(b).toBe(INV_BASS[q]![label]);
      });
    }
  }
});

describe('drop-2 inversions — transposition preserves structure', () => {
  const qualities = ['maj7', '7', 'm7', 'm7b5'];
  for (const q of qualities) {
    const shapes = SHAPES[q]!.map((s, i) => ({ ...s, idx: i })).filter((s) => s.label.startsWith('Drop-2'));
    for (const s of shapes) {
      for (let root = 0; root < 12; root++) {
        it(`${q} ${s.label} at root=${root}`, () => {
          const v = buildVoicing(root, q, s.idx);
          expect(v).not.toBeNull();
          const pcs = pcsSet(v!);
          const expPcs = new Set(EXPECTED_PCS[q]!.map((p) => ((p + root) % 12) as PitchClass));
          expect(pcs.size).toBe(expPcs.size);
          for (const p of expPcs) expect(pcs.has(p as PitchClass)).toBe(true);
        });
      }
    }
  }
});

describe('triad inversions — bass correctness', () => {
  const cases: Array<{ q: string; label: string; expectedBass: PitchClass }> = [
    { q: '',  label: '1ra inv. (3 en bajo)',   expectedBass: 4 },
    { q: '',  label: '2da inv. (5 en bajo)',   expectedBass: 7 },
    { q: 'm', label: '1ra inv. (b3 en bajo)',  expectedBass: 3 },
    { q: 'm', label: '2da inv. (5 en bajo)',   expectedBass: 7 },
  ];
  for (const c of cases) {
    it(`C${c.q} ${c.label}`, () => {
      const idx = SHAPES[c.q]!.findIndex((s) => s.label === c.label);
      expect(idx).toBeGreaterThanOrEqual(0);
      const v = buildVoicing(0, c.q, idx);
      expect(v).not.toBeNull();
      expect(bassOf(v!)).toBe(c.expectedBass);
    });
  }
});
