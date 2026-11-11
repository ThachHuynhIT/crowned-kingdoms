/**
 * Quản lý WebAudio (spec G5 §3): context chỉ được tạo khi `unlock()` (sau cử chỉ đầu tiên), buffer hiệu
 * ứng sinh một lần cho mỗi context, gain master × music/sfx và crossfade nhạc 600 ms. Không phụ thuộc Phaser;
 * scene làm adapter.
 *
 * Graph (owner 10/11/2026: quieter, softer): music bus + sfx bus (+ a shared reverb send) → low-pass → soft-knee
 * compressor → makeup trim → master (volume × MASTER_OUTPUT) → destination. Each effect voice gets a slight
 * counter-based pitch/level variation; `VoiceGate` caps voices per id and per battle and spaces repeats of one id.
 */
import { MUSIC_BUS_GAIN, MUSIC_CROSSFADE_MS, type MusicId } from '../data/music';
import type { AudioSettings } from '../data/settings';
import { DEFAULT_SCREEN_SHAKE, MASTER_OUTPUT, VOLUME_MAX } from '../data/settings';
import {
  MASTER_COMPRESSOR,
  MASTER_LOWPASS_HZ,
  MASTER_LOWPASS_Q,
  REVERB,
  SFX,
  SFX_IDS,
  type SfxId,
} from '../data/sfx';
import { DEFAULT_VOLUME } from '../data/meta';
import { type LoopHandle, type LoopTimers, scheduleLoop } from './music';
import { compressorMakeupTrim, reverbImpulse } from './mix';
import { synthesizeSfx } from './sfx';
import { playVariation, VoiceGate } from './voices';

export type AudioContextFactory = () => AudioContext;

export interface AudioManagerOptions {
  /** Timers for the music scheduler and fade clean-up (tests inject fakes). */
  timers?: LoopTimers & {
    setTimeout(fn: () => void, ms: number): unknown;
    clearTimeout(handle: unknown): void;
  };
}

interface MusicLayer {
  track: MusicId;
  gain: GainNode;
  loop: LoopHandle;
}

const defaultTimers = {
  setInterval: (fn: () => void, ms: number) => globalThis.setInterval(fn, ms),
  clearInterval: (h: unknown) => globalThis.clearInterval(h as ReturnType<typeof setInterval>),
  setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
  clearTimeout: (h: unknown) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>),
};

export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private buffers = new Map<SfxId, AudioBuffer>();
  private voices = new Map<SfxId, Set<AudioBufferSourceNode>>();
  private readonly gate = new VoiceGate();
  /** Every node of the master chain, disconnected on destroy. */
  private chain: AudioNode[] = [];
  private unlocking: Promise<void> | null = null;
  private settings: Pick<AudioSettings, 'master' | 'music' | 'sfx' | 'screenShake'> = {
    master: DEFAULT_VOLUME,
    music: DEFAULT_VOLUME,
    sfx: DEFAULT_VOLUME,
    screenShake: DEFAULT_SCREEN_SHAKE,
  };
  private desiredTrack: MusicId | null = null;
  private current: MusicLayer | null = null;
  private fading = new Set<{ layer: MusicLayer; timer: unknown }>();
  private suspended = false;
  private destroyed = false;
  private readonly timers: NonNullable<AudioManagerOptions['timers']>;

  constructor(
    private readonly createContext: AudioContextFactory,
    options: AudioManagerOptions = {},
  ) {
    this.timers = options.timers ?? defaultTimers;
  }

  /** True once a context exists (after the first gesture). */
  get unlocked(): boolean {
    return this.context !== null;
  }

  /**
   * Creates the context on first call (from a pointerdown/click), builds the effect buffers once and resumes a
   * suspended context. Never rejects: a failed resume is retried on the next call.
   */
  unlock(): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    if (this.unlocking) return this.unlocking;
    this.unlocking = this.doUnlock().finally(() => {
      this.unlocking = null;
    });
    return this.unlocking;
  }

  private async doUnlock(): Promise<void> {
    if (!this.context) {
      const ctx = this.createContext();
      this.context = ctx;
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
      this.musicBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.buildChain(ctx, this.master, this.musicBus, this.sfxBus);
      for (const id of SFX_IDS) {
        const pcm = synthesizeSfx(SFX[id], ctx.sampleRate);
        const buffer = ctx.createBuffer(1, pcm.length, ctx.sampleRate);
        buffer.getChannelData(0).set(pcm);
        this.buffers.set(id, buffer);
      }
      this.applyVolumes();
    }
    this.suspended = false;
    const ctx = this.context;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Autoplay policy or a backgrounded tab: the next gesture retries.
        return;
      }
    }
    if (this.destroyed || this.suspended) return;
    if (this.desiredTrack && !this.current) this.startTrack(this.desiredTrack, false);
  }

  play(id: SfxId): void {
    const ctx = this.context;
    if (!ctx || !this.sfxBus || this.suspended || this.destroyed) return;
    if (this.settings.master <= 0 || this.settings.sfx <= 0) return;
    let active = this.voices.get(id);
    if (!active) {
      active = new Set();
      this.voices.set(id, active);
    }
    const now = ctx.currentTime;
    if (!this.gate.canStart(id, now)) return;
    const variation = playVariation(id, this.gate.start(id, now));
    const source = ctx.createBufferSource();
    source.buffer = this.buffers.get(id)!;
    source.playbackRate.value = variation.rate;
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = variation.gain;
    source.connect(voiceGain);
    voiceGain.connect(this.sfxBus);
    const slots = active;
    slots.add(source);
    source.onended = () => {
      slots.delete(source);
      this.gate.end(id);
      source.disconnect();
      voiceGain.disconnect();
    };
    source.start();
  }

  setMusic(track: MusicId | null): void {
    if (this.destroyed) return;
    this.desiredTrack = track;
    if (!this.context || this.suspended) return;
    if (this.current?.track === track) return;
    this.fadeOutCurrent();
    if (track) this.startTrack(track, true);
  }

  setVolumes(settings: Pick<AudioSettings, 'master' | 'music' | 'sfx' | 'screenShake'>): void {
    this.settings = { ...settings };
    this.applyVolumes();
  }

  /** Background: stops the music scheduler and suspends the context. `unlock()` resumes. */
  async suspend(): Promise<void> {
    if (!this.context || this.destroyed) return;
    this.suspended = true;
    this.stopAllMusic();
    try {
      await this.context.suspend();
    } catch {
      // Ignore: the context may already be closed.
    }
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopAllMusic();
    for (const slots of this.voices.values()) {
      for (const source of slots) {
        source.onended = null;
        try {
          source.stop();
        } catch {
          // Already stopped.
        }
        source.disconnect();
      }
      slots.clear();
    }
    this.voices.clear();
    this.gate.clear();
    this.buffers.clear();
    for (const node of this.chain) node.disconnect();
    this.chain = [];
    const ctx = this.context;
    this.context = null;
    this.master = this.musicBus = this.sfxBus = null;
    if (ctx) {
      try {
        await ctx.close();
      } catch {
        // Ignore.
      }
    }
  }

  private applyVolumes(): void {
    if (!this.master || !this.musicBus || !this.sfxBus) return;
    this.master.gain.value = (this.settings.master / VOLUME_MAX) * MASTER_OUTPUT;
    this.musicBus.gain.value = (this.settings.music / VOLUME_MAX) * MUSIC_BUS_GAIN;
    this.sfxBus.gain.value = this.settings.sfx / VOLUME_MAX;
  }

  /** Buses → low-pass → compressor → makeup trim → master, plus the shared reverb send into the low-pass. */
  private buildChain(ctx: AudioContext, master: GainNode, musicBus: GainNode, sfxBus: GainNode): void {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = MASTER_LOWPASS_HZ;
    lowpass.Q.value = MASTER_LOWPASS_Q;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = MASTER_COMPRESSOR.threshold;
    compressor.knee.value = MASTER_COMPRESSOR.knee;
    compressor.ratio.value = MASTER_COMPRESSOR.ratio;
    compressor.attack.value = MASTER_COMPRESSOR.attack;
    compressor.release.value = MASTER_COMPRESSOR.release;
    const trim = ctx.createGain();
    trim.gain.value = compressorMakeupTrim();
    musicBus.connect(lowpass);
    sfxBus.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(trim);
    trim.connect(master);

    const [left, right] = reverbImpulse(
      ctx.sampleRate,
      REVERB.seconds,
      REVERB.decay,
      REVERB.preDelay,
      REVERB.damping,
      REVERB.seed,
    );
    const impulse = ctx.createBuffer(2, left.length, ctx.sampleRate);
    impulse.getChannelData(0).set(left);
    impulse.getChannelData(1).set(right);
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    const sfxSend = ctx.createGain();
    sfxSend.gain.value = REVERB.sfxSend;
    const musicSend = ctx.createGain();
    musicSend.gain.value = REVERB.musicSend;
    const wet = ctx.createGain();
    wet.gain.value = REVERB.wet;
    sfxBus.connect(sfxSend);
    musicBus.connect(musicSend);
    sfxSend.connect(convolver);
    musicSend.connect(convolver);
    convolver.connect(wet);
    wet.connect(lowpass);
    this.chain = [musicBus, sfxBus, lowpass, compressor, trim, master, convolver, sfxSend, musicSend, wet];
  }

  private startTrack(track: MusicId, fadeIn: boolean): void {
    const ctx = this.context!;
    const gain = ctx.createGain();
    gain.connect(this.musicBus!);
    const now = ctx.currentTime;
    if (fadeIn) {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + MUSIC_CROSSFADE_MS / 1000);
    } else gain.gain.setValueAtTime(1, now);
    const loop = scheduleLoop(ctx, track, gain, now, this.timers);
    this.current = { track, gain, loop };
  }

  private fadeOutCurrent(): void {
    const layer = this.current;
    if (!layer) return;
    this.current = null;
    const ctx = this.context!;
    const now = ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(now);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
    layer.gain.gain.linearRampToValueAtTime(0, now + MUSIC_CROSSFADE_MS / 1000);
    const entry = { layer, timer: null as unknown };
    entry.timer = this.timers.setTimeout(() => {
      this.fading.delete(entry);
      layer.loop.stop();
      layer.gain.disconnect();
    }, MUSIC_CROSSFADE_MS);
    this.fading.add(entry);
  }

  private stopAllMusic(): void {
    for (const entry of this.fading) {
      this.timers.clearTimeout(entry.timer);
      entry.layer.loop.stop();
      entry.layer.gain.disconnect();
    }
    this.fading.clear();
    if (this.current) {
      this.current.loop.stop();
      this.current.gain.disconnect();
      this.current = null;
    }
  }
}
