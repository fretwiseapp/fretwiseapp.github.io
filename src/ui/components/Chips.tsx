import type { AppState, AppActions } from '../hooks/useAppState';
import type { PitchClass } from '@engine/types';
import { TUNINGS } from '@engine/constants';
import { buildVoicing } from '@engine/voicings';
import { playShape } from '@audio/index';

const COMMON_QUALITIES = ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', 'sus2', 'sus4', '6', 'm6', 'add9', '9', 'm9', 'maj9', '13', 'm13', '7b9', '7#9', '7#11'];

interface ChipsProps {
  state: AppState;
  actions: AppActions;
}

export function Chips({ state, actions }: ChipsProps) {
  return (
    <div className="bar">
      <label id="chip-builder-label">Constructor</label>
      <div className="chips" role="group" aria-labelledby="chip-builder-label">
        {COMMON_QUALITIES.map((q) => {
          const active = state.chordQuality === q;
          return (
            <button
              key={q}
              className={active ? 'on' : ''}
              aria-pressed={active}
              onClick={() => {
                const root = (state.chordRoot ?? 0) as PitchClass;
                actions.setChordFromChip(root, q);
                const v = buildVoicing(root, q, 0);
                if (v) playShape(v, TUNINGS[state.tuning]);
              }}
            >
              {q || 'maj'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
