/**
 * Stress §8.10: một trận bị ép quá trần. Phe mình xin 25 Trại × 20 lính (trần playerUnitCap = 160), địch đổ 600
 * con trong ba đợt (trần entityCap = 512), lính và tháp đều bắn tên nhanh để chạm trần đạn (projectileCap).
 * Trận phải giữ đúng trần, mọi toạ độ hữu hạn, chạy lại cho cùng hash từng tick, và mỗi tick vẫn dưới ngưỡng.
 */
import { describe, expect, it } from 'vitest';
import { BATTLE } from '../../data/battle';
import { attackStats, battleSetup, structure, unitStats } from '../testing/fixtures';
import { hashWorld } from './hash';
import { battleResult, stepBattle } from './step';
import type { BattleSetup } from './types';
import { createBattle, drainEvents, KIND_UNIT, TEAM_ALLY } from './world';

declare const process: { hrtime: { bigint(): bigint } };

const TICKS = 300;
const LIMIT_MS = 4;

const bowman = unitStats({ unit: 'militia', hp: 40, dmg: 2, range: 80, interval: 4, projectileSpeed: 3, speed: 1 });
const raider = unitStats({ unit: 'bandit', hp: 60, dmg: 3, speed: 0.9 });
const raiderArcher = unitStats({
  unit: 'bandit_archer',
  hp: 40,
  dmg: 2,
  range: 80,
  interval: 4,
  projectileSpeed: 3,
  speed: 0.8,
});

const stressSetup = (): BattleSetup =>
  battleSetup({
    year: 25,
    autoFire: true,
    structures: [
      ...Array.from({ length: 25 }, (_, plot) => plot)
        .filter((plot) => plot !== 2)
        .map((plot) => structure(plot, { cardId: 'wheat_militia', spawn: { stats: bowman, count: 20 } })),
      structure(2, {
        cardId: 'neutral_archer_tower',
        kind: 'tower',
        attack: attackStats({ dmg: 3, range: 120, interval: 2, projectileSpeed: 3 }),
      }),
    ],
    waves: [0, 20, 40].map((spawnTick) => ({
      spawnTick,
      spawns: Array.from({ length: 200 }, (_, i) => ({ stats: i % 2 === 0 ? raiderArcher : raider, edge: 'S' as const })),
    })),
  });

interface Trace {
  hashes: number[];
  peakEntities: number;
  peakAllies: number;
  peakProjectiles: number;
  finite: boolean;
  ns: bigint;
}

const run = (): Trace => {
  const w = createBattle(stressSetup());
  const trace: Trace = { hashes: [], peakEntities: 0, peakAllies: 0, peakProjectiles: 0, finite: true, ns: 0n };
  for (let t = 0; t < TICKS && battleResult(w) === null; t++) {
    const t0 = process.hrtime.bigint();
    stepBattle(w, []);
    trace.ns += process.hrtime.bigint() - t0;
    drainEvents(w);
    trace.hashes.push(hashWorld(w));
    let allies = 0;
    for (let i = 0; i < w.count; i++) {
      if (!Number.isFinite(w.x[i]!) || !Number.isFinite(w.y[i]!)) trace.finite = false;
      if (w.kind[i] === KIND_UNIT && w.team[i] === TEAM_ALLY && w.hp[i]! > 0) allies++;
    }
    trace.peakEntities = Math.max(trace.peakEntities, w.count);
    trace.peakAllies = Math.max(trace.peakAllies, allies);
    trace.peakProjectiles = Math.max(trace.peakProjectiles, w.projectileCount);
  }
  return trace;
};

describe('battle stress at the caps (§8.10)', () => {
  it('holds the entity, player-unit and projectile caps, stays finite, deterministic and fast', () => {
    run(); // warm the JIT
    const a = run();
    const b = run();
    expect(a.hashes.length).toBeGreaterThan(100);
    expect(b.hashes).toEqual(a.hashes);
    expect(a.finite).toBe(true);
    expect(a.peakEntities).toBeLessThanOrEqual(BATTLE.entityCap);
    expect(a.peakEntities).toBeGreaterThan(400); // the waves really pushed against the cap
    expect(a.peakAllies).toBeLessThanOrEqual(BATTLE.playerUnitCap);
    expect(a.peakProjectiles).toBeLessThanOrEqual(BATTLE.projectileCap);
    const avgMs = Number(a.ns) / a.hashes.length / 1e6;
    console.info(
      `[stress] ${a.hashes.length} ticks, peak ${a.peakEntities} entities, ${a.peakAllies} allies, ` +
        `${a.peakProjectiles} projectiles, avg ${avgMs.toFixed(3)} ms/tick`,
    );
    expect(avgMs).toBeLessThanOrEqual(LIMIT_MS);
  }, 20_000); // three 300-tick battles at the caps; the per-tick limit above is what is measured
});
