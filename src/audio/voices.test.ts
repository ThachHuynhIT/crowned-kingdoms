import { describe, expect, it } from 'vitest';
import {
  SFX_BATTLE_MAX_VOICES,
  SFX_GAIN_VARIATION,
  SFX_MAX_VOICES,
  SFX_MIN_INTERVAL_MS,
  SFX_PITCH_VARIATION_CENTS,
} from '../data/sfx';
import { playVariation, variationAt, VoiceGate } from './voices';

const gap = SFX_MIN_INTERVAL_MS / 1000;

describe('variationAt', () => {
  it('is deterministic, inside [-1, 1) and spread out', () => {
    const values = Array.from({ length: 64 }, (_, n) => variationAt(n));
    expect(values).toEqual(Array.from({ length: 64 }, (_, n) => variationAt(n)));
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThan(1);
    }
    expect(values[0]).toBe(0);
    // Neighbours differ, and every quarter of the range gets used.
    for (let i = 1; i < values.length; i++) expect(values[i]).not.toBeCloseTo(values[i - 1]!, 3);
    for (const [lo, hi] of [[-1, -0.5], [-0.5, 0], [0, 0.5], [0.5, 1]]) {
      expect(values.some((v) => v >= lo! && v < hi!)).toBe(true);
    }
  });
});

describe('playVariation', () => {
  it('battle sounds vary in pitch and level within the category range', () => {
    const cents = SFX_PITCH_VARIATION_CENTS.battle;
    const rates = new Set<number>();
    for (let n = 0; n < 32; n++) {
      const v = playVariation('hit_light', n);
      expect(v.rate).toBeGreaterThanOrEqual(Math.pow(2, -cents / 1200) - 1e-9);
      expect(v.rate).toBeLessThanOrEqual(Math.pow(2, cents / 1200) + 1e-9);
      expect(Math.abs(v.gain - 1)).toBeLessThanOrEqual(SFX_GAIN_VARIATION.battle + 1e-9);
      rates.add(Math.round(v.rate * 1e6));
    }
    expect(rates.size).toBe(32);
  });

  it('melodic sounds stay in tune', () => {
    for (let n = 0; n < 8; n++) {
      expect(playVariation('coin', n)).toEqual({ rate: 1, gain: 1 });
      expect(playVariation('victory', n)).toEqual({ rate: 1, gain: 1 });
    }
  });
});

describe('VoiceGate', () => {
  it('drops a repeat of one id inside the minimum interval', () => {
    const gate = new VoiceGate();
    expect(gate.canStart('hit_light', 0)).toBe(true);
    gate.start('hit_light', 0);
    expect(gate.canStart('hit_light', gap / 2)).toBe(false);
    expect(gate.canStart('arrow', gap / 2)).toBe(true);
    expect(gate.canStart('hit_light', gap)).toBe(true);
  });

  it('caps the voices of one id and frees a slot when one ends', () => {
    const gate = new VoiceGate();
    let t = 0;
    for (let i = 0; i < SFX_MAX_VOICES; i++, t += gap) {
      expect(gate.canStart('coin', t)).toBe(true);
      expect(gate.start('coin', t)).toBe(i);
    }
    expect(gate.canStart('coin', t)).toBe(false);
    gate.end('coin');
    expect(gate.activeCount('coin')).toBe(SFX_MAX_VOICES - 1);
    expect(gate.canStart('coin', t)).toBe(true);
  });

  it('caps the whole battle category, not the UI', () => {
    const gate = new VoiceGate();
    const battle = ['hit_light', 'hit_heavy', 'arrow', 'cannon', 'fire', 'magic', 'death_pop'] as const;
    for (let i = 0; i < SFX_BATTLE_MAX_VOICES; i++) gate.start(battle[i]!, 0);
    expect(gate.battleVoices).toBe(SFX_BATTLE_MAX_VOICES);
    expect(gate.canStart(battle[SFX_BATTLE_MAX_VOICES]!, 0)).toBe(false);
    expect(gate.canStart('ui_click', 0)).toBe(true);
    gate.end('hit_light');
    expect(gate.canStart(battle[SFX_BATTLE_MAX_VOICES]!, 0)).toBe(true);
  });

  it('end without a start is harmless; clear resets the counts', () => {
    const gate = new VoiceGate();
    gate.end('arrow');
    expect(gate.activeCount('arrow')).toBe(0);
    gate.start('arrow', 0);
    gate.clear();
    expect(gate.battleVoices).toBe(0);
    expect(gate.canStart('arrow', 0)).toBe(true);
  });
});
