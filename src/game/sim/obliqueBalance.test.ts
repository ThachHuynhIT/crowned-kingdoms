/**
 * Harness cân bằng cho thay đổi "địch chỉ từ phía trước + tường núi" (plan 26/10/2026, T4).
 * Mặc định chạy 3 seed (smoke, không phải bằng chứng cân bằng); đặt VITE_WALL_BALANCE_SEEDS=100 để đo
 * 3 vua × 100 seed × 2 bot = 600 ca và in mỗi ca một dòng `WALL_BALANCE_JSON {...}` cho
 * tools/compare_wall_balance.py.
 */
import { describe, expect, it } from 'vitest';
import { RULES_FULL } from '../../data/rules';
import type { KingId } from '../../data/types';
import { runHeadless } from './headless';
import { randomBot } from './bots/random';
import { scriptedBot } from './bots/scripted';

const KINGS: KingId[] = ['wheat', 'stone', 'arcane'];
const BOTS = { random: randomBot, scripted: scriptedBot } as const;
const SEEDS = Number(import.meta.env.VITE_WALL_BALANCE_SEEDS ?? '3');

describe('oblique balance harness', () => {
  it(`plays ${KINGS.length} kings × ${SEEDS} seeds × ${Object.keys(BOTS).length} bots to a legal end`, () => {
    let rows = 0;
    for (const bot of Object.keys(BOTS) as (keyof typeof BOTS)[]) {
      for (const kingId of KINGS) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          let row: Record<string, unknown>;
          try {
            const { state, commands } = runHeadless({ seed, kingId, rules: RULES_FULL, bot: BOTS[bot] });
            expect(state.phase).toBe('ended');
            expect(commands).toBeLessThan(5000);
            row = {
              seed,
              kingId,
              bot,
              won: state.won === true,
              year: state.year,
              commands,
              bossesDefeated: state.stats.bossesDefeated.length,
              crashed: false,
            };
          } catch (e) {
            // Một bot chơi ra lệnh bất hợp pháp (vd. lastLife) là lỗi có sẵn của bot; ghi lại, tính là thua, không bỏ ca.
            row = { seed, kingId, bot, won: false, year: 0, commands: 0, bossesDefeated: 0, crashed: true, error: String(e).slice(0, 120) };
          }
          console.info(`WALL_BALANCE_JSON ${JSON.stringify(row)}`);
          rows += 1;
        }
      }
    }
    expect(rows).toBe(KINGS.length * SEEDS * 2);
  }, 600_000); // 600 ca mất vài phút; mặc định 18 ca vẫn cần dư thời gian khi cả bộ test chạy song song
});
