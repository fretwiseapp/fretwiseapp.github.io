import type { Strings, Tuning } from '@engine/types';
import { colorForNote } from '../theme';

interface MiniDiagramProps {
  strings: Strings;
  tuning?: Tuning;
}

const STANDARD: Tuning = [40, 45, 50, 55, 59, 64];

export function MiniDiagram({ strings, tuning = STANDARD }: MiniDiagramProps) {
  const nums: number[] = [];
  for (const v of strings) if (typeof v === 'number' && v > 0) nums.push(v);
  const minF = nums.length > 0 ? Math.max(1, Math.min(...nums)) : 1;
  const startFret = minF > 4 ? minF : 1;

  const W = 90, H = 80, fs = 18, ss = 11, padL = 14, padT = 14;

  const elements: React.ReactNode[] = [
    <rect key="bg" x={padL} y={padT} width={fs * 4} height={ss * 5} fill="#3d2418" />,
    <rect key="nut" x={padL - 2} y={padT - 1} width={2} height={ss * 5 + 2} fill={startFret === 1 ? '#e8e8e8' : '#6a6a6a'} />,
  ];

  for (let f = 1; f <= 4; f++) {
    elements.push(
      <line key={`fret-${f}`} x1={padL + f * fs} y1={padT} x2={padL + f * fs} y2={padT + ss * 5} stroke="#a89878" strokeWidth={0.8} />
    );
  }
  for (let st = 0; st < 6; st++) {
    const y = padT + (5 - st) * ss;
    elements.push(
      <line key={`str-${st}`} x1={padL} y1={y} x2={padL + fs * 4} y2={y} stroke="#c8a06a" strokeWidth={0.6} />
    );
  }
  if (startFret > 1) {
    elements.push(<text key="startfret" x={padL - 7} y={padT + 4} fontSize={7} fill="#888">{startFret}</text>);
  }
  for (let st = 0; st < 6; st++) {
    const y = padT + (5 - st) * ss;
    const v = strings[st];
    if (v === 'muted') {
      elements.push(<text key={`x-${st}`} x={padL - 5} y={y + 2} fontSize={8} fill="#aaa" textAnchor="middle">×</text>);
    } else if (v === 0) {
      const pc = tuning[st]! % 12;
      elements.push(<circle key={`o-${st}`} cx={padL - 5} cy={y} r={2.5} fill="none" stroke={colorForNote(pc)} strokeWidth={1.4} />);
    } else {
      const relF = v - startFret + 1;
      if (relF >= 1 && relF <= 4) {
        const pc = (tuning[st]! + v) % 12;
        elements.push(<circle key={`d-${st}`} cx={padL + relF * fs - fs / 2} cy={y} r={4} fill={colorForNote(pc)} />);
      }
    }
  }

  return <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">{elements}</svg>;
}
