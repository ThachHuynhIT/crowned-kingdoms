import { ESLint } from 'eslint';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MUSIC_BUS_GAIN } from '../data/music';
import { MASTER_OUTPUT } from '../data/settings';
import {
  MASTER_COMPRESSOR,
  MASTER_LOWPASS_HZ,
  REVERB,
  SFX_BATTLE_MAX_VOICES,
  SFX_IDS,
  SFX_MAX_VOICES,
  SFX_MIN_INTERVAL_MS,
} from '../data/sfx';
import { AudioManager } from './AudioManager';
import { compressorMakeupTrim } from './mix';
import { asContext, FakeAudioContext, FakeBufferSource, type FakeGain } from './testing/fakeAudio';

const setup = (configure?: (ctx: FakeAudioContext) => void) => {
  const contexts: FakeAudioContext[] = [];
  const manager = new AudioManager(() => {
    const ctx = new FakeAudioContext();
    configure?.(ctx);
    contexts.push(ctx);
    return asContext(ctx);
  });
  return { manager, contexts };
};

/** Effect voices: buffer sources feeding a per-voice gain on the sfx bus (gains[2]). */
const sfxSources = (ctx: FakeAudioContext): FakeBufferSource[] =>
  ctx.started.filter(
    (s) => s instanceof FakeBufferSource && (s.connections[0] as FakeGain | undefined)?.connections.includes(ctx.gains[2]),
  ) as FakeBufferSource[];

/** Seconds between two plays of one id that both pass the minimum interval. */
const GAP = SFX_MIN_INTERVAL_MS / 1000;

describe('AudioManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates no context before unlock and ignores sounds played before it', async () => {
    const { manager, contexts } = setup();
    manager.play('ui_click');
    manager.setMusic('planning');
    expect(contexts.length).toBe(0);
    await manager.unlock();
    expect(contexts.length).toBe(1);
    // The click before unlock is not replayed; only the planning loop starts.
    expect(sfxSources(contexts[0]!).length).toBe(0);
    expect(contexts[0]!.started.length).toBeGreaterThan(0);
    await manager.destroy();
  });

  it('concurrent unlocks make one context and one buffer set', async () => {
    const { manager, contexts } = setup((c) => (c.state = 'suspended'));
    await Promise.all([manager.unlock(), manager.unlock(), manager.unlock()]);
    await manager.unlock();
    expect(contexts.length).toBe(1);
    // One buffer per effect plus the stereo reverb impulse.
    expect(contexts[0]!.buffers.length).toBe(SFX_IDS.length + 1);
    expect(contexts[0]!.state).toBe('running');
    await manager.destroy();
  });

  it('master 50 × sfx 20 gives an effective sfx gain of 0.1 × MASTER_OUTPUT (the whole mix at a 24th, owner 10/11/2026)', async () => {
    const { manager, contexts } = setup();
    manager.setVolumes({ master: 50, music: 100, sfx: 20, screenShake: true });
    await manager.unlock();
    const [master, music, sfx] = contexts[0]!.gains as FakeGain[];
    expect(master!.gain.value * sfx!.gain.value).toBeCloseTo(0.1 * MASTER_OUTPUT);
    expect(MASTER_OUTPUT).toBeCloseTo(0.25 / 6);
    // Music sits under the effects.
    expect(music!.gain.value).toBeCloseTo(MUSIC_BUS_GAIN);
    expect(MUSIC_BUS_GAIN).toBeLessThan(1);
    await manager.destroy();
  });

  it('routes both buses through a low-pass, a compressor and a makeup trim into the master, with a reverb send', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    const ctx = contexts[0]!;
    const [master, music, sfx] = ctx.gains as FakeGain[];
    expect(ctx.filters.length).toBe(1);
    expect(ctx.compressors.length).toBe(1);
    expect(ctx.convolvers.length).toBe(1);
    const lowpass = ctx.filters[0]!;
    const compressor = ctx.compressors[0]!;
    const convolver = ctx.convolvers[0]!;
    expect(lowpass.type).toBe('lowpass');
    expect(lowpass.frequency.value).toBe(MASTER_LOWPASS_HZ);
    expect(compressor.threshold.value).toBe(MASTER_COMPRESSOR.threshold);
    expect(compressor.knee.value).toBe(MASTER_COMPRESSOR.knee);
    expect(compressor.ratio.value).toBe(MASTER_COMPRESSOR.ratio);
    expect(music!.connections).toContain(lowpass);
    expect(sfx!.connections).toContain(lowpass);
    expect(lowpass.connections).toEqual([compressor]);
    const trim = compressor.connections[0] as FakeGain;
    expect(trim.gain.value).toBeCloseTo(compressorMakeupTrim());
    expect(trim.connections).toEqual([master]);
    expect(master!.connections).toEqual([ctx.destination]);
    const sends = ctx.gains.filter((g) => g.connections.includes(convolver));
    expect(sends.map((g) => g.gain.value).sort()).toEqual([REVERB.sfxSend, REVERB.musicSend].sort());
    expect(convolver.buffer?.numberOfChannels).toBe(2);
    const wet = convolver.connections[0] as FakeGain;
    expect(wet.gain.value).toBe(REVERB.wet);
    expect(wet.connections).toEqual([lowpass]);
    await manager.destroy();
    expect(lowpass.disconnected && compressor.disconnected && convolver.disconnected).toBe(true);
  });

  it('muted sfx creates no voice', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    manager.setVolumes({ master: 100, music: 100, sfx: 0, screenShake: true });
    manager.play('coin');
    manager.setVolumes({ master: 0, music: 100, sfx: 100, screenShake: true });
    manager.play('coin');
    expect(contexts[0]!.started.length).toBe(0);
    await manager.destroy();
  });

  it('drops a voice of one id past the cap; an ended voice frees its slot', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    const ctx = contexts[0]!;
    for (let i = 0; i <= SFX_MAX_VOICES; i++) {
      manager.play('hit_light');
      ctx.currentTime += GAP;
    }
    expect(ctx.started.length).toBe(SFX_MAX_VOICES);
    manager.play('arrow');
    expect(ctx.started.length).toBe(SFX_MAX_VOICES + 1);
    ctx.started[0]!.finish();
    manager.play('hit_light');
    expect(ctx.started.length).toBe(SFX_MAX_VOICES + 2);
    await manager.destroy();
  });

  it('drops a repeat of one id inside the minimum interval', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    const ctx = contexts[0]!;
    manager.play('hit_light');
    manager.play('hit_light');
    ctx.currentTime += GAP / 2;
    manager.play('hit_light');
    expect(sfxSources(ctx).length).toBe(1);
    ctx.currentTime += GAP / 2;
    manager.play('hit_light');
    expect(sfxSources(ctx).length).toBe(2);
    await manager.destroy();
  });

  it('a busy battle never plays more than the battle voice cap at once; UI sounds still play', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    const ctx = contexts[0]!;
    const battle = ['hit_light', 'hit_heavy', 'arrow', 'cannon', 'fire', 'magic', 'death_pop', 'throne_hit'] as const;
    for (let frame = 0; frame < 10; frame++) {
      for (const id of battle) manager.play(id);
      ctx.currentTime += GAP;
    }
    expect(sfxSources(ctx).length).toBe(SFX_BATTLE_MAX_VOICES);
    manager.play('ui_click');
    expect(sfxSources(ctx).length).toBe(SFX_BATTLE_MAX_VOICES + 1);
    await manager.destroy();
  });

  it('repeated hits get slightly different pitch and level; a coin stays in tune', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    const ctx = contexts[0]!;
    for (let i = 0; i < 3; i++) {
      manager.play('hit_light');
      manager.play('coin');
      ctx.currentTime += GAP;
      for (const s of ctx.started) s.finish();
    }
    const voices = sfxSources(ctx);
    const hits = voices.filter((_, i) => i % 2 === 0);
    const coins = voices.filter((_, i) => i % 2 === 1);
    expect(new Set(hits.map((s) => s.playbackRate.value)).size).toBe(3);
    expect(new Set(hits.map((s) => (s.connections[0] as FakeGain).gain.value)).size).toBe(3);
    for (const s of coins) expect(s.playbackRate.value).toBe(1);
    await manager.destroy();
  });

  it('crossfades music over 600 ms and keeps one scheduler', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    manager.setMusic('planning');
    manager.setMusic('planning');
    expect(vi.getTimerCount()).toBe(1);
    manager.setMusic('battle');
    const ctx = contexts[0]!;
    const layers = ctx.gains.filter((g) => g.connections.includes(ctx.gains[1]!));
    expect(layers.length).toBe(2);
    expect(layers[0]!.gain.events.at(-1)).toMatchObject({ kind: 'ramp', value: 0, time: 0.6 });
    expect(layers[1]!.gain.events.at(-1)).toMatchObject({ kind: 'ramp', value: 1, time: 0.6 });
    // Old scheduler + fade timer + new scheduler.
    expect(vi.getTimerCount()).toBe(3);
    vi.advanceTimersByTime(600);
    expect(vi.getTimerCount()).toBe(1);
    expect(layers[0]!.disconnected).toBe(true);
    manager.setMusic(null);
    vi.advanceTimersByTime(600);
    expect(vi.getTimerCount()).toBe(0);
    await manager.destroy();
  });

  it('suspend/resume never doubles the scheduler; destroy leaves nothing behind', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    manager.setMusic('battle');
    for (let i = 0; i < 3; i++) {
      await manager.suspend();
      expect(vi.getTimerCount()).toBe(0);
      manager.play('ui_click');
      await manager.unlock();
      expect(vi.getTimerCount()).toBe(1);
    }
    const ctx = contexts[0]!;
    expect(ctx.suspendCalls).toBe(3);
    expect(ctx.resumeCalls).toBe(3);
    manager.play('ui_click');
    await manager.destroy();
    expect(vi.getTimerCount()).toBe(0);
    expect(ctx.closeCalls).toBe(1);
    expect(ctx.started.every((s) => s.disconnected)).toBe(true);
    await manager.unlock();
    manager.play('ui_click');
    expect(contexts.length).toBe(1);
  });

  it('a rejected resume does not throw and is retried by the next unlock', async () => {
    const { manager, contexts } = setup((c) => {
      c.state = 'suspended';
      c.failNextResume = new Error('not allowed');
    });
    manager.setMusic('planning');
    await expect(manager.unlock()).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
    await manager.unlock();
    expect(contexts[0]!.resumeCalls).toBe(2);
    expect(vi.getTimerCount()).toBe(1);
    await manager.destroy();
  });
});

describe('src/audio layering (ESLint)', () => {
  const lint = async (code: string): Promise<string[]> => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText(code, { filePath: 'src/audio/__probe.ts' });
    return result!.messages.map((m) => m.ruleId ?? m.message);
  };

  it('allows a type-only import of GameEvents', async () => {
    const msgs = await lint("import type { GameEvents } from '../game/events';\nexport type E = GameEvents;\n");
    expect(msgs).toEqual([]);
  }, 30_000);

  it('rejects a runtime import from src/game', async () => {
    expect(await lint("import { createGameBus } from '../game/events';\nexport const b = createGameBus;\n")).toContain(
      '@typescript-eslint/no-restricted-imports',
    );
    expect(await lint("import { newRun } from '../game/run/yearFlow';\nexport const r = newRun;\n")).toContain(
      '@typescript-eslint/no-restricted-imports',
    );
    expect(await lint("import type { RunState } from '../game/run/state';\nexport type S = RunState;\n")).toContain(
      '@typescript-eslint/no-restricted-imports',
    );
  }, 30_000);

  it('rejects Phaser and presentation/platform imports', async () => {
    for (const path of ['phaser', '../ui/theme', '../scenes/keys', '../render/uiKit', '../platform/session']) {
      expect(await lint(`import * as m from '${path}';\nexport const x = m;\n`)).toContain(
        '@typescript-eslint/no-restricted-imports',
      );
    }
  }, 30_000);
});
