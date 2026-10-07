import { useMemo, useState } from 'react';
import { SCALE_FAMILIES } from '../../data/scales';
import { SHARP, TUNINGS, FRET_COUNT } from '@engine/constants';
import { buildScaleExercise } from '@engine/generate';
import { DUR } from '@engine/time';
import type { PitchClass, TuningName } from '@engine/types';
import { PracticeBoard } from '../components/PracticeBoard';
import { usePracticePlayer } from '../hooks/usePracticePlayer';
import type { Direction } from '@engine/generate';

/**
 * Practicar — scales and patterns, at tempo.
 *
 * First exercise type on purpose: the engine generates the material, so this
 * ships with every scale in every key and position and nothing had to be
 * authored. It also exercises the whole machine end to end — generator,
 * fingering, transport, playhead — which is what the next exercise types reuse.
 *
 * No microphone yet. This guides; it does not grade. Saying so plainly in the UI
 * matters more than it looks: a practice tool that seems to be listening and is
 * not would be worse than one that is honest about guiding.
 */

const DIRECTIONS: readonly { id: Direction; label: string }[] = [
  { id: 'up', label: 'Subir' },
  { id: 'down', label: 'Bajar' },
  { id: 'upDown', label: 'Subir y bajar' },
];

const FIGURES: readonly { id: string; label: string; ticks: number }[] = [
  { id: 'q', label: 'Negras', ticks: DUR.quarter },
  { id: 'e', label: 'Corcheas', ticks: DUR.eighth },
  { id: 't', label: 'Tresillos', ticks: DUR.triplet8 },
  { id: 's', label: 'Semicorcheas', ticks: DUR.sixteenth },
];

const SPANS = [4, 5, 6] as const;

export function PracticeTab() {
  // Defaults: A minor pentatonic at the 5th fret — the first thing most guitarists
  // ever learn to run, so the page is useful before anything is touched.
  const [root, setRoot] = useState<PitchClass>(9);
  const [scaleName, setScaleName] = useState('Pentatónica menor');
  const [minFret, setMinFret] = useState(5);
  const [span, setSpan] = useState<number>(4);
  const [allowOpen, setAllowOpen] = useState(false);
  const [direction, setDirection] = useState<Direction>('upDown');
  const [figure, setFigure] = useState('e');
  const [tuningName] = useState<TuningName>('standard');
  const [displayMode, setDisplayMode] = useState<'note' | 'deg'>('deg');

  const [bpm, setBpm] = useState(72);
  const [loop, setLoop] = useState(true);
  const [metronome, setMetronome] = useState(true);
  const [countInBars, setCountInBars] = useState(1);

  const maxFret = Math.min(minFret + span - 1, FRET_COUNT);
  const tuning = TUNINGS[tuningName];
  const noteValue = FIGURES.find((f) => f.id === figure)!.ticks;

  const exercise = useMemo(
    () => buildScaleExercise({
      root, scaleName,
      window: { tuning, minFret, maxFret, allowOpen },
      direction, noteValue,
    }),
    [root, scaleName, tuning, minFret, maxFret, allowOpen, direction, noteValue]
  );

  // The player needs a sequence even when the window yields nothing playable;
  // an empty one keeps the hook's identity stable instead of conditionally called.
  const EMPTY = useMemo(() => ({ events: [], beatsPerBar: 4, lengthTicks: 1920 }), []);
  const settings = useMemo(() => ({ bpm, loop, metronome, countInBars }), [bpm, loop, metronome, countInBars]);
  const player = usePracticePlayer(exercise?.sequence ?? EMPTY, settings);

  const noteCount = exercise?.sequence.events.length ?? 0;

  return (
    <div className="practice">
      <div className="practice-head">
        <h2>Practicar · escalas y patrones</h2>
        <p>
          El mástil marca la nota que viene. Todavía <strong>no escucha</strong> lo que tocás —
          por ahora guía, no corrige.
        </p>
      </div>

      <div className="practice-controls">
        <div className="pc-row">
          <label className="pc-field">
            <span>Tónica</span>
            <select value={root} onChange={(e) => setRoot(Number(e.target.value) as PitchClass)}>
              {SHARP.map((n, i) => <option key={n} value={i}>{n}</option>)}
            </select>
          </label>

          <label className="pc-field pc-grow">
            <span>Escala</span>
            <select value={scaleName} onChange={(e) => setScaleName(e.target.value)}>
              {SCALE_FAMILIES.map((fam) => (
                <optgroup key={fam.label} label={fam.label}>
                  {fam.scales.map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="pc-field">
            <span>Posición</span>
            <div className="pc-stepper">
              <button type="button" onClick={() => setMinFret(Math.max(1, minFret - 1))} disabled={minFret <= 1} aria-label="Una posición hacia el clavijero">◀</button>
              <strong>{minFret}–{maxFret}</strong>
              <button type="button" onClick={() => setMinFret(Math.min(FRET_COUNT - span + 1, minFret + 1))} disabled={maxFret >= FRET_COUNT} aria-label="Una posición hacia el cuerpo">▶</button>
            </div>
          </div>

          <div className="pc-field">
            <span>Trastes</span>
            <div className="toggle">
              {SPANS.map((s) => (
                <button key={s} type="button" className={span === s ? 'on' : ''} onClick={() => setSpan(s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="pc-row">
          <div className="pc-field">
            <span>Dirección</span>
            <div className="toggle">
              {DIRECTIONS.map((d) => (
                <button key={d.id} type="button" className={direction === d.id ? 'on' : ''} onClick={() => setDirection(d.id)}>{d.label}</button>
              ))}
            </div>
          </div>

          <div className="pc-field">
            <span>Figura</span>
            <div className="toggle">
              {FIGURES.map((f) => (
                <button key={f.id} type="button" className={figure === f.id ? 'on' : ''} onClick={() => setFigure(f.id)}>{f.label}</button>
              ))}
            </div>
          </div>

          <div className="pc-field">
            <span>Mostrar</span>
            <div className="toggle">
              <button type="button" className={displayMode === 'deg' ? 'on' : ''} onClick={() => setDisplayMode('deg')}>Grados</button>
              <button type="button" className={displayMode === 'note' ? 'on' : ''} onClick={() => setDisplayMode('note')}>Notas</button>
            </div>
          </div>

          <label className="pc-check">
            <input type="checkbox" checked={allowOpen} onChange={(e) => setAllowOpen(e.target.checked)} />
            <span>Cuerdas al aire</span>
          </label>
        </div>
      </div>

      {exercise ? (
        <>
          <div className="practice-stage">
            <PracticeBoard
              tuning={tuning}
              minFret={minFret}
              maxFret={maxFret}
              events={exercise.sequence.events}
              currentIndex={player.currentIndex}
              scaleRoot={root}
              scaleName={scaleName}
              displayMode={displayMode}
            />
          </div>

          <div className="practice-transport">
            <button
              type="button"
              className={player.playing ? 'pt-play on' : 'pt-play'}
              onClick={() => (player.playing ? player.stop() : player.start())}
            >
              {player.playing ? '■ Parar' : '▶ Tocar'}
            </button>

            <label className="pc-field pc-grow">
              <span>Tempo · <strong>{bpm} BPM</strong></span>
              <input type="range" min={40} max={200} step={1} value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))} />
            </label>

            <label className="pc-check">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
              <span>Repetir</span>
            </label>
            <label className="pc-check">
              <input type="checkbox" checked={metronome} onChange={(e) => setMetronome(e.target.checked)} />
              <span>Metrónomo</span>
            </label>
            <label className="pc-check">
              <input type="checkbox" checked={countInBars > 0} onChange={(e) => setCountInBars(e.target.checked ? 1 : 0)} />
              <span>Cuenta de entrada</span>
            </label>
          </div>

          <div className="practice-meta" role="status">
            {player.countInBeat > 0
              ? <span className="pm-countin">Entrando… {player.countInBeat}</span>
              : <span>{exercise.title} · {noteCount} notas</span>}
          </div>
        </>
      ) : (
        <p className="practice-empty">
          Esa escala no entra en esta ventana del mástil. Ampliá los trastes o movete de posición.
        </p>
      )}
    </div>
  );
}
