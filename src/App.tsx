import { useCallback } from 'react';
import { useAppState } from './ui/hooks/useAppState';
import { useTheme } from './ui/hooks/useTheme';
import { useLocalStorage } from './ui/hooks/useLocalStorage';
import { useKeyboardShortcuts } from './ui/hooks/useKeyboardShortcuts';
import { ThemeToggle } from './ui/components/ThemeToggle';
import { BrandHeader } from './ui/components/BrandHeader';
import { TabBar, tabPanelId } from './ui/components/TabBar';
import type { TabId } from './ui/components/TabBar';
import { ExploreTab } from './ui/tabs/ExploreTab';
import { PracticeTab } from './ui/tabs/PracticeTab';
import { playShape } from './audio';
import { SHAPES } from './data/shapes';
import { TUNINGS } from '@engine/constants';

/**
 * App shell — brand header, section tabs, and the shared state the sections read.
 *
 * Explorar's state (useAppState) is owned here rather than inside ExploreTab so
 * that switching sections never discards what the user had on the fretboard.
 * Keyboard shortcuts are scoped to Explorar: they are its shortcuts, and leaving
 * them live under Practicar would steal Space from a future transport control.
 */

const TAB_KEY = 'fretwise:tab';

function isTabId(v: unknown): v is TabId {
  return v === 'explore' || v === 'practice';
}

export function App() {
  const [state, actions] = useAppState();
  const [theme, setTheme, effectiveTheme] = useTheme();
  const [storedTab, setStoredTab] = useLocalStorage<TabId>(TAB_KEY, 'explore');
  // Guard against a stale or hand-edited localStorage value naming a tab that
  // no longer exists — otherwise no panel renders at all.
  const tab: TabId = isTabId(storedTab) ? storedTab : 'explore';

  const tuning = TUNINGS[state.tuning];

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
    enabled: tab === 'explore',
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

      <TabBar active={tab} onChange={setStoredTab} />

      <div
        id={tabPanelId(tab)}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={-1}
      >
        {tab === 'explore'
          ? <ExploreTab state={state} actions={actions} />
          : <PracticeTab />}
      </div>
    </div>
  );
}
