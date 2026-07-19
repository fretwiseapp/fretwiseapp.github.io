import { memo, useMemo } from 'react';
import type { Strings, Key, DisplayMode, ViewMode, PitchClass, Tuning, IdentifiedChord } from '@engine/types';
import { SHARP, FRET_COUNT } from '@engine/constants';
import { deg, spell } from '@engine/spell';
import { degOfScale } from '@engine/scales';
import { qBySymbol } from '@engine/qualities';
import { listVoicings } from '@engine/voicings';
import { SCALES } from '@data/scales';
import type { Overlay, VoicingFilter } from '../hooks/useAppState';
import { colorForNote, colorForDegree, colorForVoicing, ROOT_HIGHLIGHT } from '../theme';

interface FretboardProps {
  strings: Strings;
  overlays: Overlay[];
  tuning: Tuning;
  keyName: Key;
  displayMode: DisplayMode;
  view: ViewMode;
  current: IdentifiedChord | null;
  chordRoot: PitchClass | null;
  chordQuality: string | null;
  scaleRoot: PitchClass;
  scaleName: string;
  showAllVoicings: boolean;
  voicingFilter: VoicingFilter;
  onFretClick: (stringIdx: number, fret: number) => void;
  onStringStateClick: (stringIdx: number) => void;
  onFretClickSound: (midi: number) => void;
}

export const Fretboard = memo(function Fretboard(props: FretboardProps) {
  const { strings, overlays, tuning, keyName: key, displayMode, view, current, chordRoot, chordQuality, scaleRoot, scaleName, showAllVoicings, voicingFilter, onFretClick, onStringStateClick, onFretClickSound } = props;

  // Canvas grows with fret count so each cell keeps a playable minimum width
  // (~42 px) on a full 22-fret board — 960 was fine for 15 frets but packs
  // 22 too tightly to hit accurately on touch. 1280 × 180 gives 56 px/cell,
  // a bit wider than the default but the .stage scroller handles overflow.
  const W = 1280, H = 180, padL = 40, padR = 20, padT = 20, padB = 30;
  const bw = W - padL - padR, bh = H - padT - padB;
  const fs = bw / FRET_COUNT, ss = bh / 5;

  const { chordPcs, scalePcs, cRoot, qSym } = useMemo(() => {
    let chordPcs: Set<PitchClass> | null = null;
    let cRoot: PitchClass | null = null;
    let qSym = '';
    if (current) {
      cRoot = current.root;
      qSym = current.quality.sym;
      chordPcs = new Set(current.quality.req.map((iv) => (cRoot! + iv) % 12));
    } else if (chordRoot !== null && chordQuality !== null) {
      cRoot = chordRoot;
      qSym = chordQuality;
      const q = qBySymbol(qSym);
      if (q) chordPcs = new Set(q.req.map((iv) => (cRoot! + iv) % 12));
    }
    let scalePcs: Set<PitchClass> | null = null;
    if (view === 'scale' || view === 'both') {
      const ivs = SCALES[scaleName];
      if (ivs) scalePcs = new Set(ivs.map((iv) => (scaleRoot + iv) % 12));
    }
    return { chordPcs, scalePcs, cRoot, qSym };
  }, [current, chordRoot, chordQuality, scaleRoot, scaleName, view]);

  const labelFor = (pc: PitchClass): string => {
    if (displayMode === 'deg' && current) return deg((pc - current.root + 12) % 12, current.quality.sym);
    return spell(pc, key);
  };

  const dotColorFor = (pc: PitchClass): string => {
    if (displayMode === 'deg' && current) return colorForDegree(deg((pc - current.root + 12) % 12, current.quality.sym));
    return colorForNote(pc);
  };

  const inChord = view === 'chord';

  const elements: React.ReactNode[] = [
    <rect key="bg" x={padL} y={padT} width={bw} height={bh} fill="#0d0d0d" />,
    <rect key="nut" x={padL - 5} y={padT - 2} width={5} height={bh + 4} fill="#e8e8e8" />,
  ];

  // Frets + fret numbers
  for (let f = 1; f <= FRET_COUNT; f++) {
    const x = padL + f * fs;
    elements.push(
      <rect key={`fret-${f}`} x={x - 1} y={padT} width={2} height={bh} fill="#4a4a4a" />,
      <text key={`fnum-${f}`} x={x - fs / 2} y={H - 10} textAnchor="middle" fontSize={10} fill="#6a6a6a">{f}</text>
    );
  }
  // Dot inlays — Gibson/Fender convention: single dots on 3, 5, 7, 9, 15, 17,
  // 19 and double dots on 12 and 21. Only render dots that fit inside the board.
  const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19];
  const DOUBLE_INLAYS = [12, 21];
  for (const f of SINGLE_INLAYS) {
    if (f > FRET_COUNT) continue;
    elements.push(<circle key={`inlay-${f}`} cx={padL + f * fs - fs / 2} cy={padT + bh / 2} r={4} fill="#3a3a3a" />);
  }
  for (const f of DOUBLE_INLAYS) {
    if (f > FRET_COUNT) continue;
    const cx = padL + f * fs - fs / 2;
    elements.push(
      <circle key={`inlay-${f}-top`} cx={cx} cy={padT + ss * 1.3} r={4} fill="#3a3a3a" />,
      <circle key={`inlay-${f}-bot`} cx={cx} cy={padT + ss * 3.7} r={4} fill="#3a3a3a" />,
    );
  }

  // Merge user-picked overlays with the auto-generated full voicing set when "show all" is on.
  // Ordered: user overlays first (0..N-1 get stable colors), then every voicing of the current chord
  // sorted by lowest fret (already sorted by listVoicings). User sees a neck-wide map ascending.
  const effectiveOverlays = useMemo(() => {
    if (!showAllVoicings || !current) return overlays;
    const all = listVoicings(current.root, current.quality.sym, tuning, key);
    // Dedup against user-picked overlays using (root, quality, voicingIdx, octave).
    // Octave is part of the key so both the base and +12 variants can coexist.
    const alreadyPicked = new Set(overlays.map((o) => `${o.root}:${o.quality}:${o.voicingIdx}:${o.octave}`));
    const auto: Overlay[] = all
      .filter((v) => voicingFilter[v.family])
      .filter((v) => !alreadyPicked.has(`${current.root}:${current.quality.sym}:${v.idx}:${v.octave}`))
      .map((v) => ({
        strings: v.strings,
        root: current.root,
        quality: current.quality.sym,
        voicingIdx: v.idx,
        octave: v.octave,
        label: v.label,
        inversion: v.inversion,
        bassPc: v.bassPc,
        family: v.family,
      }));
    return [...overlays, ...auto];
  }, [overlays, showAllVoicings, current, tuning, key, voicingFilter]);

  // Build overlay presence index: for each (stringIdx, fret), list of overlay indices that include this note
  const overlayAt = new Map<string, number[]>();
  for (let oi = 0; oi < effectiveOverlays.length; oi++) {
    const ov = effectiveOverlays[oi]!;
    for (let st = 0; st < 6; st++) {
      const v = ov.strings[st];
      if (v === 'muted') continue;
      const f = v === 0 ? 0 : v;
      const key = `${st}:${f}`;
      if (!overlayAt.has(key)) overlayAt.set(key, []);
      overlayAt.get(key)!.push(oi);
    }
  }

  // Strings + markers + dots
  for (let st = 0; st < 6; st++) {
    const row = 5 - st;
    const y = padT + row * ss;
    const thick = st < 3 ? 1.8 - st * 0.3 : 0.9 - (st - 3) * 0.15;
    const colStr = st < 3 ? '#6a6a6a' : '#8a8a8a';
    elements.push(<line key={`str-${st}`} x1={padL} y1={y} x2={W - padR} y2={y} stroke={colStr} strokeWidth={thick} />);

    const openPc = tuning[st]! % 12;
    const openLbl = (strings[st] === 0 && displayMode === 'deg' && current)
      ? deg((openPc - current.root + 12) % 12, qSym)
      : SHARP[openPc]!;
    elements.push(
      <text key={`open-${st}`} x={15} y={y + 4} textAnchor="middle" fontSize={11} fill="#8a8a8a" fontWeight={600}>{openLbl}</text>
    );

    if (inChord) {
      const v = strings[st];
      if (v === 'muted') {
        elements.push(
          <g key={`sm-${st}`} style={{ cursor: 'pointer' }} onClick={() => onStringStateClick(st)}>
            <circle cx={padL - 18} cy={y} r={7} fill="#161616" stroke="#555" />
            <text x={padL - 18} y={y + 3} textAnchor="middle" fontSize={10} fill="#8a8a8a" fontWeight={700}>×</text>
          </g>
        );
      } else if (v === 0) {
        elements.push(
          <g key={`sm-${st}`} style={{ cursor: 'pointer' }} onClick={() => onStringStateClick(st)}>
            <circle cx={padL - 18} cy={y} r={7} fill="rgba(255,255,255,0.06)" stroke="#8a8a8a" strokeWidth={1.3} />
            <text x={padL - 18} y={y + 3} textAnchor="middle" fontSize={9} fill="#e0e0e0" fontWeight={700}>O</text>
          </g>
        );
      } else {
        elements.push(
          <g key={`sm-${st}`} style={{ cursor: 'pointer' }} onClick={() => onStringStateClick(st)}>
            <circle cx={padL - 18} cy={y} r={6} fill="rgba(255,255,255,0.05)" stroke="#5a5a5a" strokeDasharray="2 2" />
          </g>
        );
      }
    }

    for (let f = 0; f <= FRET_COUNT; f++) {
      const x = f === 0 ? padL - 18 : padL + f * fs - fs / 2;
      if (inChord && f > 0) {
        elements.push(
          <rect
            key={`fh-${st}-${f}`}
            x={padL + (f - 1) * fs} y={y - ss / 2} width={fs} height={ss}
            fill="transparent" style={{ cursor: 'pointer' }}
            onClick={() => {
              onFretClick(st, f);
              const newVal = strings[st] === f ? null : f;
              if (newVal !== null) onFretClickSound(tuning[st]! + f);
            }}
          />
        );
      }

      const pc = ((openPc + f) % 12) as PitchClass;
      let dotColor: string | null = null;
      let dotLbl = '';
      let isRoot = false;
      let small = false;

      if (inChord) {
        if (strings[st] === f && f > 0) {
          isRoot = current !== null && pc === current.root;
          dotColor = dotColorFor(pc);
          dotLbl = labelFor(pc);
        }
      } else if (view === 'arp' && chordPcs && chordPcs.has(pc)) {
        isRoot = pc === cRoot;
        dotColor = dotColorFor(pc);
        dotLbl = displayMode === 'deg' ? deg((pc - (cRoot ?? 0) + 12) % 12, qSym) : spell(pc, key, qSym);
      } else if (view === 'scale' && scalePcs && scalePcs.has(pc)) {
        isRoot = pc === scaleRoot;
        dotColor = displayMode === 'deg' ? colorForDegree(degOfScale(pc, scaleRoot, scaleName)) : colorForNote(pc);
        dotLbl = displayMode === 'deg' ? degOfScale(pc, scaleRoot, scaleName) : spell(pc, key);
      } else if (view === 'both' && scalePcs && scalePcs.has(pc)) {
        if (chordPcs && chordPcs.has(pc)) {
          isRoot = pc === cRoot;
          dotColor = dotColorFor(pc);
          dotLbl = displayMode === 'deg' ? deg((pc - (cRoot ?? 0) + 12) % 12, qSym) : spell(pc, key, qSym);
        } else {
          dotColor = '#71717a';
          small = true;
          dotLbl = displayMode === 'deg' ? degOfScale(pc, scaleRoot, scaleName) : spell(pc, key);
        }
      }

      if (dotColor) {
        const r = small ? 5 : 10;
        const fz = small ? 7 : (dotLbl.length > 2 ? 8 : 10);
        // Root highlight: thicker border + golden ring
        const strokeCol = isRoot ? ROOT_HIGHLIGHT : 'white';
        const strokeW = isRoot ? 2.5 : (small ? 1 : 1.5);
        elements.push(
          <circle key={`dot-${st}-${f}`} cx={x} cy={y} r={r} fill={dotColor} stroke={strokeCol} strokeWidth={strokeW} pointerEvents="none" />
        );
        if (!small || dotLbl.length <= 2) {
          elements.push(
            <text key={`dotlbl-${st}-${f}`} x={x} y={y + (small ? 3 : 4)} textAnchor="middle" fontSize={fz} fill="white" fontWeight={700} pointerEvents="none">{dotLbl}</text>
          );
        }
      }

      // Overlay rings (stacked voicings): draw concentric rings of voicing-colors AROUND the dot.
      // If there's no primary dot here but overlays present, also render a small labeled marker
      // using the first overlay's color so the user can still read the note.
      if (inChord) {
        const ovs = overlayAt.get(`${st}:${f}`) ?? [];
        if (ovs.length > 0 && !dotColor && f > 0) {
          const firstVIdx = ovs[0]!;
          const markerCol = colorForVoicing(firstVIdx);
          const isOverlayRoot = current !== null && pc === current.root;
          elements.push(
            <circle key={`ovdot-${st}-${f}`} cx={x} cy={y} r={8} fill={markerCol} fillOpacity={0.85} stroke={isOverlayRoot ? ROOT_HIGHLIGHT : 'white'} strokeWidth={isOverlayRoot ? 2 : 1} pointerEvents="none" />
          );
          elements.push(
            <text key={`ovlbl-${st}-${f}`} x={x} y={y + 3} textAnchor="middle" fontSize={9} fill="white" fontWeight={700} pointerEvents="none">{labelFor(pc)}</text>
          );
        }
        for (let oi = 0; oi < ovs.length; oi++) {
          const vIdx = ovs[oi]!;
          const ringCol = colorForVoicing(vIdx);
          const baseR = dotColor ? 10 : 8;
          const ringR = baseR + 4 + oi * 3.5;
          elements.push(
            <circle key={`ov-${st}-${f}-${oi}`} cx={x} cy={y} r={ringR} fill="none" stroke={ringCol} strokeWidth={2} pointerEvents="none" />
          );
        }
      }
    }
  }

  // Accessible summary of what the SVG depicts — updated on every render so screen
  // readers can announce chord changes without us maintaining a parallel live region.
  const ariaSummary = (() => {
    const parts: string[] = ['Diapasón de guitarra'];
    if (current) {
      const rootName = SHARP[current.root]!;
      parts.push(`mostrando ${rootName}${current.quality.sym || 'maj'}`);
    } else if (chordRoot !== null && chordQuality !== null) {
      parts.push(`preparado para ${SHARP[chordRoot]!}${chordQuality || 'maj'}`);
    }
    const pressed = strings
      .map((v, i) => (typeof v === 'number' && v > 0 ? `cuerda ${6 - i} traste ${v}` : null))
      .filter(Boolean)
      .join(', ');
    if (pressed) parts.push(`notas pisadas: ${pressed}`);
    return parts.join('. ');
  })();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaSummary}
    >
      {elements}
    </svg>
  );
});
