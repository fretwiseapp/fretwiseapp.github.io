import type { Strings, Tuning, PcExtraction, IdentifiedChord, Key, PitchClass } from './types';
import { Q } from './qualities';
import { spell } from './spell';

/** Tension interval → name. Used when labeling extras in relaxed matches. */
export const TENSIONS: Readonly<Record<number, string>> = {
  1: 'b9', 2: 'add9', 3: '#9', 5: 'add11', 6: '#11', 8: 'b13', 9: 'add13',
};

/**
 * Extract pitch classes, bass, and MIDI notes from a 6-string strings array.
 * Handles both 'muted' (runtime) and deduplicates pitch classes.
 */
export function pcsOf(strings: Strings, tuning: Tuning): PcExtraction {
  const midi: number[] = [];
  let bass: number | null = null;
  for (let s = 0; s < 6; s++) {
    const v = strings[s];
    if (v === 'muted' || v == null) continue;
    const m = tuning[s]! + (v === 0 ? 0 : v);
    midi.push(m);
    if (bass === null || m < bass) bass = m;
  }
  const pcs = Array.from(new Set(midi.map((m) => m % 12))).sort((a, b) => a - b);
  return { pcs, bassPc: bass !== null ? bass % 12 : null, midi };
}

/**
 * Identify a chord from pitch classes, ranked by score.
 *
 * Two-pass algorithm:
 *   1. STRICT: only accept qualities whose required intervals exactly match (no extras).
 *   2. RELAXED: also accept qualities with up to 2 extra tones if they are valid tensions
 *              (see TENSIONS map). Extras get labeled as "add9", "#11", etc.
 *
 * Scoring:
 *   - Base priority from quality definition
 *   - +35 (strict) / +32 (relaxed) when bass == root (strong preference for root-position reading)
 *   - +6 when both 3rd (or b3) AND 7th (or b7) are present (defines harmonic function)
 *   - +2 per present required interval (strict only)
 *   - -6 per missing omittable interval
 *   - -4 per extra (relaxed only)
 *
 * Tie-breaker: candidates where bass == root beat those where it doesn't.
 * This prevents Cmaj13 (root-bass C) from being read as Am11/C.
 */
export function identify(pcs: PitchClass[], bassPc: PitchClass | null): IdentifiedChord[] {
  if (pcs.length < 3) return [];
  const out: IdentifiedChord[] = [];

  const runPass = (relaxed: boolean) => {
    for (const root of pcs) {
      const ivs = pcs.map((p) => (p - root + 12) % 12);
      const ivSet = new Set(ivs);
      for (const q of Q) {
        const rs = new Set(q.req);
        const os = new Set(q.omit);
        let missing = 0;
        let critical = false;
        for (const r of q.req) {
          if (!ivSet.has(r)) {
            if (os.has(r)) missing++;
            else { critical = true; break; }
          }
        }
        if (critical) continue;
        const extras = ivs.filter((iv) => !rs.has(iv));
        if (!relaxed && extras.length > 0) continue;
        if (relaxed && (extras.length === 0 || extras.length > 2 || extras.some((iv) => !(iv in TENSIONS)))) continue;
        const present = q.req.filter((r) => ivSet.has(r)).length;
        if (present < Math.ceil(q.req.length / 2)) continue;

        let score = relaxed ? q.prio - 10 : q.prio;
        if (bassPc === root) score += relaxed ? 32 : 35;
        if (!relaxed && (ivSet.has(3) || ivSet.has(4)) && (ivSet.has(10) || ivSet.has(11))) score += 6;
        score -= missing * 6;
        if (relaxed) score -= extras.length * 4;
        else score += present * 2;

        out.push({
          root,
          quality: q,
          score,
          missing,
          extras: relaxed ? extras : [],
          pass: relaxed ? 'relaxed' : 'strict',
        });
      }
    }
  };

  runPass(false);
  runPass(true);

  out.sort((a, b) => {
    const d = b.score - a.score;
    if (d !== 0) return d;
    // Tie-breaker: prefer candidate where bass == root
    const ab = bassPc === a.root ? 1 : 0;
    const bb = bassPc === b.root ? 1 : 0;
    return bb - ab;
  });
  return out;
}

/**
 * Format a candidate as a chord name, including any added tensions and slash bass.
 */
export function nameOf(c: IdentifiedChord, key: Key, bassPc: PitchClass | null): string {
  const { quality: q, root } = c;
  const rn = spell(root, key, q.sym);
  let base = rn + q.sym;
  if (c.extras && c.extras.length > 0) {
    const names = c.extras.map((iv) => TENSIONS[iv]!);
    const adds = names.filter((x) => x.startsWith('add'));
    const alts = names.filter((x) => !x.startsWith('add'));
    base = rn + q.sym + adds.join('') + alts.join('');
  }
  if (bassPc !== null && bassPc !== root) {
    base += '/' + spell(bassPc, key, q.sym);
  }
  return base;
}
