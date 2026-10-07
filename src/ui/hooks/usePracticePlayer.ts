import { useCallback, useEffect, useRef, useState } from 'react';
import { Transport } from '../../audio/transport';
import type { Sequence } from '@engine/time';

/**
 * React binding for the audio Transport.
 *
 * The important detail is what does *not* go into React state. The playhead is
 * read from the audio clock every animation frame, but state is only written
 * when the sounding note actually changes — roughly eight times a second at
 * practice tempos instead of sixty. Re-rendering an SVG fretboard at 60 fps to
 * move one circle is how a smooth exercise turns into a stuttering one on a
 * laptop that is also running a browser, a dev server and a tuner.
 *
 * Changing any setting stops playback rather than applying mid-flight: notes are
 * already scheduled on the audio clock minutes-of-tempo ahead, and re-deriving
 * them in place is a source of subtle timing bugs for no real gain. Press play
 * again — it starts from the top with a count-in anyway.
 */

export interface PracticeSettings {
  bpm: number;
  loop: boolean;
  metronome: boolean;
  countInBars: number;
}

interface PlayerState {
  playing: boolean;
  /** Index of the sounding note, or -1 (idle or counting in). */
  currentIndex: number;
  /** 1-based count-in beat, or 0. */
  countInBeat: number;
}

const IDLE: PlayerState = { playing: false, currentIndex: -1, countInBeat: 0 };

/** Index of the last note whose onset has passed. Exercises are tens of events. */
function indexAt(seq: Sequence, tick: number): number {
  let found = -1;
  for (let i = 0; i < seq.events.length; i++) {
    if (seq.events[i]!.tick <= tick) found = i;
    else break;
  }
  return found;
}

export function usePracticePlayer(sequence: Sequence, settings: PracticeSettings) {
  const [state, setState] = useState<PlayerState>(IDLE);
  const transportRef = useRef<Transport | null>(null);
  const rafRef = useRef<number | null>(null);
  // Read inside the animation loop without making it a dependency.
  const seqRef = useRef(sequence);
  seqRef.current = sequence;

  const stop = useCallback(() => {
    transportRef.current?.dispose();
    transportRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setState(IDLE);
  }, []);

  const start = useCallback(() => {
    // Tear down any previous run first, so double-clicking play cannot leave two
    // transports scheduling into the same audio clock.
    transportRef.current?.dispose();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const t = new Transport(seqRef.current, {
      bpm: settings.bpm,
      loop: settings.loop,
      metronome: settings.metronome,
      countInBars: settings.countInBars,
      onEnd: () => stop(),
    });
    transportRef.current = t;
    t.start();
    setState({ playing: true, currentIndex: -1, countInBeat: settings.countInBars > 0 ? 1 : 0 });

    const frame = (): void => {
      const tr = transportRef.current;
      if (!tr || !tr.isPlaying) return;
      const pos = tr.position();
      const idx = pos.tick < 0 ? -1 : indexAt(seqRef.current, pos.tick);
      // Only touch React when something visible changed.
      setState((prev) =>
        prev.currentIndex === idx && prev.countInBeat === pos.countInBeat && prev.playing
          ? prev
          : { playing: true, currentIndex: idx, countInBeat: pos.countInBeat }
      );
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [settings.bpm, settings.loop, settings.metronome, settings.countInBars, stop]);

  // Any change of exercise or settings ends the current run — see the note above.
  useEffect(() => {
    stop();
  }, [sequence, settings.bpm, settings.loop, settings.metronome, settings.countInBars, stop]);

  // Never leave a transport scheduling into the audio clock after unmount.
  useEffect(() => () => {
    transportRef.current?.dispose();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return { ...state, start, stop };
}
