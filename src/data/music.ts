/** Hai vòng nhạc sinh bằng WebAudio (spec G5 §3). Chỉ là số; `src/audio/music.ts` lập lịch. */

export type MusicId = 'planning' | 'battle';

/**
 * Instruments, synthesised in `src/audio/music.ts` (owner 10/11/2026: softer, more modern): `flute` a soft sine lead,
 * `pluck` a filtered triangle with an exponential decay (electric-piano-like), `horn` a warm detuned triangle pad
 * behind a low-pass, `drum` a sine kick (pitch 36) or a soft band-passed shaker (any other pitch).
 */
export type Instrument = 'flute' | 'pluck' | 'drum' | 'horn';

export interface MusicNote {
  beat: number;
  beats: number;
  pitch: number;
}

export interface MusicVoice {
  instrument: Instrument;
  /** 0…1. */
  gain: number;
  notes: readonly MusicNote[];
}

export interface MusicTrack {
  bpm: number;
  beatsPerBar: number;
  bars: number;
  voices: readonly MusicVoice[];
}

/** Level of the music bus under the effects (owner 10/11/2026: music under the effects). */
export const MUSIC_BUS_GAIN = 0.6;

/** Thời gian chuyển nhạc (ms). */
export const MUSIC_CROSSFADE_MS = 600;
/** Bộ lập lịch đánh thức mỗi `MUSIC_LOOKAHEAD_MS` và đặt trước các nốt trong `MUSIC_HORIZON_MS` tới. */
export const MUSIC_LOOKAHEAD_MS = 100;
export const MUSIC_HORIZON_MS = 200;

/** Ngũ cung trưởng C/D/E/G/A (MIDI). */
export const PENTATONIC_C: readonly number[] = [60, 62, 64, 67, 69];

const n = (beat: number, beats: number, pitch: number): MusicNote => ({ beat, beats, pitch });

/** A chord: every pitch starts at `beat` and lasts `beats`. */
const chord = (beat: number, beats: number, pitches: readonly number[]): MusicNote[] =>
  pitches.map((pitch) => n(beat, beats, pitch));

/** One note per beat from `beat`. */
const run = (beat: number, pitches: readonly number[]): MusicNote[] => pitches.map((pitch, i) => n(beat + i, 1, pitch));

export const MUSIC: Readonly<Record<MusicId, MusicTrack>> = {
  // Calm C major pentatonic: a slow pad, a one-note-per-beat arpeggio and a sparse lead.
  planning: {
    bpm: 72,
    beatsPerBar: 4,
    bars: 4,
    voices: [
      {
        instrument: 'horn',
        gain: 0.07,
        notes: [
          ...chord(0, 4, [48, 52, 55]),
          ...chord(4, 4, [45, 52, 57]),
          ...chord(8, 4, [43, 50, 55]),
          ...chord(12, 4, [45, 50, 55]),
        ],
      },
      {
        instrument: 'pluck',
        gain: 0.09,
        notes: [
          ...run(0, [60, 64, 67, 64]),
          ...run(4, [57, 60, 64, 60]),
          ...run(8, [55, 62, 67, 62]),
          ...run(12, [57, 62, 64, 67]),
        ],
      },
      {
        instrument: 'flute',
        gain: 0.06,
        notes: [n(0, 3, 76), n(3, 1, 74), n(4, 4, 72), n(8, 2, 74), n(10, 2, 79), n(12, 4, 76)],
      },
    ],
  },
  // Battle: A minor, steady but not busy: soft kick and shaker, a pad and a quarter-note ostinato.
  battle: {
    bpm: 96,
    beatsPerBar: 4,
    bars: 4,
    voices: [
      {
        instrument: 'drum',
        gain: 0.16,
        notes: [
          n(0, 0.5, 36), n(1, 0.5, 42), n(2, 0.5, 36), n(3, 0.5, 42),
          n(4, 0.5, 36), n(5, 0.5, 42), n(6, 0.5, 36), n(7, 0.5, 42),
          n(8, 0.5, 36), n(9, 0.5, 42), n(10, 0.5, 36), n(11, 0.5, 42),
          n(12, 0.5, 36), n(13, 0.5, 42), n(14, 0.5, 36), n(15, 0.25, 42), n(15.5, 0.25, 36),
        ],
      },
      {
        instrument: 'horn',
        gain: 0.07,
        notes: [
          ...chord(0, 4, [45, 52, 57]),
          ...chord(4, 4, [41, 48, 53]),
          ...chord(8, 4, [43, 50, 55]),
          ...chord(12, 4, [40, 47, 52]),
        ],
      },
      {
        instrument: 'pluck',
        gain: 0.08,
        notes: [
          ...run(0, [57, 64, 60, 64]),
          ...run(4, [53, 60, 57, 60]),
          ...run(8, [55, 62, 59, 62]),
          ...run(12, [52, 59, 55, 59]),
        ],
      },
    ],
  },
};
