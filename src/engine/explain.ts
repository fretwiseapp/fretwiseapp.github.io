/**
 * Explain a melodic line against a chord.
 *
 * This is the piece the rest of the product is built to enable. Showing *what*
 * to play is a commodity — every tab site does it. Saying *why* a note works is
 * what a teacher does, and it is the thing a lick library cannot be bought out
 * of: the same explanation applies to every line, in every key, forever, because
 * it is computed from the chord rather than written down next to a transcription.
 *
 * The classification is deliberately conservative. It names the four things a
 * player can actually act on — this note is the chord, this one colours it, this
 * one leans into the next one, this one is just passing through — and refuses to
 * invent certainty it does not have.
 *
 * Two honesty constraints, both load-bearing:
 *
 *  1. **"Avoid note" is a convention, not a law.** It means "a semitone above a
 *     chord tone, so it will sound unresolved if you land on it and stay" — a
 *     statement about tension, not about permission. Every one of these notes is
 *     played constantly, on purpose, by people who know what it does. The UI must
 *     never phrase it as a prohibition.
 *
 *  2. **An approach note outranks everything except a chord tone.** A note that
 *     resolves by step into a chord tone is doing its job regardless of how it
 *     scores in isolation — that is precisely why bebop lines are full of notes
 *     that look wrong in a vertical analysis. Classifying by context rather than
 *     by pitch alone is the whole point.
 *
 * Sources for the conventions encoded here: Mark Levine, *The Jazz Theory Book*
 * (chord/scale and avoid-note tables, chs. 2–5); Mulholland & Hojnacki, *The
 * Berklee Book of Jazz Harmony* (available tensions).
 */

import { qBySymbol } from './qualities';
import { CHORD_SCALES, SCALES } from '../data/scales';
import type { MidiNote, PitchClass } from './types';

export type NoteRole =
  /** 1, 3, 5, 7 (or 6) — the chord itself. Lands safely on any beat. */
  | 'chordTone'
  /** An available extension: colour, still consonant with the chord. */
  | 'tension'
  /** A scale tone a semitone above a chord tone — leans, wants to move. */
  | 'avoid'
  /** Resolves by step into the next chord tone. Context, not pitch, decides this. */
  | 'approach'
  /** In the scale, on the way somewhere, not a chord tone. */
  | 'passing'
  /** Neither in the chord nor in the scale. */
  | 'outside';

export interface NoteExplanation {
  /** Position in the line. */
  index: number;
  midi: MidiNote;
  pc: PitchClass;
  role: NoteRole;
  /** Semitones above the chord root, 0..11. */
  interval: number;
  /** How the note reads against the chord: '1', '♭3', '♯11', '13'… */
  degree: string;
  /** One sentence, ready for the UI. */
  note: string;
}

export interface LineExplanation {
  notes: NoteExplanation[];
  /** The scale the line was read against. */
  scaleName: string;
  /** Count per role, for a summary line. */
  counts: Readonly<Record<NoteRole, number>>;
}

export interface ChordRef {
  root: PitchClass;
  /** Quality symbol as used by SHAPES/Q: '', 'm7', 'maj7', '7alt'… */
  quality: string;
}

/**
 * How an interval reads when it IS part of the chord. A minor third is a ♭3 in a
 * minor chord; calling it a ♯9 there would be nonsense.
 */
const CHORD_DEGREE: readonly string[] =
  ['1', '♭9', '9', '♭3', '3', '4', '♭5', '5', '♯5', '6', '♭7', '7'];

/** How the same interval reads when it is NOT a chord tone — i.e. as a tension. */
const TENSION_DEGREE: readonly string[] =
  ['1', '♭9', '9', '♯9', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'];

/** A step: chromatic (1) or diatonic (2). Wider than that is a leap, not an approach. */
const MAX_APPROACH_STEP = 2;

const EMPTY_COUNTS: Readonly<Record<NoteRole, number>> = {
  chordTone: 0, tension: 0, avoid: 0, approach: 0, passing: 0, outside: 0,
};

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** Pitch classes of the chord, as intervals above its root. */
export function chordIntervals(quality: string): number[] | null {
  const q = qBySymbol(quality);
  if (!q) return null;
  // Deduplicated mod 12: a 13th chord lists 9 and 13 above the octave in theory
  // but on a fretboard they are the same chroma as the 2 and the 6.
  return [...new Set(q.req.map(mod12))].sort((a, b) => a - b);
}

/**
 * The scale to read the line against. An explicit choice wins; otherwise the
 * chord/scale table picks one, which is what a player would default to anyway.
 */
function resolveScale(quality: string, explicit?: string): { name: string; intervals: readonly number[] } | null {
  const name = explicit ?? CHORD_SCALES[quality]?.[0];
  if (!name) return null;
  const intervals = SCALES[name];
  return intervals ? { name, intervals } : null;
}

function sentence(role: NoteRole, degree: string): string {
  switch (role) {
    case 'chordTone':
      return `${degree} del acorde — podés aterrizar acá y quedarte.`;
    case 'tension':
      return `${degree} — color sobre el acorde, suena sin tensión que resolver.`;
    case 'avoid':
      // Phrased as what it does, never as a rule. See the header note.
      return `${degree} — a un semitono de una nota del acorde: tira, no se queda quieta.`;
    case 'approach':
      return `${degree} — entra por paso a la nota del acorde que sigue.`;
    case 'passing':
      return `${degree} — de paso, en camino a otra nota.`;
    case 'outside':
      return `${degree} — fuera de la escala: funciona si la resolvés.`;
  }
}

/**
 * Classify every note of a line against one chord.
 *
 * `midis` is the line in order. Order matters: approach notes are identified by
 * where they go, so the same pitch can be an approach note in one line and a
 * passing note in another.
 */
export function explainLine(
  midis: readonly MidiNote[],
  chord: ChordRef,
  opts: { scaleName?: string } = {}
): LineExplanation | null {
  const chordIvs = chordIntervals(chord.quality);
  if (!chordIvs) return null;
  const scale = resolveScale(chord.quality, opts.scaleName);
  if (!scale) return null;

  const chordSet = new Set(chordIvs);
  // Scale degrees are relative to the chord root: chord/scale thinking reads
  // Mixolydian over G7 from G, not from the key the tune happens to be in.
  const scaleSet = new Set(scale.intervals.map(mod12));
  // A note is "avoid" when it sits a semitone above a chord tone.
  const semitoneAboveChordTone = new Set(chordIvs.map((iv) => mod12(iv + 1)));

  const isChordTone = (midi: MidiNote): boolean => chordSet.has(mod12(midi - chord.root));

  const notes: NoteExplanation[] = midis.map((midi, index) => {
    const interval = mod12(midi - chord.root);
    const inChord = chordSet.has(interval);
    const inScale = scaleSet.has(interval);
    const degree = inChord ? CHORD_DEGREE[interval]! : TENSION_DEGREE[interval]!;

    let role: NoteRole;
    if (inChord) {
      role = 'chordTone';
    } else {
      const next = midis[index + 1];
      const resolvesByStep =
        next !== undefined && Math.abs(next - midi) <= MAX_APPROACH_STEP && isChordTone(next);
      if (resolvesByStep) {
        role = 'approach';
      } else if (!inScale) {
        role = 'outside';
      } else if (semitoneAboveChordTone.has(interval)) {
        role = 'avoid';
      } else {
        role = 'passing';
      }
    }

    return { index, midi, pc: mod12(midi), role, interval, degree, note: sentence(role, degree) };
  });

  const counts = { ...EMPTY_COUNTS };
  for (const n of notes) counts[n.role]++;

  return { notes, scaleName: scale.name, counts };
}

/**
 * A tension is "available" when it is in the chord/scale and is not a semitone
 * above a chord tone. This is the vertical view — what you can hold over the
 * chord — as opposed to explainLine, which reads a line horizontally.
 */
export function availableTensions(chord: ChordRef, scaleName?: string): number[] {
  const chordIvs = chordIntervals(chord.quality);
  if (!chordIvs) return [];
  const scale = resolveScale(chord.quality, scaleName);
  if (!scale) return [];
  const chordSet = new Set(chordIvs);
  const clashes = new Set(chordIvs.map((iv) => mod12(iv + 1)));
  return scale.intervals
    .map(mod12)
    .filter((iv) => !chordSet.has(iv) && !clashes.has(iv))
    .sort((a, b) => a - b);
}

/** Degree label for an interval above a chord root, read as a tension. */
export function tensionDegree(interval: number): string {
  return TENSION_DEGREE[mod12(interval)]!;
}
