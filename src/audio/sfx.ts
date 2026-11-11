/**
 * Tổng hợp PCM cho hiệu ứng âm (spec G5 §3; owner 10/11/2026: modern and soft). Each layer is a sine/triangle tone
 * with an exponential pitch glide, or white noise through a gliding band-pass; each has a linear attack and an
 * exponential decay. The sum is normalised to the sound's peak level and ends with a short fade to exact silence.
 * Noise uses the sound's local seed and never touches the run RNG.
 */
import { Rng } from '../core/random';
import { SFX_CATEGORY_GAIN, SFX_FADE_TAIL, type SfxDef, type SfxLayer } from '../data/sfx';

/** Level (0…1) of one layer at `t` seconds from the start of the sound, before the final fade. */
export const layerEnvelopeAt = (layer: SfxLayer, t: number): number => {
  const local = t - layer.delay;
  if (local < 0) return 0;
  if (local < layer.attack) return local / layer.attack;
  return Math.exp(-(local - layer.attack) / layer.decay);
};

/** The final fade: 1 until `duration − SFX_FADE_TAIL`, then linear to 0 at `duration`. */
export const fadeAt = (def: SfxDef, t: number): number => {
  if (t <= 0 || t >= def.duration) return 0;
  const tail = Math.min(SFX_FADE_TAIL, def.duration / 2);
  const left = def.duration - t;
  return left < tail ? left / tail : 1;
};

/** Frequency (Hz) of a layer `local` seconds after it starts: exponential glide toward `endFrequency`. */
export const glideAt = (layer: SfxLayer, local: number): number => {
  if (layer.glide <= 0 || local <= 0) return layer.frequency;
  return layer.endFrequency + (layer.frequency - layer.endFrequency) * Math.exp(-local / layer.glide);
};

/** The peak the synthesiser normalises a sound to. */
export const sfxPeak = (def: SfxDef): number => def.gain * SFX_CATEGORY_GAIN[def.category];

/** Band-pass biquad (RBJ cookbook, 0 dB peak gain) with a centre that may change per sample. */
class BandPass {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  constructor(
    private readonly sampleRate: number,
    private readonly q: number,
  ) {}
  next(x: number, centre: number): number {
    const f = Math.min(centre, this.sampleRate * 0.45);
    const w0 = (2 * Math.PI * f) / this.sampleRate;
    const alpha = Math.sin(w0) / (2 * this.q);
    const a0 = 1 + alpha;
    const y = (alpha * x - alpha * this.x2 + 2 * Math.cos(w0) * this.y1 - (1 - alpha) * this.y2) / a0;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

const renderLayer = (layer: SfxLayer, out: Float32Array, sampleRate: number, rng: Rng): void => {
  const start = Math.max(0, Math.ceil(layer.delay * sampleRate));
  const nyquistGuard = sampleRate * 0.45;
  const filter = layer.wave === 'noise' ? new BandPass(sampleRate, layer.q) : null;
  let phase = 0;
  for (let i = start; i < out.length; i++) {
    const t = i / sampleRate;
    const local = t - layer.delay;
    const env = layerEnvelopeAt(layer, t);
    const freq = glideAt(layer, local);
    let v: number;
    if (filter) v = filter.next(rng.next() * 2 - 1, freq);
    else {
      phase = (phase + freq / sampleRate) % 1;
      // A tone above the guard would alias at low sample rates: leave it out.
      if (freq >= nyquistGuard) v = 0;
      else if (layer.wave === 'sine') v = Math.sin(2 * Math.PI * phase);
      else v = 4 * Math.abs(phase - 0.5) - 1;
    }
    out[i]! += v * env * layer.gain;
  }
};

/** Renders `def` at `sampleRate`, normalised to `peak` (default: the sound's category level, `sfxPeak`). */
export const synthesizeSfx = (def: SfxDef, sampleRate: number, peak: number = sfxPeak(def)): Float32Array => {
  const length = Math.max(1, Math.round(def.duration * sampleRate));
  const out = new Float32Array(length);
  const rng = new Rng(def.seed);
  for (const layer of def.layers) renderLayer(layer, out, sampleRate, rng);
  let raw = 0;
  for (let i = 0; i < length; i++) {
    out[i]! *= fadeAt(def, i / sampleRate);
    raw = Math.max(raw, Math.abs(out[i]!));
  }
  const scale = raw > 0 ? peak / raw : 0;
  for (let i = 0; i < length; i++) out[i] = Math.max(-1, Math.min(1, out[i]! * scale));
  out[length - 1] = 0;
  return out;
};

export interface PcmStats {
  peak: number;
  rms: number;
  /** Seconds until the signal last exceeds 10% of its peak. */
  audibleSeconds: number;
}

/** Peak, RMS and audible length of rendered PCM (tests and level reports). */
export const pcmStats = (pcm: Float32Array, sampleRate: number): PcmStats => {
  let peak = 0;
  let sum = 0;
  for (const s of pcm) {
    peak = Math.max(peak, Math.abs(s));
    sum += s * s;
  }
  let last = 0;
  for (let i = 0; i < pcm.length; i++) if (Math.abs(pcm[i]!) > peak * 0.1) last = i;
  return { peak, rms: pcm.length > 0 ? Math.sqrt(sum / pcm.length) : 0, audibleSeconds: last / sampleRate };
};
