/**
 * Lập lịch vòng nhạc (spec G5 §3): bộ hẹn giờ thức mỗi 100 ms và đặt trước các nốt trong 200 ms tới
 * theo đồng hồ của AudioContext. Nốt đã trễ (ví dụ sau khi tab ngủ) bị bỏ, không phát bù.
 */
import { MUSIC, MUSIC_HORIZON_MS, MUSIC_LOOKAHEAD_MS, type MusicId, type MusicNote, type MusicVoice } from '../data/music';
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

/** Trống: nhiễu ngắn; pitch 36 = trống trầm, còn lại = trống cơm. */
const DRUM_KICK: SfxDef = {
  wave: 'noise', frequency: 160, endFrequency: 50, attack: 0.002, decay: 0.08, sustain: 0.3,
  release: 0.06, duration: 0.18, gain: 1, seed: 101,
};
const DRUM_SNARE: SfxDef = {
  wave: 'noise', frequency: 2600, endFrequency: 1800, attack: 0.002, decay: 0.05, sustain: 0.2,
  release: 0.05, duration: 0.12, gain: 0.8, seed: 102,
};
const KICK_PITCH = 36;

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
    const pcm = synthesizeSfx(key === KICK_PITCH ? DRUM_KICK : DRUM_SNARE, context.sampleRate);
    buffer = context.createBuffer(1, pcm.length, context.sampleRate);
    buffer.getChannelData(0).set(pcm);
    byPitch.set(key, buffer);
  }
  return buffer;
};

export const midiToHz = (pitch: number): number => 440 * Math.pow(2, (pitch - 69) / 12);

const OSC_TYPE: Record<'flute' | 'pluck' | 'horn', OscillatorType> = {
  flute: 'triangle',
  pluck: 'square',
  horn: 'square',
};

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
  const live = new Set<AudioScheduledSourceNode>();
  let loopIndex = 0;
  let cursor = 0;
  let stopped = false;

  const playNote = ({ note, voice }: ScheduledNote, when: number): void => {
    const end = when + note.beats * secondsPerBeat;
    const gain = context.createGain();
    gain.connect(output);
    let source: AudioScheduledSourceNode;
    if (voice.instrument === 'drum') {
      const buf = context.createBufferSource();
      buf.buffer = drumBuffer(context, note.pitch);
      gain.gain.setValueAtTime(voice.gain, when);
      source = buf;
    } else {
      const osc = context.createOscillator();
      osc.type = OSC_TYPE[voice.instrument];
      osc.frequency.setValueAtTime(midiToHz(note.pitch), when);
      const peakAt = when + 0.01;
      const fadeFrom = voice.instrument === 'pluck' ? peakAt : Math.max(peakAt, end - 0.05);
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(voice.gain, peakAt);
      gain.gain.setValueAtTime(voice.gain, fadeFrom);
      gain.gain.linearRampToValueAtTime(0, end);
      source = osc;
    }
    source.connect(gain);
    live.add(source);
    source.onended = () => {
      live.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(when);
    source.stop(end);
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
      for (const source of [...live]) {
        source.onended = null;
        try {
          source.stop();
        } catch {
          // Already stopped.
        }
        source.disconnect();
      }
      live.clear();
    },
  };
};
