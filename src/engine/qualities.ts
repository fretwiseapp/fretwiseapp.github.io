import type { Quality } from './types';

/**
 * The canonical chord quality dictionary.
 * Each entry: [symbol, full-name-es, required-intervals, omittable-intervals, priority].
 *
 * Sources:
 *  - Mark Levine, *The Jazz Theory Book* (Sher Music, 1995) — chord-type taxonomy,
 *    drop-2 voicings, altered-dominant conventions.
 *  - Joe Mulholland & Tom Hojnacki, *The Berklee Book of Jazz Harmony* (2013) —
 *    chord-symbol standards, function, avoid notes.
 *  - Vincent Persichetti, *Twentieth-Century Harmony* (1961) — extended tertian,
 *    polychords, quartal structures.
 *
 * Omittable intervals encode idiomatic omissions on guitar and in jazz voicings:
 *   - The 5 is the most common omission (doesn't define function).
 *   - The 11 is avoided in dominants with a natural 3 (creates b9 clash).
 *   - The 13 implies the 7; the 9 is optional when the 13 is present.
 *
 * Priority breaks ties when multiple qualities match a pitch-class set. Higher =
 * preferred reading. Extensions (9, 11, 13) rank above base 7ths so they win when
 * enough color tones are present.
 */
const RAW: Array<[string, string, number[], number[], number]> = [
  // Triads
  ['',     'Tríada mayor',         [0, 4, 7],               [],      55],
  ['m',    'Tríada menor',         [0, 3, 7],               [],      55],
  ['dim',  'Tríada disminuida',    [0, 3, 6],               [],      55],
  ['aug',  'Tríada aumentada',     [0, 4, 8],               [],      52],
  ['sus2', 'Suspendido 2',         [0, 2, 7],               [],      45],
  ['sus4', 'Suspendido 4',         [0, 5, 7],               [],      45],

  // Sixths
  ['6',    'Sexta mayor',          [0, 4, 7, 9],            [7],     60],
  ['m6',   'Sexta menor',          [0, 3, 7, 9],            [7],     60],
  ['6/9',  'Sexta con 9',          [0, 2, 4, 7, 9],         [7],     72],

  // Sevenths
  ['maj7',  'Séptima mayor',       [0, 4, 7, 11],           [7],     68],
  ['m7',    'Menor 7ma',           [0, 3, 7, 10],           [7],     68],
  ['7',     'Dominante',           [0, 4, 7, 10],           [7],     68],
  ['mMaj7', 'Menor mayor 7',       [0, 3, 7, 11],           [7],     62],
  ['dim7',  'Disminuido 7',        [0, 3, 6, 9],            [],      70],
  ['m7b5',  'Semidisminuido',      [0, 3, 6, 10],           [],      70],
  ['7b5',   '7♭5',                 [0, 4, 6, 10],           [],      58],
  ['maj7#5','maj7#5',              [0, 4, 8, 11],           [],      58],
  ['7#5',   '7#5 (aumentada)',     [0, 4, 8, 10],           [],      60],

  // Add chords
  ['add9',    'Add 9',             [0, 2, 4, 7],            [7],     58],
  ['m(add9)', 'm add 9',           [0, 2, 3, 7],            [7],     58],
  ['add11',   'Add 11',            [0, 4, 5, 7],            [7],     50],

  // Ninths
  ['maj9', 'Mayor 9',              [0, 2, 4, 7, 11],        [7],     78],
  ['m9',   'Menor 9',              [0, 2, 3, 7, 10],        [7],     78],
  ['9',    'Dominante 9',          [0, 2, 4, 7, 10],        [7],     78],
  ['7b9',  '7♭9',                  [0, 1, 4, 7, 10],        [7],     75],
  ['7#9',  '7#9',                  [0, 3, 4, 7, 10],        [7],     75],
  ['mMaj9','mMaj9',                [0, 2, 3, 7, 11],        [7],     70],

  // Elevenths
  ['m11',     'Menor 11',          [0, 2, 3, 5, 7, 10],     [7, 2],  82],
  ['11',      'Dominante 11',      [0, 2, 5, 7, 10],        [7, 2],  74],
  ['maj7#11', 'Maj7#11 (Lydian)',  [0, 4, 6, 7, 11],        [7],     80],
  ['7#11',    '7#11',              [0, 4, 6, 7, 10],        [7],     78],
  ['9#11',    '9#11',              [0, 2, 4, 6, 7, 10],     [7],     82],
  ['maj9#11', 'Maj9#11',           [0, 2, 4, 6, 7, 11],     [7],     82],

  // Thirteenths & altered
  ['13',      'Dominante 13',      [0, 4, 7, 9, 10],        [7, 4],  84],
  ['maj13',   'Maj13',             [0, 4, 7, 9, 11],        [7],     82],
  ['m13',     'Menor 13',          [0, 3, 7, 9, 10],        [7],     82],
  ['13b9',    '13♭9',              [0, 1, 4, 7, 9, 10],     [7],     80],
  ['7b13',    '7♭13',              [0, 4, 7, 8, 10],        [7],     74],
  ['7#5#9',   'alt (#5#9)',        [0, 3, 4, 8, 10],        [],      76],
  ['7b5b9',   'alt (♭5♭9)',        [0, 1, 4, 6, 10],        [],      76],
];

export const Q: ReadonlyArray<Quality> = RAW.map(([sym, full, req, omit, prio]) => ({
  sym, full, req, omit, prio,
}));

/** Lookup a quality by its symbol. */
export function qBySymbol(sym: string): Quality | undefined {
  return Q.find((q) => q.sym === sym);
}

/** True iff the quality symbol represents a minor-family chord (has a minor 3rd). */
export function isMinorQuality(sym: string): boolean {
  return /^(m(?!aj)|dim|m7|m6|m9|m11|m13|mMaj)/.test(sym);
}
