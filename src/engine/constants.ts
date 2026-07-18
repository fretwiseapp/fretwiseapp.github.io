import type { Tuning, TuningName, Key } from './types';

/** Sharp note names by pitch class. */
export const SHARP: readonly string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Flat note names by pitch class. */
export const FLAT: readonly string[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Standard and alternate tunings as MIDI note numbers (low to high: E A D G B e in standard).
 * E2=40, A2=45, D3=50, G3=55, B3=59, E4=64.
 */
export const TUNINGS: Readonly<Record<TuningName, Tuning>> = {
  standard: [40, 45, 50, 55, 59, 64],
  dropD:    [38, 45, 50, 55, 59, 64],
  dadgad:   [38, 45, 50, 55, 57, 62],
  openG:    [38, 43, 50, 55, 59, 62],
  halfDown: [39, 44, 49, 54, 58, 63],
} as const;

/**
 * Preferred accidental by key.
 * 's' = sharp-preference, 'f' = flat-preference, 'n' = neutral (context-dependent).
 * Follows circle-of-fifths convention.
 */
export const KEY_PREFS: Readonly<Record<Exclude<Key, 'auto'>, 's' | 'f' | 'n'>> = {
  'C': 'n',
  'G': 's', 'D': 's', 'A': 's', 'E': 's', 'B': 's', 'F#': 's',
  'F': 'f', 'Bb': 'f', 'Eb': 'f', 'Ab': 'f', 'Db': 'f', 'Gb': 'f',
} as const;

/**
 * Total frets rendered on the stage fretboard.
 *
 * 22 is the most common modern electric-guitar count (Fender Strat/Tele since the
 * '80s, most PRS, Ibanez, Music Man, Schecter). 21 (vintage Fender) and 24 (Ibanez
 * shred, most 7/8-string) are the other common counts; classical and many acoustics
 * have 19–20. We render 22 because it covers the full working range of popular-
 * music guitar and gives room for upper-position voicings and the two-octave mark.
 *
 * Dot inlays follow the Gibson/Fender convention: 3, 5, 7, 9, 12 (double), 15, 17,
 * 19, 21 (double). Some makers use 22 instead of 21 for the second double-dot but
 * 21 is more common across Fender and Gibson.
 */
export const FRET_COUNT = 22;
