import { useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import type { AppState, AppActions, EffectsState } from '../hooks/useAppState';
import type { DisplayMode, Key, TuningName, ViewMode, PitchClass } from '@engine/types';
import { SHARP, FLAT, TUNINGS } from '@engine/constants';
import { SHAPES } from '@data/shapes';
import { SCALES } from '@data/scales';
import { qBySymbol } from '@engine/qualities';
import { playShape } from '@audio/index';

const ROOT_LABELS = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
const KEY_OPTIONS: { value: Key; label: string }[] = [
  { value: 'auto', label: 'Auto' }, { value: 'C', label: 'C/Am' }, { value: 'G', label: 'G/Em' },
  { value: 'D', label: 'D/Bm' }, { value: 'A', label: 'A/F#m' }, { value: 'E', label: 'E/C#m' },
  { value: 'B', label: 'B/G#m' }, { value: 'F#', label: 'F#/D#m' }, { value: 'F', label: 'F/Dm' },
  { value: 'Bb', label: 'Bb/Gm' }, { value: 'Eb', label: 'Eb/Cm' }, { value: 'Ab', label: 'Ab/Fm' },
  { value: 'Db', label: 'Db/Bbm' },
];
const TUNING_OPTIONS: { value: TuningName; label: string }[] = [
  { value: 'standard', label: 'Standard EADGBE' }, { value: 'dropD', label: 'Drop D' },
  { value: 'dadgad', label: 'DADGAD' }, { value: 'openG', label: 'Open G' },
  { value: 'halfDown', label: '½ tono abajo' },
];

interface ControlsProps {
  state: AppState;
  actions: AppActions;
}

export function Controls({ state, actions }: ControlsProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  const datalist = (() => {
    const opts: string[] = [];
    for (let r = 0; r < 12; r++) {
      for (const sym of Object.keys(SHAPES)) {
        opts.push(SHARP[r] + sym);
        if (FLAT[r] !== SHARP[r]) opts.push(FLAT[r] + sym);
      }
    }
    return opts;
  })();

  const handleSearch = () => {
    if (!searchRef.current) return;
    const v = actions.setChordFromName(searchRef.current.value);
    if (v) playShape(v, TUNINGS[state.tuning]);
  };

  const playWith = (v: ReturnType<AppActions['setChordFromPicker']>) => {
    if (v) playShape(v, TUNINGS[state.tuning]);
  };

  return (
    <>
      <div className="bar">
        <label htmlFor="chord-search">Buscar acorde</label>
        <input id="chord-search" ref={searchRef} list="allChords" placeholder="Ej: Cmaj7, F#m7b5, G13..." autoComplete="off"
          aria-label="Buscar acorde por nombre (ej. Cmaj7, F#m7b5, G13). Enter para cargar."
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSearch(); }} />
        <datalist id="allChords">
          {datalist.map((c) => <option key={c} value={c} />)}
        </datalist>
        <button className="primary" onClick={handleSearch}>Cargar</button>
        <div className="sep" />
        <label>Raíz</label>
        <select value={state.chordRoot ?? '__none__'} onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value;
          if (v === '__none__') { actions.clear(); return; }
          const pc = Number(v) as PitchClass;
          playWith(actions.setChordFromPicker(pc, state.chordQuality ?? 'maj7'));
        }}>
          <option value="__none__">— Ninguna —</option>
          {ROOT_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
        </select>
        <label>Calidad</label>
        {/* Empty string is a valid quality symbol (major triad), so we use a
            distinct sentinel '__none__' for "no quality selected". */}
        <select value={state.chordQuality ?? '__none__'} onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value;
          if (v === '__none__') { actions.clear(); return; }
          playWith(actions.setChordFromPicker((state.chordRoot ?? 0) as PitchClass, v));
        }}>
          <option value="__none__">— Ninguna —</option>
          {Object.keys(SHAPES).map((sym) => {
            const q = qBySymbol(sym);
            return q ? <option key={sym} value={sym}>{(sym || 'maj') + ' — ' + q.full}</option> : null;
          })}
        </select>
      </div>

      <div className="bar">
        <label>Afinación</label>
        <select value={state.tuning} onChange={(e: ChangeEvent<HTMLSelectElement>) => actions.setTuning(e.target.value as TuningName)}>
          {TUNING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label>Tonalidad</label>
        <select value={state.key} onChange={(e: ChangeEvent<HTMLSelectElement>) => actions.setKey(e.target.value as Key)}>
          {KEY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="sep" />
        <label>Mostrar</label>
        <div className="toggle">
          {(['note', 'deg'] as DisplayMode[]).map((m) => (
            <button key={m} className={state.displayMode === m ? 'on' : ''} onClick={() => actions.setDisplayMode(m)}>
              {m === 'note' ? 'Notas' : 'Grados'}
            </button>
          ))}
        </div>
      </div>

      <div className="bar">
        <label>Vista</label>
        <div className="toggle">
          {([
            { v: 'chord', l: 'Acorde' }, { v: 'arp', l: 'Arpegio' },
            { v: 'scale', l: 'Escala' }, { v: 'both', l: 'Acorde+Escala' },
          ] as { v: ViewMode; l: string }[]).map((o) => (
            <button key={o.v} className={state.view === o.v ? 'on' : ''} onClick={() => actions.setView(o.v)}>{o.l}</button>
          ))}
        </div>
        <div className="sep" />
        <label>Escala raíz</label>
        <select value={state.scaleRoot} onChange={(e: ChangeEvent<HTMLSelectElement>) => actions.setScale(Number(e.target.value) as PitchClass, state.scaleName)}>
          {ROOT_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
        </select>
        <label>Escala</label>
        {/* Empty string = "no scale". Fretboard already degrades gracefully:
            SCALES[''] is undefined → scalePcs stays null → no overlay rendered. */}
        <select value={state.scaleName} onChange={(e: ChangeEvent<HTMLSelectElement>) => actions.setScale(state.scaleRoot, e.target.value)}>
          <option value="">— Ninguna —</option>
          {Object.keys(SCALES).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="sep" />
        <label>Voicing</label>
        <VoicingPicker state={state} actions={actions} />
      </div>

      <div className="bar">
        <label>Efectos</label>
        <EffectsPicker effects={state.effects} onToggle={actions.toggleEffect} />
      </div>
    </>
  );
}

interface EffectsPickerProps {
  effects: EffectsState;
  onToggle: (name: keyof EffectsState) => void;
}

/** Toggle pills for Chorus / Delay / Distortion. Each click flips its wet gain
 *  via a short smoothing ramp so the change is audible but click-free. */
function EffectsPicker({ effects, onToggle }: EffectsPickerProps) {
  const fxs: { key: keyof EffectsState; label: string; hint: string }[] = [
    { key: 'chorus',     label: 'Chorus',     hint: 'Modulación suave tipo shimmer — 0.8 Hz, ±3 ms' },
    { key: 'delay',      label: 'Delay',      hint: 'Eco slapback a 320 ms con 35 % de realimentación' },
    { key: 'distortion', label: 'Distorsión', hint: 'Soft-clip estilo válvula con compensación de volumen' },
  ];
  return (
    <div className="effects-picker" role="group" aria-label="Efectos de audio">
      {fxs.map((fx) => (
        <button
          key={fx.key}
          className={effects[fx.key] ? 'on' : ''}
          onClick={() => onToggle(fx.key)}
          title={fx.hint}
          aria-pressed={effects[fx.key]}
        >
          {fx.label}
        </button>
      ))}
    </div>
  );
}

function VoicingPicker({ state, actions }: ControlsProps) {
  const shapes = state.chordQuality ? SHAPES[state.chordQuality] : null;
  if (!shapes || shapes.length <= 1) {
    return <select disabled><option>—</option></select>;
  }
  return (
    <select value={state.voicingIdx} onChange={(e: ChangeEvent<HTMLSelectElement>) => {
      const v = actions.setVoicingIdx(Number(e.target.value));
      if (v) playShape(v, TUNINGS[state.tuning]);
    }}>
      {shapes.map((s, i) => <option key={i} value={i}>{`${i + 1}. ${s.label}`}</option>)}
    </select>
  );
}
