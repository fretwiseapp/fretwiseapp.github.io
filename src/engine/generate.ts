/**
 * Generated practice material.
 *
 * The cheapest content is content nobody has to write. Scales, arpeggios and
 * patterns are fully determined by theory the engine already holds, so this
 * module derives them instead of shipping a library of hand-authored exercises.
 * That is the whole reason the practice surface can launch with infinite
 * material at zero authoring cost — and why hand-written licks can wait until
 * the machinery is proven.
 *
 * Everything here is pure: given the same options it returns the same exercise,
 * on any machine, forever. That matters more than it sounds — progress records
 * point at exercise ids, so an id has to mean the same thing next year.
 */

import { SCALES } from '../data/scales';
import { SHARP } from './constants';
import { fingerSequence, pitchesInWindow } from './fingering';
import type { NeckWindow } from './fingering';
import { DUR, makeSequence } from './time';
import type { NoteEvent, Sequence } from './time';
import type { PitchClass } from './types';

/** Up, down, or up and back without repeating the turnaround note. */
export type Direction = 'up' | 'down' | 'upDown';

export interface ScaleExerciseOptions {
  root: PitchClass;
  /** Key of `SCALES` — e.g. 'Pentatónica menor'. */
  scaleName: string;
  window: NeckWindow;
  direction?: Direction;
  /** Ticks per note. Defaults to eighth notes. */
  noteValue?: number;
  beatsPerBar?: number;
}

export interface ScaleExercise {
  /**
   * Stable identifier, derived entirely from the options. Generated content has
   * no database row to borrow an id from, so the parameters *are* the id — which
   * also means an exercise can be reconstructed from its id alone, and a user's
   * history never points at something that no longer exists.
   */
  id: string;
  title: string;
  sequence: Sequence;
  /** Pitch classes of the scale, for the fretboard overlay and the explain layer. */
  pcs: PitchClass[];
  root: PitchClass;
  scaleName: string;
  direction: Direction;
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // strip accents: 'Pentatónica' → 'Pentatonica'
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a position scale: every scale note available inside the neck window,
 * played in order, at a steady note value.
 *
 * Lowest note to highest rather than root-to-root. In a fixed hand position the
 * root is rarely the lowest available note, and forcing the line to start on it
 * either leaves notes of the box unplayed or drags the hand out of position —
 * the thing a position exercise exists to train. The root is still marked, so
 * the player always sees where home is.
 *
 * Returns null when the scale name is unknown or the window holds fewer than two
 * notes (a one-note "exercise" is a bug in the caller's window, not material).
 */
export function buildScaleExercise(opts: ScaleExerciseOptions): ScaleExercise | null {
  const intervals = SCALES[opts.scaleName];
  if (!intervals) return null;

  const root = ((opts.root % 12) + 12) % 12;
  const pcs = intervals.map((iv) => (root + iv) % 12);
  const direction: Direction = opts.direction ?? 'up';
  const noteValue = opts.noteValue ?? DUR.eighth;
  const beatsPerBar = opts.beatsPerBar ?? 4;

  const ascending = pitchesInWindow(pcs, opts.window);
  if (ascending.length < 2) return null;

  let pitches: number[];
  if (direction === 'up') pitches = ascending;
  else if (direction === 'down') pitches = [...ascending].reverse();
  // Up then back down, landing on the note it started from. The turnaround note
  // is played once, the way anyone actually practises a scale.
  else pitches = [...ascending, ...[...ascending].reverse().slice(1)];

  const placements = fingerSequence(pitches, opts.window);
  if (!placements) return null;

  const events: NoteEvent[] = placements.map((p, i) => ({
    tick: i * noteValue,
    dur: noteValue,
    midi: p.midi,
    string: p.string,
    fret: p.fret,
  }));

  const w = opts.window;
  const id = [
    'scale',
    slug(opts.scaleName),
    SHARP[root]!.toLowerCase().replace('#', 's'),
    `f${w.minFret}-${w.maxFret}`,
    w.allowOpen === true ? 'open' : 'closed',
    direction.toLowerCase(),
  ].join(':');

  return {
    id,
    title: `${SHARP[root]} ${opts.scaleName} · trastes ${w.minFret}–${w.maxFret}`,
    sequence: makeSequence(events, beatsPerBar),
    pcs,
    root,
    scaleName: opts.scaleName,
    direction,
  };
}
