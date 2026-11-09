/**
 * Điều phối Vô tận đến năm 65 (spec 2026-11-09 §9 E4: test orchestration kiểm boss lặp cả ba). Quyết định
 * do `randomBot`; KẾT QUẢ TRẬN LÀ GIẢ (luôn thắng) — đây không phải bằng chứng một ván thật sống được tới đó.
 */
import { describe, expect, it } from 'vitest';
import { Rng, hashSeed } from '../../core/random';
import { RULES_ENDLESS } from '../../data/rules';
import type { BattleResult } from '../battle/types';
import { CONTENT } from '../cards/registry';
import { applyCommand } from '../run/commands';
import type { RunState } from '../run/state';
import { newRun } from '../run/yearFlow';
import { decodeRun, encodeRun } from '../save/codec';
import { randomBot } from './bots/random';

const won = (state: RunState): BattleResult => ({
  won: true,
  ticks: 400,
  throneHpLostPct: 0,
  kills: 5,
  killsBySource: {},
  interventionsUsed: 0,
  unitsLost: 0,
  capped: 0,
  inputs: [],
  ...(state.army?.boss !== undefined ? { bossDefeated: state.army.boss } : {}),
});

describe('Endless orchestration to year 65 (fake wins)', () => {
  it('passes year 30 without ending, repeats all three bosses, offers a blessing at every milestone and saves cleanly', () => {
    let state = newRun(3, 'wheat', CONTENT, RULES_ENDLESS);
    const rng = new Rng(hashSeed('3:orchestration'));
    let blessingsOffered = 0;
    let guard = 0;
    while (state.year <= 65 && state.phase !== 'ended') {
      guard += 1;
      if (guard > 20_000) throw new Error('orchestration did not progress');
      if (state.phase === 'blessing') blessingsOffered += 1;
      const cmd = randomBot(state, CONTENT, rng);
      const r = applyCommand(state, cmd, CONTENT);
      if ('error' in r) throw new Error(`illegal ${JSON.stringify(cmd)} in ${state.phase}: ${r.error}`);
      state = r.state;
      if (cmd.type === 'startBattle') {
        const res = applyCommand(state, { type: 'battleResult', result: won(state) }, CONTENT);
        if ('error' in res) throw new Error(res.error);
        state = res.state;
      }
    }
    expect(state.phase).not.toBe('ended');
    expect(state.year).toBe(66);
    expect(state.won).toBeNull();
    // Bosses at 10/20/30 and again at 40/50/60.
    expect(state.stats.bossesWon).toBe(6);
    expect([...state.stats.bossesDefeated].sort()).toEqual(['boss_bog_ogre', 'boss_crownless_king', 'boss_hornet_queen']);
    // Milestones 30, 35, …, 65.
    expect(blessingsOffered).toBe(8);
    expect(state.endless!.lastBlessingYear).toBe(65);
    const stacks = Object.values(state.endless!.blessingStacks).reduce((a, b) => a + b, 0);
    expect(stacks).toBeLessThanOrEqual(8);
    for (const e of Object.values(state.enemies)) expect(e!.attacks).toBeLessThanOrEqual(3);
    const decoded = decodeRun(encodeRun(state, CONTENT), CONTENT);
    expect(decoded.kind).toBe('ok');
    if (decoded.kind === 'ok') expect(decoded.state).toEqual(state);
  });
});
