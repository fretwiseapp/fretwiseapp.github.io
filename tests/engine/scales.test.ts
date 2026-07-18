import { describe, it, expect } from 'vitest';
import { SCALES, CHORD_SCALES } from '../../src/data/scales';
import { SHAPES } from '../../src/data/shapes';
import { degOfScale } from '../../src/engine/scales';

describe('scales library', () => {
  it('has at least 30 scales', () => {
    expect(Object.keys(SCALES).length).toBeGreaterThanOrEqual(30);
  });

  const spotChecks: Array<[string, number[]]> = [
    ['Jónica (Mayor)',              [0, 2, 4, 5, 7, 9, 11]],
    ['Dórica',                      [0, 2, 3, 5, 7, 9, 10]],
    ['Menor armónica',              [0, 2, 3, 5, 7, 8, 11]],
    ['Alterada',                    [0, 1, 3, 4, 6, 8, 10]],
    ['Pentatónica mayor',           [0, 2, 4, 7, 9]],
    ['Blues menor',                 [0, 3, 5, 6, 7, 10]],
    ['Disminuida (H-W)',            [0, 1, 3, 4, 6, 7, 9, 10]],
    ['Hirajoshi',                   [0, 2, 3, 7, 8]],
    ['Doble armónica (Bizantina)',  [0, 1, 4, 5, 7, 8, 11]],
    ['Napolitana menor',            [0, 1, 3, 5, 7, 8, 11]],
  ];
  for (const [name, intervals] of spotChecks) {
    it(`${name} has correct intervals`, () => {
      expect([...SCALES[name]!]).toEqual(intervals);
    });
  }

  it('degOfScale returns ordinal for in-scale notes', () => {
    // C Ionian: 1=C, 2=D, 3=E, 4=F, 5=G, 6=A, 7=B
    expect(degOfScale(0, 0, 'Jónica (Mayor)')).toBe('1');
    expect(degOfScale(2, 0, 'Jónica (Mayor)')).toBe('2');
    expect(degOfScale(4, 0, 'Jónica (Mayor)')).toBe('3');
    expect(degOfScale(11, 0, 'Jónica (Mayor)')).toBe('7');
  });
});

describe('chord-scale map', () => {
  it('covers every SHAPES quality', () => {
    const uncovered = Object.keys(SHAPES).filter((s) => !CHORD_SCALES[s]);
    expect(uncovered).toEqual([]);
  });

  it('all suggested scales exist in SCALES', () => {
    for (const [quality, scales] of Object.entries(CHORD_SCALES)) {
      for (const scale of scales) {
        expect(SCALES[scale], `${quality} → ${scale} not in SCALES`).toBeDefined();
      }
    }
  });
});
