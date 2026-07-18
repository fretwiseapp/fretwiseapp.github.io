/**
 * Core types for the Fretwise engine.
 *
 * PitchClass: integer 0..11 representing one of 12 chroma (C=0, C#=1, ..., B=11).
 * MidiNote: standard MIDI note number (e.g. A4 = 69).
 * Fret: a non-negative integer representing the fret played on a string, or 'muted'/'x' if the string is silenced.
 *
 * NOTE on 'x' vs 'muted': SHAPES (static voicing database) use 'x' to represent muted strings
 * (short, matches chord chart notation). Runtime Strings arrays use 'muted' (more descriptive).
 * The `buildVoicing` function converts from one to the other. Respect this boundary rigorously.
 */

export type PitchClass = number; // 0..11
export type MidiNote = number;
export type Fret = number | 'muted';
export type ShapeFret = number | 'x';

export type Strings = [Fret, Fret, Fret, Fret, Fret, Fret];
export type ShapeStrings = [ShapeFret, ShapeFret, ShapeFret, ShapeFret, ShapeFret, ShapeFret];
export type Tuning = readonly [MidiNote, MidiNote, MidiNote, MidiNote, MidiNote, MidiNote];

/** A chord quality definition (Cmaj7, Dm7, etc. — abstracted from root). */
export interface Quality {
  /** Symbol appended to root name, e.g. 'maj7', 'm7', '' for major triad. */
  sym: string;
  /** Full Spanish description. */
  full: string;
  /** Required intervals (semitones from root). */
  req: number[];
  /** Intervals that are omittable without losing identity (e.g. the 5 in most chords). */
  omit: number[];
  /** Base identification priority — higher wins ties. */
  prio: number;
}

/**
 * Family taxonomy for voicing shapes:
 *   - 'caged': the five moveable CAGED patterns (C, A, G, E, D shapes) plus
 *              open/barré forms. These are the "positions" of the chord on
 *              the neck — same chord tones, different hand locations.
 *   - 'drop2': jazz drop-2 voicings on any four-string set (4321, 5432, etc.).
 *   - 'drop3': jazz drop-3 voicings (typically 6432 with A muted).
 *   - 'invHigh': upper-register triad inversions on the GBe string set.
 * Used by the fretboard's filter UI so the user can show/hide each category.
 */
export type VoicingFamily = 'caged' | 'drop2' | 'drop3' | 'invHigh';

/** A single voicing shape (abstract, movable via baseRoot+shift). */
export interface VoicingShape {
  baseRoot: PitchClass;
  shape: ShapeStrings;
  label: string;
  /** Categorization for filtering. Defaults to 'caged' when unspecified. */
  family?: VoicingFamily;
}

/** A concrete realized voicing with actual fret numbers. */
export interface Voicing {
  idx: number;
  label: string;
  strings: Strings;
  inversion: string;     // 'raíz' | '1ra inv.' | '2da inv.' | '3ra inv.' | 'ext'
  bassName: string;      // spelled bass note
  bassPc: PitchClass | null;
  family: VoicingFamily;
  /** Octave offset from the base shape position: 0 = first playable, 1 = +12 frets. */
  octave: number;
}

/** Result of identifying a chord from a set of pitch classes. */
export interface IdentifiedChord {
  root: PitchClass;
  quality: Quality;
  score: number;
  missing: number;
  extras: number[];
  pass: 'strict' | 'relaxed';
}

/** Container for extracted pitch-class info from a Strings array. */
export interface PcExtraction {
  pcs: PitchClass[];
  bassPc: PitchClass | null;
  midi: MidiNote[];
}

export type Key = 'auto' | 'C' | 'G' | 'D' | 'A' | 'E' | 'B' | 'F#' | 'F' | 'Bb' | 'Eb' | 'Ab' | 'Db' | 'Gb';

export type DisplayMode = 'note' | 'deg';
export type ViewMode = 'chord' | 'arp' | 'scale' | 'both';
export type TuningName = 'standard' | 'dropD' | 'dadgad' | 'openG' | 'halfDown';
