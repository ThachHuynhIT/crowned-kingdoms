import { describe, expect, it } from 'vitest';
import { Rng } from '../../../core/random';
import { RULES_FULL } from '../../../data/rules';
import type { CardId, KingId } from '../../../data/types';
import { simulateBattle } from '../../battle/step';
import { CONTENT } from '../../cards/registry';
import { buildBattleSetup } from '../../run/battleSetup';
import { applyCommand } from '../../run/commands';
import type { RunCommand, RunState } from '../../run/state';
import { THRONE_PLOT } from '../../run/board';
import { newRun } from '../../run/yearFlow';
import { runState, withBuilding } from '../../testing/fixtures';
import { runHeadless } from '../headless';
import { scriptedBot } from './scripted';

interface Trace {
  state: RunState;
  commands: RunCommand[];
  /** Years in which a battle was fought, in order. */
  fought: number[];
}

/** Plays a whole run with the scripted bot; every intent goes through applyCommand and is checked. */
const play = (seed: number, kingId: KingId): Trace => {
  const rng = new Rng(seed);
  let state = newRun(seed, kingId, CONTENT, RULES_FULL);
  const commands: RunCommand[] = [];
  const fought: number[] = [];
  const apply = (cmd: RunCommand): void => {
    const before = JSON.stringify(state);
    const r = applyCommand(state, cmd, CONTENT);
    if ('error' in r) throw new Error(`illegal ${JSON.stringify(cmd)} in ${state.phase} year ${state.year}: ${r.error}`);
    expect(JSON.stringify(state), 'applyCommand must not change its input').toBe(before);
    state = r.state;
    commands.push(cmd);
  };
  while (state.phase !== 'ended') {
    if (commands.length > 5000) throw new Error('scripted run did not finish');
    const snapshot = JSON.stringify(state);
    const cmd = scriptedBot(state, CONTENT, rng);
    expect(JSON.stringify(state), 'the bot must not change the state it reads').toBe(snapshot);
    apply(cmd);
    if (cmd.type === 'startBattle') {
      fought.push(state.year);
      apply({ type: 'battleResult', result: simulateBattle(buildBattleSetup(state, CONTENT), []) });
    }
  }
  return { state, commands, fought };
};

describe('scripted_legal_commands', () => {
  it('every command of a stone run is legal and leaves its input untouched', () => {
    const { state, commands } = play(1, 'stone');
    expect(state.phase).toBe('ended');
    expect(commands.length).toBeGreaterThan(10);
  }, 120_000);

  it('the same seed gives the same command trace and the same end state', () => {
    const a = play(2, 'wheat');
    const b = play(2, 'wheat');
    expect(JSON.stringify(a.commands)).toBe(JSON.stringify(b.commands));
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
  }, 120_000);

  it('turns Tự bắn on once, never rerolls and never buys a plot', () => {
    const { commands } = play(1, 'stone');
    expect(commands.filter((c) => c.type === 'setAutoFire')).toHaveLength(1);
    expect(commands.some((c) => c.type === 'reroll' || c.type === 'unlockPlot')).toBe(false);
  }, 120_000);
});

describe('scripted bot on stone, seed 1 (diagnostic for the year-10 boss)', () => {
  it('reports how far the run got and whether boss 1 was fought', () => {
    const { state, fought } = play(1, 'stone');
    const reachedBoss1 = fought.includes(10);
    // Reported in the PR; not a gate: an early legal defeat is a valid outcome.
    console.info(
      `scripted stone seed 1: year ${state.year}, won ${String(state.won)}, boss 1 fought: ${String(reachedBoss1)}, bosses defeated: ${state.stats.bossesDefeated.length}`,
    );
    expect(state.year).toBeGreaterThanOrEqual(1);
    expect(state.year).toBeLessThanOrEqual(30);
  }, 120_000);
});

describe('scripted bot and run-state refusals (G4 meta cards)', () => {
  const META_CARDS = ['neutral_royal_seal', 'moon_eclipse_pact'] as CardId[];

  /** Throne level 5 (Royal Seal → maxLevel) and one life (Eclipse Pact → lastLife), both in hand. */
  const refusedHand = (): RunState => {
    const base = withBuilding(runState({ lives: 1 }), 6, 'wheat_militia', 1);
    return {
      ...base,
      throneLevel: 5,
      plots: base.plots.map((p, i) => (i === THRONE_PLOT ? { ...p, building: { ...p.building!, level: 5 } } : p)),
      unlockedCards: ['neutral_royal_seal' as CardId],
      deck: [...base.deck, ...META_CARDS],
      hand: [...META_CARDS],
    };
  };

  it('never plays a card that the run state refuses: every command it returns is accepted', () => {
    let state = refusedHand();
    const rng = new Rng(1);
    for (let step = 0; step < 8 && state.phase === 'planning'; step++) {
      const cmd = scriptedBot(state, CONTENT, rng);
      if (cmd.type === 'play') expect(META_CARDS).not.toContain(state.hand[cmd.handIndex]);
      const r = applyCommand(state, cmd, CONTENT);
      if ('error' in r) throw new Error(`illegal ${JSON.stringify(cmd)}: ${r.error}`);
      state = r.state;
    }
  });

  it('a headless run with both meta cards unlocked completes', () => {
    const out = runHeadless({
      seed: 3,
      kingId: 'wheat',
      rules: RULES_FULL,
      bot: scriptedBot,
      unlockedCards: ['neutral_duplicate', 'neutral_royal_seal'] as CardId[],
    });
    expect(out.state.phase).toBe('ended');
    expect(out.state.unlockedCards).toEqual(['neutral_duplicate', 'neutral_royal_seal']);
  }, 120_000);
});
