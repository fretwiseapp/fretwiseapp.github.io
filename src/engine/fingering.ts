/**
 * Where to play a line on the neck.
 *
 * `voicings.ts` solves the chord version of this problem — a static shape, six
 * strings at once. This solves the melodic one: given an ordered list of pitches
 * and a region of the neck, pick a string and fret for each so the result is
 * actually playable by a hand that stays roughly in one place.
 *
 * The guitar makes this a real problem rather than a lookup: the same pitch
 * exists at up to six places on the fretboard. A naive "first match wins" picks
 * absurd fingerings (string-hopping back and forth for an ascending scale), and
 * a hand-written box pattern per scale per position would be hundreds of tables
 * that go stale the moment anyone adds a tuning.
 *
 * Method: dynamic programming over candidate placements. Each pitch has a few
 * candidates inside the window; the cost of going from one placement to the next
 * models hand travel and string crossing; Viterbi picks the cheapest path. Cost
 * is O(n·c²) with c ≈ 2–3, so it is trivially fast for any realistic exercise.
 *
 * NOTE on tunings: nothing here assumes standard tuning — it reads the `Tuning`
 * array. Drop D and DADGAD work for free.
 */

import type { MidiNote, Tuning } from './types';

/** A pitch assigned to one place on the neck. `string` 0 = lowest (low E in standard). */
export interface Placement {
  string: number;
  /** 0 = open. */
  fret: number;
  midi: MidiNote;
}

export interface NeckWindow {
  tuning: Tuning;
  /** Lowest *fretted* fret allowed, inclusive. 1 = first fret. */
  minFret: number;
  /** Highest fret allowed, inclusive. */
  maxFret: number;
  /**
   * Whether open strings count as inside the window. Open strings cost the hand
   * nothing, so they are usually welcome near the nut and meaningless at fret 12.
   */
  allowOpen?: boolean;
}

/* ---------- Cost model ----------
 * Weights are relative, not physical. They encode three claims a guitarist would
 * recognise, in descending order of importance:
 *   1. Moving the hand along the neck is the expensive thing.
 *   2. Crossing strings costs a little.
 *   3. Crossing *backwards* (down a string while the pitch goes up) is awkward
 *      and is what naive algorithms produce, so it is penalised hard.
 */
const W_FRET_TRAVEL = 1;
const W_STRING_CROSS = 0.6;
const W_CROSS_BACK = 3;
/** Deterministic tie-break: prefer the lower fret, then the lower string. */
const W_TIE_FRET = 1e-4;
const W_TIE_STRING = 1e-5;

/** Every placement inside the window that sounds `midi`, ordered by string, lowest first. */
export function placementsOf(midi: MidiNote, win: NeckWindow): Placement[] {
  const out: Placement[] = [];
  for (let s = 0; s < win.tuning.length; s++) {
    const fret = midi - win.tuning[s]!;
    if (fret < 0) continue;
    const inWindow = fret >= win.minFret && fret <= win.maxFret;
    const isOpen = fret === 0 && win.allowOpen === true;
    if (inWindow || isOpen) out.push({ string: s, fret, midi });
  }
  return out;
}

/** Every distinct pitch available in the window whose pitch class is in `pcs`, ascending. */
export function pitchesInWindow(pcs: readonly number[], win: NeckWindow): MidiNote[] {
  const wanted = new Set(pcs.map((p) => ((p % 12) + 12) % 12));
  const seen = new Set<MidiNote>();
  for (let s = 0; s < win.tuning.length; s++) {
    const open = win.tuning[s]!;
    const lo = win.allowOpen === true ? 0 : win.minFret;
    for (let f = lo; f <= win.maxFret; f++) {
      if (f !== 0 && f < win.minFret) continue;
      const midi = open + f;
      if (wanted.has(midi % 12)) seen.add(midi);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

function transitionCost(a: Placement, b: Placement): number {
  let c = 0;
  // Open strings are played by the picking hand alone, so they neither move the
  // fretting hand nor cost anything to reach.
  if (a.fret > 0 && b.fret > 0) c += Math.abs(b.fret - a.fret) * W_FRET_TRAVEL;

  const dString = b.string - a.string;
  if (dString !== 0) {
    c += Math.abs(dString) * W_STRING_CROSS;
    const dPitch = b.midi - a.midi;
    // Going up in pitch should go up in string, and vice versa. Disagreement
    // means the hand doubles back across the neck for no reason.
    if (dPitch !== 0 && Math.sign(dString) !== Math.sign(dPitch)) c += W_CROSS_BACK;
  }
  return c;
}

/**
 * Assign a string and fret to each pitch, minimising total hand movement.
 *
 * Returns null if any pitch is unreachable inside the window — callers should
 * widen the window rather than receive a silently wrong fingering.
 */
export function fingerSequence(midis: readonly MidiNote[], win: NeckWindow): Placement[] | null {
  if (midis.length === 0) return [];

  const layers: Placement[][] = [];
  for (const m of midis) {
    const cands = placementsOf(m, win);
    if (cands.length === 0) return null;
    layers.push(cands);
  }

  // Viterbi. `best[i]` = cheapest total cost to reach candidate i of this layer;
  // `from[i]` = index of its predecessor in the previous layer.
  let best: number[] = layers[0]!.map((p) => p.fret * W_TIE_FRET + p.string * W_TIE_STRING);
  const backlinks: number[][] = [layers[0]!.map(() => -1)];

  for (let li = 1; li < layers.length; li++) {
    const prev = layers[li - 1]!;
    const cur = layers[li]!;
    const nextBest = new Array<number>(cur.length).fill(Infinity);
    const nextFrom = new Array<number>(cur.length).fill(0);

    for (let ci = 0; ci < cur.length; ci++) {
      const tie = cur[ci]!.fret * W_TIE_FRET + cur[ci]!.string * W_TIE_STRING;
      for (let pi = 0; pi < prev.length; pi++) {
        const total = best[pi]! + transitionCost(prev[pi]!, cur[ci]!) + tie;
        // Strict `<` keeps the first (lowest-string) candidate on ties, which is
        // what a guitarist reaches for when two options are equally cheap.
        if (total < nextBest[ci]!) {
          nextBest[ci] = total;
          nextFrom[ci] = pi;
        }
      }
    }
    best = nextBest;
    backlinks.push(nextFrom);
  }

  let idx = 0;
  for (let i = 1; i < best.length; i++) if (best[i]! < best[idx]!) idx = i;

  const out: Placement[] = new Array(layers.length);
  for (let li = layers.length - 1; li >= 0; li--) {
    out[li] = layers[li]![idx]!;
    idx = backlinks[li]![idx]!;
  }
  return out;
}

/**
 * Widest fret span the fingering demands, ignoring open strings.
 *
 * A hand comfortably covers about four frets low on the neck and more higher up,
 * where the frets are closer together. Callers use this to warn that a window is
 * asking for a stretch, not to reject it — players differ.
 */
export function fretSpan(placements: readonly Placement[]): number {
  const fretted = placements.filter((p) => p.fret > 0).map((p) => p.fret);
  if (fretted.length === 0) return 0;
  return Math.max(...fretted) - Math.min(...fretted);
}
