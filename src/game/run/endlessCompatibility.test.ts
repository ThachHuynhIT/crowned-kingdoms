/**
 * Baseline của chế độ thường trước Endless (spec 2026-11-09 §8, plan E1 Task 1 Step 1). Các literal dưới
 * đây ghi lần đầu trên commit 43ad681 TRƯỚC khi sửa mã Endless, rồi ghi lại trên commit 3652e5a (cân bằng G5 `75a1448`:
 * 2 mạng, máu Ngai mới; vẫn KHÔNG có mã Endless) khi gộp `endless-e1` vào G5, rồi ghi lại khi đổi luật trận (2026-11-09, nhánh `battle-field-rework`: địch phá hết công trình rồi mới tới Ngai, rồi tầm tháp ×3, rồi công trình chặn đường + đội hình + giới hạn đi xa, rồi cổng xa 1,5 lần, rồi cân bằng lại `docs/balance/2026-11-09-battle-rework-balance.md`; vẫn KHÔNG có mã Endless), rồi ghi lại khi đổi luật lượt và độ dài trận (2026-11-10, spec `2026-11-10-hand-and-battle-length-design.md`: tay 5 lá, chơi/bán nhiều lá rồi Ra trận khi tay ≤ 2, hết giờ là thua ở tick 3000, Cuồng Nộ cộng dồn; bot chơi nhiều lá; vẫn KHÔNG có mã Endless), rồi ghi lại khi đổi luật rút bài (2026-11-10, spec `2026-11-10-draw-one-and-shop-design.md` §3: năm 1 rút 5 lá, từ năm 2 giữ bài và rút thêm 1 lá (2 lá ở năm hội đồng và năm sau boss), không còn đổi tay hết lá chơi được, Đổi bài rút lại đúng số lá đang cầm, trận tự bắt đầu khi tay ≤ 2 (0 ở năm 30), cùng Mua thẻ; số đo bằng `trace()` dưới đây, vẫn KHÔNG có mã Endless), rồi re-recorded 2026-11-10 for the draw-one balance retune (ENEMY_STAT_MULT 1,75, BOSS_HP_MULT/BOSS_DMG_MULT, Cuồng Nộ 600 tick × 20%, khiên Vua Không Ngai 1200, máu Ngai mới; số đo bằng `trace()`, vẫn KHÔNG có mã Endless), rồi ghi lại lần nữa sáng 10/11/2026 (đàn ong mỗi 100 tick, boss đáp 70 tick, ENEMY_STAT_MULT 2,05, BOSS_HP_MULT [1; 0,55; 0,27], hệ số địch theo vua FOE_MULT_BY_KING; số đo bằng `trace()`, vẫn KHÔNG có mã Endless), rồi ghi lại tối 10/11/2026 (Can Thiệp riêng từng vua `setup.power`, `KING_TUNING` thay `FOE_MULT_BY_KING`, boss −10%; số đo bằng `trace()`, vẫn KHÔNG có mã Endless); không được ghi lại để test xanh. Nếu dữ liệu cân bằng thay đổi có chủ
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
  'wheat:1': { commands: 23, commandHash: 2153002306, setupHash: 846608704, stateHash: 1786037065 },
  'stone:2': { commands: 9, commandHash: 1424272521, setupHash: 4173331860, stateHash: 212073804 },
  'arcane:3': { commands: 24, commandHash: 4011728065, setupHash: 2294368709, stateHash: 2136648973 },
};

describe('normal 30-year baseline is unchanged by Endless', () => {
  for (const key of Object.keys(BASELINE)) {
    const [kingId, seed] = key.split(':') as [KingId, string];
    it(`${kingId} seed ${seed}: commands, battle setups and gameplay states match the pre-Endless baseline`, () => {
      expect(trace(Number(seed), kingId)).toEqual(BASELINE[key]);
    });
  }
});
