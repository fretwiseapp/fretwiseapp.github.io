import { describe, it, expect } from 'vitest';
import { explainLine, availableTensions, chordIntervals, tensionDegree } from '../../src/engine/explain';
import type { NoteRole } from '../../src/engine/explain';
import { Q } from '../../src/engine/qualities';
import { CHORD_SCALES, SCALES } from '../../src/data/scales';
import type { MidiNote, PitchClass } from '../../src/engine/types';

// C4 = 60. Named so the test reads as music rather than as arithmetic.
const C = 60, Db = 61, D = 62, Eb = 63, E = 64, F = 65, Gb = 66,
      G = 67, Ab = 68, A = 69, Bb = 70, B = 71, C5 = 72;

const roles = (midis: number[], quality: string, scaleName?: string): NoteRole[] => {
  const r = explainLine(midis as MidiNote[], { root: 0 as PitchClass, quality }, { scaleName });
  if (!r) throw new Error('explainLine returned null');
  return r.notes.map((n) => n.role);
};

const degrees = (midis: number[], quality: string, scaleName?: string): string[] => {
  const r = explainLine(midis as MidiNote[], { root: 0 as PitchClass, quality }, { scaleName });
  if (!r) throw new Error('explainLine returned null');
  return r.notes.map((n) => n.degree);
};

describe('chordIntervals', () => {
  it('reduces a chord to its pitch classes above the root', () => {
    expect(chordIntervals('maj7')).toEqual([0, 4, 7, 11]);
    expect(chordIntervals('m7')).toEqual([0, 3, 7, 10]);
    expect(chordIntervals('13')).toEqual([0, 4, 7, 9, 10]);
  });

  it('returns null for a quality that does not exist', () => {
    expect(chordIntervals('m7b9#13')).toBeNull();
  });
});

describe('explainLine — the published avoid notes', () => {
  // Levine, ch. 2: over a major 7th chord the 4 is the avoid note; over a
  // dominant with a natural 3 it is the 4 as well. These are the two cases
  // every method book names, so they are the two the classifier must get right.
  it('calls the 4 over maj7 an avoid note', () => {
    expect(roles([F, C5], 'maj7')).toEqual(['avoid', 'chordTone']);
    expect(degrees([F], 'maj7')).toEqual(['11']);
  });

  it('calls the 4 over a dominant an avoid note', () => {
    expect(roles([F, C5], '7')).toEqual(['avoid', 'chordTone']);
  });

  // Levine, ch. 2, explicitly: Dorian over a m7 chord has no avoid notes. Every
  // tone of the scale is either the chord or a usable colour.
  it('finds no avoid note anywhere in Dorian over m7', () => {
    const dorian = [C, D, Eb, F, G, A, Bb, C5];
    // Ascending, so no note resolves by step into a chord tone by accident on
    // the way: this tests the vertical classification, not the horizontal one.
    const r = roles(dorian, 'm7', 'Dórica');
    expect(r).not.toContain('avoid');
    expect(r).not.toContain('outside');
  });
});

describe('explainLine — context beats pitch', () => {
  // The load-bearing rule from the module header. F alone over Cmaj7 is an
  // avoid note; F moving to E is how half the standards resolve.
  it('an approach note outranks avoid', () => {
    expect(roles([F, E], 'maj7')).toEqual(['approach', 'chordTone']);
  });

  it('a leap into a chord tone is not an approach', () => {
    // Same F, same destination chord tone, seven semitones away.
    expect(roles([F, C5], 'maj7')).toEqual(['avoid', 'chordTone']);
  });

  it('an outside note that resolves by step is an approach', () => {
    // Ab is not in Ionian and not in Cmaj7, but it leans into G.
    expect(roles([Ab, G], 'maj7')).toEqual(['approach', 'chordTone']);
    // Leaping away from it instead, it is simply outside.
    expect(roles([Ab, D], 'maj7')).toEqual(['outside', 'passing']);
  });

  it('the last note is never an approach, having nowhere to go', () => {
    expect(roles([E, F], 'maj7')).toEqual(['chordTone', 'avoid']);
  });

  it('reads the same line differently depending on where it goes', () => {
    // The same 9 over the same C7. Stepping down into the root it is doing a
    // job; leaping away to the 13 it is just a note on the way.
    expect(roles([F, D, C], '7')[1]).toBe('approach');
    expect(roles([F, D, A], '7')[1]).toBe('passing');
  });
});

describe('explainLine — degree naming', () => {
  // A minor third is a ♭3 when the chord has one and a ♯9 when it does not.
  // Printing ♯9 inside a minor chord would be nonsense, which is why there are
  // two tables rather than one.
  it('names a minor third ♭3 in a minor chord', () => {
    expect(degrees([Eb], 'm7')).toEqual(['♭3']);
  });

  it('names the same pitch ♯9 over a dominant', () => {
    expect(degrees([Eb], '7')).toEqual(['♯9']);
  });

  it('names chord tones that happen to be alterations by their chord degree', () => {
    // In a 7♭9 the ♭9 is part of the chord, not a tension over it.
    expect(degrees([Db], '7b9')).toEqual(['♭9']);
    expect(roles([Db], '7b9')).toEqual(['chordTone']);
  });

  it('names an upper structure as a tension, not as a compound interval', () => {
    expect(degrees([D], 'm7')).toEqual(['9']);
    expect(degrees([A], '7')).toEqual(['13']);
    expect(degrees([Gb], 'maj7', 'Lidia')).toEqual(['♯11']);
  });
});

describe('explainLine — invariants', () => {
  it('is relative to the chord root, not to any key', () => {
    const line = [F, E, D, C];
    const inC = explainLine(line as MidiNote[], { root: 0 as PitchClass, quality: 'maj7' })!;
    // The same line transposed up a minor third over an E♭maj7.
    const inEb = explainLine(line.map((m) => m + 3) as MidiNote[], { root: 3 as PitchClass, quality: 'maj7' })!;
    expect(inEb.notes.map((n) => n.role)).toEqual(inC.notes.map((n) => n.role));
    expect(inEb.notes.map((n) => n.degree)).toEqual(inC.notes.map((n) => n.degree));
  });

  it('classifies notes below the chord root the same as notes above it', () => {
    expect(roles([F - 12, C], 'maj7')).toEqual(roles([F, C5], 'maj7'));
  });

  it('counts every note exactly once', () => {
    const line = [C, D, Eb, E, F, Gb, G, Ab, A, Bb, B];
    const r = explainLine(line as MidiNote[], { root: 0 as PitchClass, quality: '7' })!;
    const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(line.length);
    expect(r.notes.map((n) => n.index)).toEqual(line.map((_, i) => i));
  });

  it('gives every note a sentence', () => {
    const r = explainLine([C, Db, D, F] as MidiNote[], { root: 0 as PitchClass, quality: 'm7' })!;
    for (const n of r.notes) expect(n.note.length).toBeGreaterThan(10);
  });

  it('handles an empty line', () => {
    const r = explainLine([], { root: 0 as PitchClass, quality: 'maj7' })!;
    expect(r.notes).toEqual([]);
    expect(Object.values(r.counts).every((c) => c === 0)).toBe(true);
  });

  it('returns null rather than guessing when the chord or scale is unknown', () => {
    expect(explainLine([C] as MidiNote[], { root: 0 as PitchClass, quality: 'nope' })).toBeNull();
    expect(
      explainLine([C] as MidiNote[], { root: 0 as PitchClass, quality: 'maj7' }, { scaleName: 'Nope' })
    ).toBeNull();
  });
});

describe('availableTensions', () => {
  // Mulholland & Hojnacki, ch. 3. These three are the tables every player
  // memorises, so they are worth pinning down literally.
  const cases: Array<[string, string, number[]]> = [
    ['maj7', 'Mayor (Jónica)', [2, 9]],        // 9 and 13; the 11 clashes with the 3
    ['m7',   'Dórica',         [2, 5, 9]],     // 9, 11 and 13 — all of them
    ['7',    'Mixolidia',      [2, 9]],        // 9 and 13; the 11 clashes with the 3
  ];
  for (const [quality, scale, expected] of cases) {
    it(`${quality} over ${scale} → ${expected.join(', ')}`, () => {
      expect(availableTensions({ root: 0 as PitchClass, quality }, scale)).toEqual(expected);
    });
  }

  it('never returns a chord tone', () => {
    for (const q of Q) {
      const chord = new Set(chordIntervals(q.sym)!);
      for (const iv of availableTensions({ root: 0 as PitchClass, quality: q.sym })) {
        expect(chord.has(iv)).toBe(false);
      }
    }
  });

  it('returns nothing for a chord it does not know', () => {
    expect(availableTensions({ root: 0 as PitchClass, quality: 'nope' })).toEqual([]);
  });
});

describe('tensionDegree', () => {
  it('labels an interval above the root', () => {
    expect(tensionDegree(6)).toBe('♯11');
    expect(tensionDegree(9)).toBe('13');
  });

  it('wraps compound intervals into the octave', () => {
    expect(tensionDegree(18)).toBe('♯11');
    expect(tensionDegree(-3)).toBe('13');
  });
});

describe('every chord in the dictionary is explainable', () => {
  // The guard that matters: a quality added to Q, or a scale renamed in
  // CHORD_SCALES, must not silently make explainLine return null — which in the
  // UI would read as "no explanation available" for a perfectly ordinary chord.
  for (const q of Q) {
    it(`${q.sym || 'mayor'} resolves to a real default scale`, () => {
      expect(chordIntervals(q.sym)).not.toBeNull();
      const defaults = CHORD_SCALES[q.sym];
      expect(defaults, `CHORD_SCALES has no entry for '${q.sym}'`).toBeTruthy();
      for (const name of defaults!) expect(SCALES[name], `unknown scale '${name}'`).toBeTruthy();
      expect(explainLine([60] as MidiNote[], { root: 0 as PitchClass, quality: q.sym })).not.toBeNull();
    });
  }
});
