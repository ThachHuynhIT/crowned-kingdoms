/**
 * Baseline của chế độ thường trước Endless (spec 2026-11-09 §8, plan E1 Task 1 Step 1). Các literal dưới
 * đây ghi lần đầu trên commit 43ad681 TRƯỚC khi sửa mã Endless, rồi ghi lại trên commit 3652e5a (cân bằng G5 `75a1448`:
 * 2 mạng, máu Ngai mới; vẫn KHÔNG có mã Endless) khi gộp `endless-e1` vào G5; không được ghi lại để test xanh. Nếu dữ liệu cân bằng thay đổi có chủ
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
  'wheat:1': { commands: 19, commandHash: 2603584545, setupHash: 2357124241, stateHash: 2665322096 },
  'stone:2': { commands: 145, commandHash: 2257098007, setupHash: 4071353414, stateHash: 1525268769 },
  'arcane:3': { commands: 94, commandHash: 1263202381, setupHash: 559040931, stateHash: 1660468774 },
};

describe('normal 30-year baseline is unchanged by Endless', () => {
  for (const key of Object.keys(BASELINE)) {
    const [kingId, seed] = key.split(':') as [KingId, string];
    it(`${kingId} seed ${seed}: commands, battle setups and gameplay states match the pre-Endless baseline`, () => {
      expect(trace(Number(seed), kingId)).toEqual(BASELINE[key]);
    });
  }
});
