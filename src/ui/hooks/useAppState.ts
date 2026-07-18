import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Strings, Key, DisplayMode, ViewMode, TuningName, PitchClass, VoicingFamily } from '@engine/types';
import { TUNINGS, FRET_COUNT } from '@engine/constants';
import { pcsOf, identify } from '@engine/pcset';
import { buildVoicing } from '@engine/voicings';
import { parseChordName } from '@engine/index';

const EMPTY_STRINGS: Strings = ['muted', 'muted', 'muted', 'muted', 'muted', 'muted'];

/* ---------- Persisted preferences ---------- */

const PREFS_KEY = 'chord-lab:prefs';

interface PersistedPrefs {
  tuning: TuningName;
  key: Key;
  displayMode: DisplayMode;
  view: ViewMode;
  scaleRoot: PitchClass;
  scaleName: string;
  showAllVoicings: boolean;
  voicingFilter: VoicingFilter;
  effects: EffectsState;
}

export type VoicingFilter = Record<VoicingFamily, boolean>;

export interface EffectsState {
  chorus: boolean;
  delay: boolean;
  distortion: boolean;
}

const DEFAULT_EFFECTS: EffectsState = {
  chorus: false,
  delay: false,
  distortion: false,
};

const DEFAULT_VOICING_FILTER: VoicingFilter = {
  caged: true,
  drop2: true,
  drop3: true,
  invHigh: true,
};

const VOICING_FAMILY_KEYS: readonly VoicingFamily[] = ['caged', 'drop2', 'drop3', 'invHigh'];

function isVoicingFilter(v: unknown): v is VoicingFilter {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return VOICING_FAMILY_KEYS.every((k) => typeof o[k] === 'boolean');
}

function isEffectsState(v: unknown): v is EffectsState {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.chorus === 'boolean' && typeof o.delay === 'boolean' && typeof o.distortion === 'boolean';
}

const VALID_DISPLAY_MODES: readonly DisplayMode[] = ['note', 'deg'];
const VALID_VIEWS: readonly ViewMode[] = ['chord', 'arp', 'scale', 'both'];

/**
 * Read prefs from localStorage defensively. Returns only keys whose shape passes
 * runtime validation — stale/corrupt fields are dropped so they fall back to defaults.
 */
function loadPrefs(): Partial<PersistedPrefs> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const p = parsed as Record<string, unknown>;
    const out: Partial<PersistedPrefs> = {};
    if (typeof p.tuning === 'string' && p.tuning in TUNINGS) out.tuning = p.tuning as TuningName;
    if (typeof p.key === 'string') out.key = p.key as Key;
    if (typeof p.displayMode === 'string' && VALID_DISPLAY_MODES.includes(p.displayMode as DisplayMode)) {
      out.displayMode = p.displayMode as DisplayMode;
    }
    if (typeof p.view === 'string' && VALID_VIEWS.includes(p.view as ViewMode)) {
      out.view = p.view as ViewMode;
    }
    if (typeof p.scaleRoot === 'number' && Number.isInteger(p.scaleRoot) && p.scaleRoot >= 0 && p.scaleRoot < 12) {
      out.scaleRoot = p.scaleRoot as PitchClass;
    }
    if (typeof p.scaleName === 'string') out.scaleName = p.scaleName;
    if (typeof p.showAllVoicings === 'boolean') out.showAllVoicings = p.showAllVoicings;
    if (isVoicingFilter(p.voicingFilter)) out.voicingFilter = p.voicingFilter;
    if (isEffectsState(p.effects)) out.effects = p.effects;
    return out;
  } catch {
    return {};
  }
}

function savePrefs(p: PersistedPrefs): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* quota exceeded / disabled — silently degrade, state remains in-memory */
  }
}

/* ---------- Deep-link URL sync ---------- */

/**
 * URL shape (compact, human-readable):
 *   ?s=m,3,2,0,1,0   six string frets; 'm' = muted, 0..24 = fret
 *   ?t=dropD         tuning name (optional, defaults to 'standard')
 *   ?v=scale         view mode (optional, defaults to 'chord')
 *
 * Only params with non-default values are written, so a cleared fretboard
 * leaves the URL clean for easy bookmarking of the app root.
 */
interface UrlState {
  strings?: Strings;
  tuning?: TuningName;
  view?: ViewMode;
}

function encodeStrings(strings: Strings): string {
  return strings.map((v) => (v === 'muted' ? 'm' : String(v))).join(',');
}

function decodeStrings(s: string): Strings | null {
  const parts = s.split(',');
  if (parts.length !== 6) return null;
  const out: (number | 'muted')[] = [];
  for (const p of parts) {
    if (p === 'm') {
      out.push('muted');
    } else {
      const n = Number(p);
      // Accept any integer in renderable range. Bounding by FRET_COUNT prevents
      // a malformed/malicious URL from placing dots past the visible neck.
      if (!Number.isInteger(n) || n < 0 || n > FRET_COUNT) return null;
      out.push(n);
    }
  }
  return out as Strings;
}

function allMuted(strings: Strings): boolean {
  return strings.every((v) => v === 'muted');
}

function loadUrlState(): UrlState {
  try {
    if (typeof window === 'undefined') return {};
    const p = new URLSearchParams(window.location.search);
    const out: UrlState = {};
    const s = p.get('s');
    if (s) {
      const decoded = decodeStrings(s);
      if (decoded) out.strings = decoded;
    }
    const t = p.get('t');
    if (t && t in TUNINGS) out.tuning = t as TuningName;
    const v = p.get('v');
    if (v && VALID_VIEWS.includes(v as ViewMode)) out.view = v as ViewMode;
    return out;
  } catch {
    return {};
  }
}

function saveUrlState(strings: Strings, tuning: TuningName, view: ViewMode): void {
  try {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (!allMuted(strings)) params.set('s', encodeStrings(strings));
    if (tuning !== 'standard') params.set('t', tuning);
    if (view !== 'chord') params.set('v', view);
    const qs = params.toString();
    const next = qs ? `?${qs}` : window.location.pathname;
    // replaceState: no new history entry, so back/forward remain clean.
    window.history.replaceState(null, '', next);
  } catch {
    /* navigating file:// or sandboxed iframe — skip URL sync silently */
  }
}

/** Build a shareable URL reflecting the current chord state. */
export function buildShareUrl(strings: Strings, tuning: TuningName, view: ViewMode): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams();
  if (!allMuted(strings)) params.set('s', encodeStrings(strings));
  if (tuning !== 'standard') params.set('t', tuning);
  if (view !== 'chord') params.set('v', view);
  const qs = params.toString();
  return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
}

/** A stacked voicing overlay with identifier color. */
export interface Overlay {
  strings: Strings;
  root: PitchClass;
  quality: string;
  voicingIdx: number;
  /** Octave offset (0 = first playable, 1 = +12). Part of the dedup key so the
   *  same shape at two neck positions counts as two distinct overlays. */
  octave: number;
  label: string;
  inversion: string;
  bassPc: PitchClass | null;
  family: VoicingFamily;
}

const MAX_OVERLAYS = 5;

export interface AppState {
  tuning: TuningName;
  key: Key;
  displayMode: DisplayMode;
  view: ViewMode;
  scaleRoot: PitchClass;
  scaleName: string;
  chordRoot: PitchClass | null;
  chordQuality: string | null;
  voicingIdx: number;
  voicingOctave: number;      // 0 or 1 — +12 fret offset when user picks an octave-up variant
  strings: Strings;           // primary voicing (manually editable)
  overlays: Overlay[];        // additional stacked voicings (display only)
  stackMode: boolean;         // when true, card clicks ADD overlays; when false, REPLACE strings
  showAllVoicings: boolean;   // when true, fretboard renders ALL voicings of the current chord as colored rings
  /** Per-family visibility toggles; only applied while `showAllVoicings` is on. */
  voicingFilter: VoicingFilter;
  /** Per-effect on/off toggles applied to the global audio chain. */
  effects: EffectsState;
}

export interface AppActions {
  setTuning: (t: TuningName) => void;
  setKey: (k: Key) => void;
  setDisplayMode: (m: DisplayMode) => void;
  setView: (v: ViewMode) => void;
  setScale: (root: PitchClass, name: string) => void;
  setChordFromPicker: (root: PitchClass, sym: string) => Strings | null;
  setChordFromName: (name: string) => Strings | null;
  setChordFromChip: (root: PitchClass, sym: string) => Strings | null;
  setVoicingIdx: (i: number) => Strings | null;
  selectVoicingCard: (root: PitchClass, sym: string, idx: number, label: string, inversion: string, bassPc: PitchClass | null, family: VoicingFamily, octave: number) => Strings | null;
  toggleStackMode: () => void;
  removeOverlay: (i: number) => void;
  clearOverlays: () => void;
  toggleShowAllVoicings: () => void;
  toggleVoicingFamily: (f: VoicingFamily) => void;
  toggleEffect: (name: keyof EffectsState) => void;
  toggleFret: (stringIdx: number, fret: number) => void;
  toggleStringState: (stringIdx: number) => void;
  clear: () => void;
}

export function useAppState(): [AppState, AppActions] {
  // Lazy initializer: merge layered sources. Priority (highest wins):
  //   URL query params  >  localStorage prefs  >  hardcoded defaults.
  // A shared URL reliably displays the shared chord even if the recipient has
  // their own saved preferences. Ephemeral fields (chord selection metadata,
  // overlays, stackMode) are never persisted — except strings, which ARE
  // hydrated from the URL so shared links render immediately.
  const [state, setState] = useState<AppState>(() => {
    const prefs = loadPrefs();
    const url = loadUrlState();
    return {
      tuning: url.tuning ?? prefs.tuning ?? 'standard',
      key: prefs.key ?? 'auto',
      displayMode: prefs.displayMode ?? 'note',
      view: url.view ?? prefs.view ?? 'chord',
      scaleRoot: prefs.scaleRoot ?? 0,
      scaleName: prefs.scaleName ?? 'Jónica (Mayor)',
      chordRoot: null,
      chordQuality: null,
      voicingIdx: 0,
      voicingOctave: 0,
      strings: url.strings ?? ([...EMPTY_STRINGS] as Strings),
      overlays: [],
      stackMode: false,
      showAllVoicings: prefs.showAllVoicings ?? false,
      voicingFilter: prefs.voicingFilter ?? { ...DEFAULT_VOICING_FILTER },
      effects: prefs.effects ?? { ...DEFAULT_EFFECTS },
    };
  });

  // Persist the preference subset whenever any persisted field changes.
  // Ephemeral state churn (strings/overlays) does not trigger writes.
  useEffect(() => {
    savePrefs({
      tuning: state.tuning,
      key: state.key,
      displayMode: state.displayMode,
      view: state.view,
      scaleRoot: state.scaleRoot,
      scaleName: state.scaleName,
      showAllVoicings: state.showAllVoicings,
      voicingFilter: state.voicingFilter,
      effects: state.effects,
    });
  }, [state.tuning, state.key, state.displayMode, state.view, state.scaleRoot, state.scaleName, state.showAllVoicings, state.voicingFilter, state.effects]);

  // Keep the URL in sync with the *shareable* slice (strings/tuning/view). Writes
  // via replaceState so the back button isn't polluted with every fret tap.
  useEffect(() => {
    saveUrlState(state.strings, state.tuning, state.view);
  }, [state.strings, state.tuning, state.view]);

  const setTuning = useCallback((tuning: TuningName) => setState((s) => ({ ...s, tuning })), []);
  const setKey = useCallback((key: Key) => setState((s) => ({ ...s, key })), []);
  const setDisplayMode = useCallback((displayMode: DisplayMode) => setState((s) => ({ ...s, displayMode })), []);
  const setView = useCallback((view: ViewMode) => setState((s) => ({ ...s, view })), []);
  const setScale = useCallback((scaleRoot: PitchClass, scaleName: string) => setState((s) => ({ ...s, scaleRoot, scaleName })), []);

  const applyChord = useCallback((root: PitchClass, sym: string, idx = 0): Strings | null => {
    const v = buildVoicing(root, sym, idx, 0);
    if (!v) return null;
    setState((s) => ({ ...s, strings: v, chordRoot: root, chordQuality: sym, voicingIdx: idx, voicingOctave: 0, overlays: [] }));
    return v;
  }, []);

  const setChordFromPicker = useCallback((root: PitchClass, sym: string) => applyChord(root, sym, 0), [applyChord]);
  const setChordFromChip = useCallback((root: PitchClass, sym: string) => applyChord(root, sym, 0), [applyChord]);
  const setChordFromName = useCallback((name: string): Strings | null => {
    const parsed = parseChordName(name);
    if (!parsed) return null;
    return applyChord(parsed.pc, parsed.sym, 0);
  }, [applyChord]);

  const setVoicingIdx = useCallback((idx: number): Strings | null => {
    let out: Strings | null = null;
    setState((s) => {
      if (s.chordRoot === null || !s.chordQuality) return s;
      const v = buildVoicing(s.chordRoot, s.chordQuality, idx, 0);
      if (!v) return s;
      out = v;
      return { ...s, strings: v, voicingIdx: idx, voicingOctave: 0 };
    });
    return out;
  }, []);

  /** Select a voicing or inversion from the results card. Respects stackMode.
   *  `octave` (0 or 1) selects between the first playable position and the +12
   *  variant — both stored as distinct entries in listVoicings. */
  const selectVoicingCard = useCallback((root: PitchClass, sym: string, idx: number, label: string, inversion: string, bassPc: PitchClass | null, family: VoicingFamily, octave: number): Strings | null => {
    const v = buildVoicing(root, sym, idx, octave);
    if (!v) return null;
    setState((s) => {
      if (s.stackMode) {
        const overlay: Overlay = { strings: v, root, quality: sym, voicingIdx: idx, octave, label, inversion, bassPc, family };
        // Toggle: clicking the same card while stacked removes it. Dedup key
        // includes octave so the same shape at two positions counts as distinct.
        const existingIdx = s.overlays.findIndex((o) => o.root === root && o.quality === sym && o.voicingIdx === idx && o.octave === octave);
        if (existingIdx >= 0) {
          return { ...s, overlays: s.overlays.filter((_, i) => i !== existingIdx) };
        }
        if (s.overlays.length >= MAX_OVERLAYS) return s;
        return { ...s, overlays: [...s.overlays, overlay] };
      }
      return { ...s, strings: v, chordRoot: root, chordQuality: sym, voicingIdx: idx, voicingOctave: octave, overlays: [] };
    });
    return v;
  }, []);

  const toggleStackMode = useCallback(() => setState((s) => ({ ...s, stackMode: !s.stackMode })), []);
  const removeOverlay = useCallback((i: number) => setState((s) => ({ ...s, overlays: s.overlays.filter((_, idx) => idx !== i) })), []);
  const clearOverlays = useCallback(() => setState((s) => ({ ...s, overlays: [] })), []);
  const toggleShowAllVoicings = useCallback(() => setState((s) => ({ ...s, showAllVoicings: !s.showAllVoicings })), []);
  const toggleVoicingFamily = useCallback((f: VoicingFamily) => setState((s) => ({
    ...s,
    voicingFilter: { ...s.voicingFilter, [f]: !s.voicingFilter[f] },
  })), []);
  const toggleEffect = useCallback((name: keyof EffectsState) => setState((s) => ({
    ...s,
    effects: { ...s.effects, [name]: !s.effects[name] },
  })), []);

  const toggleFret = useCallback((stringIdx: number, fret: number) => {
    setState((s) => {
      const next = [...s.strings] as Strings;
      next[stringIdx] = next[stringIdx] === fret ? 'muted' : fret;
      return { ...s, strings: next, overlays: [] };
    });
  }, []);

  const toggleStringState = useCallback((stringIdx: number) => {
    setState((s) => {
      const next = [...s.strings] as Strings;
      const v = next[stringIdx];
      if (v === 'muted') next[stringIdx] = 0;
      else next[stringIdx] = 'muted';
      return { ...s, strings: next };
    });
  }, []);

  const clear = useCallback(() => setState((s) => ({
    ...s,
    strings: [...EMPTY_STRINGS] as Strings,
    chordRoot: null,
    chordQuality: null,
    voicingIdx: 0,
    voicingOctave: 0,
    overlays: [],
  })), []);

  const actions = useMemo<AppActions>(() => ({
    setTuning, setKey, setDisplayMode, setView, setScale,
    setChordFromPicker, setChordFromName, setChordFromChip,
    setVoicingIdx, selectVoicingCard,
    toggleStackMode, removeOverlay, clearOverlays, toggleShowAllVoicings,
    toggleVoicingFamily, toggleEffect,
    toggleFret, toggleStringState, clear,
  }), [setTuning, setKey, setDisplayMode, setView, setScale, setChordFromPicker, setChordFromName, setChordFromChip, setVoicingIdx, selectVoicingCard, toggleStackMode, removeOverlay, clearOverlays, toggleShowAllVoicings, toggleVoicingFamily, toggleEffect, toggleFret, toggleStringState, clear]);

  return [state, actions];
}

export function identifyCurrent(state: AppState) {
  const tuning = TUNINGS[state.tuning];
  const ext = pcsOf(state.strings, tuning);
  const candidates = ext.pcs.length >= 3 ? identify(ext.pcs, ext.bassPc) : [];
  return { tuning, ext, candidates, current: candidates[0] ?? null };
}
