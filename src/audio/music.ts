/**
 * Lập lịch vòng nhạc (spec G5 §3): bộ hẹn giờ thức mỗi 100 ms và đặt trước các nốt trong 200 ms tới
 * theo đồng hồ của AudioContext. Nốt đã trễ (ví dụ sau khi tab ngủ) bị bỏ, không phát bù. Owner 10/11/2026: soft
 * instruments (sine lead, filtered triangle pluck, detuned pad, sine kick) with smooth exponential releases.
 */
import {
  type Instrument,
  MUSIC,
  MUSIC_HORIZON_MS,
  MUSIC_LOOKAHEAD_MS,
  type MusicId,
  type MusicNote,
  type MusicVoice,
} from '../data/music';
import type { SfxDef } from '../data/sfx';
import { synthesizeSfx } from './sfx';

export interface LoopTimers {
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
}

const defaultTimers: LoopTimers = {
  setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
  clearInterval: (handle) => globalThis.clearInterval(handle as ReturnType<typeof setInterval>),
};

export interface LoopHandle {
  stop(): void;
}

/** Trống (owner 10/11/2026: softer): pitch 36 = a round sine kick, any other pitch = a soft band-passed shaker. */
const DRUM_KICK: SfxDef = {
  category: 'fanfare',
  duration: 0.4,
  gain: 1,
  seed: 101,
  layers: [
    { wave: 'sine', frequency: 120, endFrequency: 48, glide: 0.03, q: 1, delay: 0, attack: 0.002, decay: 0.08, gain: 1 },
    { wave: 'noise', frequency: 1200, endFrequency: 1200, glide: 0, q: 1, delay: 0, attack: 0.001, decay: 0.006, gain: 0.15 },
  ],
};
const DRUM_SHAKER: SfxDef = {
  category: 'fanfare',
  duration: 0.16,
  gain: 1,
  seed: 102,
  layers: [
    { wave: 'noise', frequency: 6000, endFrequency: 6000, glide: 0, q: 1.2, delay: 0, attack: 0.006, decay: 0.025, gain: 1 },
  ],
};
const KICK_PITCH = 36;
/** The shaker sits under the kick. */
const SHAKER_LEVEL = 0.35;

const drumBuffers = new WeakMap<AudioContext, Map<number, AudioBuffer>>();

const drumBuffer = (context: AudioContext, pitch: number): AudioBuffer => {
  let byPitch = drumBuffers.get(context);
  if (!byPitch) {
    byPitch = new Map();
    drumBuffers.set(context, byPitch);
  }
  const key = pitch === KICK_PITCH ? KICK_PITCH : 0;
  let buffer = byPitch.get(key);
  if (!buffer) {
    const pcm = synthesizeSfx(key === KICK_PITCH ? DRUM_KICK : DRUM_SHAKER, context.sampleRate, 1);
    buffer = context.createBuffer(1, pcm.length, context.sampleRate);
    buffer.getChannelData(0).set(pcm);
    byPitch.set(key, buffer);
  }
  return buffer;
};

export const midiToHz = (pitch: number): number => 440 * Math.pow(2, (pitch - 69) / 12);

/** Sources started per note of each instrument (the pad is two detuned oscillators). */
export const SOURCES_PER_NOTE: Readonly<Record<Instrument, number>> = { flute: 1, pluck: 1, horn: 2, drum: 1 };

/**
 * Synthesis of the tonal instruments: oscillator type, detune of each oscillator (cents), low-pass cutoff (Hz; the
 * pluck's opens at `cutoff` and closes to `cutoffEnd` with time constant `cutoffTime`), attack (s) and release time
 * constant (s). The pluck decays on its own with time constant `decay` (s); the others hold until the note ends.
 */
interface ToneDef {
  type: OscillatorType;
  detune: readonly number[];
  cutoff: number;
  cutoffEnd: number;
  cutoffTime: number;
  attack: number;
  decay: number | null;
  release: number;
}

export const TONE: Readonly<Record<Exclude<Instrument, 'drum'>, ToneDef>> = {
  flute: { type: 'sine', detune: [0], cutoff: 4000, cutoffEnd: 4000, cutoffTime: 1, attack: 0.08, decay: null, release: 0.15 },
  pluck: { type: 'triangle', detune: [0], cutoff: 2600, cutoffEnd: 700, cutoffTime: 0.15, attack: 0.005, decay: 0.3, release: 0.1 },
  horn: { type: 'triangle', detune: [-7, 7], cutoff: 1000, cutoffEnd: 1000, cutoffTime: 1, attack: 0.35, decay: null, release: 0.35 },
};

/** A voice is cut this many time constants after its release starts (≈ −50 dB). */
const TAIL_CONSTANTS = 6;

interface ScheduledNote {
  note: MusicNote;
  voice: MusicVoice;
}

export const scheduleLoop = (
  context: AudioContext,
  track: MusicId,
  output: AudioNode,
  startAt: number,
  timers: LoopTimers = defaultTimers,
): LoopHandle => {
  const def = MUSIC[track];
  const secondsPerBeat = 60 / def.bpm;
  const loopSeconds = def.bars * def.beatsPerBar * secondsPerBeat;
  const events: ScheduledNote[] = def.voices
    .flatMap((voice, vi) => voice.notes.map((note) => ({ note, voice, vi })))
    .sort((a, b) => a.note.beat - b.note.beat || a.vi - b.vi)
    .map(({ note, voice }) => ({ note, voice }));
  /** Playing sources and the nodes each one owns (disconnected with it). */
  const live = new Map<AudioScheduledSourceNode, AudioNode[]>();
  let loopIndex = 0;
  let cursor = 0;
  let stopped = false;

  const own = (source: AudioScheduledSourceNode, nodes: AudioNode[]): void => {
    live.set(source, nodes);
    source.onended = () => {
      live.delete(source);
      source.disconnect();
      for (const node of nodes) node.disconnect();
    };
  };

  const playNote = ({ note, voice }: ScheduledNote, when: number): void => {
    const end = when + note.beats * secondsPerBeat;
    const gain = context.createGain();
    gain.connect(output);
    if (voice.instrument === 'drum') {
      const buf = context.createBufferSource();
      buf.buffer = drumBuffer(context, note.pitch);
      gain.gain.setValueAtTime(voice.gain * (note.pitch === KICK_PITCH ? 1 : SHAKER_LEVEL), when);
      buf.connect(gain);
      own(buf, [gain]);
      buf.start(when);
      buf.stop(when + buf.buffer.duration);
      return;
    }
    const tone = TONE[voice.instrument];
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;
    filter.frequency.setValueAtTime(tone.cutoff, when);
    if (tone.cutoffEnd !== tone.cutoff) filter.frequency.setTargetAtTime(tone.cutoffEnd, when, tone.cutoffTime);
    filter.connect(gain);
    const peakAt = when + tone.attack;
    // Each oscillator of a pad carries its share so a chord note is as loud as a single one.
    const level = voice.gain / tone.detune.length;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(level, peakAt);
    let stopAt: number;
    if (tone.decay !== null) {
      gain.gain.setTargetAtTime(0, peakAt, tone.decay);
      stopAt = peakAt + TAIL_CONSTANTS * tone.decay;
    } else {
      const releaseAt = Math.max(peakAt, end);
      gain.gain.setTargetAtTime(0, releaseAt, tone.release);
      stopAt = releaseAt + TAIL_CONSTANTS * tone.release;
    }
    tone.detune.forEach((cents, i) => {
      const osc = context.createOscillator();
      osc.type = tone.type;
      osc.frequency.setValueAtTime(midiToHz(note.pitch), when);
      osc.detune.value = cents;
      osc.connect(filter);
      // The last oscillator of the note owns the shared filter and gain.
      own(osc, i === tone.detune.length - 1 ? [filter, gain] : []);
      osc.start(when);
      osc.stop(stopAt);
    });
  };

  const pump = (): void => {
    if (stopped || events.length === 0) return;
    const now = context.currentTime;
    const horizon = now + MUSIC_HORIZON_MS / 1000;
    // After a long stall skip whole passes at once instead of walking every missed note.
    const currentPass = Math.floor((now - startAt) / loopSeconds);
    if (currentPass > loopIndex) {
      loopIndex = currentPass;
      cursor = 0;
    }
    for (;;) {
      const ev = events[cursor]!;
      const when = startAt + loopIndex * loopSeconds + ev.note.beat * secondsPerBeat;
      if (when >= horizon) break;
      if (when >= now) playNote(ev, when);
      cursor += 1;
      if (cursor === events.length) {
        cursor = 0;
        loopIndex += 1;
      }
    }
  };

  pump();
  const handle = timers.setInterval(pump, MUSIC_LOOKAHEAD_MS);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      timers.clearInterval(handle);
      for (const [source, nodes] of [...live]) {
        source.onended = null;
        try {
          source.stop();
        } catch {
          // Already stopped.
        }
        source.disconnect();
        for (const node of nodes) node.disconnect();
      }
      live.clear();
    },
  };
};
