/**
 * Scale library covering diatonic modes, pentatonic, bebop, harmonic/melodic minor,
 * symmetric, and exotic scales.
 *
 * Each scale is encoded as an array of semitone offsets from the tonic.
 * Example: Ionian (Major) = [0, 2, 4, 5, 7, 9, 11]
 *
 * Sources (all verified against at least one of these):
 *   - Mark Levine, *The Jazz Theory Book* (Sher, 1995) — diatonic modes, bebop,
 *     melodic minor family, chord/scale pairings.
 *   - Joe Mulholland & Tom Hojnacki, *The Berklee Book of Jazz Harmony* (2013).
 *   - Vincent Persichetti, *Twentieth-Century Harmony* (Norton, 1961) — Neapolitan
 *     and bitonal scales.
 *   - Nicolas Slonimsky, *Thesaurus of Scales and Melodic Patterns* (Scribner, 1947)
 *     — exotic and symmetric scales.
 *   - Grove Music Online (Oxford) — regional scales (Hijaz, Hirajoshi, In-sen, Yo).
 */
export const SCALES: Readonly<Record<string, readonly number[]>> = {
  // Diatonic modes
  'Mayor (Jónica)':            [0, 2, 4, 5, 7, 9, 11],
  'Dórica':                    [0, 2, 3, 5, 7, 9, 10],
  'Frigia':                    [0, 1, 3, 5, 7, 8, 10],
  'Lidia':                     [0, 2, 4, 6, 7, 9, 11],
  'Mixolidia':                 [0, 2, 4, 5, 7, 9, 10],
  'Menor natural (Eólica)':    [0, 2, 3, 5, 7, 8, 10],
  'Locria':                    [0, 1, 3, 5, 6, 8, 10],

  // Harmonic minor family
  'Menor armónica':            [0, 2, 3, 5, 7, 8, 11],
  'Frigia dominante':          [0, 1, 4, 5, 7, 8, 10],

  // Melodic minor family (jazz minor — ascending form used both up and down).
  // Mode order (1..7): Jazz minor · Dorian b2 · Lydian augmented · Lydian dominant ·
  //                    Mixolydian b6 · Locrian nat 2 · Altered (Super Locrian).
  // — Mark Levine, The Jazz Theory Book, ch. 4; Berklee Jazz Harmony.
  'Menor melódica':            [0, 2, 3, 5, 7, 9, 11], // 1st mode
  'Lidia aumentada':           [0, 2, 4, 6, 8, 9, 11], // 3rd mode — scale for maj7#5 / maj7(+5)
  'Lidia dominante':           [0, 2, 4, 6, 7, 9, 10], // 4th mode — scale for 7#11
  'Mixolidia b6':              [0, 2, 4, 5, 7, 8, 10], // 5th mode — scale for 7b13 / 7sus(b13)
  'Locria #2':                 [0, 2, 3, 5, 6, 8, 10], // 6th mode — scale for m7b5 with natural 9
  'Alterada':                  [0, 1, 3, 4, 6, 8, 10], // 7th mode — scale for 7alt (all four alterations)

  // Pentatonic
  'Pentatónica mayor':         [0, 2, 4, 7, 9],
  'Pentatónica menor':         [0, 3, 5, 7, 10],
  'Blues menor':               [0, 3, 5, 6, 7, 10],
  'Blues mayor':               [0, 2, 3, 4, 7, 9],

  // Bebop
  'Bebop mayor':               [0, 2, 4, 5, 7, 8, 9, 11],
  'Bebop dominante':           [0, 2, 4, 5, 7, 9, 10, 11],
  'Bebop dórica':              [0, 2, 3, 4, 5, 7, 9, 10],

  // Symmetric
  'Tonos enteros':             [0, 2, 4, 6, 8, 10],
  'Disminuida (H-W)':          [0, 1, 3, 4, 6, 7, 9, 10],
  'Disminuida (W-H)':          [0, 2, 3, 5, 6, 8, 9, 11],
  'Cromática':                 [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],

  // Exotic / world
  'Hirajoshi':                 [0, 2, 3, 7, 8],
  'In-sen':                    [0, 1, 5, 7, 10],
  'Yo':                        [0, 2, 5, 7, 9],
  'Doble armónica (Bizantina)':[0, 1, 4, 5, 7, 8, 11],
  'Hungara menor':             [0, 2, 3, 6, 7, 8, 11],
  'Gitana (Romani)':           [0, 2, 3, 6, 7, 8, 10],
  'Napolitana menor':          [0, 1, 3, 5, 7, 8, 11],
  'Napolitana mayor':          [0, 1, 3, 5, 7, 9, 11],
  'Persa':                     [0, 1, 4, 5, 6, 8, 11],
  'Enigmática':                [0, 1, 4, 6, 8, 10, 11],
  'Prometeo':                  [0, 2, 4, 6, 9, 10],
  'Árabe':                     [0, 2, 4, 5, 6, 8, 10],
  'Egipcia':                   [0, 2, 5, 7, 10],
} as const;

/**
 * Scales grouped into theory families, in didactic order, for a grouped picker
 * (rendered as <optgroup>s). Every key of SCALES appears exactly once here.
 * Keeping this in the data layer means the UI needs no grouping logic.
 */
export const SCALE_FAMILIES: readonly { readonly label: string; readonly scales: readonly string[] }[] = [
  // The two most-wanted scales in the library lead the list, under their common
  // names. Filed as modes they are correct and unfindable: someone looking for
  // "la mayor" does not scan for "Jónica".
  { label: 'Mayor, menor y modos', scales: ['Mayor (Jónica)', 'Menor natural (Eólica)', 'Dórica', 'Frigia', 'Lidia', 'Mixolidia', 'Locria'] },
  { label: 'Menor armónica', scales: ['Menor armónica', 'Frigia dominante'] },
  { label: 'Menor melódica', scales: ['Menor melódica', 'Lidia aumentada', 'Lidia dominante', 'Mixolidia b6', 'Locria #2', 'Alterada'] },
  { label: 'Pentatónicas y blues', scales: ['Pentatónica mayor', 'Pentatónica menor', 'Blues menor', 'Blues mayor'] },
  { label: 'Bebop', scales: ['Bebop mayor', 'Bebop dominante', 'Bebop dórica'] },
  { label: 'Simétricas', scales: ['Tonos enteros', 'Disminuida (H-W)', 'Disminuida (W-H)', 'Cromática'] },
  { label: 'Exóticas y del mundo', scales: ['Hirajoshi', 'In-sen', 'Yo', 'Doble armónica (Bizantina)', 'Hungara menor', 'Gitana (Romani)', 'Napolitana menor', 'Napolitana mayor', 'Persa', 'Enigmática', 'Prometeo', 'Árabe', 'Egipcia'] },
] as const;

/**
 * Scales that were saved under an older name. A preference stored before a
 * rename must still resolve, or the picker silently falls back to the default
 * and the user loses their scale.
 */
const RENAMED: Readonly<Record<string, string>> = {
  'Jónica (Mayor)': 'Mayor (Jónica)',
  'Eólica (menor natural)': 'Menor natural (Eólica)',
};

/** Current name for a stored scale name, or null if it names no scale we have. */
export function canonicalScaleName(name: string): string | null {
  const migrated = RENAMED[name] ?? name;
  return migrated in SCALES ? migrated : null;
}

/**
 * Suggested scales to play over each chord quality.
 *
 * Source convention: Mark Levine, *The Jazz Theory Book* (the "chord/scale" tables in
 * chs. 3–6); Barrie Nettles & Richard Graf, *The Chord Scale Theory & Jazz Harmony*
 * (Advance Music); Berklee *Jazz Harmony* (Mulholland/Hojnacki).
 *
 * Guidelines applied:
 *   - Dominant 7 chords get ranked lists depending on the tension: natural 9/13 →
 *     Mixolydian; #11 → Lydian dominant; b9/#9 alone → dim H-W or Phrygian dominant;
 *     b13 → Mixolydian b6; all four alterations → Altered (Super Locrian).
 *   - maj7#5 → Lydian augmented (3rd mode of melodic minor), not plain Lydian.
 *   - m7b5 → Locrian (diatonic VII of the major key) or Locrian #2 (jazz ii° in minor).
 *   - dim triad in diatonic context → Locrian; in jazz it's almost always spelled dim7
 *     and paired with the whole-half diminished scale.
 */
export const CHORD_SCALES: Readonly<Record<string, readonly string[]>> = {
  '':        ['Mayor (Jónica)', 'Lidia', 'Pentatónica mayor', 'Bebop mayor'],
  'm':       ['Dórica', 'Menor natural (Eólica)', 'Frigia', 'Pentatónica menor', 'Blues menor'],
  'dim':     ['Locria', 'Disminuida (W-H)'],
  'aug':     ['Tonos enteros', 'Lidia aumentada'],
  'sus2':    ['Mixolidia', 'Mayor (Jónica)', 'Pentatónica mayor'],
  'sus4':    ['Mixolidia', 'Dórica'],
  '6':       ['Mayor (Jónica)', 'Lidia', 'Pentatónica mayor'],
  'm6':      ['Dórica', 'Menor melódica'],
  '6/9':     ['Mayor (Jónica)', 'Lidia', 'Pentatónica mayor'],
  'maj7':    ['Mayor (Jónica)', 'Lidia', 'Bebop mayor'],
  'm7':      ['Dórica', 'Menor natural (Eólica)', 'Frigia', 'Bebop dórica', 'Pentatónica menor'],
  '7':       ['Mixolidia', 'Lidia dominante', 'Alterada', 'Frigia dominante', 'Disminuida (H-W)', 'Bebop dominante', 'Blues menor'],
  'mMaj7':   ['Menor melódica', 'Menor armónica'],
  'dim7':    ['Disminuida (W-H)'],
  'm7b5':    ['Locria', 'Locria #2'],
  '7b5':     ['Lidia dominante', 'Tonos enteros', 'Alterada'],
  'maj7#5':  ['Lidia aumentada'],
  '7#5':     ['Tonos enteros', 'Alterada'],
  'add9':    ['Mayor (Jónica)', 'Lidia'],
  'm(add9)': ['Dórica', 'Menor melódica'],
  'add11':   ['Lidia', 'Mayor (Jónica)'],
  'maj9':    ['Mayor (Jónica)', 'Lidia'],
  'm9':      ['Dórica', 'Menor natural (Eólica)'],
  '9':       ['Mixolidia', 'Lidia dominante', 'Bebop dominante'],
  '7b9':     ['Frigia dominante', 'Disminuida (H-W)'],
  '7#9':     ['Alterada', 'Disminuida (H-W)', 'Blues menor'],
  'mMaj9':   ['Menor melódica'],
  'm11':     ['Dórica', 'Menor natural (Eólica)'],
  '11':      ['Mixolidia'],
  'maj7#11': ['Lidia'],
  '7#11':    ['Lidia dominante'],
  '9#11':    ['Lidia dominante'],
  'maj9#11': ['Lidia'],
  '13':      ['Mixolidia', 'Lidia dominante', 'Bebop dominante'],
  'maj13':   ['Mayor (Jónica)', 'Lidia'],
  'm13':     ['Dórica'],
  '13b9':    ['Disminuida (H-W)'],
  '7b13':    ['Mixolidia b6', 'Alterada', 'Frigia dominante'],
  '7#5#9':   ['Alterada'],
  '7b5b9':   ['Alterada', 'Disminuida (H-W)'],
} as const;
