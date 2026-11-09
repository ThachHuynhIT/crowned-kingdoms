/**
 * Baseline của chế độ thường trước Endless (spec 2026-11-09 §8, plan E1 Task 1 Step 1). Các literal dưới
 * đây ghi trên commit 43ad681 TRƯỚC khi sửa mã Endless; không được ghi lại để test xanh. Nếu dữ liệu cân bằng thay đổi có chủ
 * đích (thuế, mạng, máu Ngai…), ghi lại baseline ở một commit riêng KHÔNG chứa thay đổi Endless.
 *
 * Gameplay projection bỏ đúng các trường schema mới của RunState v7 (`version`, `mode`, `endless`,
 * `rng.blessing`); BattleSetup thì so nguyên bản (normal không có thuộc tính `geometry`).
 */
import { describe, expect, it } from 'vitest';
import { hashSeed } from '../../core/random';
import { RULES_FULL } from '../../data/rules';
import type { KingId } from '../../data/types';
import { CONTENT } from '../cards/registry';
import { runHeadless } from '../sim/headless';
import { buildBattleSetup } from './battleSetup';
import type { RunState } from './state';

const projection = (s: RunState): string => {
  const rest: Record<string, unknown> = { ...s };
  delete rest.version;
  delete rest.mode;
  delete rest.endless;
  const rng: Record<string, unknown> = { ...s.rng };
  delete rng.blessing;
  rest.rng = rng;
  return JSON.stringify(rest);
};

interface Trace {
  commands: number;
  commandHash: number;
  setupHash: number;
  stateHash: number;
}

function trace(seed: number, kingId: KingId): Trace {
  let commandHash = 0;
  let setupHash = 0;
  let stateHash = 0;
  const { commands } = runHeadless({
    seed,
    kingId,
    rules: RULES_FULL,
    onCommand: (_before, cmd, after) => {
      commandHash = hashSeed(`${commandHash}${JSON.stringify(cmd)}`);
      stateHash = hashSeed(`${stateHash}${projection(after)}`);
      if (cmd.type === 'startBattle') {
        setupHash = hashSeed(`${setupHash}${JSON.stringify(buildBattleSetup(after, CONTENT))}`);
      }
    },
  });
  return { commands, commandHash, setupHash, stateHash };
}

const BASELINE: Record<string, Trace> = {
  'wheat:1': { commands: 25, commandHash: 1036865453, setupHash: 1127600529, stateHash: 1392394059 },
  'stone:2': { commands: 166, commandHash: 2824981390, setupHash: 285605194, stateHash: 245140952 },
  'arcane:3': { commands: 87, commandHash: 2699888080, setupHash: 941771780, stateHash: 3674319706 },
};

describe('normal 30-year baseline is unchanged by Endless', () => {
  for (const key of Object.keys(BASELINE)) {
    const [kingId, seed] = key.split(':') as [KingId, string];
    it(`${kingId} seed ${seed}: commands, battle setups and gameplay states match the pre-Endless baseline`, () => {
      expect(trace(Number(seed), kingId)).toEqual(BASELINE[key]);
    });
  }
});
