/**
 * Transport — plays a Sequence in time.
 *
 * The one rule that matters here: **`setInterval` is not a clock.** JavaScript
 * timers drift, get throttled in background tabs, and are at the mercy of the
 * main thread; a metronome built on one wanders audibly within a minute, and any
 * timing we grade a player against would be grading our own jitter.
 *
 * So there are two clocks, the standard Web Audio arrangement:
 *   - `AudioContext.currentTime` is the real clock. Every note is scheduled at an
 *     absolute time on it, by the audio hardware, sample-accurate.
 *   - A coarse timer only wakes us up often enough to push the next slice of
 *     notes into that schedule. If it fires late, nothing is late — it merely
 *     schedules sooner. If it fires early, it schedules nothing.
 *
 * The UI reads its position from `currentTime` too, never from a counter it
 * increments itself, so the playhead cannot drift away from what you hear.
 */

import { PPQ, ticksToSeconds } from '@engine/time';
import type { Sequence } from '@engine/time';
import { getAudioContext, tryResume } from './context';
import { playNote } from './synth';

/** How far ahead notes are handed to the audio clock. */
const SCHEDULE_AHEAD = 0.14;
/** How often we wake up to do that. Must be well under SCHEDULE_AHEAD. */
const LOOKAHEAD_MS = 25;
/** Lead-in before the first sound, so the graph is warm and nothing is clipped. */
const START_LEAD = 0.15;

export interface TransportOptions {
  bpm: number;
  loop: boolean;
  metronome: boolean;
  /** Bars of clicks before the music starts. 0 disables the count-in. */
  countInBars: number;
  /** Fires when a non-looping run finishes. */
  onEnd?: () => void;
}

/** Where the playhead is. `tick` is -1 during the count-in. */
export interface Position {
  playing: boolean;
  /** Position inside the sequence, in ticks. -1 while counting in. */
  tick: number;
  /** Count-in beat being heard (1-based), or 0 once the music has started. */
  countInBeat: number;
}

function click(ctx: AudioContext, at: number, accent: boolean): void {
  // A short pitched blip rather than noise: it cuts through a guitar without
  // sounding like a glitch, and the accent is unmistakable on beat 1.
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = accent ? 1600 : 1000;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.17 : 0.09, at + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.06);
}

export class Transport {
  private seq: Sequence;
  private opts: TransportOptions;
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  /** Absolute time of tick 0 of the first repetition. */
  private musicStart = 0;
  /** Scheduling cursor: which repetition and which event comes next. */
  private cycle = 0;
  private idx = 0;
  /** Metronome cursor, counted in beats from the start of the count-in. */
  private clickBeat = 0;
  private ended = false;

  constructor(seq: Sequence, opts: TransportOptions) {
    this.seq = seq;
    this.opts = opts;
  }

  get isPlaying(): boolean {
    return this.timer !== null;
  }

  private get cycleSeconds(): number {
    return ticksToSeconds(this.seq.lengthTicks, this.opts.bpm);
  }

  private get beatSeconds(): number {
    // Clamped: a bpm of 0 would make every scheduling loop below advance by zero
    // seconds and spin forever. The UI never sends one, which is exactly why the
    // guard belongs here rather than there.
    return 60 / Math.max(20, Math.min(400, this.opts.bpm));
  }

  /** Absolute time of event `i` in repetition `c`. */
  private eventTime(c: number, i: number): number {
    const e = this.seq.events[i]!;
    return this.musicStart + c * this.cycleSeconds + ticksToSeconds(e.tick, this.opts.bpm);
  }

  start(): void {
    if (this.isPlaying) return;
    tryResume(); // must happen inside the user gesture that called start()
    const ctx = getAudioContext();
    this.ctx = ctx;

    const countInSeconds = this.opts.countInBars * this.seq.beatsPerBar * this.beatSeconds;
    this.musicStart = ctx.currentTime + START_LEAD + countInSeconds;
    this.cycle = 0;
    this.idx = 0;
    this.clickBeat = 0;
    this.ended = false;

    this.schedule();
    this.timer = setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    // Notes already handed to the audio clock keep sounding for their natural
    // length. Cutting them would need a gain node per voice, and a plucked string
    // ringing out past the stop button is what a real instrument does anyway.
  }

  dispose(): void {
    this.stop();
    this.ctx = null;
  }

  /** Hand the audio clock everything due in the next SCHEDULE_AHEAD seconds. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const horizon = ctx.currentTime + SCHEDULE_AHEAD;

    // Count-in clicks start before the music; in-sequence clicks continue through it.
    if (this.opts.metronome || this.opts.countInBars > 0) {
      const firstClick = this.musicStart - this.opts.countInBars * this.seq.beatsPerBar * this.beatSeconds;
      for (;;) {
        const at = firstClick + this.clickBeat * this.beatSeconds;
        if (at >= horizon) break;
        // A single run stops clicking when the music stops; a loop never does.
        if (!this.opts.loop && at >= this.musicStart + this.cycleSeconds - 1e-6) break;
        const isCountIn = at < this.musicStart - 1e-6;
        // Once the music is running, the metronome only sounds if asked for.
        if (isCountIn || this.opts.metronome) {
          click(ctx, Math.max(at, ctx.currentTime), this.clickBeat % this.seq.beatsPerBar === 0);
        }
        this.clickBeat++;
      }
    }

    while (!this.ended) {
      if (this.seq.events.length === 0) break;
      const at = this.eventTime(this.cycle, this.idx);
      if (at >= horizon) break;

      const e = this.seq.events[this.idx]!;
      // playNote takes an offset from "now", which is exactly what we have.
      playNote(e.midi, Math.max(0, at - ctx.currentTime), ticksToSeconds(e.dur, this.opts.bpm) * 1.6, 0.3);

      this.idx++;
      if (this.idx >= this.seq.events.length) {
        this.idx = 0;
        this.cycle++;
        if (!this.opts.loop) {
          this.ended = true;
          const endAt = this.musicStart + this.cycle * this.cycleSeconds;
          // Let the last note ring before reporting the end.
          setTimeout(() => { this.stop(); this.opts.onEnd?.(); },
            Math.max(0, (endAt - ctx.currentTime) * 1000) + 400);
        }
      }
    }
  }

  /**
   * Where the playhead is right now, derived from the audio clock — never from a
   * counter, so it cannot drift away from what is being heard.
   */
  position(): Position {
    const ctx = this.ctx;
    if (!ctx || !this.isPlaying) return { playing: false, tick: -1, countInBeat: 0 };

    const elapsed = ctx.currentTime - this.musicStart;
    if (elapsed < 0) {
      const countInSeconds = this.opts.countInBars * this.seq.beatsPerBar * this.beatSeconds;
      const into = countInSeconds + elapsed;
      return { playing: true, tick: -1, countInBeat: Math.max(1, Math.floor(into / this.beatSeconds) + 1) };
    }

    const inCycle = this.opts.loop ? elapsed % this.cycleSeconds : Math.min(elapsed, this.cycleSeconds);
    return { playing: true, tick: (inCycle * this.opts.bpm * PPQ) / 60, countInBeat: 0 };
  }
}
