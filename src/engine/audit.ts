import type { Strings, IdentifiedChord, PitchClass, Key } from './types';
import { TENSIONS } from './pcset';
import { spell } from './spell';

/** Practical warnings about a fingering (stretches, barre requirements). */
export function playabilityWarnings(strings: Strings): string[] {
  const warnings: string[] = [];
  const frets: number[] = [];
  for (let s = 0; s < 6; s++) {
    const v = strings[s];
    if (typeof v === 'number' && v > 0) frets.push(v);
  }
  if (frets.length === 0) return warnings;
  const span = Math.max(...frets) - Math.min(...frets);
  const distinct = new Set(frets).size;
  if (span > 5) warnings.push(`Estirón de ${span} trastes.`);
  if (distinct > 4) warnings.push(`${distinct} trastes distintos: cejilla o pulgar.`);
  return warnings;
}

/** Theoretical audit — catches enharmonic ambiguities, omissions, tensions added. */
export function theoreticalAudit(
  candidate: IdentifiedChord,
  pcs: PitchClass[],
  bassPc: PitchClass | null,
  otherCandidates: IdentifiedChord[],
  key: Key = 'auto',
): string[] {
  const audit: string[] = [];
  const q = candidate.quality;
  const ivSet = new Set(pcs.map((pc) => (pc - candidate.root + 12) % 12));

  if (bassPc !== null && bassPc !== candidate.root) {
    audit.push(`Bajo (${spell(bassPc, key, q.sym)}) ≠ fundamental → slash chord.`);
  }
  if (q.sym === 'dim7') {
    audit.push('Dim7 simétrico: 4 nombres enarmónicos válidos.');
  }
  if (q.sym === 'aug') {
    audit.push('Aumentado: 3 nombres enarmónicos válidos.');
  }
  if (q.sym === '6' && otherCandidates.some((c) => c.quality.sym === 'm7')) {
    audit.push('C6 y Am7 comparten notas; el bajo define la función.');
  }
  if (q.sym === 'sus2' && otherCandidates.some((c) => c.quality.sym === 'sus4')) {
    audit.push('sus2 y sus4 son inversiones mutuas.');
  }
  const sevenChordNoFifth = q.sym.includes('7') && !ivSet.has(7)
    && !['dim7', 'm7b5', '7b5', '7#5', 'maj7#5', '7#5#9', '7b5b9'].includes(q.sym);
  if (sevenChordNoFifth) {
    audit.push('Quinta omitida: idiomático en guitarra.');
  }
  if (candidate.pass === 'relaxed' && candidate.extras.length > 0) {
    const labels = candidate.extras.map((iv) => TENSIONS[iv]).join(', ');
    audit.push(`Tensión agregada: ${labels}.`);
  }

  if (audit.length === 0) audit.push('Sin ambigüedades relevantes.');
  return audit;
}
