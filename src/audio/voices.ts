/**
 * Per-play variation and voice admission for effects (owner 10/11/2026: repeated hits should not sound identical and a
 * busy battle must not stack into noise). Pure: no WebAudio, no Math.random.
 */
import {
  SFX,
  SFX_BATTLE_MAX_VOICES,
  SFX_GAIN_VARIATION,
  SFX_MAX_VOICES,
  SFX_MIN_INTERVAL_MS,
  SFX_PITCH_VARIATION_CENTS,
  type SfxId,
} from '../data/sfx';

const GOLDEN = 0.6180339887498949;
const SILVER = 0.4142135623730951;

/**
 * Low-discrepancy value in [−1, 1) for play number `n` (Weyl sequence with step `step`): evenly spread, never random;
 * play 0 sits in the middle (0).
 */
export const variationAt = (n: number, step: number = GOLDEN): number => {
  const f = (0.5 + n * step) % 1;
  return f * 2 - 1;
};

export interface PlayVariation {
  /** Playback rate of the buffer (1 = as synthesised). */
  rate: number;
  /** Gain of this voice (1 = as synthesised). */
  gain: number;
}

/** Pitch (± cents) and level spread of play number `n` of `id`, from its category's ranges. */
export const playVariation = (id: SfxId, n: number): PlayVariation => {
  const category = SFX[id].category;
  const cents = SFX_PITCH_VARIATION_CENTS[category] * variationAt(n, GOLDEN);
  return {
    rate: Math.pow(2, cents / 1200),
    gain: 1 + SFX_GAIN_VARIATION[category] * variationAt(n, SILVER),
  };
};

/**
 * Decides whether a play may start: at most `SFX_MAX_VOICES` of one id, `SFX_BATTLE_MAX_VOICES` of the battle
 * category, and none within `SFX_MIN_INTERVAL_MS` of the last start of the same id. Times are in seconds.
 */
export class VoiceGate {
  private readonly active = new Map<SfxId, number>();
  private readonly lastStart = new Map<SfxId, number>();
  private readonly plays = new Map<SfxId, number>();
  private battleActive = 0;

  canStart(id: SfxId, now: number): boolean {
    if ((this.active.get(id) ?? 0) >= SFX_MAX_VOICES) return false;
    if (SFX[id].category === 'battle' && this.battleActive >= SFX_BATTLE_MAX_VOICES) return false;
    const last = this.lastStart.get(id);
    return last === undefined || (now - last) * 1000 >= SFX_MIN_INTERVAL_MS - 1e-6;
  }

  /** Records a start and returns the play number of this id (0, 1, 2, …) for `playVariation`. */
  start(id: SfxId, now: number): number {
    this.active.set(id, (this.active.get(id) ?? 0) + 1);
    if (SFX[id].category === 'battle') this.battleActive += 1;
    this.lastStart.set(id, now);
    const n = this.plays.get(id) ?? 0;
    this.plays.set(id, n + 1);
    return n;
  }

  end(id: SfxId): void {
    const count = this.active.get(id) ?? 0;
    if (count <= 0) return;
    this.active.set(id, count - 1);
    if (SFX[id].category === 'battle') this.battleActive = Math.max(0, this.battleActive - 1);
  }

  activeCount(id: SfxId): number {
    return this.active.get(id) ?? 0;
  }

  get battleVoices(): number {
    return this.battleActive;
  }

  clear(): void {
    this.active.clear();
    this.lastStart.clear();
    this.battleActive = 0;
  }
}
