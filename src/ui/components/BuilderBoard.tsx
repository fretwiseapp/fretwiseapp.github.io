import { useEffect, useState } from 'react';
import type { Strings, Tuning, Key, PitchClass, DisplayMode, IdentifiedChord } from '@engine/types';
import { SHARP, FRET_COUNT } from '@engine/constants';
import { deg, spell } from '@engine/spell';
import { colorForNote, colorForDegree, ROOT_HIGHLIGHT } from '../theme';

/**
 * Compact chord-builder board: a movable 7-fret window with large cells, meant
 * for *forming* a chord in a hand position rather than reading the whole neck.
 *
 * Deliberately simpler than <Fretboard>: no scale overlays, arpeggio view, or
 * stacked voicings — those belong to the "Identificar" surface. It shares the
 * same app state (strings/current), so a chord built here is identified live and
 * survives a tab switch. Isolated from the tested main board to avoid regressions.
 */

const WINDOW = 7;

interface BuilderBoardProps {
  strings: Strings;
  tuning: Tuning;
  current: IdentifiedChord | null;
  displayMode: DisplayMode;
  keyName: Key;
  onFretClick: (stringIdx: number, fret: number) => void;
  onStringStateClick: (stringIdx: number) => void;
  onFretClickSound: (midi: number) => void;
}

export function BuilderBoard({ strings, tuning, current, displayMode, keyName, onFretClick, onStringStateClick, onFretClickSound }: BuilderBoardProps) {
  const maxStart = FRET_COUNT - WINDOW; // window covers frets [start+1 .. start+WINDOW]
  const pressedFrets = strings.filter((v): v is number => typeof v === 'number' && v > 0);
  const [start, setStart] = useState(() =>
    pressedFrets.length ? Math.min(Math.max(Math.min(...pressedFrets) - 1, 0), maxStart) : 0
  );

  // Keep the built chord visible: if a pressed note falls outside the current
  // window (e.g. after loading a chord or cycling a voicing), snap to fit.
  useEffect(() => {
    if (pressedFrets.length === 0) return;
    const lo = Math.min(...pressedFrets);
    const hi = Math.max(...pressedFrets);
    if (lo < start + 1 || hi > start + WINDOW) {
      setStart(Math.min(Math.max(lo - 1, 0), maxStart));
    }
  }, [strings]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = Math.min(Math.max(start, 0), maxStart);

  // Geometry — bigger cells than the full neck (only 7 frets to fit).
  const W = 600, H = 214, padL = 56, padR = 16, padT = 22, padB = 32;
  const bw = W - padL - padR, bh = H - padT - padB;
  const fs = bw / WINDOW, ss = bh / 5;

  const labelFor = (pc: PitchClass): string =>
    displayMode === 'deg' && current ? deg((pc - current.root + 12) % 12, current.quality.sym) : spell(pc, keyName);
  const colorFor = (pc: PitchClass): string =>
    displayMode === 'deg' && current ? colorForDegree(deg((pc - current.root + 12) % 12, current.quality.sym)) : colorForNote(pc);

  const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19];
  const DOUBLE_INLAYS = [12, 21];

  const els: React.ReactNode[] = [
    <rect key="bg" x={padL} y={padT} width={bw} height={bh} fill="#0d0d0d" rx={2} />,
  ];
  if (s === 0) els.push(<rect key="nut" x={padL - 5} y={padT - 2} width={5} height={bh + 4} fill="#e8e8e8" />);

  // Fret lines + numbers
  for (let w = 1; w <= WINDOW; w++) {
    const f = s + w;
    const x = padL + w * fs;
    els.push(
      <rect key={`fret-${w}`} x={x - 1} y={padT} width={2} height={bh} fill="#4a4a4a" />,
      <text key={`fnum-${w}`} x={x - fs / 2} y={H - 12} textAnchor="middle" fontSize={11} fill="#6a6a6a">{f}</text>
    );
  }
  // Inlays inside the window
  for (const f of SINGLE_INLAYS) {
    if (f <= s || f > s + WINDOW) continue;
    els.push(<circle key={`inlay-${f}`} cx={padL + (f - s) * fs - fs / 2} cy={padT + bh / 2} r={5} fill="#3a3a3a" />);
  }
  for (const f of DOUBLE_INLAYS) {
    if (f <= s || f > s + WINDOW) continue;
    const cx = padL + (f - s) * fs - fs / 2;
    els.push(
      <circle key={`inlay-${f}-t`} cx={cx} cy={padT + ss * 1.3} r={5} fill="#3a3a3a" />,
      <circle key={`inlay-${f}-b`} cx={cx} cy={padT + ss * 3.7} r={5} fill="#3a3a3a" />,
    );
  }

  // String rows
  for (let st = 0; st < 6; st++) {
    const y = padT + (5 - st) * ss;
    const thick = st < 3 ? 1.9 - st * 0.3 : 1.0 - (st - 3) * 0.15;
    const colStr = st < 3 ? '#6a6a6a' : '#8a8a8a';
    els.push(<line key={`str-${st}`} x1={padL} y1={y} x2={W - padR} y2={y} stroke={colStr} strokeWidth={thick} />);

    const openPc = (tuning[st]! % 12) as PitchClass;
    const openLbl = (strings[st] === 0 && displayMode === 'deg' && current)
      ? deg((openPc - current.root + 12) % 12, current.quality.sym)
      : SHARP[openPc]!;
    els.push(<text key={`ol-${st}`} x={14} y={y + 4} textAnchor="middle" fontSize={12} fill="#8a8a8a" fontWeight={600}>{openLbl}</text>);

    // Open / muted marker (click to toggle) just left of the nut
    const mx = padL - 30;
    const v = strings[st];
    if (v === 'muted') {
      els.push(
        <g key={`m-${st}`} style={{ cursor: 'pointer' }} onClick={() => onStringStateClick(st)}>
          <circle cx={mx} cy={y} r={8} fill="#161616" stroke="#555" />
          <text x={mx} y={y + 3} textAnchor="middle" fontSize={11} fill="#8a8a8a" fontWeight={700}>×</text>
        </g>
      );
    } else if (v === 0) {
      const isRoot = current !== null && openPc === current.root;
      els.push(
        <g key={`m-${st}`} style={{ cursor: 'pointer' }} onClick={() => onStringStateClick(st)}>
          <circle cx={mx} cy={y} r={9} fill={colorFor(openPc)} stroke={isRoot ? ROOT_HIGHLIGHT : 'white'} strokeWidth={isRoot ? 2.5 : 1.5} />
          <text x={mx} y={y + 4} textAnchor="middle" fontSize={openLbl.length > 2 ? 8 : 10} fill="white" fontWeight={700}>{openLbl}</text>
        </g>
      );
    } else {
      els.push(
        <g key={`m-${st}`} style={{ cursor: 'pointer' }} onClick={() => onStringStateClick(st)}>
          <circle cx={mx} cy={y} r={8} fill="rgba(255,255,255,0.05)" stroke="#5a5a5a" strokeDasharray="2 2" />
        </g>
      );
    }

    // Fret cells in the window
    for (let w = 1; w <= WINDOW; w++) {
      const f = s + w;
      const cx = padL + w * fs - fs / 2;
      els.push(
        <rect
          key={`cell-${st}-${w}`}
          x={padL + (w - 1) * fs} y={y - ss / 2} width={fs} height={ss}
          fill="transparent" style={{ cursor: 'pointer' }}
          onClick={() => {
            onFretClick(st, f);
            if (strings[st] !== f) onFretClickSound(tuning[st]! + f);
          }}
        />
      );
      if (strings[st] === f) {
        const pc = ((openPc + f) % 12) as PitchClass;
        const isRoot = current !== null && pc === current.root;
        const lbl = labelFor(pc);
        els.push(
          <circle key={`d-${st}-${w}`} cx={cx} cy={y} r={13} fill={colorFor(pc)} stroke={isRoot ? ROOT_HIGHLIGHT : 'white'} strokeWidth={isRoot ? 3 : 1.5} pointerEvents="none" />,
          <text key={`dl-${st}-${w}`} x={cx} y={y + 4} textAnchor="middle" fontSize={lbl.length > 2 ? 9 : 11} fill="white" fontWeight={700} pointerEvents="none">{lbl}</text>
        );
      }
    }
  }

  const atMin = s <= 0;
  const atMax = s >= maxStart;

  return (
    <div className="builder">
      <div className="builder-pos">
        <button type="button" onClick={() => setStart(Math.max(s - 1, 0))} disabled={atMin} aria-label="Mover ventana un traste hacia el clavijero">◀</button>
        <span className="builder-pos-label">Trastes <strong>{s + 1}–{s + WINDOW}</strong></span>
        <button type="button" onClick={() => setStart(Math.min(s + 1, maxStart))} disabled={atMax} aria-label="Mover ventana un traste hacia el cuerpo">▶</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Constructor de acordes, ventana de trastes ${s + 1} a ${s + WINDOW}`}>
        {els}
      </svg>
    </div>
  );
}
