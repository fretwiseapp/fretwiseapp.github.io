import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppState, identifyCurrent } from './ui/hooks/useAppState';
import { useTheme } from './ui/hooks/useTheme';
import { useKeyboardShortcuts } from './ui/hooks/useKeyboardShortcuts';
import { Controls } from './ui/components/Controls';
import { Chips } from './ui/components/Chips';
import { HeroChord } from './ui/components/HeroChord';
import { Fretboard } from './ui/components/Fretboard';
import { StringButtons } from './ui/components/StringButtons';
import { ResultsCard } from './ui/components/ResultsCard';
import { ThemeToggle } from './ui/components/ThemeToggle';
import { BrandHeader } from './ui/components/BrandHeader';
import { playNote, playShape } from './audio';
import { SHAPES } from './data/shapes';
import { FRET_COUNT } from '@engine/constants';

// Fret-window presets. 'all' = the full neck (default); a number zooms to that
// many frets, enlarging the cells so a chord high up the neck reads clearly.
const FRET_WINDOWS: readonly (number | 'all')[] = ['all', 7, 5, 4];

export function App() {
  const [state, actions] = useAppState();
  const [theme, setTheme, effectiveTheme] = useTheme();

  // Fret-window zoom (view-only, not persisted). start is 0-based; first visible
  // fret is start+1.
  const [fretLen, setFretLen] = useState<number | 'all'>('all');
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

  // Keyboard shortcut callbacks. Voicing cycling is bounded by the current chord's
  // shape count; if there's no selected chord, [/] is a no-op.
  const onPlay = useCallback(() => { playShape(state.strings, tuning); }, [state.strings, tuning]);
  const onArpeggio = useCallback(() => { playShape(state.strings, tuning, 'arp'); }, [state.strings, tuning]);
  const cycleVoicing = useCallback((delta: 1 | -1) => {
    if (!state.chordQuality) return;
    const shapes = SHAPES[state.chordQuality];
    if (!shapes || shapes.length === 0) return;
    const next = (state.voicingIdx + delta + shapes.length) % shapes.length;
    const v = actions.setVoicingIdx(next);
    if (v) playShape(v, tuning);
  }, [state.chordQuality, state.voicingIdx, actions, tuning]);
  const cycleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'auto' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  useKeyboardShortcuts({
    state,
    actions,
    onPlay,
    onArpeggio,
    onNextVoicing: () => cycleVoicing(1),
    onPrevVoicing: () => cycleVoicing(-1),
    onCycleTheme: cycleTheme,
  });

  return (
    <div className="app">
      <BrandHeader>
        <ThemeToggle theme={theme} effective={effectiveTheme} onChange={setTheme} />
      </BrandHeader>

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
    </div>
  );
}
