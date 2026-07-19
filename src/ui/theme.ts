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

/**
 * By pitch class (0..11). A modernized, cooler chromatic wheel — 12 hues must stay
 * distinct for the fretboard to be readable, so this can't collapse into a single
 * indigo ramp. It is retuned to harmonize with the brand: muted, contemporary stops,
 * anchored on the brand indigo at G#/Ab.
 */
export const NOTE_COLORS: readonly string[] = [
  '#ef4444', // C   red
  '#f97316', // C#/Db   orange
  '#f59e0b', // D   amber
  '#eab308', // D#/Eb   yellow
  '#84cc16', // E   lime
  '#22c55e', // F   green
  '#14b8a6', // F#/Gb   teal
  '#06b6d4', // G   cyan
  '#635bff', // G#/Ab   indigo (brand anchor)
  '#8b5cf6', // A   violet
  '#a855f7', // A#/Bb   purple
  '#ec4899', // B   pink
];

/**
 * By chord degree string. Each degree has a fixed color regardless of key.
 * Indigo semantic field: a cohesive cool ramp anchored on the brand indigo (root),
 * spaced by hue + lightness so degrees stay distinguishable.
 *   1 indigo · 3 blue · 5 cyan · 9 violet · 11 teal · 6/13 periwinkle · 7 slate
 */
export const DEGREE_COLORS: Readonly<Record<string, string>> = {
  '1':   '#635bff', // root — brand indigo
  'b9':  '#a78bfa', '9':  '#8b5cf6', '#9': '#7c3aed',   // 9 family — violet
  'b3':  '#2563eb', '3':  '#3b82f6', // 3 family — blue
  '11':  '#14b8a6', '#11': '#0d9488', 'b5': '#0d9488',  // 4/11 family — teal
  '5':   '#22d3ee', // 5 — cyan
  '#5':  '#06b6d4', 'b13': '#06b6d4',                   // #5/b13 — deep cyan
  '6':   '#818cf8', '13':  '#6366f1',                   // 6/13 — periwinkle
  'b7':  '#64748b', 'bb7': '#94a3b8',                   // 7-family — slate
  '7':   '#475569',
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
export const ROOT_HIGHLIGHT = '#c7d2fe';

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
