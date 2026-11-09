import { describe, expect, it } from 'vitest';
import { SFX, SFX_IDS } from './sfx';

const EXPECTED = [
  'ui_click', 'ui_hover', 'card_draw', 'card_play', 'reroll', 'coin', 'plot_unlock', 'level_up',
  'battle_horn', 'hit_light', 'hit_heavy', 'arrow', 'cannon', 'fire', 'magic', 'death_pop',
  'boulder_whoosh', 'boulder_impact', 'throne_hit', 'victory', 'defeat',
];

describe('SFX data', () => {
  it('has exactly the 21 spec ids', () => {
    expect([...SFX_IDS]).toEqual(EXPECTED);
    expect(Object.keys(SFX).sort()).toEqual([...EXPECTED].sort());
  });

  it.each(EXPECTED)('%s has finite, positive parameters and a valid envelope', (id) => {
    const d = SFX[id as keyof typeof SFX];
    for (const v of [d.frequency, d.endFrequency, d.attack, d.decay, d.sustain, d.release, d.duration, d.gain, d.seed]) {
      expect(Number.isFinite(v)).toBe(true);
    }
    expect(d.frequency).toBeGreaterThan(0);
    expect(d.endFrequency).toBeGreaterThan(0);
    expect(d.duration).toBeGreaterThan(0);
    for (const v of [d.attack, d.decay, d.release]) expect(v).toBeGreaterThanOrEqual(0);
    expect(d.sustain).toBeGreaterThanOrEqual(0);
    expect(d.sustain).toBeLessThanOrEqual(1);
    expect(d.gain).toBeGreaterThan(0);
    expect(d.gain).toBeLessThanOrEqual(1);
    expect(d.attack + d.decay + d.release).toBeLessThanOrEqual(d.duration);
    expect(['square', 'triangle', 'noise']).toContain(d.wave);
  });
});
