import { describe, expect, it } from 'vitest';
import { SFX, SFX_IDS, type SfxDef } from '../data/sfx';
import { envelopeAt, synthesizeSfx } from './sfx';

const base: SfxDef = {
  wave: 'square',
  frequency: 440,
  endFrequency: 440,
  attack: 0.01,
  decay: 0.02,
  sustain: 0.5,
  release: 0.03,
  duration: 0.1,
  gain: 0.8,
  seed: 7,
};

describe('synthesizeSfx', () => {
  it('has duration × sampleRate samples', () => {
    expect(synthesizeSfx(base, 8000).length).toBe(800);
    expect(synthesizeSfx(base, 44100).length).toBe(4410);
  });

  it.each(SFX_IDS)('%s is deterministic, finite, within [-1, 1] and released to 0', (id) => {
    const a = synthesizeSfx(SFX[id], 8000);
    const b = synthesizeSfx(SFX[id], 8000);
    expect(a).toEqual(b);
    let peak = 0;
    for (const s of a) {
      expect(Number.isFinite(s)).toBe(true);
      expect(Math.abs(s)).toBeLessThanOrEqual(1);
      peak = Math.max(peak, Math.abs(s));
    }
    expect(peak).toBeGreaterThan(0);
    expect(a[a.length - 1]).toBe(0);
  });

  it('noise depends on the local seed only', () => {
    const noise: SfxDef = { ...base, wave: 'noise' };
    expect(synthesizeSfx(noise, 8000)).toEqual(synthesizeSfx(noise, 8000));
    expect(synthesizeSfx(noise, 8000)).not.toEqual(synthesizeSfx({ ...noise, seed: 8 }, 8000));
  });

  it('the envelope follows ADSR', () => {
    expect(envelopeAt(base, 0)).toBe(0);
    expect(envelopeAt(base, 0.01)).toBeCloseTo(1);
    expect(envelopeAt(base, 0.03)).toBeCloseTo(0.5);
    expect(envelopeAt(base, 0.05)).toBeCloseTo(0.5);
    expect(envelopeAt(base, 0.1)).toBe(0);
  });

  it('the frequency sweep changes the waveform period', () => {
    const flat = synthesizeSfx({ ...base, sustain: 1, attack: 0, decay: 0, release: 0.001 }, 8000);
    const sweep = synthesizeSfx({ ...base, sustain: 1, attack: 0, decay: 0, release: 0.001, endFrequency: 1760 }, 8000);
    const crossings = (s: Float32Array): number => {
      let c = 0;
      for (let i = 1; i < s.length; i++) if (s[i - 1]! <= 0 && s[i]! > 0) c++;
      return c;
    };
    expect(crossings(sweep)).toBeGreaterThan(crossings(flat));
  });
});
