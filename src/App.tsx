import { useCallback, useEffect, useMemo } from 'react';
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
import { playNote, playShape, setEffectEnabled } from './audio';
import { SHAPES } from './data/shapes';

export function App() {
  const [state, actions] = useAppState();
  const [theme, setTheme, effectiveTheme] = useTheme();

  const { tuning, ext, candidates, current } = useMemo(
    () => identifyCurrent(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.strings, state.tuning]
  );

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
    const next = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
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

  // Mirror effects state to the audio engine whenever it changes. The engine's
  // chain is built lazily on first playback — calling setEffectEnabled before
  // any sound has played is safe (buildChain runs on demand).
  useEffect(() => {
    setEffectEnabled('chorus', state.effects.chorus);
    setEffectEnabled('delay', state.effects.delay);
    setEffectEnabled('distortion', state.effects.distortion);
  }, [state.effects.chorus, state.effects.delay, state.effects.distortion]);

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
