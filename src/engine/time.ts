/**
 * Musical time for the practice surface.
 *
 * Everything Fretwise did until now was *instantaneous*: a set of pitch classes
 * with no notion of before or after. Practising needs the opposite — ordered
 * events with durations — so this module adds the time axis and nothing else.
 * It is pure arithmetic: no audio, no DOM, no scheduling. The transport that
 * actually plays a Sequence lives in `audio/`, and it reads these numbers.
 *
 * Why ticks and not seconds: a Sequence has to survive a tempo change without
 * being rebuilt, and floating-point seconds accumulate rounding error when you
 * add up a few hundred eighth notes. Ticks are integers and tempo-independent;
 * seconds are derived at the last possible moment, by the scheduler.
 *
 * PPQ (pulses per quarter note) = 480 is the MIDI-sequencer convention. It is
 * divisible by 2, 3, 4, 5, 6 and 8, so eighths, triplets, sixteenths, quintuplets
 * and sextuplets are all exact integers — no drift, no rounding in the grid.
 */

import type { MidiNote } from './types';

/** Ticks per quarter note. */
export const PPQ = 480;

/** Common note values, in ticks. */
export const DUR = {
  whole: PPQ * 4,
  half: PPQ * 2,
  quarter: PPQ,
  eighth: PPQ / 2,
  triplet8: PPQ / 3,
  sixteenth: PPQ / 4,
} as const;

/**
 * One note to be played, placed in time and on the neck.
 *
 * `string`/`fret` are a *suggestion*, not a verification target: the same pitch
 * exists at several places on a guitar, and nothing that listens to a microphone
 * can tell which one the player used. We can grade which note was played and
 * when — never where it was fingered.
 */
export interface NoteEvent {
  /** Onset, in ticks from the start of the sequence. */
  tick: number;
  /** Sounding length, in ticks. */
  dur: number;
  midi: MidiNote;
  /** String index, 0 = lowest (6th / low E in standard tuning). */
  string: number;
  /** Fret number; 0 = open. */
  fret: number;
}

/**
 * A playable exercise: ordered events plus the grid they sit on.
 *
 * v1 assumes the beat is a quarter note, so `beatsPerBar` is the numerator of a
 * x/4 time signature. Compound meters (6/8) need a beat unit and are out of
 * scope until there is content that asks for them.
 */
export interface Sequence {
  /** Ordered by `tick`, ascending. Guaranteed by `makeSequence`. */
  events: readonly NoteEvent[];
  beatsPerBar: number;
  /** Total length in ticks, rounded up to a whole bar so loops are musical. */
  lengthTicks: number;
}

/** Ticks per bar at the given meter. */
export function ticksPerBar(beatsPerBar: number): number {
  return beatsPerBar * PPQ;
}

/** Convert ticks to seconds at a tempo. */
export function ticksToSeconds(ticks: number, bpm: number): number {
  return (ticks / PPQ) * (60 / bpm);
}

/** Convert seconds to ticks at a tempo. */
export function secondsToTicks(seconds: number, bpm: number): number {
  return (seconds * bpm * PPQ) / 60;
}

/** Where a tick falls on the grid. `bar` and `beat` are 1-based, as a musician counts. */
export function barBeat(tick: number, beatsPerBar: number): { bar: number; beat: number; tickInBeat: number } {
  const perBar = ticksPerBar(beatsPerBar);
  const bar = Math.floor(tick / perBar);
  const rem = tick - bar * perBar;
  const beat = Math.floor(rem / PPQ);
  return { bar: bar + 1, beat: beat + 1, tickInBeat: rem - beat * PPQ };
}

/**
 * Build a Sequence from loose events: sorts them and rounds the length up to a
 * whole bar. Looping a sequence that ends mid-bar drops the listener a beat
 * early and the exercise stops feeling like music, so the padding is deliberate.
 */
export function makeSequence(events: readonly NoteEvent[], beatsPerBar: number): Sequence {
  const sorted = [...events].sort((a, b) => a.tick - b.tick || a.string - b.string);
  const end = sorted.reduce((max, e) => Math.max(max, e.tick + e.dur), 0);
  const perBar = ticksPerBar(beatsPerBar);
  return {
    events: sorted,
    beatsPerBar,
    lengthTicks: Math.max(perBar, Math.ceil(end / perBar) * perBar),
  };
}

/**
 * The event sounding at `tick`, and the one after it — what a playhead needs to
 * highlight "now" and "next" on the fretboard.
 *
 * Linear scan: exercises are tens of events, and a binary search would be more
 * code than the saving is worth. Revisit if a sequence ever holds thousands.
 */
export function eventAt(seq: Sequence, tick: number): { current: NoteEvent | null; next: NoteEvent | null } {
  let current: NoteEvent | null = null;
  let next: NoteEvent | null = null;
  for (const e of seq.events) {
    if (e.tick <= tick && tick < e.tick + e.dur) current = e;
    else if (e.tick > tick) { next = e; break; }
  }
  return { current, next };
}
