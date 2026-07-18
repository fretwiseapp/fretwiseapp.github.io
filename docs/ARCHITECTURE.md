# Architecture

## Layering

```
┌───────────────────────────────────────────────────┐
│                    ui/                            │
│   React components, hooks, styles — view only     │
│                     ▲                             │
│                     │ props + callbacks           │
├─────────────────────┼─────────────────────────────┤
│                     │                             │
│                  audio/                           │
│   Karplus-Strong + AudioContext management        │
│                     ▲                             │
│                     │ consumed by UI              │
├─────────────────────┼─────────────────────────────┤
│                     │                             │
│                  engine/                          │
│   Pure functions: identify, build, spell, audit   │
│                     ▲                             │
│                     │ reads static tables from    │
├─────────────────────┼─────────────────────────────┤
│                     │                             │
│                   data/                           │
│           SHAPES, SCALES, CHORD_SCALES            │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Enforcement.** `engine/` imports only from itself and `data/`. `audio/` imports only `engine/types`. `ui/` imports from all layers below. There are no upward dependencies and no circular imports.

**Why:** the engine can be extracted to a standalone npm package, compiled to WASM for a plugin, or run server-side for batch analysis. The UI can be fully replaced (e.g. Svelte, Solid, native mobile) without touching music theory.

## Data flow

```
User gesture (tap, type, select)
    │
    ▼
AppActions (useAppState)
    │
    ▼
AppState mutation (setStrings, setChordRoot, etc.)
    │
    ▼
App re-renders — runs identifyCurrent(state)
    │
    ▼
pcsOf(strings, tuning) → {pcs, bassPc, midi}
    │
    ▼
identify(pcs, bassPc) → ranked candidates
    │
    ▼
Components render: Fretboard (overlay modes), HeroChord,
                   ResultsCard (name, voicings, scales, audit)
```

`identifyCurrent` is memoized on `(strings, tuning)`. All derived data (spell names, degrees, voicings list) is computed in the components as needed — cheap enough to not warrant global memoization.

## State model

Single `AppState` with 10 fields covering everything the UI needs:

```ts
{
  tuning: TuningName;       // which tuning is active
  key: Key;                 // tonality for enharmonic spelling
  displayMode: 'note' | 'deg';
  view: 'chord' | 'arp' | 'scale' | 'both';
  scaleRoot: PitchClass;
  scaleName: string;
  chordRoot: PitchClass | null;       // remembered for voicing cycling
  chordQuality: string | null;
  voicingIdx: number;
  strings: Strings;         // the actual fretboard state
}
```

Actions are grouped in `AppActions` (typed callbacks). No reducer, no zustand, no context — `useState` + `useCallback` is sufficient at this scale. Migrate to Zustand or Jotai when state grows past ~20 fields or needs cross-cutting selectors.

## Engine algorithms

### Chord identification (`pcset.ts → identify`)

Two passes over pitch-class candidates:

**Pass 1 (strict):** for each candidate root, compute intervals to all pcs. For each quality in the 41-entry dictionary, check if every `req` interval is present in the pc set (allowing omittable intervals to be missing). Reject if extras exist.

**Pass 2 (relaxed):** same, but allow up to 2 extra intervals if they are known tensions (b9, add9, #9, add11, #11, b13, add13). Added tensions get appended to the quality symbol in `nameOf`.

**Scoring:** quality.prio + bass-is-root bonus + third-and-seventh bonus − missing penalty − extras penalty. Tiebreaker prefers candidates where bass == root (prevents Cmaj13 from being read as Am11/C when there's a C in the bass).

### Voicing construction (`voicings.ts → buildVoicing`)

Every `VoicingShape` has a `baseRoot` (pitch class the shape is written for) and a `shape` array of 6 frets (one per string, `'x'` = muted). To build a voicing at an arbitrary target root:

```
shift = (targetRoot - baseRoot + 12) mod 12
appliedShape = shape.map(fret => fret === 'x' ? 'muted' : fret + shift)
```

If the requested shape index doesn't fit in the fret range (max 15), `buildVoicing` falls back to the first shape that does. This lets us store shapes canonically (comfortable fret range for C root) without pre-computing every transposition.

### Drop-2 inversions

Standard jazz voicing: take a closed-voicing 4-note chord, drop the 2nd-highest note an octave. The result lays out on 4 adjacent strings with each of the 4 inversions having a distinct bass:

- Root pos: R-5-7-3 (bass = root)
- 1st inv:  3-7-R-5 (bass = 3rd)
- 2nd inv:  5-R-3-7 (bass = 5th)
- 3rd inv:  7-3-5-R (bass = 7th)

Shapes computed mathematically for rootPc = 0 (C), transposable to all 12 keys via the shift mechanism. See `docs/VOICING-SOURCES.md` for references.

## Audio pipeline

```
primeAudio (user gesture)
    │
    ▼
AudioContext.resume() — awaited
    │
    ▼
Silent warmup buffer (10ms) — ensures graph is hot
    │
    ▼
playNote(midi, when, dur, gain)
    │
    ▼
Karplus-Strong buffer generation:
  1. White-noise initial burst (period samples)
  2. Feedback loop: avg(prev, prev-1) × 0.9955
    │
    ▼
BufferSource → Highpass (60 Hz) → Gain → destination
    │
    ▼
Scheduled at currentTime + max(0.01, when)
```

The 10ms scheduling offset is critical: without it, the first note of a strum can be scheduled in the past relative to when the buffer actually starts playing, which causes browsers to drop it silently.

## What we're not doing yet (intentionally)

- **Backend.** No server, no database, no user accounts. Everything runs in the browser.
- **State persistence.** Reload loses state. Add `localStorage` wrapper when users ask.
- **MIDI / audio input.** Out of scope for v0.1. Pitch detection requires WASM or heavy libraries; add as an optional module later.
- **Progressions.** Chord ↔ chord navigation + tempo-based playback is a feature, not a bug fix. Design doc first.
- **Mobile tap interactions.** The fretboard works with mouse; touch support is one `onTouchEnd` wiring away but not implemented.
- **SSR.** Vite's dev server is SPA-only. Switch to Next.js if SSR becomes necessary (not a hot path for this tool).

## Performance notes

- Fretboard has ~150 SVG elements at any time. React's reconciler handles this well; we memoize the Fretboard component on its props.
- Engine `identify` runs once per state change in ~1ms for typical chords. No worker needed.
- Vite bundle is 175 kB raw / 56 kB gzipped. Can be halved by lazy-loading the scales data if needed.

## Contributing conventions

- One concept per file. `spell.ts` is only spelling logic; `pcset.ts` is only pc-set operations.
- Types live next to the thing they describe, except for cross-cutting types which go in `types.ts`.
- Every export has a JSDoc. Every non-trivial algorithm has a comment explaining *why*, not *what*.
- Tests live alongside the source under `tests/engine/`. Name test files after the module: `pcset.ts` → `tests/engine/identify.test.ts` (descriptive of the behavior, not the file).
- Commit messages: imperative mood, English. Scope prefix (`engine:`, `ui:`, `audio:`, `data:`).
