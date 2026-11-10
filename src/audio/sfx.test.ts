import { describe, expect, it } from 'vitest';
import { SFX, SFX_FADE_TAIL, SFX_IDS, type SfxDef, type SfxLayer } from '../data/sfx';
import { fadeAt, glideAt, layerEnvelopeAt, pcmStats, sfxPeak, synthesizeSfx } from './sfx';

const layer: SfxLayer = {
  wave: 'sine',
  frequency: 440,
  endFrequency: 220,
  glide: 0.02,
  q: 1,
  delay: 0.01,
  attack: 0.005,
  decay: 0.02,
  gain: 1,
};

const base: SfxDef = { category: 'game', layers: [layer], duration: 0.2, gain: 0.5, seed: 7 };

const crossings = (s: Float32Array, from: number, to: number): number => {
  let c = 0;
  for (let i = Math.max(1, from); i < to; i++) if (s[i - 1]! <= 0 && s[i]! > 0) c++;
  return c;
};

describe('synthesizeSfx', () => {
  it('has duration × sampleRate samples', () => {
    expect(synthesizeSfx(base, 8000).length).toBe(1600);
    expect(synthesizeSfx(base, 44100).length).toBe(8820);
  });

  it.each(SFX_IDS)('%s is deterministic, finite, at its category peak and released to 0', (id) => {
    const a = synthesizeSfx(SFX[id], 8000);
    const b = synthesizeSfx(SFX[id], 8000);
    expect(a).toEqual(b);
    for (const s of a) expect(Number.isFinite(s)).toBe(true);
    const stats = pcmStats(a, 8000);
    expect(stats.peak).toBeCloseTo(sfxPeak(SFX[id]), 5);
    expect(a[0]).toBe(0);
    expect(a[a.length - 1]).toBe(0);
  });

  it.each(SFX_IDS)('%s: every layer has decayed before the final fade (no click at the end)', (id) => {
    const d = SFX[id];
    const fadeStart = d.duration - SFX_FADE_TAIL;
    for (const l of d.layers) expect(layerEnvelopeAt(l, fadeStart)).toBeLessThan(0.05);
  });

  it('noise depends on the local seed only', () => {
    const noisy: SfxDef = { ...base, layers: [{ ...layer, wave: 'noise', frequency: 1000, endFrequency: 1000, glide: 0 }] };
    expect(synthesizeSfx(noisy, 8000)).toEqual(synthesizeSfx(noisy, 8000));
    expect(synthesizeSfx(noisy, 8000)).not.toEqual(synthesizeSfx({ ...noisy, seed: 8 }, 8000));
  });

  it('the envelope: silent before the delay, linear attack, exponential decay', () => {
    expect(layerEnvelopeAt(layer, 0)).toBe(0);
    expect(layerEnvelopeAt(layer, 0.0125)).toBeCloseTo(0.5);
    expect(layerEnvelopeAt(layer, 0.015)).toBeCloseTo(1);
    expect(layerEnvelopeAt(layer, 0.035)).toBeCloseTo(Math.exp(-1));
    expect(layerEnvelopeAt(layer, 0.055)).toBeCloseTo(Math.exp(-2));
  });

  it('the final fade reaches exact silence at the end', () => {
    expect(fadeAt(base, 0)).toBe(0);
    expect(fadeAt(base, 0.1)).toBe(1);
    expect(fadeAt(base, base.duration - SFX_FADE_TAIL / 2)).toBeCloseTo(0.5);
    expect(fadeAt(base, base.duration)).toBe(0);
  });

  it('the pitch glides exponentially from frequency to endFrequency', () => {
    expect(glideAt(layer, 0)).toBe(440);
    expect(glideAt(layer, 0.02)).toBeCloseTo(220 + 220 * Math.exp(-1));
    expect(glideAt(layer, 1)).toBeCloseTo(220);
    expect(glideAt({ ...layer, glide: 0, endFrequency: 440 }, 0.5)).toBe(440);
    // A falling glide: more zero crossings early than late.
    const slow: SfxDef = {
      ...base,
      duration: 0.4,
      layers: [{ ...layer, delay: 0, attack: 0.001, decay: 10, frequency: 1600, endFrequency: 200, glide: 0.08 }],
    };
    const pcm = synthesizeSfx(slow, 8000);
    expect(crossings(pcm, 0, 800)).toBeGreaterThan(crossings(pcm, 2400, 3200));
  });

  it('a custom peak overrides the category level', () => {
    expect(pcmStats(synthesizeSfx(base, 8000, 1), 8000).peak).toBeCloseTo(1, 5);
  });
});

describe('rendered levels (no speakers in CI: measured from the PCM)', () => {
  const stats = Object.fromEntries(SFX_IDS.map((id) => [id, pcmStats(synthesizeSfx(SFX[id], 44100), 44100)]));

  it('UI clicks are very soft and very short', () => {
    expect(stats.ui_click!.peak).toBeLessThanOrEqual(0.12);
    expect(stats.ui_click!.audibleSeconds).toBeLessThan(0.05);
    expect(stats.ui_hover!.rms).toBeLessThan(stats.ui_click!.rms);
  });

  it('battle hits are soft and short', () => {
    for (const id of ['hit_light', 'hit_heavy', 'arrow', 'death_pop'] as const) {
      expect(stats[id]!.peak).toBeLessThanOrEqual(0.25);
      expect(stats[id]!.audibleSeconds).toBeLessThan(0.25);
    }
  });

  it('battle hits carry less energy than the fanfares', () => {
    for (const id of ['hit_light', 'hit_heavy', 'arrow', 'cannon', 'magic', 'fire'] as const) {
      expect(stats[id]!.rms).toBeLessThan(stats.battle_horn!.rms);
      expect(stats[id]!.rms).toBeLessThan(stats.victory!.rms);
    }
  });
});
