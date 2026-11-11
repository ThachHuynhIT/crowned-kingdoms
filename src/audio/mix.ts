/**
 * Pure maths of the master bus (owner 10/11/2026): the reverb impulse and the trim that cancels the compressor's
 * automatic makeup gain. No WebAudio here, so both are unit-tested.
 */
import { Rng } from '../core/random';
import { MASTER_COMPRESSOR } from '../data/sfx';

/**
 * Linear gain that cancels the makeup gain a WebAudio DynamicsCompressorNode adds by itself: the spec raises the
 * whole output by (1 / curve(0 dB))^0.6. The curve is approximated without its knee: 0 dB in → T + (0 − T) / R out.
 * Without this trim the compressor would make quiet sounds louder, the opposite of what the owner asked.
 */
export const compressorMakeupTrim = (threshold: number = MASTER_COMPRESSOR.threshold, ratio: number = MASTER_COMPRESSOR.ratio): number => {
  const fullRangeDb = threshold - threshold / ratio;
  const makeupDb = -0.6 * fullRangeDb;
  return Math.pow(10, -makeupDb / 20);
};

/**
 * Stereo reverb impulse: seeded white noise with an exponential decay (time constant `decay` s), silent for
 * `preDelay` s, darkened by a one-pole low-pass (`damping` 0…1) and faded to zero over its last 50 ms.
 */
export const reverbImpulse = (
  sampleRate: number,
  seconds: number,
  decay: number,
  preDelay: number,
  damping: number,
  seed: number,
): [Float32Array, Float32Array] => {
  const length = Math.max(1, Math.round(seconds * sampleRate));
  const pre = Math.round(preDelay * sampleRate);
  const fade = Math.max(1, Math.round(0.05 * sampleRate));
  const channels: [Float32Array, Float32Array] = [new Float32Array(length), new Float32Array(length)];
  channels.forEach((data, c) => {
    const rng = new Rng(seed + c * 7919);
    let low = 0;
    for (let i = pre; i < length; i++) {
      const t = (i - pre) / sampleRate;
      low = low * damping + (rng.next() * 2 - 1) * (1 - damping);
      const tail = Math.min(1, (length - 1 - i) / fade);
      data[i] = low * Math.exp(-t / decay) * tail;
    }
    data[length - 1] = 0;
  });
  return channels;
};
