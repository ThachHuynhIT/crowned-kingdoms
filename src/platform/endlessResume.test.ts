/**
 * Endless reload matrix (plan 2026-11-09 Endless Task 5 Step 5): real states of a greedy Endless run (years 30, 31,
 * 35, 40, 41) are written through the real session to a fake IndexedDB, read back by a brand-new session and driven
 * by a brand-new controller with the same next command; the result must equal the uninterrupted run. A blessing
 * offer is never re-rolled and a picked blessing is never applied twice.
 */
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { RULES_ENDLESS } from '../data/rules';
import { simulateBattle } from '../game/battle/step';
import { CONTENT } from '../game/cards/registry';
import { createGameBus } from '../game/events';
import { buildBattleSetup } from '../game/run/battleSetup';
import { applyCommand } from '../game/run/commands';
import { RunController } from '../game/run/RunController';
import type { RunCommand, RunState } from '../game/run/state';
import { greedyBot } from '../game/sim/bots/greedy';
import { runHeadless } from '../game/sim/headless';
import { createSession } from './session';

interface Sample {
  label: string;
  state: RunState;
  next: RunCommand;
}

const WANTED: readonly { label: string; match: (s: RunState, next: RunCommand) => boolean }[] = [
  { label: 'blessing year 30', match: (s) => s.phase === 'blessing' && s.year === 30 },
  {
    label: 'planning year 31',
    match: (s, n) => s.phase === 'planning' && s.year === 31 && n.type === 'play',
  },
  { label: 'blessing year 35', match: (s) => s.phase === 'blessing' && s.year === 35 },
  { label: 'battle entry year 40 (boss)', match: (s) => s.phase === 'battle' && s.year === 40 },
  { label: 'yearEnd year 41', match: (s) => s.phase === 'yearEnd' && s.year === 41 },
];

const collect = (): Sample[] => {
  const found = new Map<string, Sample>();
  runHeadless({
    seed: 1,
    kingId: 'stone',
    rules: RULES_ENDLESS,
    bot: greedyBot,
    stopAfterYears: 42,
    onCommand: (before, cmd) => {
      for (const w of WANTED)
        if (!found.has(w.label) && w.match(before, cmd))
          found.set(w.label, { label: w.label, state: before, next: cmd });
    },
  });
  return [...found.values()];
};

const SAMPLES = collect();
const reload = async (disk: IDBFactory) => createSession(disk, () => undefined, CONTENT);

describe('Endless resume matrix', () => {
  it('found every Endless state to reload in a real run', () => {
    expect(SAMPLES.map((s) => s.label)).toEqual(WANTED.map((w) => w.label));
  });

  for (const { label } of WANTED) {
    it(`${label}: write → new session → same state, same next state`, async () => {
      const sample = SAMPLES.find((s) => s.label === label)!;
      expect(sample.state.mode).toBe('endless');
      const disk = new IDBFactory();
      await (await reload(disk)).persistence.checkpoint(sample.state);
      const second = await reload(disk);
      const loaded = await second.load();
      expect(loaded.kind).toBe('ok');
      if (loaded.kind !== 'ok') return;
      expect(loaded.state).toEqual(sample.state);

      if (sample.state.phase === 'battle') {
        const bus = createGameBus();
        const controller = new RunController(bus, CONTENT, loaded.state, second.persistence);
        const setups: unknown[] = [];
        bus.on('battle:started', ({ setup }) => setups.push(setup));
        controller.kickoff();
        await controller.whenIdle();
        const setup = buildBattleSetup(sample.state, CONTENT);
        expect(setups).toEqual([setup]);
        expect((setup as { geometry?: string }).geometry).toBe('endless');
        expect(controller.runner!.world.tick).toBe(0);
        const direct = simulateBattle(setup, []);
        let result: { won: boolean; ticks: number; kills: number } | null = null;
        bus.on('battle:ended', ({ result: r }) => (result = r));
        for (let i = 0; i < 3000 && result === null; i++) controller.update(1000);
        await controller.whenIdle();
        expect(result).toMatchObject({ won: direct.won, ticks: direct.ticks, kills: direct.kills });
        return;
      }

      const bus = createGameBus();
      const controller = new RunController(bus, CONTENT, loaded.state, second.persistence);
      bus.emit('ui:command', { command: sample.next });
      await controller.whenIdle();
      const expected = applyCommand(sample.state, sample.next, CONTENT);
      if ('error' in expected) throw new Error(expected.error);
      expect(controller.state).toEqual(expected.state);
      const after = await (await reload(disk)).load();
      expect(after).toEqual({ kind: 'ok', state: expected.state });
    }, 120_000);
  }

  it('reloading a blessing offer five times never re-rolls it or grants anything', async () => {
    const sample = SAMPLES.find((s) => s.label === 'blessing year 30')!;
    const disk = new IDBFactory();
    await (await reload(disk)).persistence.checkpoint(sample.state);
    for (let i = 0; i < 5; i++) {
      const loaded = await (await reload(disk)).load();
      expect(loaded).toEqual({ kind: 'ok', state: sample.state });
    }
  }, 60_000);
});
