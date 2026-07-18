/**
 * Color palettes — consistent across the app.
 *
 * Rules:
 *   1. Each pitch class has ONE color. Sharps and flats of the same pitch class share it.
 *      Example: C#=Db uses the same color.
 *   2. Each chord degree has ONE color. 1 is always red, 3 is always blue, etc. —
 *      independent of which note happens to be the 1 or the 3.
 *   3. Voicing-identifier colors are separate: used when stacking multiple voicings
 *      on the fretboard to visually distinguish each voicing from the others.
 */

/** By pitch class (0..11). C=red, D=orange, E=yellow, ..., B=violet. */
export const NOTE_COLORS: readonly string[] = [
  '#e63946', // C   red
  '#f47b3a', // C#/Db   red-orange
  '#f4a93a', // D   orange
  '#e5c82a', // D#/Eb   gold
  '#b6d64a', // E   yellow-green
  '#6ac04a', // F   green
  '#3aa894', // F#/Gb   teal
  '#2e86c1', // G   blue
  '#5e5ccd', // G#/Ab   indigo
  '#8e44ad', // A   purple
  '#c04198', // A#/Bb   magenta
  '#db3f7b', // B   rose
];

/** By chord degree string. Each degree has a fixed color regardless of which key. */
export const DEGREE_COLORS: Readonly<Record<string, string>> = {
  '1':   '#c0392b', // root — deep red
  'b9':  '#9b5eb0', '9':  '#7d3c98', '#9': '#5e3370',   // 9 family — purples
  'b3':  '#1f618d', '3':  '#2e86c1', // 3 family — blues
  '11':  '#16a085', '#11': '#117a65', 'b5': '#117a65',  // 4/11 family — teal
  '5':   '#f39c12', // 5 — amber
  '#5':  '#d35400', 'b13': '#d35400',                   // #5/b13 — burnt orange
  '6':   '#d68910', '13':  '#b9770e',                   // 6/13 — mustard
  'b7':  '#7f8c8d', 'bb7': '#566573',                   // 7-family — greys
  '7':   '#34495e',
};

/**
 * Color for each stacked voicing (position in stack → color).
 * Maximum 5 voicings can be stacked before colors repeat.
 */
export const VOICING_COLORS: readonly string[] = [
  '#e74c3c', // 1st voicing — red
  '#3498db', // 2nd — blue
  '#f39c12', // 3rd — orange
  '#27ae60', // 4th — green
  '#9b59b6', // 5th — purple
];

/** Color for the root-note highlight in degree mode (kept separate for UI contrast). */
export const ROOT_HIGHLIGHT = '#f59e0b';

/** Get color for a pitch class. Handles out-of-range defensively. */
export function colorForNote(pc: number): string {
  const idx = ((pc % 12) + 12) % 12;
  return NOTE_COLORS[idx]!;
}

/** Get color for a degree string. Falls back to a neutral grey if unknown. */
export function colorForDegree(deg: string): string {
  return DEGREE_COLORS[deg] ?? '#7f8c8d';
}

/** Get the voicing-identifier color for a stack-overlay index (modulo palette length). */
export function colorForVoicing(idx: number): string {
  return VOICING_COLORS[((idx % VOICING_COLORS.length) + VOICING_COLORS.length) % VOICING_COLORS.length]!;
}
