import { memo } from 'react';
import { SHARP } from '@engine/constants';
import { degOfScale } from '@engine/scales';
import type { NoteEvent } from '@engine/time';
import type { Tuning, PitchClass } from '@engine/types';

/**
 * The fretboard for Practicar.
 *
 * Deliberately a second board rather than new props on `Fretboard`. That one is
 * built around chords — voicings, inversions, overlays, string muting — and is
 * the most visually load-bearing component in the product. This one has a single
 * job: show a window of the neck, the notes of the exercise laid out on it, and
 * which one is sounding right now.
 *
 * The geometry constants match `Fretboard` on purpose so the two read as the
 * same instrument. That duplication is known and tracked: once both boards are
 * stable the layout maths comes out into a shared module. Extracting it now, with
 * one of the two still unbuilt, would mean refactoring the main surface to fit a
 * component that does not exist yet.
 */

const H = 180, padL = 40, padR = 20, padT = 20, padB = 30;
const FULL_SPAN = 1280;
const TOTAL_FRETS = 22;

interface PracticeBoardProps {
  tuning: Tuning;
  /** First fret shown, inclusive. */
  minFret: number;
  /** Last fret shown, inclusive. */
  maxFret: number;
  /** Every note of the exercise, so the whole shape is visible before it plays. */
  events: readonly NoteEvent[];
  /** Index into `events` of the note sounding now, or -1. */
  currentIndex: number;
  scaleRoot: PitchClass;
  scaleName: string;
  /** 'note' shows note names, 'deg' shows scale degrees — degrees are what teach. */
  displayMode: 'note' | 'deg';
}

export const PracticeBoard = memo(function PracticeBoard(props: PracticeBoardProps) {
  const { tuning, minFret, maxFret, events, currentIndex, scaleRoot, scaleName, displayMode } = props;

  const winLen = Math.max(1, maxFret - minFret + 1);
  const fs = (FULL_SPAN - padL - padR) / TOTAL_FRETS;
  const W = padL + padR + winLen * fs;
  const bh = H - padT - padB;
  const ss = bh / 5;

  // Low E is string 0 and sits at the bottom, as on a chord chart.
  const yOf = (stringIdx: number): number => padT + (5 - stringIdx) * ss;
  // Column 0 is the open-string slot left of the nut.
  const xOf = (fret: number): number =>
    fret === 0 ? padL - 18 : padL + (fret - minFret + 1) * fs - fs / 2;

  const labelOf = (midi: number): string =>
    displayMode === 'deg'
      ? degOfScale((midi % 12) as PitchClass, scaleRoot, scaleName)
      : SHARP[midi % 12]!;

  const current = currentIndex >= 0 ? events[currentIndex] : undefined;
  const next = currentIndex >= 0 ? events[currentIndex + 1] : events[0];

  const els: React.ReactNode[] = [];

  // Nut, frets, inlays
  els.push(<rect key="bg" x={0} y={0} width={W} height={H} rx={10} fill="#0d0d0d" />);
  if (minFret <= 1) {
    els.push(<rect key="nut" x={padL - 3} y={padT - 6} width={4} height={bh + 12} fill="#d8d8d8" rx={1} />);
  }
  for (let w = 0; w <= winLen; w++) {
    els.push(<line key={`fr-${w}`} x1={padL + w * fs} y1={padT - 6} x2={padL + w * fs} y2={padT + bh + 6} stroke="#3a3a3a" strokeWidth={1.2} />);
  }
  const INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
  for (let f = minFret; f <= maxFret; f++) {
    const cx = padL + (f - minFret + 1) * fs - fs / 2;
    if (INLAYS.has(f)) els.push(<circle key={`in-${f}`} cx={cx} cy={padT + bh / 2} r={4} fill="#2a2a2a" />);
    if (f === 12 || f === 24) {
      els.push(<circle key={`in12a-${f}`} cx={cx} cy={padT + bh / 2 - ss} r={4} fill="#2a2a2a" />);
      els.push(<circle key={`in12b-${f}`} cx={cx} cy={padT + bh / 2 + ss} r={4} fill="#2a2a2a" />);
    }
    els.push(<text key={`fn-${f}`} x={cx} y={H - 10} textAnchor="middle" fontSize={10} fill="#6a6a6a">{f}</text>);
  }

  // Strings, thickest at the bottom
  for (let st = 0; st < 6; st++) {
    const y = yOf(st);
    els.push(<line key={`s-${st}`} x1={padL} y1={y} x2={W - padR} y2={y} stroke={st < 3 ? '#6a6a6a' : '#8a8a8a'} strokeWidth={st < 3 ? 1.8 - st * 0.3 : 0.9 - (st - 3) * 0.15} />);
    els.push(<text key={`sl-${st}`} x={15} y={y + 4} textAnchor="middle" fontSize={11} fill="#8a8a8a" fontWeight={600}>{SHARP[tuning[st]! % 12]}</text>);
  }

  // Every note of the exercise, so the shape is readable before a single note sounds.
  // Deduplicated: an up-and-down exercise visits most positions twice.
  const seen = new Set<string>();
  events.forEach((e) => {
    const k = `${e.string}:${e.fret}`;
    if (seen.has(k)) return;
    seen.add(k);
    const isRoot = e.midi % 12 === scaleRoot;
    els.push(
      <g key={`n-${k}`}>
        <circle cx={xOf(e.fret)} cy={yOf(e.string)} r={9}
          fill={isRoot ? 'rgba(99,91,255,0.26)' : 'rgba(255,255,255,0.07)'}
          stroke={isRoot ? '#635BFF' : '#4a4a4a'} strokeWidth={1.2} />
        <text x={xOf(e.fret)} y={yOf(e.string) + 3.5} textAnchor="middle" fontSize={9}
          fill={isRoot ? '#b9b4ff' : '#9a9a9a'} fontWeight={600}>{labelOf(e.midi)}</text>
      </g>
    );
  });

  // The note after the current one, so the hand can move before it is needed.
  if (next && next !== current) {
    els.push(<circle key="next" cx={xOf(next.fret)} cy={yOf(next.string)} r={12}
      fill="none" stroke="#635BFF" strokeWidth={1.4} strokeDasharray="3 3" opacity={0.75} />);
  }

  // The note sounding now.
  if (current) {
    els.push(
      <g key="cur">
        <circle cx={xOf(current.fret)} cy={yOf(current.string)} r={13} fill="#635BFF" />
        <text x={xOf(current.fret)} y={yOf(current.string) + 4} textAnchor="middle" fontSize={11}
          fill="#fff" fontWeight={700}>{labelOf(current.midi)}</text>
      </g>
    );
  }

  return (
    <svg className="practice-board" viewBox={`0 0 ${W} ${H}`} width="100%"
      role="img" aria-label={`Mástil, trastes ${minFret} a ${maxFret}`}>
      {els}
    </svg>
  );
});
