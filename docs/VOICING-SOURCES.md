# Voicing Sources

Every voicing in `src/data/shapes.ts` is either (a) derived mathematically from standard jazz harmony rules, (b) verified against a published source, or (c) both. This document tracks attribution.

## Primary sources consulted

- **Dirk Laukens**, *Drop 2 Chords — Chord Chart, Theory & Exercises* — jazzguitar.be/blog/drop-2-chords/
- **Jazz Guitar Licks**, *Drop 2 Chord Voicings on Guitar with Diagrams* — jazz-guitar-licks.com/blog/drop-2-chord-voicings-guitar-diagrams-jazz-lesson.html
- **HubGuitar**, *Drop 2 Chords Chart (Advanced Chord Lesson)* — hubguitar.com/fretboard/drop2-chords
- **Guitar Lesson World** (David Taub), *Drop 2 Chords* — guitarlessonworld.com/lessons/drop-2-chords/
- **Applied Guitar Theory**, *Guitar Chord Inversions* — appliedguitartheory.com/lessons/learning-guitar-chord-inversions/
- **Mark Levine**, *The Jazz Theory Book*, Sher Music Co., 1995 — voicing theory, chord-scale relationships
- **Ted Greene**, *Chord Chemistry*, Dale Zdenek Publications, 1971 — triad inversions, drop voicings

## Drop-2 inversion formula (standard)

For any 4-note chord {R, 3, 5, 7} on an adjacent 4-string set (low to high), the four drop-2 inversions are:

| Inversion | Voice order (low→high) | Bass |
|-----------|-----------------------|------|
| Root pos  | R – 5 – 7 – 3         | R    |
| 1st inv   | 3 – 7 – R – 5         | 3rd  |
| 2nd inv   | 5 – R – 3 – 7         | 5th  |
| 3rd inv   | 7 – 3 – 5 – R         | 7th  |

## Voicings tagged by source

### maj7 / m7 / 7 / m7b5 / dim7 — drop-2 on string set 4-3-2-1 (DGBe)

Shape values computed from first principles using the formula above. Each voicing was verified by:
1. Computing fret numbers from tuning pitch-classes (D=2, G=7, B=11, e=4)
2. Running the test suite: voicing → `pcsOf` → `identify` → name matches
3. Cross-checking against diagrams on jazzguitar.be and hubguitar.com

### Root-position E-shape and A-shape barré chords

Standard CAGED system positions. Canonical references:
- **William Leavitt**, *A Modern Method for Guitar, Volume 1*, Berklee Press
- Any open-chord primer

### Triad inversions on string set 4-3-2 (DGB)

Computed from first principles for C root:
- Root pos: D=10 (C), G=9 (E), B=8 (G)  → [x,x,10,9,8,x]
- 1st inv: D=2 (E),  G=0 (G), B=1 (C)  → [x,x,2,0,1,x]
- 2nd inv: D=5 (G),  G=5 (C), B=5 (E)  → [x,x,5,5,5,x]

Minor triad analogue:
- Root pos: D=10 (C), G=8 (Eb), B=8 (G)  → [x,x,10,8,8,x]
- 1st inv: D=1 (Eb), G=0 (G), B=1 (C)  → [x,x,1,0,1,x]
- 2nd inv: D=5 (G),  G=5 (C), B=4 (Eb) → [x,x,5,5,4,x]

### Hendrix voicing (E7#9)

Standard voicing, [0, 7, 6, 7, 8, x]. Notes: E B D G# D, omit high e. See Jimi Hendrix, "Purple Haze" (1967) main riff chord.

### m11 / 11 / 13

Compact rootless voicings that omit the 5th (standard jazz practice). Present chord function via 3-7 shell + upper tensions:

- m11: R-b7-b3-11 on strings 5-4-3-2
- 11 (dominant 11): R-11-b7-9 on strings 5-4-3-2 (no 3 — the "true 11" has the 4 replace the 3)
- 13: R-b7-3-13 on strings 5-4-3-2 (no 5)

## Caveats

- **dim7 is symmetric.** Cdim7 = Ebdim7 = F#dim7 = Adim7 (same pitch classes). When the engine identifies an inverted dim7, it may return a different enharmonic name. This is musically correct — there are 4 valid names.
- **Some inversions fall out of fret range for high roots.** `buildVoicing` auto-falls-back to the first playable shape. This is by design; if you need every inversion at every root, we'd need both low and high-register variants (future addition).
- **Voicings favor adjacency.** We prefer drop-2 over drop-3 because drop-2 fits standard 4-string sets without stretches. Drop-3 (dropping the 3rd-highest note) is also common but requires string-skipping; not included in v0.1.

## Contributing new voicings

To add a voicing:

1. Compute the shape for rootPc = 0 (C) using the tuning pc offsets.
2. Verify the pitch-class set is exactly the chord's interval structure.
3. Add to `src/data/shapes.ts` with a descriptive label.
4. Write a test in `tests/engine/inversions.test.ts` if it's an inversion.
5. Cite the source in this document with a link or bibliographic reference.

Do not add a voicing without a verified source and a passing test. "I think this sounds right" is not acceptable — we're building a reference tool.
