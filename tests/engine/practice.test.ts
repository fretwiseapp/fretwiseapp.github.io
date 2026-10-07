import { describe, it, expect } from 'vitest';
import { SCALES } from '../../src/data/scales';
import { TUNINGS } from '../../src/engine/constants';
import {
  PPQ, DUR, ticksPerBar, ticksToSeconds, secondsToTicks, barBeat, makeSequence, eventAt,
} from '../../src/engine/time';
import type { NoteEvent } from '../../src/engine/time';
import {
  placementsOf, pitchesInWindow, fingerSequence, fretSpan,
} from '../../src/engine/fingering';
import type { NeckWindow } from '../../src/engine/fingering';
import { buildScaleExercise } from '../../src/engine/generate';

const STD = TUNINGS.standard;
const win = (minFret: number, maxFret: number, allowOpen = false): NeckWindow =>
  ({ tuning: STD, minFret, maxFret, allowOpen });

/* ------------------------------------------------------------------ time -- */

describe('time — tick arithmetic', () => {
  it('converts a quarter note at 120 bpm to half a second', () => {
    expect(ticksToSeconds(PPQ, 120)).toBeCloseTo(0.5, 10);
    expect(ticksToSeconds(PPQ * 4, 60)).toBeCloseTo(4, 10);
  });

  it('round-trips ticks through seconds at awkward tempos', () => {
    for (const bpm of [57, 72, 100, 133, 208]) {
      for (const t of [0, 1, PPQ / 3, PPQ, 7 * PPQ + 13]) {
        expect(secondsToTicks(ticksToSeconds(t, bpm), bpm)).toBeCloseTo(t, 6);
      }
    }
  });

  it('divides PPQ exactly for every note value we ship', () => {
    // The point of 480: no rounding in the grid. If one of these ever produces a
    // fraction, sequences built from it will drift against the metronome.
    for (const d of Object.values(DUR)) expect(Number.isInteger(d)).toBe(true);
    for (const n of [2, 3, 4, 5, 6, 8]) expect(PPQ % n).toBe(0);
  });

  it('counts bars and beats the way a musician does (1-based)', () => {
    expect(barBeat(0, 4)).toEqual({ bar: 1, beat: 1, tickInBeat: 0 });
    expect(barBeat(PPQ, 4)).toEqual({ bar: 1, beat: 2, tickInBeat: 0 });
    expect(barBeat(PPQ * 4, 4)).toEqual({ bar: 2, beat: 1, tickInBeat: 0 });
    expect(barBeat(PPQ * 3 + 240, 3)).toEqual({ bar: 2, beat: 1, tickInBeat: 240 });
  });
});

describe('time — makeSequence', () => {
  const ev = (tick: number, dur = PPQ): NoteEvent => ({ tick, dur, midi: 60, string: 0, fret: 0 });

  it('sorts events by tick regardless of input order', () => {
    const s = makeSequence([ev(PPQ * 2), ev(0), ev(PPQ)], 4);
    expect(s.events.map((e) => e.tick)).toEqual([0, PPQ, PPQ * 2]);
  });

  it('pads the length up to a whole bar so loops stay musical', () => {
    // Five quarter notes in 4/4 spill into bar 2 — the loop must run two full bars,
    // not stop on beat 2, or the exercise loses the pulse every time round.
    const s = makeSequence(Array.from({ length: 5 }, (_, i) => ev(i * PPQ)), 4);
    expect(s.lengthTicks).toBe(ticksPerBar(4) * 2);
  });

  it('never returns a zero-length sequence', () => {
    expect(makeSequence([], 4).lengthTicks).toBe(ticksPerBar(4));
  });
});

describe('time — eventAt', () => {
  const seq = makeSequence([
    { tick: 0, dur: 240, midi: 60, string: 0, fret: 0 },
    { tick: 480, dur: 240, midi: 62, string: 0, fret: 2 },
  ], 4);

  it('finds the sounding note', () => {
    expect(eventAt(seq, 100).current?.midi).toBe(60);
  });

  it('reports no current note inside a rest, but still sees the next one', () => {
    const at = eventAt(seq, 300);
    expect(at.current).toBeNull();
    expect(at.next?.midi).toBe(62);
  });

  it('has no next note past the last onset', () => {
    expect(eventAt(seq, 10_000).next).toBeNull();
  });
});

/* ------------------------------------------------------------- fingering -- */

describe('fingering — placements', () => {
  it('finds every place a pitch lives inside the window', () => {
    // E4 (64) is the open high E, and also fret 5 of the B string (59 + 5).
    expect(placementsOf(64, win(1, 5))).toEqual([{ string: 4, fret: 5, midi: 64 }]);
    expect(placementsOf(64, win(1, 5, true))).toEqual([
      { string: 4, fret: 5, midi: 64 },
      { string: 5, fret: 0, midi: 64 },
    ]);
  });

  it('excludes pitches below a string and outside the window', () => {
    expect(placementsOf(30, win(1, 22))).toEqual([]);   // below the low E
    expect(placementsOf(64, win(10, 12))).toEqual([]);  // E4 lives nowhere in frets 10–12
  });

  it('only admits open strings when asked', () => {
    expect(pitchesInWindow([4], win(1, 4))).not.toContain(64);
    expect(pitchesInWindow([4], win(1, 4, true))).toContain(64);
  });
});

describe('fingering — the Viterbi assignment', () => {
  const cMajor = SCALES['Mayor (Jónica)']!.map((iv) => iv % 12);

  it('returns null rather than a wrong answer when a pitch is unreachable', () => {
    expect(fingerSequence([64, 200], win(1, 5))).toBeNull();
  });

  it('handles the empty sequence', () => {
    expect(fingerSequence([], win(1, 5))).toEqual([]);
  });

  it('never leaves the window', () => {
    const w = win(5, 9);
    const got = fingerSequence(pitchesInWindow(cMajor, w), w)!;
    expect(got.length).toBeGreaterThan(5);
    for (const p of got) {
      expect(p.fret).toBeGreaterThanOrEqual(5);
      expect(p.fret).toBeLessThanOrEqual(9);
    }
    expect(fretSpan(got)).toBeLessThanOrEqual(4);
  });

  it('places every note where it actually sounds', () => {
    // The one check that catches an off-by-one anywhere in the chain: the pitch
    // the engine promises must be the pitch that string and fret produce.
    const w = win(1, 5, true);
    const got = fingerSequence(pitchesInWindow(cMajor, w), w)!;
    for (const p of got) expect(STD[p.string]! + p.fret).toBe(p.midi);
  });

  it('walks up the strings for an ascending line instead of doubling back', () => {
    // A naive "first match wins" picks a placement per note in isolation and
    // produces a zig-zag. Within one position an ascending scale should only ever
    // move to a higher string.
    const w = win(5, 9);
    const got = fingerSequence(pitchesInWindow(cMajor, w), w)!;
    for (let i = 1; i < got.length; i++) {
      expect(got[i]!.string).toBeGreaterThanOrEqual(got[i - 1]!.string);
    }
  });

  it('works in a tuning it was never written for', () => {
    const w: NeckWindow = { tuning: TUNINGS.dadgad, minFret: 3, maxFret: 7 };
    const got = fingerSequence(pitchesInWindow(cMajor, w), w)!;
    expect(got.length).toBeGreaterThan(4);
    for (const p of got) expect(TUNINGS.dadgad[p.string]! + p.fret).toBe(p.midi);
  });
});

/* -------------------------------------------------------------- generate -- */

describe('generate — scale exercises', () => {
  const base = { root: 0, scaleName: 'Pentatónica menor', window: win(5, 8) };

  it('refuses an unknown scale instead of inventing one', () => {
    expect(buildScaleExercise({ ...base, scaleName: 'No existe' })).toBeNull();
  });

  it('refuses a window too narrow to hold an exercise', () => {
    // F# Hirajoshi {6,8,9,1,2} meets standard tuning at fret 1 on exactly one
    // string (G#, 3rd string). A single note is not an exercise.
    expect(buildScaleExercise({ root: 6, scaleName: 'Hirajoshi', window: win(1, 1) })).toBeNull();
    // A degenerate window (min above max) holds nothing at all.
    expect(buildScaleExercise({ root: 0, scaleName: 'Mayor (Jónica)', window: win(9, 5) })).toBeNull();
  });

  it('derives a stable id from the options alone', () => {
    const a = buildScaleExercise(base)!;
    const b = buildScaleExercise({ ...base })!;
    expect(a.id).toBe(b.id);
    expect(a.id).toBe('scale:pentatonica-menor:c:f5-8:closed:up');
    // Any option that changes the notes must change the id, or progress records
    // start pointing at the wrong exercise.
    expect(buildScaleExercise({ ...base, root: 2 })!.id).not.toBe(a.id);
    expect(buildScaleExercise({ ...base, direction: 'upDown' })!.id).not.toBe(a.id);
    expect(buildScaleExercise({ ...base, window: win(5, 8, true) })!.id).not.toBe(a.id);
  });

  it('turns around once and lands back home on upDown', () => {
    const up = buildScaleExercise({ ...base, direction: 'up' })!;
    const ud = buildScaleExercise({ ...base, direction: 'upDown' })!;
    const n = up.sequence.events.length;
    expect(ud.sequence.events.length).toBe(n * 2 - 1);
    expect(ud.sequence.events[0]!.midi).toBe(ud.sequence.events[ud.sequence.events.length - 1]!.midi);
    // The top note is played once, not twice in a row.
    const mids = ud.sequence.events.map((e) => e.midi);
    expect(mids.indexOf(Math.max(...mids))).toBe(n - 1);
  });

  it('reverses exactly for down', () => {
    const up = buildScaleExercise({ ...base, direction: 'up' })!;
    const down = buildScaleExercise({ ...base, direction: 'down' })!;
    expect(down.sequence.events.map((e) => e.midi))
      .toEqual([...up.sequence.events.map((e) => e.midi)].reverse());
  });

  it('lays notes on an unbroken grid', () => {
    const ex = buildScaleExercise({ ...base, noteValue: DUR.eighth })!;
    ex.sequence.events.forEach((e, i) => {
      expect(e.tick).toBe(i * DUR.eighth);
      expect(e.dur).toBe(DUR.eighth);
    });
  });
});

describe('generate — sweep across scales, keys, windows and tunings', () => {
  const scaleNames = Object.keys(SCALES);
  const tunings = ['standard', 'dropD', 'dadgad'] as const;
  const windows: readonly [number, number, boolean][] = [
    [1, 5, true], [3, 7, false], [5, 9, false], [7, 11, false], [12, 15, false],
  ];

  // ~6.6k exercises × ~20 notes. Failures are collected rather than asserted
  // per note: an expect() per iteration costs half a million calls and turns a
  // sub-second sweep into ten seconds.
  it('covers every scale in every key without producing a wrong note', () => {
    let built = 0;
    const bad: string[] = [];
    const fail = (ex: { id: string }, why: string): void => {
      if (bad.length < 10) bad.push(`${ex.id}: ${why}`);
    };

    for (const scaleName of scaleNames) {
      for (let root = 0; root < 12; root++) {
        for (const [lo, hi, open] of windows) {
          for (const t of tunings) {
            const tuning = TUNINGS[t];
            const ex = buildScaleExercise({
              root,
              scaleName,
              window: { tuning, minFret: lo, maxFret: hi, allowOpen: open },
              direction: 'upDown',
            });
            if (!ex) continue;
            built++;

            const allowed = new Set(ex.pcs);
            let prevTick = -1;
            for (const e of ex.sequence.events) {
              // Placement must sound the pitch it claims.
              if (tuning[e.string]! + e.fret !== e.midi) fail(ex, `string ${e.string} fret ${e.fret} ≠ midi ${e.midi}`);
              // Every note must belong to the scale — no accidental chromatics.
              if (!allowed.has(e.midi % 12)) fail(ex, `midi ${e.midi} is outside the scale`);
              // Frets must stay inside the window (0 only when open was allowed).
              if (e.fret === 0) { if (!open) fail(ex, 'open string in a closed window'); }
              else if (e.fret < lo || e.fret > hi) fail(ex, `fret ${e.fret} outside ${lo}–${hi}`);
              // Time must move forward.
              if (e.tick <= prevTick) fail(ex, `tick ${e.tick} does not advance`);
              prevTick = e.tick;
            }
            // The sequence must fit the bars it claims to occupy.
            const last = ex.sequence.events[ex.sequence.events.length - 1]!;
            if (ex.sequence.lengthTicks < last.tick + last.dur) fail(ex, 'length shorter than its own notes');
          }
        }
      }
    }
    expect(bad).toEqual([]);
    // Guard against the sweep silently degenerating to zero exercises.
    expect(built).toBeGreaterThan(2000);
  });
});
