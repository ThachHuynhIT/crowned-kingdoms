/** Hiệu ứng âm thanh sinh bằng WebAudio (spec G5 §3). Chỉ là số; `src/audio/sfx.ts` tổng hợp PCM. */

export const SFX_IDS = [
  'ui_click',
  'ui_hover',
  'card_draw',
  'card_play',
  'reroll',
  'coin',
  'plot_unlock',
  'level_up',
  'battle_horn',
  'hit_light',
  'hit_heavy',
  'arrow',
  'cannon',
  'fire',
  'magic',
  'death_pop',
  'boulder_whoosh',
  'boulder_impact',
  'throne_hit',
  'victory',
  'defeat',
] as const;

export type SfxId = (typeof SFX_IDS)[number];

export type SfxWave = 'square' | 'triangle' | 'noise';

/**
 * Một âm: dạng sóng, quét tần số tuyến tính `frequency` → `endFrequency` (Hz) và bao ADSR.
 * Mọi thời gian tính bằng giây; `sustain` là mức 0…1; `gain` 0…1; `seed` cho nhiễu (không dùng RNG ván).
 */
export interface SfxDef {
  wave: SfxWave;
  frequency: number;
  endFrequency: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  duration: number;
  gain: number;
  seed: number;
}

/** Số tiếng cùng id phát đồng thời; tiếng thứ năm bị bỏ. */
export const SFX_MAX_VOICES = 4;

const def = (
  wave: SfxWave,
  frequency: number,
  endFrequency: number,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  duration: number,
  gain: number,
  seed: number,
): SfxDef => ({ wave, frequency, endFrequency, attack, decay, sustain, release, duration, gain, seed });

export const SFX: Readonly<Record<SfxId, SfxDef>> = {
  ui_click: def('square', 880, 660, 0.002, 0.02, 0.3, 0.02, 0.05, 0.35, 1),
  ui_hover: def('triangle', 1320, 1320, 0.004, 0.015, 0.2, 0.015, 0.04, 0.2, 2),
  card_draw: def('noise', 2400, 1200, 0.005, 0.05, 0.3, 0.05, 0.12, 0.3, 3),
  card_play: def('triangle', 440, 660, 0.005, 0.06, 0.5, 0.08, 0.18, 0.45, 4),
  reroll: def('square', 330, 880, 0.005, 0.08, 0.4, 0.06, 0.2, 0.3, 5),
  coin: def('square', 1568, 2093, 0.002, 0.05, 0.5, 0.1, 0.2, 0.3, 6),
  plot_unlock: def('triangle', 262, 523, 0.01, 0.1, 0.6, 0.15, 0.35, 0.45, 7),
  level_up: def('square', 523, 1047, 0.01, 0.12, 0.6, 0.18, 0.45, 0.35, 8),
  battle_horn: def('square', 196, 220, 0.06, 0.2, 0.7, 0.3, 0.9, 0.4, 9),
  hit_light: def('noise', 1800, 900, 0.002, 0.03, 0.2, 0.03, 0.07, 0.3, 10),
  hit_heavy: def('noise', 700, 200, 0.002, 0.06, 0.4, 0.08, 0.16, 0.45, 11),
  arrow: def('noise', 3200, 2200, 0.002, 0.04, 0.2, 0.04, 0.1, 0.22, 12),
  cannon: def('noise', 260, 60, 0.003, 0.12, 0.5, 0.2, 0.4, 0.55, 13),
  fire: def('noise', 900, 500, 0.02, 0.1, 0.5, 0.12, 0.3, 0.3, 14),
  magic: def('triangle', 988, 1976, 0.01, 0.08, 0.5, 0.12, 0.26, 0.3, 15),
  death_pop: def('square', 392, 98, 0.002, 0.05, 0.3, 0.06, 0.13, 0.3, 16),
  boulder_whoosh: def('noise', 600, 1600, 0.08, 0.2, 0.6, 0.2, 0.6, 0.3, 17),
  boulder_impact: def('noise', 180, 40, 0.002, 0.15, 0.5, 0.3, 0.55, 0.6, 18),
  throne_hit: def('square', 147, 110, 0.003, 0.1, 0.5, 0.15, 0.32, 0.45, 19),
  victory: def('triangle', 523, 1047, 0.02, 0.3, 0.7, 0.5, 1.4, 0.45, 20),
  defeat: def('triangle', 392, 131, 0.02, 0.3, 0.6, 0.6, 1.4, 0.45, 21),
};
