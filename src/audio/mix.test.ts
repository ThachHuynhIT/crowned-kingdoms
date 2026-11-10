import { describe, expect, it } from 'vitest';
import { MASTER_COMPRESSOR, REVERB } from '../data/sfx';
import { compressorMakeupTrim, reverbImpulse } from './mix';

describe('compressorMakeupTrim', () => {
  it('cancels the automatic makeup gain: 0.6 × (T − T/R) dB', () => {
    // −12 dB, 4:1 → 0 dB in comes out at −9 dB → +5.4 dB makeup → trim −5.4 dB.
    expect(compressorMakeupTrim(-12, 4)).toBeCloseTo(Math.pow(10, -5.4 / 20));
    expect(compressorMakeupTrim(0, 4)).toBeCloseTo(1);
    const trim = compressorMakeupTrim();
    expect(trim).toBeGreaterThan(0);
    expect(trim).toBeLessThan(1);
    expect(trim).toBeCloseTo(compressorMakeupTrim(MASTER_COMPRESSOR.threshold, MASTER_COMPRESSOR.ratio));
  });
});

describe('reverbImpulse', () => {
  const sr = 8000;
  const [l, r] = reverbImpulse(sr, REVERB.seconds, REVERB.decay, REVERB.preDelay, REVERB.damping, REVERB.seed);

  it('is stereo, deterministic and decorrelated', () => {
    expect(l.length).toBe(Math.round(REVERB.seconds * sr));
    expect(r.length).toBe(l.length);
    const again = reverbImpulse(sr, REVERB.seconds, REVERB.decay, REVERB.preDelay, REVERB.damping, REVERB.seed);
    expect(again[0]).toEqual(l);
    expect(r).not.toEqual(l);
  });

  it('is silent during the pre-delay, decays and ends at zero', () => {
    const pre = Math.round(REVERB.preDelay * sr);
    for (let i = 0; i < pre; i++) expect(l[i]).toBe(0);
    const energy = (from: number, to: number): number => {
      let e = 0;
      for (let i = from; i < to; i++) e += l[i]! * l[i]!;
      return e;
    };
    const quarter = Math.floor(l.length / 4);
    expect(energy(pre, quarter)).toBeGreaterThan(energy(quarter * 3, l.length) * 100);
    expect(l[l.length - 1]).toBe(0);
    for (const s of l) expect(Number.isFinite(s)).toBe(true);
  });
});
