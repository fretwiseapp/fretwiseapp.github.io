import type { VoicingShape } from '../engine/types';

/**
 * Voicing shapes database.
 *
 * Each quality maps to an array of VoicingShapes. Each shape has:
 *  - baseRoot: the pitch class at which the shape is "anchored" (frets as written)
 *  - shape: 6-element [low E, A, D, G, B, high e] with numeric frets or 'x' for muted
 *  - label: human-readable identifier (also conveys inversion position)
 *  - family: 'caged' | 'drop2' | 'drop3' | 'invHigh' — used by the Fretboard filter UI
 *
 * When building a voicing at some targetRoot, the system computes shift = (targetRoot - baseRoot) mod 12
 * and adds that shift to every non-muted fret. listVoicings also emits octave-up variants
 * (shift + 12) whenever they fit within FRET_COUNT — so a chord like A major appears both at
 * its first playable position AND twelve frets higher, giving a complete neck map.
 *
 * CAGED shapes ('caged'):
 *   Five movable patterns derived from the open-position C, A, G, E, D chords. Transposed,
 *   these let you play every major/minor/7th chord in multiple neck positions. Essential for
 *   fretboard mastery — the same chord tones in different hand locations.
 *
 * Drop-2 inversions ('drop2') use the formula (low-to-high voice order):
 *   Root:    R-5-7-3       (bass is the root)
 *   1st inv: 3-7-R-5       (bass is the 3rd)
 *   2nd inv: 5-R-3-7       (bass is the 5th)
 *   3rd inv: 7-3-5-R       (bass is the 7th)
 *
 * String sets covered (low→high string indices):
 *   4321 (DGBe): compact, bright, sits in mid-upper neck.
 *   5432 (ADGB): fuller, darker counterpart; complements 4321 and — combined with
 *                the 22-fret range — provides multiple voicing positions per root
 *                including 16-22 for F/G/A/Bb/B roots.
 *   6432 (EDGB, A muted): drop-3 root position ('drop3') — classic "6th-string-root"
 *                         jazz comping shape. Only root position is practical on guitar;
 *                         inversions exceed playable stretch.
 *
 * Sources for drop-2 / drop-3 shapes:
 *   - Dirk Laukens, "Drop 2 Chords" & "Drop 3 Chords" — jazzguitar.be/blog/
 *   - "Drop 2 Chords Chart" — hubguitar.com/fretboard/drop2-chords
 *   - Jazz Guitar Licks, "Drop 2 Major 7 Chord Voicings" — jazz-guitar-licks.com
 *   - Guitar Lesson World, "Drop 2 Chords" — guitarlessonworld.com/lessons/drop-2-chords/
 *   - Ted Greene, Chord Chemistry (1971) — drop-3 and close-voice systems.
 *
 * Triad inversion shapes on string-set DGB (4-3-2, 'invHigh') are derived from first principles
 * using the tuning pitch-class offsets (D=2, G=7, B=11) and verified against conventional diagrams.
 *
 * All shapes are round-trip tested: buildVoicing(root, sym, idx) → identify() → name match.
 * See tests/engine/voicings.test.ts for coverage.
 */
export const SHAPES: Readonly<Record<string, readonly VoicingShape[]>> = {
  '': [
    { baseRoot: 4, shape: [0, 2, 2, 1, 0, 0],       label: 'E-shape barré',          family: 'caged' },
    { baseRoot: 9, shape: ['x', 0, 2, 2, 2, 0],     label: 'A-shape barré',          family: 'caged' },
    { baseRoot: 0, shape: ['x', 3, 2, 0, 1, 0],     label: 'C-shape',                family: 'caged' },
    { baseRoot: 2, shape: ['x', 'x', 0, 2, 3, 2],   label: 'D-shape',                family: 'caged' },
    { baseRoot: 7, shape: [3, 2, 0, 0, 0, 3],       label: 'G-shape',                family: 'caged' },
    { baseRoot: 4, shape: ['x', 'x', 2, 1, 0, 0],   label: 'Triada aguda',           family: 'invHigh' },
    { baseRoot: 0, shape: ['x', 'x', 2, 0, 1, 'x'], label: '1ra inv. (3 en bajo)',   family: 'invHigh' },
    { baseRoot: 0, shape: ['x', 'x', 5, 5, 5, 'x'], label: '2da inv. (5 en bajo)',   family: 'invHigh' },
  ],
  'm': [
    { baseRoot: 4, shape: [0, 2, 2, 0, 0, 0],       label: 'E-shape',                family: 'caged' },
    { baseRoot: 9, shape: ['x', 0, 2, 2, 1, 0],     label: 'A-shape',                family: 'caged' },
    { baseRoot: 2, shape: ['x', 'x', 0, 2, 3, 1],   label: 'D-shape',                family: 'caged' },
    { baseRoot: 4, shape: ['x', 'x', 2, 0, 1, 0],   label: 'Triada aguda',           family: 'invHigh' },
    { baseRoot: 0, shape: ['x', 'x', 1, 0, 1, 'x'], label: '1ra inv. (b3 en bajo)',  family: 'invHigh' },
    { baseRoot: 0, shape: ['x', 'x', 5, 5, 4, 'x'], label: '2da inv. (5 en bajo)',   family: 'invHigh' },
  ],
  'dim':   [{ baseRoot: 9, shape: ['x', 0, 1, 2, 1, 'x'], label: 'A-shape',          family: 'caged' }],
  'aug':   [{ baseRoot: 4, shape: [0, 3, 2, 1, 1, 0],     label: 'E-shape',          family: 'caged' }],
  'sus2':  [
    { baseRoot: 4, shape: [0, 2, 4, 4, 0, 0],   label: 'E-shape',                    family: 'caged' },
    { baseRoot: 9, shape: ['x', 0, 2, 2, 0, 0], label: 'A-shape',                    family: 'caged' },
  ],
  'sus4':  [
    { baseRoot: 4, shape: [0, 2, 2, 2, 0, 0],   label: 'E-shape',                    family: 'caged' },
    { baseRoot: 9, shape: ['x', 0, 2, 2, 3, 0], label: 'A-shape',                    family: 'caged' },
  ],
  '6':     [{ baseRoot: 9, shape: ['x', 0, 2, 2, 2, 2], label: 'A-shape',            family: 'caged' }],
  'm6':    [{ baseRoot: 9, shape: ['x', 0, 2, 2, 1, 2], label: 'A-shape',            family: 'caged' }],
  '6/9':   [{ baseRoot: 9, shape: ['x', 0, 2, 4, 2, 2], label: 'A-shape',            family: 'caged' }],

  // maj7 with CAGED variants + all 4 drop-2 inversions on DGBe (4321) and ADGB (5432), plus drop-3 on EDGB (6432).
  'maj7': [
    { baseRoot: 4, shape: [0, 2, 1, 1, 0, 0],          label: 'E-shape',             family: 'caged' },
    { baseRoot: 9, shape: ['x', 0, 2, 1, 2, 0],        label: 'A-shape',             family: 'caged' },
    { baseRoot: 0, shape: ['x', 3, 2, 0, 0, 0],        label: 'C-shape',             family: 'caged' },
    { baseRoot: 2, shape: ['x', 'x', 0, 2, 2, 2],      label: 'D-shape',             family: 'caged' },
    { baseRoot: 7, shape: [3, 2, 0, 0, 0, 2],          label: 'G-shape',             family: 'caged' },
    { baseRoot: 0, shape: ['x', 'x', 10, 12, 12, 12],  label: 'Drop-2 raíz (4321)',  family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 2, 4, 1, 3],      label: 'Drop-2 1ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 5, 5, 5, 7],      label: 'Drop-2 2da inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 9, 9, 8, 8],      label: 'Drop-2 3ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 3, 5, 4, 5, 'x'],      label: 'Drop-2 raíz (5432)',    family: 'drop2' },
    { baseRoot: 0, shape: ['x', 7, 9, 5, 8, 'x'],      label: 'Drop-2 1ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 10, 10, 9, 12, 'x'],   label: 'Drop-2 2da inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 2, 2, 0, 1, 'x'],      label: 'Drop-2 3ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: [8, 'x', 9, 9, 8, 'x'],      label: 'Drop-3 raíz (6432)',    family: 'drop3' },
  ],
  'm7': [
    { baseRoot: 4, shape: [0, 2, 0, 0, 0, 0],          label: 'E-shape',             family: 'caged' },
    { baseRoot: 9, shape: ['x', 0, 2, 0, 1, 0],        label: 'A-shape',             family: 'caged' },
    { baseRoot: 2, shape: ['x', 'x', 0, 2, 1, 1],      label: 'D-shape',             family: 'caged' },
    { baseRoot: 0, shape: ['x', 'x', 10, 12, 11, 11],  label: 'Drop-2 raíz (4321)',  family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 1, 3, 1, 3],      label: 'Drop-2 1ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 5, 5, 4, 6],      label: 'Drop-2 2da inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 8, 8, 8, 8],      label: 'Drop-2 3ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 3, 5, 3, 4, 'x'],      label: 'Drop-2 raíz (5432)',    family: 'drop2' },
    { baseRoot: 0, shape: ['x', 6, 8, 5, 8, 'x'],      label: 'Drop-2 1ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 10, 10, 8, 11, 'x'],   label: 'Drop-2 2da inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 1, 1, 0, 1, 'x'],      label: 'Drop-2 3ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: [8, 'x', 8, 8, 8, 'x'],      label: 'Drop-3 raíz (6432)',    family: 'drop3' },
  ],
  '7': [
    { baseRoot: 4, shape: [0, 2, 0, 1, 0, 0],          label: 'E-shape',             family: 'caged' },
    { baseRoot: 9, shape: ['x', 0, 2, 0, 2, 0],        label: 'A-shape',             family: 'caged' },
    { baseRoot: 0, shape: ['x', 3, 2, 3, 1, 0],        label: 'C-shape',             family: 'caged' },
    { baseRoot: 2, shape: ['x', 'x', 0, 2, 1, 2],      label: 'D-shape',             family: 'caged' },
    { baseRoot: 7, shape: [3, 2, 0, 0, 0, 1],          label: 'G-shape',             family: 'caged' },
    { baseRoot: 0, shape: ['x', 'x', 10, 12, 11, 12],  label: 'Drop-2 raíz (4321)',  family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 2, 3, 1, 3],      label: 'Drop-2 1ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 5, 5, 5, 6],      label: 'Drop-2 2da inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 8, 9, 8, 8],      label: 'Drop-2 3ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 3, 5, 3, 5, 'x'],      label: 'Drop-2 raíz (5432)',    family: 'drop2' },
    { baseRoot: 0, shape: ['x', 7, 8, 5, 8, 'x'],      label: 'Drop-2 1ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 10, 10, 9, 11, 'x'],   label: 'Drop-2 2da inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 1, 2, 0, 1, 'x'],      label: 'Drop-2 3ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: [8, 'x', 8, 9, 8, 'x'],      label: 'Drop-3 raíz (6432)',    family: 'drop3' },
  ],
  'm7b5': [
    { baseRoot: 9, shape: ['x', 0, 1, 0, 1, 'x'],      label: 'A-shape',             family: 'caged' },
    { baseRoot: 0, shape: ['x', 'x', 10, 11, 11, 11],  label: 'Drop-2 raíz (4321)',  family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 1, 3, 1, 2],      label: 'Drop-2 1ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 4, 5, 4, 6],      label: 'Drop-2 2da inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 8, 8, 7, 8],      label: 'Drop-2 3ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 3, 4, 3, 4, 'x'],      label: 'Drop-2 raíz (5432)',    family: 'drop2' },
    { baseRoot: 0, shape: ['x', 6, 8, 5, 7, 'x'],      label: 'Drop-2 1ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 9, 10, 8, 11, 'x'],    label: 'Drop-2 2da inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: [8, 'x', 8, 8, 7, 'x'],      label: 'Drop-3 raíz (6432)',    family: 'drop3' },
  ],
  'dim7': [
    { baseRoot: 9, shape: ['x', 0, 1, 2, 1, 2],        label: 'A-shape',             family: 'caged' },
    { baseRoot: 0, shape: ['x', 'x', 10, 11, 10, 11],  label: 'Drop-2 raíz (4321)',  family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 1, 2, 1, 2],      label: 'Drop-2 1ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 4, 5, 4, 5],      label: 'Drop-2 2da inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 'x', 7, 8, 7, 8],      label: 'Drop-2 3ra inv (4321)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 3, 4, 2, 4, 'x'],      label: 'Drop-2 raíz (5432)',    family: 'drop2' },
    { baseRoot: 0, shape: ['x', 6, 7, 5, 7, 'x'],      label: 'Drop-2 1ra inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: ['x', 9, 10, 8, 10, 'x'],    label: 'Drop-2 2da inv (5432)', family: 'drop2' },
    { baseRoot: 0, shape: [8, 'x', 7, 8, 7, 'x'],      label: 'Drop-3 raíz (6432)',    family: 'drop3' },
  ],

  'mMaj7':    [{ baseRoot: 4, shape: [0, 2, 1, 0, 0, 0],          label: 'E-shape',      family: 'caged' }],
  '7b5':      [{ baseRoot: 9, shape: ['x', 0, 1, 0, 2, 'x'],      label: 'A-shape',      family: 'caged' }],
  'maj7#5':   [{ baseRoot: 9, shape: ['x', 0, 3, 1, 2, 0],        label: 'A-shape',      family: 'caged' }],
  '7#5':      [{ baseRoot: 4, shape: [0, 3, 0, 1, 1, 0],          label: 'E-shape',      family: 'caged' }],

  'add9':     [{ baseRoot: 4, shape: [0, 2, 2, 1, 0, 2],          label: 'E-shape',      family: 'caged' }],
  'm(add9)':  [{ baseRoot: 4, shape: [0, 2, 2, 0, 0, 2],          label: 'E-shape',      family: 'caged' }],
  'add11':    [{ baseRoot: 0, shape: ['x', 3, 2, 0, 1, 1],        label: 'C-shape',      family: 'caged' }],

  'maj9':     [{ baseRoot: 4, shape: [0, 'x', 1, 1, 0, 2],        label: 'E-shape',      family: 'caged' }],
  'm9':       [{ baseRoot: 4, shape: [0, 'x', 0, 0, 0, 2],        label: 'E-shape',      family: 'caged' }],
  '9':        [{ baseRoot: 4, shape: [0, 'x', 0, 1, 0, 2],        label: 'E-shape',      family: 'caged' }],
  '7b9':      [{ baseRoot: 9, shape: ['x', 0, 2, 3, 2, 3],        label: 'A-shape',      family: 'caged' }],
  '7#9':      [{ baseRoot: 4, shape: [0, 7, 6, 7, 8, 'x'],        label: 'Hendrix alto', family: 'caged' }],
  'mMaj9':    [{ baseRoot: 9, shape: ['x', 0, 6, 5, 5, 7],        label: 'A-shape',      family: 'caged' }],

  'm11':      [{ baseRoot: 9, shape: ['x', 0, 0, 0, 1, 3],        label: 'A-shape',      family: 'caged' }],
  '11':       [{ baseRoot: 9, shape: ['x', 0, 0, 0, 0, 3],        label: 'A-shape',      family: 'caged' }],
  'maj7#11':  [{ baseRoot: 4, shape: [0, 'x', 1, 1, 0, 6],        label: 'E-shape Lydian', family: 'caged' }],
  '7#11':     [{ baseRoot: 9, shape: ['x', 0, 5, 6, 4, 5],        label: 'A-shape',      family: 'caged' }],
  '9#11':     [{ baseRoot: 9, shape: ['x', 0, 5, 6, 4, 7],        label: 'A-shape',      family: 'caged' }],

  '13':       [{ baseRoot: 9, shape: ['x', 0, 2, 0, 2, 2],        label: 'A-shape',        family: 'caged' }],
  'maj13':    [{ baseRoot: 4, shape: [0, 2, 1, 1, 2, 2],          label: 'E-shape barré', family: 'caged' }],
  'm13':      [{ baseRoot: 9, shape: ['x', 0, 5, 5, 7, 7],        label: 'A-shape',        family: 'caged' }],
} as const;
