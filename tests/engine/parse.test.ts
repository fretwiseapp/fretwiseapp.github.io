import { describe, it, expect } from 'vitest';
import { parseChordName } from '../../src/engine/index';

describe('parseChordName', () => {
  const cases: Array<[string, number, string]> = [
    ['C',        0,  ''],
    ['Cmaj7',    0,  'maj7'],
    ['Cm7',      0,  'm7'],
    ['Cm',       0,  'm'],
    ['C7',       0,  '7'],
    ['C6',       0,  '6'],
    ['C9',       0,  '9'],
    ['C13',      0,  '13'],
    ['Csus2',    0,  'sus2'],
    ['Csus4',    0,  'sus4'],
    ['F#m7',     6,  'm7'],
    ['Bbmaj7',   10, 'maj7'],
    ['Ebm',      3,  'm'],
    ['D#dim7',   3,  'dim7'],
    ['F#m7b5',   6,  'm7b5'],
    ['E7#9',     4,  '7#9'],
    ['Dm9',      2,  'm9'],
    ['Am',       9,  'm'],
    ['Gsus4',    7,  'sus4'],
    ['Bdim',     11, 'dim'],
  ];

  for (const [name, pc, sym] of cases) {
    it(`parses "${name}" → pc=${pc}, sym="${sym}"`, () => {
      const r = parseChordName(name);
      expect(r).not.toBeNull();
      expect(r!.pc).toBe(pc);
      expect(r!.sym).toBe(sym);
    });
  }

  it('returns null for invalid input', () => {
    expect(parseChordName('')).toBeNull();
    expect(parseChordName('Xyz')).toBeNull();
    expect(parseChordName('Cfoobar')).toBeNull();
  });
});
