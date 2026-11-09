import { ESLint } from 'eslint';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MASTER_OUTPUT } from '../data/settings';
import { SFX_IDS } from '../data/sfx';
import { AudioManager } from './AudioManager';
import { asContext, FakeAudioContext, type FakeBufferSource, type FakeGain } from './testing/fakeAudio';

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

const sfxSources = (ctx: FakeAudioContext): FakeBufferSource[] =>
  ctx.started.filter((s) => (s as FakeBufferSource).buffer?.length !== undefined && s.connections.includes(ctx.gains[2])) as FakeBufferSource[];

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
    expect(contexts[0]!.buffers.length).toBe(SFX_IDS.length);
    expect(contexts[0]!.state).toBe('running');
    await manager.destroy();
  });

  it('master 50 × sfx 20 gives an effective sfx gain of 0.1 × MASTER_OUTPUT (the whole mix is halved)', async () => {
    const { manager, contexts } = setup();
    manager.setVolumes({ master: 50, music: 100, sfx: 20, screenShake: true });
    await manager.unlock();
    const [master, , sfx] = contexts[0]!.gains as FakeGain[];
    expect(master!.gain.value * sfx!.gain.value).toBeCloseTo(0.1 * MASTER_OUTPUT);
    expect(MASTER_OUTPUT).toBe(0.5);
    await manager.destroy();
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

  it('drops the fifth voice of one id; an ended voice frees its slot', async () => {
    const { manager, contexts } = setup();
    await manager.unlock();
    const ctx = contexts[0]!;
    for (let i = 0; i < 5; i++) manager.play('hit_light');
    expect(ctx.started.length).toBe(4);
    manager.play('arrow');
    expect(ctx.started.length).toBe(5);
    ctx.started[0]!.finish();
    manager.play('hit_light');
    expect(ctx.started.length).toBe(6);
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
