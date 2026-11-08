/**
 * Tổng hợp PCM cho hiệu ứng âm (spec G5 §3): square/triangle/noise, quét tần số tuyến tính và ADSR.
 * Nhiễu dùng seed cục bộ của từng âm, không bao giờ chạm RNG của ván.
 */
import { Rng } from '../core/random';
import type { SfxDef } from '../data/sfx';

/** Mức bao ADSR (0…1) tại thời điểm `t` giây; về 0 đúng ở `duration`. */
export const envelopeAt = (def: SfxDef, t: number): number => {
  const { attack, decay, sustain, release, duration } = def;
  if (t <= 0 || t >= duration) return 0;
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - ((t - attack) / decay) * (1 - sustain);
  const releaseStart = duration - release;
  if (t < releaseStart) return sustain;
  return release > 0 ? sustain * ((duration - t) / release) : 0;
};

export const synthesizeSfx = (def: SfxDef, sampleRate: number): Float32Array => {
  const length = Math.max(1, Math.round(def.duration * sampleRate));
  const out = new Float32Array(length);
  const rng = new Rng(def.seed);
  let phase = 0;
  let held = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const progress = length > 1 ? i / (length - 1) : 0;
    const freq = def.frequency + (def.endFrequency - def.frequency) * progress;
    const previous = phase;
    phase = (phase + freq / sampleRate) % 1;
    let v: number;
    if (def.wave === 'square') v = phase < 0.5 ? 1 : -1;
    else if (def.wave === 'triangle') v = 4 * Math.abs(phase - 0.5) - 1;
    else {
      // Sample-and-hold noise: a new random value each cycle, so the pitch sweep colours the noise.
      if (i === 0 || phase < previous) held = rng.next() * 2 - 1;
      v = held;
    }
    const s = v * envelopeAt(def, t) * def.gain;
    out[i] = Math.max(-1, Math.min(1, s));
  }
  out[length - 1] = 0;
  return out;
};
