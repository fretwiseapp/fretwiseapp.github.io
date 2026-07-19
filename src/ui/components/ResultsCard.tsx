import { useState } from 'react';
import type { AppState, AppActions } from '../hooks/useAppState';
import { buildShareUrl } from '../hooks/useAppState';
import type { IdentifiedChord, Key, PitchClass, Strings, Tuning, VoicingFamily } from '@engine/types';
import { nameOf } from '@engine/pcset';
import { spell, deg } from '@engine/spell';
import { listVoicings } from '@engine/voicings';
import { playabilityWarnings, theoreticalAudit } from '@engine/audit';
import { CHORD_SCALES } from '@data/scales';
import { playNote, playShape } from '@audio/index';
import { colorForVoicing } from '../theme';
import { MiniDiagram } from './MiniDiagram';

interface ResultsCardProps {
  state: AppState;
  actions: AppActions;
  current: IdentifiedChord | null;
  candidates: IdentifiedChord[];
  pcs: PitchClass[];
  bassPc: PitchClass | null;
  midi: number[];
  tuning: Tuning;
}

export function ResultsCard(props: ResultsCardProps) {
  const { state, actions, current, candidates, pcs, bassPc, midi, tuning } = props;
  const { strings, key } = state;

  if (pcs.length === 0) {
    return (
      <div className="results">
        <div className="card" style={{ gridColumn: '1/-1' }}>
          <div className="empty-state">
            <svg
              className="empty-mark"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <rect width="64" height="64" rx="14" fill="#111111" />
              <g stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round">
                <path d="M16 12v40M32 12v40M48 12v40" />
              </g>
              <circle cx="16" cy="42" r="6" fill="#635BFF" />
              <circle cx="32" cy="30" r="6" fill="#ffffff" />
              <circle cx="48" cy="18" r="6" fill="#ffffff" />
            </svg>
            <h3>Todavía no hay acorde</h3>
            <p className="empty-lede">
              Armá una posición en el diapasón y Fretwise te devuelve el nombre, las inversiones
              y las escalas compatibles — al instante.
            </p>
            <div className="empty-hints" aria-label="Maneras de empezar">
              <span className="empty-hint"><span className="dot red" aria-hidden="true" />Pulsá un traste</span>
              <span className="empty-hint"><span className="dot blue" aria-hidden="true" />Buscá un acorde</span>
              <span className="empty-hint"><span className="dot amber" aria-hidden="true" />Elegí raíz + calidad</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const warnings = playabilityWarnings(strings);
  const warnEl = warnings.length > 0 ? <div className="warn">⚠ {warnings.join(' · ')}</div> : null;

  if (pcs.length === 1) {
    return (
      <div className="results">
        <div className="card" style={{ gridColumn: '1/-1' }}>
          <h3>Nota única</h3>
          <p className="chord-name">{spell(pcs[0]!, key)}</p>
          <p className="desc">Una sola clase de altura.</p>
          {warnEl}
        </div>
      </div>
    );
  }

  if (pcs.length === 2) {
    const iv = Math.min((pcs[1]! - pcs[0]! + 12) % 12, (pcs[0]! - pcs[1]! + 12) % 12);
    if (iv === 7) {
      const r = ((pcs[1]! - pcs[0]! + 12) % 12) === 7 ? pcs[0]! : pcs[1]!;
      return (
        <div className="results">
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <h3>Power chord</h3>
            <p className="chord-name">{spell(r, key, '5')}5</p>
            <p className="desc">Raíz + 5ta justa, sin tercera.</p>
            <div className="audio-ctrls">
              <button className="p" onClick={() => playShape(strings, tuning)}>▶ Reproducir</button>
            </div>
            {warnEl}
          </div>
        </div>
      );
    }
    const intName: Record<number, string> = { 1: '2m', 2: '2M', 3: '3m', 4: '3M', 5: '4J', 6: 'tritono' };
    return (
      <div className="results">
        <div className="card" style={{ gridColumn: '1/-1' }}>
          <h3>Intervalo</h3>
          <p className="chord-name">{spell(pcs[0]!, key)} · {spell(pcs[1]!, key)}</p>
          <p className="desc">{intName[iv] ?? 'int'}. Faltan notas para un acorde.</p>
          {warnEl}
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="results">
        <div className="card" style={{ gridColumn: '1/-1' }}>
          <h3>Sin match</h3>
          <p className="desc">Notas: {pcs.map((p) => spell(p, key)).join(' · ')}</p>
          {warnEl}
        </div>
      </div>
    );
  }

  const q = current.quality;
  const name = nameOf(current, key, bassPc);
  const bn = bassPc !== null ? spell(bassPc, key, q.sym) : null;

  const rs = new Set(q.req);
  const notes = pcs.map((pc) => {
    const iv = (pc - current.root + 12) % 12;
    const extra = !rs.has(iv);
    const d = deg(iv, q.sym);
    return {
      name: spell(pc, key, q.sym),
      deg: d,
      isRoot: pc === current.root,
      isT: ['b9', '9', '11', '#11', 'b13', '13'].includes(d) && !extra,
      isA: extra,
      midi: midi.find((m) => m % 12 === pc) ?? 0,
    };
  }).sort((a, b) => {
    const order = ['1', 'b9', '9', 'b3', '3', '#9', '11', 'b5', '#11', '5', '#5', 'b13', '6', '13', 'bb7', 'b7', '7'];
    return order.indexOf(a.deg) - order.indexOf(b.deg);
  });

  const alts = candidates.slice(1)
    .filter((c) => (current.score - c.score) <= 18 && nameOf(c, key, bassPc) !== name)
    .slice(0, 4);

  const audit = theoreticalAudit(current, pcs, bassPc, candidates, key);

  // Split voicings into Voicings (root in bass) vs Inversions (other)
  const allVoicings = listVoicings(current.root, q.sym, tuning, key);
  const rootVoicings = allVoicings.filter((v) => v.inversion === 'raíz');
  const inversions = allVoicings.filter((v) => v.inversion !== 'raíz');

  const activeKey = (root: PitchClass, sym: string, idx: number, octave: number): boolean => {
    if (state.stackMode) return state.overlays.some((o) => o.root === root && o.quality === sym && o.voicingIdx === idx && o.octave === octave);
    return current.root === root && q.sym === sym && state.voicingIdx === idx && state.voicingOctave === octave;
  };

  const overlayColorFor = (root: PitchClass, sym: string, idx: number, octave: number): string | null => {
    if (!state.stackMode) return null;
    const overlayIdx = state.overlays.findIndex((o) => o.root === root && o.quality === sym && o.voicingIdx === idx && o.octave === octave);
    return overlayIdx >= 0 ? colorForVoicing(overlayIdx) : null;
  };

  return (
    <div className="results">
      <div className="card">
        <h3>Acorde</h3>
        <p className="chord-name">{name}</p>
        <p className="desc">{q.full}{bassPc !== null && bassPc !== current.root && bn ? ' · bajo ' + bn : ''}</p>
        <div className="audio-ctrls">
          <button className="p" onClick={() => playShape(strings, tuning)}>▶ Reproducir</button>
          <button onClick={() => playShape(strings, tuning, 'arp')}>♫ Arpegio</button>
          <button
            className={state.showAllVoicings ? 'p' : ''}
            onClick={actions.toggleShowAllVoicings}
            title="Muestra todos los voicings de este acorde en el diapasón a la vez, ordenados de traste más bajo al más alto — incluye repeticiones de octava"
          >
            {state.showAllVoicings ? '◉ Viendo todos' : '◎ Ver todos en el diapasón'}
          </button>
          {state.showAllVoicings && (
            <VoicingFamilyFilter filter={state.voicingFilter} onToggle={actions.toggleVoicingFamily} />
          )}
          <button
            className={state.stackMode ? 'p' : ''}
            onClick={actions.toggleStackMode}
            title="Cuando está activado, clickear voicings/inversiones los apila con colores distintos"
          >
            {state.stackMode ? '▣ Apilar: ON' : '▢ Apilar'}
          </button>
          {state.overlays.length > 0 && (
            <button onClick={actions.clearOverlays}>✕ Limpiar capas ({state.overlays.length})</button>
          )}
          <ShareButton strings={strings} tuning_={state.tuning} view={state.view} />
        </div>
        {warnEl}

        <AltsList alts={alts} bassPc={bassPc} keyName={key} />

        <VoicingSection
          title="Voicings (raíz en el bajo)"
          voicings={rootVoicings}
          root={current.root}
          quality={q.sym}
          tuning={tuning}
          activeKey={activeKey}
          overlayColorFor={overlayColorFor}
          onPick={(root, sym, idx, v) => {
            const result = actions.selectVoicingCard(root, sym, idx, v.label, v.inversion, v.bassPc, v.family, v.octave);
            if (result) playShape(result, tuning);
          }}
        />
        <VoicingSection
          title="Inversiones"
          voicings={inversions}
          root={current.root}
          quality={q.sym}
          tuning={tuning}
          activeKey={activeKey}
          overlayColorFor={overlayColorFor}
          onPick={(root, sym, idx, v) => {
            const result = actions.selectVoicingCard(root, sym, idx, v.label, v.inversion, v.bassPc, v.family, v.octave);
            if (result) playShape(result, tuning);
          }}
        />

        <ScaleSuggestions qSym={q.sym} root={current.root} onPick={(root, scName) => { actions.setScale(root, scName); actions.setView('both'); }} />
      </div>
      <div className="card">
        <h3>Notas y grados</h3>
        <div className="notes">
          {notes.map((n, i) => {
            const cls = n.isRoot ? 'r' : n.isA ? 'a' : n.isT ? 't' : '';
            return (
              <div key={i} className={`n ${cls}`} onClick={() => { if (n.midi) playNote(n.midi, 0, 1.3, 0.4); }}>
                <div className="nm">{n.name}</div>
                <div className="dg">{n.deg}</div>
              </div>
            );
          })}
        </div>
        <div className="struct">Estructura: <code>{q.req.map((i) => deg(i, q.sym)).join(' · ')}</code></div>
        <div className="analysis">
          <h4>Análisis</h4>
          <ul>{audit.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponents ---

interface AltsListProps { alts: IdentifiedChord[]; bassPc: PitchClass | null; keyName: Key }
function AltsList({ alts, bassPc, keyName }: AltsListProps) {
  if (alts.length === 0) return null;
  return (
    <div className="alts">
      <div className="t">Nombres alternativos</div>
      {alts.map((a, i) => (
        <div key={i} className="alt">
          <span>{nameOf(a, keyName, bassPc)}</span>
          <span className="m">{a.quality.full}</span>
        </div>
      ))}
    </div>
  );
}

interface VoicingCardVariant { idx: number; label: string; strings: Strings; inversion: string; bassName: string; bassPc: PitchClass | null; family: VoicingFamily; octave: number }

interface VoicingSectionProps {
  title: string;
  voicings: VoicingCardVariant[];
  root: PitchClass;
  quality: string;
  tuning: Tuning;
  activeKey: (root: PitchClass, sym: string, idx: number, octave: number) => boolean;
  overlayColorFor: (root: PitchClass, sym: string, idx: number, octave: number) => string | null;
  onPick: (root: PitchClass, sym: string, idx: number, v: VoicingCardVariant) => void;
}
function VoicingSection({ title, voicings, root, quality, tuning, activeKey, overlayColorFor, onPick }: VoicingSectionProps) {
  if (voicings.length === 0) return null;
  return (
    <div className="alts">
      <div className="t">{title}</div>
      <div className="voicings">
        {voicings.map((v) => {
          const isActive = activeKey(root, quality, v.idx, v.octave);
          const overlayCol = overlayColorFor(root, quality, v.idx, v.octave);
          const style = overlayCol ? { borderColor: overlayCol, background: overlayCol + '10' } : undefined;
          return (
            // Key is (idx, octave) because both octave variants share the same shape idx.
            <div
              key={`${v.idx}:${v.octave}`}
              className={`voicing-card ${isActive ? 'active' : ''}`}
              style={style}
              onClick={() => onPick(root, quality, v.idx, v)}
            >
              <div className="lbl">{v.label}</div>
              <MiniDiagram strings={v.strings} />
              <div className="inv">{v.inversion} · bajo {v.bassName}</div>
              <div className="audio-ctrls" style={{ marginTop: 6, justifyContent: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); playShape(v.strings, tuning); }}
                  title="Reproducir este voicing"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >▶</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Per-family visibility filter shown while "Ver todos" is active.
 *  Lets the user isolate CAGED shapes from drop-2/drop-3 jazz voicings or
 *  upper-register triad inversions — essential for mastering neck positions
 *  without visual clutter. */
interface VoicingFamilyFilterProps {
  filter: Record<VoicingFamily, boolean>;
  onToggle: (f: VoicingFamily) => void;
}
function VoicingFamilyFilter({ filter, onToggle }: VoicingFamilyFilterProps) {
  const families: { key: VoicingFamily; label: string; hint: string }[] = [
    { key: 'caged',    label: 'CAGED',    hint: 'Las 5 formas movibles: C, A, G, E, D (y barré)' },
    { key: 'drop2',    label: 'Drop-2',   hint: 'Voicings drop-2 de jazz en sets 4321 y 5432' },
    { key: 'drop3',    label: 'Drop-3',   hint: 'Drop-3 jazz con raíz en 6ta cuerda (A muteada)' },
    { key: 'invHigh',  label: 'Inv. altas', hint: 'Inversiones de tríada en cuerdas GBe' },
  ];
  return (
    <div className="voicing-filter" role="group" aria-label="Filtrar voicings por familia">
      {families.map((f) => (
        <button
          key={f.key}
          className={filter[f.key] ? 'on' : ''}
          onClick={() => onToggle(f.key)}
          title={f.hint}
          aria-pressed={filter[f.key]}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

interface ScaleSuggestionsProps { qSym: string; root: PitchClass; onPick: (root: PitchClass, name: string) => void }
function ScaleSuggestions({ qSym, root, onPick }: ScaleSuggestionsProps) {
  const scales = CHORD_SCALES[qSym];
  if (!scales || scales.length === 0) return null;
  return (
    <div className="alts">
      <div className="t">Escalas compatibles — click para superponer</div>
      <div className="scales-sugg">
        {scales.map((sc) => (
          <button key={sc} onClick={() => onPick(root, sc)}>{sc}</button>
        ))}
      </div>
    </div>
  );
}

interface ShareButtonProps { strings: Strings; tuning_: AppState['tuning']; view: AppState['view'] }
function ShareButton({ strings, tuning_, view }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (): Promise<void> => {
    const url = buildShareUrl(strings, tuning_, view);
    if (!url) return;
    try {
      // Web Share API first (native share sheet on mobile); fall back to clipboard.
      if (typeof navigator !== 'undefined' && 'share' in navigator && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title: 'Fretwise', url });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
        return;
      }
      // Last-resort fallback: prompt. Keeps share working in old browsers / insecure contexts.
      window.prompt('Copiá este link:', url);
    } catch {
      /* User cancelled share sheet, or clipboard denied — silently ignore. */
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Copiar un link que reproduce exactamente este voicing y afinación"
      aria-live="polite"
    >
      {copied ? '✓ Copiado' : '🔗 Compartir'}
    </button>
  );
}
