import { useEffect, useMemo, useState } from 'react';
import { identifyCurrent } from '../hooks/useAppState';
import type { AppState, AppActions } from '../hooks/useAppState';
import { Controls } from '../components/Controls';
import { Chips } from '../components/Chips';
import { HeroChord } from '../components/HeroChord';
import { Fretboard } from '../components/Fretboard';
import { StringButtons } from '../components/StringButtons';
import { ResultsCard } from '../components/ResultsCard';
import { playNote } from '../../audio';
import { FRET_COUNT } from '@engine/constants';

/**
 * Explorar — the reference surface.
 *
 * This is Fretwise as it existed before the product grew a second section: the
 * whole "what is this / where do I play it" workflow on one screen. Extracted
 * verbatim out of App so the shell can own navigation and nothing here changed
 * behaviourally.
 *
 * State lives in App (via useAppState) rather than here, so switching to
 * Practicar and back does not wipe the fretboard. The only local state is the
 * fret window, which is view-only and intentionally not persisted.
 */

// Fret-window presets. A number zooms to that many frets (7 by default),
// enlarging the cells so a chord high up the neck reads clearly; 'all' shows
// the full neck.
const FRET_WINDOWS: readonly (number | 'all')[] = ['all', 7, 5, 4];

interface ExploreTabProps {
  state: AppState;
  actions: AppActions;
}

export function ExploreTab({ state, actions }: ExploreTabProps) {
  // Fret-window zoom (view-only, not persisted). Defaults to a 7-fret window at
  // the nut (frets 1–7); ◀/▶ slide it (1–7, 2–8, …) and the size buttons change
  // the span ("Todos" shows the whole neck). start is 0-based (first fret = start+1).
  const [fretLen, setFretLen] = useState<number | 'all'>(7);
  const [fretStart, setFretStart] = useState(0);
  const winLen = fretLen === 'all' ? FRET_COUNT : fretLen;
  const maxStart = Math.max(0, FRET_COUNT - winLen);
  const start = Math.min(Math.max(fretStart, 0), maxStart);

  const { tuning, ext, candidates, current } = useMemo(
    () => identifyCurrent(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.strings, state.tuning]
  );

  // When zoomed, keep the pressed notes visible: snap the window to fit whenever
  // the current chord's frets fall outside it (e.g. after loading a chord).
  useEffect(() => {
    if (fretLen === 'all') return;
    const pressed = state.strings.filter((v): v is number => typeof v === 'number' && v > 0);
    if (pressed.length === 0) return;
    const lo = Math.min(...pressed), hi = Math.max(...pressed);
    if (lo < start + 1 || hi > start + winLen) {
      setFretStart(Math.min(Math.max(lo - 1, 0), Math.max(0, FRET_COUNT - winLen)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.strings, fretLen]);

  return (
    <>
      <Controls state={state} actions={actions} />
      <Chips state={state} actions={actions} />

      <div className="hero-bar">
        <HeroChord current={current} pcs={ext.pcs} bassPc={ext.bassPc} key_={state.key} />
      </div>

      <div className="stage-toolbar">
        <span className="stage-toolbar-label">Trastes</span>
        <div className="toggle">
          {FRET_WINDOWS.map((opt) => (
            <button key={String(opt)} className={fretLen === opt ? 'on' : ''} onClick={() => setFretLen(opt)}>
              {opt === 'all' ? 'Todos' : opt}
            </button>
          ))}
        </div>
        {fretLen !== 'all' && (
          <div className="fret-window-pos">
            <button type="button" onClick={() => setFretStart(Math.max(start - 1, 0))} disabled={start <= 0} aria-label="Ventana un traste hacia el clavijero">◀</button>
            <span className="fret-window-label">Trastes <strong>{start + 1}–{start + winLen}</strong></span>
            <button type="button" onClick={() => setFretStart(Math.min(start + 1, maxStart))} disabled={start >= maxStart} aria-label="Ventana un traste hacia el cuerpo">▶</button>
          </div>
        )}
      </div>

      <div className="stage">
        <Fretboard
          strings={state.strings}
          overlays={state.overlays}
          tuning={tuning}
          keyName={state.key}
          displayMode={state.displayMode}
          view={state.view}
          current={current}
          chordRoot={state.chordRoot}
          chordQuality={state.chordQuality}
          scaleRoot={state.scaleRoot}
          scaleName={state.scaleName}
          showAllVoicings={state.showAllVoicings}
          voicingFilter={state.voicingFilter}
          fretStart={start}
          fretCount={winLen}
          onFretClick={actions.toggleFret}
          onStringStateClick={actions.toggleStringState}
          onFretClickSound={(midi) => playNote(midi, 0, 1.2, 0.38)}
        />
        <StringButtons strings={state.strings} onToggle={actions.toggleStringState} />
        {/* Limpiar lives in its own row under the fretboard so it never overlaps
            fret graphics. Horizontally offset to the right to sit roughly under
            frets 15-17 on wide layouts — collapses to flush-right on narrow ones. */}
        <div className="stage-clear-row">
          <button
            type="button"
            className="stage-clear"
            onClick={actions.clear}
            aria-label="Limpiar diapasón"
          >Limpiar</button>
        </div>
      </div>

      <ResultsCard
        state={state}
        actions={actions}
        current={current}
        candidates={candidates}
        pcs={ext.pcs}
        bassPc={ext.bassPc}
        midi={ext.midi}
        tuning={tuning}
      />
    </>
  );
}
