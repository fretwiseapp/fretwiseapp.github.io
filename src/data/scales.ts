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
  'Jónica (Mayor)':            [0, 2, 4, 5, 7, 9, 11],
  'Dórica':                    [0, 2, 3, 5, 7, 9, 10],
  'Frigia':                    [0, 1, 3, 5, 7, 8, 10],
  'Lidia':                     [0, 2, 4, 6, 7, 9, 11],
  'Mixolidia':                 [0, 2, 4, 5, 7, 9, 10],
  'Eólica (menor natural)':    [0, 2, 3, 5, 7, 8, 10],
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
  '':        ['Jónica (Mayor)', 'Lidia', 'Pentatónica mayor', 'Bebop mayor'],
  'm':       ['Dórica', 'Eólica (menor natural)', 'Frigia', 'Pentatónica menor', 'Blues menor'],
  'dim':     ['Locria', 'Disminuida (W-H)'],
  'aug':     ['Tonos enteros', 'Lidia aumentada'],
  'sus2':    ['Mixolidia', 'Jónica (Mayor)', 'Pentatónica mayor'],
  'sus4':    ['Mixolidia', 'Dórica'],
  '6':       ['Jónica (Mayor)', 'Lidia', 'Pentatónica mayor'],
  'm6':      ['Dórica', 'Menor melódica'],
  '6/9':     ['Jónica (Mayor)', 'Lidia', 'Pentatónica mayor'],
  'maj7':    ['Jónica (Mayor)', 'Lidia', 'Bebop mayor'],
  'm7':      ['Dórica', 'Eólica (menor natural)', 'Frigia', 'Bebop dórica', 'Pentatónica menor'],
  '7':       ['Mixolidia', 'Lidia dominante', 'Alterada', 'Frigia dominante', 'Disminuida (H-W)', 'Bebop dominante', 'Blues menor'],
  'mMaj7':   ['Menor melódica', 'Menor armónica'],
  'dim7':    ['Disminuida (W-H)'],
  'm7b5':    ['Locria', 'Locria #2'],
  '7b5':     ['Lidia dominante', 'Tonos enteros', 'Alterada'],
  'maj7#5':  ['Lidia aumentada'],
  '7#5':     ['Tonos enteros', 'Alterada'],
  'add9':    ['Jónica (Mayor)', 'Lidia'],
  'm(add9)': ['Dórica', 'Menor melódica'],
  'add11':   ['Lidia', 'Jónica (Mayor)'],
  'maj9':    ['Jónica (Mayor)', 'Lidia'],
  'm9':      ['Dórica', 'Eólica (menor natural)'],
  '9':       ['Mixolidia', 'Lidia dominante', 'Bebop dominante'],
  '7b9':     ['Frigia dominante', 'Disminuida (H-W)'],
  '7#9':     ['Alterada', 'Disminuida (H-W)', 'Blues menor'],
  'mMaj9':   ['Menor melódica'],
  'm11':     ['Dórica', 'Eólica (menor natural)'],
  '11':      ['Mixolidia'],
  'maj7#11': ['Lidia'],
  '7#11':    ['Lidia dominante'],
  '9#11':    ['Lidia dominante'],
  'maj9#11': ['Lidia'],
  '13':      ['Mixolidia', 'Lidia dominante', 'Bebop dominante'],
  'maj13':   ['Jónica (Mayor)', 'Lidia'],
  'm13':     ['Dórica'],
  '13b9':    ['Disminuida (H-W)'],
  '7b13':    ['Mixolidia b6', 'Alterada', 'Frigia dominante'],
  '7#5#9':   ['Alterada'],
  '7b5b9':   ['Alterada', 'Disminuida (H-W)'],
} as const;
