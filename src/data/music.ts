/** Hai vòng nhạc sinh bằng WebAudio (spec G5 §3). Chỉ là số; `src/audio/music.ts` lập lịch. */

export type MusicId = 'planning' | 'battle';

export type Instrument = 'flute' | 'pluck' | 'drum' | 'horn';

/** Một nốt: bắt đầu ở phách `beat` (tính từ đầu vòng), dài `beats` phách, cao độ MIDI `pitch`. */
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

/** Thời gian chuyển nhạc (ms). */
export const MUSIC_CROSSFADE_MS = 600;
/** Bộ lập lịch đánh thức mỗi `MUSIC_LOOKAHEAD_MS` và đặt trước các nốt trong `MUSIC_HORIZON_MS` tới. */
export const MUSIC_LOOKAHEAD_MS = 100;
export const MUSIC_HORIZON_MS = 200;

/** Ngũ cung trưởng C/D/E/G/A (MIDI). */
export const PENTATONIC_C: readonly number[] = [60, 62, 64, 67, 69];

const n = (beat: number, beats: number, pitch: number): MusicNote => ({ beat, beats, pitch });

export const MUSIC: Readonly<Record<MusicId, MusicTrack>> = {
  planning: {
    bpm: 90,
    beatsPerBar: 4,
    bars: 4,
    voices: [
      {
        instrument: 'flute',
        gain: 0.35,
        notes: [
          n(0, 1, 72), n(1, 1, 74), n(2, 2, 76),
          n(4, 1, 79), n(5, 1, 76), n(6, 2, 74),
          n(8, 1, 72), n(9, 1, 69), n(10, 2, 67),
          n(12, 1, 69), n(13, 1, 72), n(14, 2, 74),
        ],
      },
      {
        instrument: 'pluck',
        gain: 0.25,
        notes: [
          n(0, 0.5, 48), n(1, 0.5, 55), n(2, 0.5, 52), n(3, 0.5, 55),
          n(4, 0.5, 45), n(5, 0.5, 52), n(6, 0.5, 48), n(7, 0.5, 52),
          n(8, 0.5, 43), n(9, 0.5, 50), n(10, 0.5, 52), n(11, 0.5, 50),
          n(12, 0.5, 45), n(13, 0.5, 52), n(14, 0.5, 50), n(15, 0.5, 43),
        ],
      },
    ],
  },
  battle: {
    bpm: 120,
    beatsPerBar: 4,
    bars: 4,
    voices: [
      {
        instrument: 'drum',
        gain: 0.4,
        notes: [
          n(0, 0.25, 36), n(1, 0.25, 38), n(2, 0.25, 36), n(2.5, 0.25, 36), n(3, 0.25, 38),
          n(4, 0.25, 36), n(5, 0.25, 38), n(6, 0.25, 36), n(6.5, 0.25, 36), n(7, 0.25, 38),
          n(8, 0.25, 36), n(9, 0.25, 38), n(10, 0.25, 36), n(10.5, 0.25, 36), n(11, 0.25, 38),
          n(12, 0.25, 36), n(13, 0.25, 38), n(14, 0.25, 36), n(14.5, 0.25, 38), n(15, 0.25, 38),
        ],
      },
      {
        instrument: 'horn',
        gain: 0.3,
        notes: [
          n(0, 1.5, 57), n(1.5, 0.5, 60), n(2, 2, 62),
          n(4, 1.5, 57), n(5.5, 0.5, 55), n(6, 2, 52),
          n(8, 1.5, 57), n(9.5, 0.5, 60), n(10, 2, 64),
          n(12, 1, 62), n(13, 1, 60), n(14, 2, 57),
        ],
      },
    ],
  },
};
