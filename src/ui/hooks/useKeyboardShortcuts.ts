import { useEffect } from 'react';
import type { AppState, AppActions } from './useAppState';
import type { ViewMode } from '@engine/types';

/**
 * Global keyboard shortcuts. Bound to document, not to any specific element,
 * so they work no matter where the user's focus is — with one important exception:
 * we skip when the user is typing in a form control, so the chord search input and
 * select dropdowns retain their native keystroke behavior.
 *
 *   Space       Play current shape
 *   A           Arpeggiate
 *   C / Del     Clear fretboard
 *   1 / 2 / 3 / 4   Switch view (chord / arp / scale / both)
 *   N           Toggle notes ↔ degrees
 *   [ / ]       Prev / next voicing
 *   S           Toggle stack mode
 *   V           Toggle "show all voicings" overlay
 *   T           Cycle theme (delegated to callback)
 *   ?           Log shortcut reference to console (stand-in until we ship a help modal)
 */
interface ShortcutDeps {
  state: AppState;
  actions: AppActions;
  onPlay: () => void;
  onArpeggio: () => void;
  onNextVoicing: () => void;
  onPrevVoicing: () => void;
  onCycleTheme?: () => void;
}

const VIEW_KEYS: Record<string, ViewMode> = { '1': 'chord', '2': 'arp', '3': 'scale', '4': 'both' };

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(deps: ShortcutDeps): void {
  const { state, actions, onPlay, onArpeggio, onNextVoicing, onPrevVoicing, onCycleTheme } = deps;

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      // Never swallow user input inside form controls.
      if (isEditable(e.target)) return;
      // Let OS/browser combos through (Cmd+R, Ctrl+F, etc.).
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key;

      if (k === ' ' || k === 'Spacebar') {
        e.preventDefault(); // avoid page scroll
        onPlay();
        return;
      }

      // Case-insensitive single-letter shortcuts.
      const lower = k.length === 1 ? k.toLowerCase() : k;

      switch (lower) {
        case 'a':
          e.preventDefault();
          onArpeggio();
          return;
        case 'c':
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          actions.clear();
          return;
        case 'n':
          e.preventDefault();
          actions.setDisplayMode(state.displayMode === 'note' ? 'deg' : 'note');
          return;
        case '[':
          e.preventDefault();
          onPrevVoicing();
          return;
        case ']':
          e.preventDefault();
          onNextVoicing();
          return;
        case 's':
          e.preventDefault();
          actions.toggleStackMode();
          return;
        case 'v':
          e.preventDefault();
          actions.toggleShowAllVoicings();
          return;
        case 't':
          if (onCycleTheme) {
            e.preventDefault();
            onCycleTheme();
          }
          return;
        case '?':
          e.preventDefault();
          // eslint-disable-next-line no-console
          console.info(
            '[Fretwise] Shortcuts:\n' +
              '  Space     Play\n' +
              '  A         Arpeggio\n' +
              '  C / Del   Clear\n' +
              '  1..4      View (Chord/Arp/Scale/Both)\n' +
              '  N         Notes ↔ Degrees\n' +
              '  [ / ]     Prev / Next voicing\n' +
              '  S         Toggle stack mode\n' +
              '  V         Toggle "show all voicings"\n' +
              '  T         Cycle theme'
          );
          return;
      }

      const viewMode = VIEW_KEYS[k];
      if (viewMode) {
        e.preventDefault();
        actions.setView(viewMode);
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state.displayMode, actions, onPlay, onArpeggio, onNextVoicing, onPrevVoicing, onCycleTheme]);
}
