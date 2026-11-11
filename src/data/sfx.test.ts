import { describe, expect, it } from 'vitest';
import { MASTER_OUTPUT } from './settings';
import {
  MASTER_COMPRESSOR,
  MASTER_LOWPASS_HZ,
  REVERB,
  SFX,
  SFX_BATTLE_MAX_VOICES,
  SFX_CATEGORY_GAIN,
  SFX_GAIN_VARIATION,
  SFX_IDS,
  SFX_MAX_VOICES,
  SFX_MIN_INTERVAL_MS,
  SFX_PITCH_VARIATION_CENTS,
  type SfxId,
} from './sfx';

const EXPECTED = [
  'ui_click', 'ui_hover', 'card_draw', 'card_play', 'reroll', 'coin', 'plot_unlock', 'level_up',
  'battle_horn', 'hit_light', 'hit_heavy', 'arrow', 'cannon', 'fire', 'magic', 'death_pop',
  'boulder_whoosh', 'boulder_impact', 'throne_hit', 'victory', 'defeat',
];

const BATTLE = [
  'hit_light', 'hit_heavy', 'arrow', 'cannon', 'fire', 'magic', 'death_pop', 'boulder_whoosh', 'boulder_impact',
  'throne_hit',
];

const peak = (id: SfxId): number => SFX[id].gain * SFX_CATEGORY_GAIN[SFX[id].category];

describe('SFX data', () => {
  it('has exactly the 21 spec ids', () => {
    expect([...SFX_IDS]).toEqual(EXPECTED);
    expect(Object.keys(SFX).sort()).toEqual([...EXPECTED].sort());
  });

  it.each(EXPECTED)('%s is a valid layered recipe', (id) => {
    const d = SFX[id as SfxId];
    expect(['ui', 'game', 'battle', 'fanfare']).toContain(d.category);
    expect(d.duration).toBeGreaterThan(0);
    expect(d.gain).toBeGreaterThan(0);
    expect(d.gain).toBeLessThanOrEqual(1);
    expect(Number.isInteger(d.seed)).toBe(true);
    expect(d.layers.length).toBeGreaterThan(0);
    for (const l of d.layers) {
      for (const v of [l.frequency, l.endFrequency, l.glide, l.q, l.delay, l.attack, l.decay, l.gain]) {
        expect(Number.isFinite(v)).toBe(true);
      }
      // Owner 10/11/2026: no raw square or sawtooth beeps.
      expect(['sine', 'triangle', 'noise']).toContain(l.wave);
      expect(l.frequency).toBeGreaterThan(0);
      expect(l.endFrequency).toBeGreaterThan(0);
      // A layer without a glide keeps one pitch.
      if (l.glide === 0) expect(l.endFrequency).toBe(l.frequency);
      expect(l.glide).toBeGreaterThanOrEqual(0);
      expect(l.q).toBeGreaterThan(0);
      expect(l.delay).toBeGreaterThanOrEqual(0);
      // Soft but not sluggish attacks; a click never starts at full level.
      expect(l.attack).toBeGreaterThan(0);
      expect(l.attack).toBeLessThanOrEqual(0.35);
      expect(l.decay).toBeGreaterThan(0);
      expect(l.gain).toBeGreaterThan(0);
      expect(l.gain).toBeLessThanOrEqual(1);
      expect(l.delay + l.attack).toBeLessThan(d.duration);
    }
  });

  it('every battle sound is in the battle category; the rest are not', () => {
    for (const id of SFX_IDS) expect(SFX[id].category === 'battle').toBe(BATTLE.includes(id));
  });
});

describe('mix balance (owner 10/11/2026: still too loud, clicks very soft, hits soft and short)', () => {
  it('halves the master output again: 0.25 / 6', () => {
    expect(MASTER_OUTPUT).toBeCloseTo(0.25 / 6);
  });

  it('UI clicks are the softest, battle hits stay under the fanfares and the rewards', () => {
    expect(peak('ui_click')).toBeLessThanOrEqual(0.12);
    expect(peak('ui_hover')).toBeLessThan(peak('ui_click'));
    for (const id of BATTLE as SfxId[]) {
      expect(peak(id)).toBeLessThanOrEqual(0.25);
      expect(peak(id)).toBeLessThan(peak('battle_horn'));
      expect(peak(id)).toBeLessThan(peak('victory'));
    }
    expect(peak('hit_light')).toBeLessThan(peak('hit_heavy'));
    for (const id of SFX_IDS) expect(peak(id)).toBeLessThanOrEqual(0.4);
  });

  it('battle hits are short', () => {
    for (const id of ['hit_light', 'hit_heavy', 'arrow', 'death_pop'] as const) {
      expect(SFX[id].duration).toBeLessThanOrEqual(0.35);
    }
  });

  it('melodic sounds never vary in pitch; battle sounds vary most', () => {
    expect(SFX_PITCH_VARIATION_CENTS.game).toBe(0);
    expect(SFX_PITCH_VARIATION_CENTS.fanfare).toBe(0);
    expect(SFX_PITCH_VARIATION_CENTS.battle).toBeGreaterThan(SFX_PITCH_VARIATION_CENTS.ui);
    expect(SFX_PITCH_VARIATION_CENTS.battle).toBeLessThanOrEqual(100);
    for (const v of Object.values(SFX_GAIN_VARIATION)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(0.5);
    }
  });

  it('caps voices and spaces repeats', () => {
    expect(SFX_MAX_VOICES).toBe(3);
    expect(SFX_BATTLE_MAX_VOICES).toBe(6);
    expect(SFX_MIN_INTERVAL_MS).toBeGreaterThanOrEqual(40);
    expect(SFX_MIN_INTERVAL_MS).toBeLessThanOrEqual(60);
  });

  it('the master bus is gentle: soft-knee compressor, low-pass under 8 kHz, quiet reverb', () => {
    expect(MASTER_LOWPASS_HZ).toBeLessThan(8000);
    expect(MASTER_COMPRESSOR.ratio).toBeLessThanOrEqual(4);
    expect(MASTER_COMPRESSOR.threshold).toBeLessThan(0);
    expect(MASTER_COMPRESSOR.knee).toBeGreaterThan(0);
    expect(REVERB.sfxSend).toBeLessThanOrEqual(0.2);
    expect(REVERB.musicSend).toBeLessThanOrEqual(0.3);
    expect(REVERB.decay).toBeLessThan(REVERB.seconds);
  });
});
