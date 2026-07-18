# Fretwise

Guitar chord identifier with real-time fretboard visualization, drop-2 inversions across the neck, scale overlays, and Karplus-Strong plucked-string audio synthesis.

Pure TypeScript engine (zero music-theory dependencies) + React UI, built on Vite + Vitest.

## Quick start

```bash
npm install
npm run dev        # starts dev server on http://localhost:5173
npm test           # runs 692 tests (engine + voicings + scales)
npm run build      # production bundle → dist/
npm run typecheck  # tsc --noEmit
```

Requires Node 18+.

## What it does

- **Identify chords** from any fretboard fingering in 5 tunings (standard, drop-D, DADGAD, open-G, half-down). Two-pass algorithm with strict + relaxed (tension-tolerant) matching, 41 chord qualities, enharmonic-aware naming per key.
- **Build chords** via (a) text search with autocomplete, (b) root × quality pickers, or (c) one-click chord-builder chips.
- **Show inversions** — drop-2 inversions for maj7, m7, 7, m7b5, dim7 (all 4 inversions each), plus triad inversions for maj/m. Each voicing renders as a clickable mini-diagram and loads into the main fretboard on select.
- **Overlay scales** — 37 scales (diatonic modes, pentatonic, bebop, harmonic/melodic minor, symmetric, exotic) with 4 view modes: Chord / Arpeggio / Scale / Chord+Scale.
- **Play audio** — Karplus-Strong physically-modeled plucked string, with proper AudioContext priming to eliminate first-note dropout on iOS Safari.
- **Show degrees** — every note labeled with chord-context degrees including upper extensions (9, 11, 13, b9, #9, #11, b13).
- **Audit** — flags enharmonic ambiguity (dim7 has 4 names, C6 ≡ Am7, etc.), playability issues (stretches, barre requirements), and slash-chord inversions.

## Project structure

```
src/
├── engine/            # Pure TS. No UI imports. Fully testable in isolation.
│   ├── types.ts       # All contracts
│   ├── constants.ts   # SHARP, FLAT, TUNINGS, KEY_PREFS
│   ├── qualities.ts   # 41 quality definitions
│   ├── spell.ts       # Note spelling + degree naming (9/11/13 support)
│   ├── pcset.ts       # pcsOf, identify (two-pass with tiebreaker), nameOf
│   ├── voicings.ts    # buildVoicing, listVoicings
│   ├── scales.ts      # degOfScale
│   ├── audit.ts       # theoretical + playability audit
│   └── index.ts       # barrel + parseChordName
├── data/              # Static data. Pure tables, no logic.
│   ├── shapes.ts      # SHAPES: voicings + inversions with source citations
│   └── scales.ts      # SCALES (37) + CHORD_SCALES compatibility map
├── audio/
│   ├── context.ts     # AudioContext priming
│   └── synth.ts       # Karplus-Strong synthesis
└── ui/
    ├── hooks/
    │   └── useAppState.ts
    └── components/
        ├── Fretboard.tsx      # SVG diapason, 4 view modes
        ├── HeroChord.tsx      # Big chord name top-right
        ├── Controls.tsx       # Search + pickers + tuning + key + view
        ├── Chips.tsx          # Chord builder chips
        ├── StringButtons.tsx  # Mute/open toggles below fretboard
        ├── MiniDiagram.tsx    # Small voicing diagram
        └── ResultsCard.tsx    # Notes/degrees + voicings + scales + audit
tests/engine/          # Vitest
docs/                  # Architecture + voicing source citations
```

## Key design decisions

**Engine ↔ UI separation.** The engine has zero React dependencies. You could compile it to a CLI, a VST plugin (via WASM), or a backend service without touching UI code.

**`'x'` vs `'muted'` convention.** Static SHAPES use `'x'` (matches chord-chart notation); runtime `Strings` arrays use `'muted'` (descriptive). `buildVoicing` is the only function that converts between them. Respect this boundary.

**Two-pass chord identification.** First pass is strict (exact pc-set match). Second pass is relaxed (allows up to 2 extra notes from a known tension set: b9, add9, #9, add11, #11, b13, add13). Scoring prefers strict matches and candidates where bass == root.

**Drop-2 inversions.** Canonical voicing pattern for 4-note chords on adjacent strings:
- Root position: R-5-7-3 (low to high)
- 1st inversion: 3-7-R-5
- 2nd inversion: 5-R-3-7
- 3rd inversion: 7-3-5-R

See `docs/VOICING-SOURCES.md` for the published jazz-harmony references used.

**Audio priming.** `AudioContext.resume()` returns a Promise that's often ignored, causing the first note of a strum to drop on iOS Safari and some Chromium builds. We attach listeners for `click`, `keydown`, `touchstart` on document load that `await` resume and play a silent warmup buffer. This eliminates the dropout.

## Testing

692 tests covering:
- 10 legacy chord-shape identifications (Cmaj7, Am7, Hendrix E7#9, etc.)
- All 12 roots × 35 qualities round-trip (buildVoicing → identify → same chord)
- Drop-2 inversions at C (pcs match + bass correct)
- Drop-2 inversions at all 12 roots (pitch-class structure preserved)
- Triad inversion bass correctness
- Scale library spot-checks + degOfScale behavior
- Chord-scale coverage (every quality has suggested scales)
- Chord name parser (20 cases including sharps, flats, complex qualities)
- Spell & degree logic (key preferences, quality flavors, upper extensions)

```bash
npm test              # one-off
npm run test:watch    # development
```

## Deploy

```bash
npm run build   # → dist/
```

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Zero server required.

## License

MIT.
