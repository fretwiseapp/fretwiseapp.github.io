import type { IdentifiedChord, Key, PitchClass } from '@engine/types';
import { nameOf } from '@engine/pcset';
import { spell } from '@engine/spell';

interface HeroChordProps {
  current: IdentifiedChord | null;
  pcs: PitchClass[];
  bassPc: PitchClass | null;
  key_: Key;
}

export function HeroChord({ current, pcs, bassPc, key_ }: HeroChordProps) {
  const key = key_;
  let name = '—';
  let desc = 'esperando acorde';
  let isEmpty = true;

  if (pcs.length === 1) {
    name = spell(pcs[0]!, key);
    desc = 'nota única';
    isEmpty = false;
  } else if (pcs.length === 2) {
    const iv = Math.min((pcs[1]! - pcs[0]! + 12) % 12, (pcs[0]! - pcs[1]! + 12) % 12);
    if (iv === 7) {
      const r = ((pcs[1]! - pcs[0]! + 12) % 12) === 7 ? pcs[0]! : pcs[1]!;
      name = spell(r, key) + '5';
      desc = 'power chord';
    } else {
      name = spell(pcs[0]!, key) + ' · ' + spell(pcs[1]!, key);
      desc = 'intervalo';
    }
    isEmpty = false;
  } else if (pcs.length >= 3 && current) {
    name = nameOf(current, key, bassPc);
    desc = current.quality.full;
    isEmpty = false;
  } else if (pcs.length >= 3 && !current) {
    name = '?';
    desc = 'set no identificado';
    isEmpty = false;
  }

  return (
    <div className={`hero-chord${isEmpty ? ' is-empty' : ''}`} aria-live="polite">
      <div className="hc-name">{name}</div>
      <div className="hc-desc">{desc}</div>
    </div>
  );
}
