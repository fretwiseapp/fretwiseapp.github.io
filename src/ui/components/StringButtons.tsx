import type { Strings } from '@engine/types';

interface StringButtonsProps {
  strings: Strings;
  onToggle: (stringIdx: number) => void;
}

/** Strings are indexed 0..5 as [low E, A, D, G, B, high E]; UI counts them 6→1. */
const STRING_NUMBER = [6, 5, 4, 3, 2, 1];

export function StringButtons({ strings, onToggle }: StringButtonsProps) {
  return (
    <div className="string-btns" role="group" aria-label="Estado de cada cuerda">
      <span aria-hidden="true">cuerdas 6→1:</span>
      {strings.map((v, s) => {
        const cls = v === 'muted' ? 'muted' : v === 0 ? 'open' : '';
        const label = v === 'muted' ? '×' : v === 0 ? 'O' : String(v);
        const stateText = v === 'muted' ? 'muted' : v === 0 ? 'al aire' : `traste ${v}`;
        return (
          <button
            key={s}
            className={cls}
            onClick={() => onToggle(s)}
            aria-label={`Cuerda ${STRING_NUMBER[s]}: ${stateText}. Click para alternar mute/abierta.`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
