/**
 * Hiệu ứng âm thanh sinh bằng WebAudio (spec G5 §3). Chỉ là số; `src/audio/sfx.ts` tổng hợp PCM.
 *
 * Owner 10/11/2026: the old square/sawtooth beeps were "old and hard to listen to". Each sound is now a few soft
 * layers: sine/triangle bodies with a short exponential pitch glide and band-passed noise transients, each with a
 * few-ms attack and an exponential decay. The synthesiser normalises every sound to the peak
 * `gain × SFX_CATEGORY_GAIN[category]`, so those two numbers are the loudness of the sound before the master bus.
 */

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

export type SfxWave = 'sine' | 'triangle' | 'noise';

/** Mix group of a sound: its loudness, pitch variation and voice cap. */
export type SfxCategory = 'ui' | 'game' | 'battle' | 'fanfare';

/**
 * One layer of a sound. Tones glide exponentially from `frequency` to `endFrequency` (Hz) with time constant `glide`
 * (s; 0 = no glide). Noise is white noise through a band-pass whose centre glides the same way, with quality `q`.
 * The layer starts at `delay` (s), rises linearly over `attack` (s) and then decays exponentially with time constant
 * `decay` (s). `gain` is the layer's level relative to the other layers of the sound (0…1).
 */
export interface SfxLayer {
  wave: SfxWave;
  frequency: number;
  endFrequency: number;
  glide: number;
  q: number;
  delay: number;
  attack: number;
  decay: number;
  gain: number;
}

/**
 * A sound: its layers, total `duration` (s; the last `SFX_FADE_TAIL` seconds fade to exact silence), peak `gain`
 * within its category (0…1) and the `seed` of its noise (local, never the run RNG).
 */
export interface SfxDef {
  category: SfxCategory;
  layers: readonly SfxLayer[];
  duration: number;
  gain: number;
  seed: number;
}

/** Peak level of each category at full volume, before the master bus (owner 10/11/2026: clicks very soft, hits soft). */
export const SFX_CATEGORY_GAIN: Readonly<Record<SfxCategory, number>> = {
  ui: 0.3,
  game: 0.55,
  battle: 0.35,
  fanfare: 0.6,
};

/** Random-looking pitch spread per play (± cents), so repeated hits do not sound identical; melodic sounds stay in tune. */
export const SFX_PITCH_VARIATION_CENTS: Readonly<Record<SfxCategory, number>> = {
  ui: 25,
  game: 0,
  battle: 80,
  fanfare: 0,
};

/** Level spread per play (± fraction of the gain). */
export const SFX_GAIN_VARIATION: Readonly<Record<SfxCategory, number>> = {
  ui: 0.05,
  game: 0,
  battle: 0.15,
  fanfare: 0,
};

/** Voices of one id at once; a further play is dropped. */
export const SFX_MAX_VOICES = 3;

/** Voices of the whole battle category at once, so a busy fight does not stack into noise. */
export const SFX_BATTLE_MAX_VOICES = 6;

/** A second play of the same id within this many ms of the last one is dropped. */
export const SFX_MIN_INTERVAL_MS = 50;

/** Every sound ends with a fade of this many seconds to exact silence. */
export const SFX_FADE_TAIL = 0.01;

const tone = (
  wave: 'sine' | 'triangle',
  frequency: number,
  endFrequency: number,
  glide: number,
  delay: number,
  attack: number,
  decay: number,
  gain: number,
): SfxLayer => ({ wave, frequency, endFrequency, glide, q: 1, delay, attack, decay, gain });

const noise = (
  frequency: number,
  endFrequency: number,
  glide: number,
  q: number,
  delay: number,
  attack: number,
  decay: number,
  gain: number,
): SfxLayer => ({ wave: 'noise', frequency, endFrequency, glide, q, delay, attack, decay, gain });

const sfx = (category: SfxCategory, duration: number, gain: number, seed: number, layers: SfxLayer[]): SfxDef => ({
  category,
  layers,
  duration,
  gain,
  seed,
});

export const SFX: Readonly<Record<SfxId, SfxDef>> = {
  // UI: tiny wooden ticks and soft swishes.
  ui_click: sfx('ui', 0.08, 0.4, 1, [
    tone('sine', 1400, 900, 0.01, 0, 0.002, 0.012, 1),
    noise(4000, 4000, 0, 2, 0, 0.001, 0.004, 0.3),
  ]),
  ui_hover: sfx('ui', 0.08, 0.2, 2, [tone('sine', 1800, 1800, 0, 0, 0.004, 0.012, 1)]),
  card_draw: sfx('ui', 0.18, 0.5, 3, [
    noise(2500, 5000, 0.05, 1.2, 0, 0.01, 0.03, 1),
    tone('sine', 900, 1300, 0.04, 0, 0.005, 0.03, 0.3),
  ]),
  card_play: sfx('ui', 0.32, 0.65, 4, [
    tone('sine', 300, 180, 0.03, 0, 0.003, 0.05, 1),
    noise(1500, 1500, 0, 1, 0, 0.002, 0.02, 0.5),
    tone('triangle', 660, 660, 0, 0.01, 0.005, 0.05, 0.25),
  ]),
  reroll: sfx('ui', 0.4, 0.55, 5, [
    noise(1800, 4200, 0.1, 1.5, 0, 0.03, 0.05, 0.6),
    tone('sine', 500, 900, 0.08, 0, 0.01, 0.06, 0.6),
  ]),
  // Planning rewards: soft bells and arpeggios.
  coin: sfx('game', 0.7, 0.45, 6, [
    tone('sine', 1568, 1568, 0, 0, 0.002, 0.1, 1),
    tone('sine', 4330, 4330, 0, 0, 0.002, 0.03, 0.2),
    tone('sine', 2093, 2093, 0, 0.07, 0.003, 0.12, 0.9),
  ]),
  plot_unlock: sfx('game', 1.3, 0.55, 7, [
    noise(800, 800, 0, 0.8, 0, 0.02, 0.06, 0.25),
    tone('sine', 523, 523, 0, 0, 0.004, 0.18, 1),
    tone('sine', 784, 784, 0, 0.08, 0.004, 0.2, 0.8),
    tone('triangle', 1047, 1047, 0, 0.16, 0.004, 0.22, 0.6),
  ]),
  level_up: sfx('game', 1.4, 0.6, 8, [
    tone('sine', 523, 523, 0, 0, 0.004, 0.16, 0.8),
    tone('sine', 659, 659, 0, 0.07, 0.004, 0.16, 0.8),
    tone('sine', 784, 784, 0, 0.14, 0.004, 0.18, 0.8),
    tone('triangle', 1047, 1047, 0, 0.21, 0.004, 0.22, 0.8),
    tone('sine', 2093, 2093, 0, 0.21, 0.004, 0.12, 0.2),
  ]),
  // Fanfares: warm, slow swells.
  battle_horn: sfx('fanfare', 2.6, 0.5, 9, [
    tone('triangle', 196, 220, 0.08, 0, 0.08, 0.45, 1),
    tone('triangle', 294, 330, 0.08, 0, 0.1, 0.45, 0.45),
    tone('sine', 98, 110, 0.08, 0, 0.1, 0.45, 0.5),
  ]),
  // Battle: short, low, rounded thuds; noise only as a filtered transient.
  hit_light: sfx('battle', 0.14, 0.35, 10, [
    tone('sine', 420, 220, 0.015, 0, 0.001, 0.022, 1),
    noise(2200, 1200, 0.02, 1.4, 0, 0.001, 0.01, 0.8),
  ]),
  hit_heavy: sfx('battle', 0.32, 0.45, 11, [
    tone('sine', 160, 70, 0.03, 0, 0.002, 0.05, 1),
    noise(900, 400, 0.03, 1, 0, 0.001, 0.025, 0.7),
  ]),
  arrow: sfx('battle', 0.2, 0.3, 12, [noise(3500, 2000, 0.04, 3, 0, 0.015, 0.03, 1)]),
  cannon: sfx('battle', 0.7, 0.55, 13, [
    tone('sine', 110, 45, 0.05, 0, 0.002, 0.1, 1),
    noise(600, 200, 0.08, 0.7, 0, 0.002, 0.07, 0.8),
  ]),
  fire: sfx('battle', 0.5, 0.35, 14, [
    noise(1200, 700, 0.1, 0.8, 0, 0.03, 0.07, 1),
    tone('sine', 220, 160, 0.1, 0, 0.02, 0.06, 0.3),
  ]),
  magic: sfx('battle', 0.5, 0.35, 15, [
    tone('sine', 1320, 1760, 0.05, 0, 0.006, 0.07, 0.7),
    tone('sine', 1980, 2640, 0.05, 0.03, 0.006, 0.07, 0.4),
    noise(6000, 6000, 0, 4, 0, 0.01, 0.05, 0.2),
  ]),
  death_pop: sfx('battle', 0.3, 0.35, 16, [
    tone('sine', 520, 180, 0.04, 0, 0.003, 0.045, 1),
    noise(1000, 1000, 0, 1, 0, 0.002, 0.02, 0.4),
  ]),
  boulder_whoosh: sfx('battle', 1.0, 0.4, 17, [noise(400, 1800, 0.25, 1.5, 0, 0.2, 0.14, 1)]),
  boulder_impact: sfx('battle', 0.9, 0.6, 18, [
    tone('sine', 90, 38, 0.06, 0, 0.002, 0.14, 1),
    noise(500, 150, 0.1, 0.7, 0, 0.002, 0.1, 0.8),
  ]),
  throne_hit: sfx('battle', 0.6, 0.5, 19, [
    tone('sine', 150, 100, 0.04, 0, 0.002, 0.09, 1),
    tone('triangle', 300, 300, 0, 0, 0.002, 0.06, 0.3),
    noise(700, 700, 0, 1, 0, 0.001, 0.03, 0.5),
  ]),
  victory: sfx('fanfare', 3.0, 0.55, 20, [
    tone('sine', 523, 523, 0, 0, 0.006, 0.28, 0.8),
    tone('sine', 659, 659, 0, 0.12, 0.006, 0.28, 0.8),
    tone('sine', 784, 784, 0, 0.24, 0.006, 0.3, 0.8),
    tone('triangle', 1047, 1047, 0, 0.36, 0.01, 0.55, 0.8),
    tone('sine', 659, 659, 0, 0.36, 0.01, 0.55, 0.45),
  ]),
  defeat: sfx('fanfare', 3.2, 0.5, 21, [
    tone('sine', 392, 392, 0, 0, 0.01, 0.32, 0.8),
    tone('sine', 330, 330, 0, 0.25, 0.01, 0.32, 0.8),
    tone('triangle', 262, 262, 0, 0.5, 0.012, 0.6, 0.8),
    tone('sine', 131, 131, 0, 0.5, 0.02, 0.6, 0.5),
  ]),
};

/**
 * Master bus (owner 10/11/2026: still too loud, harsh): a gentle low-pass to soften the highs, then a soft-knee
 * compressor that only catches the peaks of a busy fight. Values are in Hz, dB and seconds.
 */
export const MASTER_LOWPASS_HZ = 6500;
export const MASTER_LOWPASS_Q = 0.5;
export const MASTER_COMPRESSOR = {
  threshold: -12,
  knee: 8,
  ratio: 4,
  attack: 0.004,
  release: 0.25,
} as const;

/**
 * Shared reverb send: a generated stereo impulse of `seconds` with exponential decay time constant `decay` (s),
 * `preDelay` (s) and a one-pole damping coefficient (0…1, higher = darker); `sfxSend`/`musicSend` are the levels sent
 * from each bus, `wet` the level of the return.
 */
export const REVERB = {
  seconds: 1.6,
  decay: 0.35,
  preDelay: 0.012,
  damping: 0.6,
  seed: 97,
  sfxSend: 0.12,
  musicSend: 0.22,
  wet: 0.5,
} as const;
