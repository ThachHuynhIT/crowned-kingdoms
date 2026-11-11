import { describe, expect, it } from 'vitest';
import { PLOT, cells } from '../../data/boardGeometry';
import type { AttackSpec, CardDef } from '../../data/types';
import { CONTENT } from './registry';

/** Tốc độ (px/tick) và tốc độ đạn của từng lính ở hình học cũ (ô 32), chép tay làm oracle. */
const OLD_UNIT_SPEEDS: readonly [string, number, number | null][] = [
  ['apprentice', 0.9, 7],
  ['archmage', 0.7, 6],
  ['bandit', 0.9, null],
  ['bandit_archer', 0.8, 7],
  ['bear', 1, null],
  ['boar_rider', 1.5, null],
  ['bombardier', 0.8, 5],
  ['boss_bog_ogre', 0.5, null],
  ['boss_crownless_king', 0.6, null],
  ['boss_hornet_queen', 0.8, 9],
  ['colossus', 0.5, null],
  ['construct', 0.8, null],
  ['dryad', 0.9, 7],
  ['footman', 0.9, null],
  ['frog', 1.2, null],
  ['frost_mage', 0.8, 7],
  ['gear_gunner', 0.8, 8],
  ['golem', 0.6, null],
  ['hookman', 0.9, 6],
  ['hornet', 1.6, null],
  ['horse_archer', 1.8, 8],
  ['iron_drake', 1.2, null],
  ['khan_guard', 1.6, null],
  ['mercenary', 1, null],
  ['militia', 1, null],
  ['miner', 0.8, null],
  ['moon_reaper', 1, null],
  ['musketeer', 0.8, 10],
  ['ogre', 0.6, null],
  ['peasant', 1.1, null],
  ['pirate', 1.1, null],
  ['reaper', 0.9, null],
  ['rider', 2, null],
  ['rubble', 0.7, null],
  ['shieldbearer', 0.7, null],
  ['skeleton', 0.9, null],
  ['slinger', 0.8, 6],
  ['spider', 1.5, null],
  ['stag', 1.4, null],
  ['swordsman', 0.9, null],
  ['tin_soldier', 0.9, null],
  ['treant', 0.5, null],
  ['vampire', 1.2, null],
  ['wolf', 1.6, null],
  ['wraith', 1.3, null],
];

/** Tầm công trình ở hình học cũ (world px) — mới phải đúng ×1,5 (spec 06/11/2026, quyết định E). */
const OLD_STRUCTURE_RANGE: Record<string, number> = {
  wheat_throne: 72, wheat_scarecrow: 72, stone_throne: 56, arcane_throne: 80, arcane_mage_tower: 80,
  neutral_archer_tower: 88, tide_cannon: 88, stone_catapult: 96, nomad_watchtower: 96, stone_crystal: 64,
  grove_throne: 64, tide_throne: 72, forge_throne: 64, clock_throne: 72, moon_throne: 72, nomad_throne: 72,
  grove_thorn_tower: 64, forge_flame_tower: 40, clock_gear_tower: 72, moon_shadow_spire: 72,
  clock_steam_cannon: 104, tide_kraken: 56,
};

const attackOf = (card: CardDef): AttackSpec | undefined => {
  if (card.kind === 'throne') return card.attack;
  if (!('effects' in card)) return undefined;
  for (const e of card.effects) if (e.type === 'tower' || e.type === 'pulse') return e.attack;
  return undefined;
};

const radiusOf = (id: string): number | undefined => {
  const card = CONTENT.card(id as never);
  if (!('effects' in card)) return undefined;
  for (const e of card.effects) if ('radius' in e && typeof e.radius === 'number') return e.radius;
  return undefined;
};

/** Ngai của sáu vua mới: [spec tầm, spec đạn, splash, đẩy lùi] ở hình học cũ. */
const NEW_THRONES: readonly [string, number, number, number | null, number | null][] = [
  ['grove_throne', 64, 7, null, null],
  ['tide_throne', 72, 6, 10, 8],
  ['forge_throne', 64, 7, null, null],
  ['clock_throne', 72, 8, null, null],
  ['moon_throne', 72, 8, null, null],
  ['nomad_throne', 72, 8, null, null],
];

describe('content at 64 px plots (spec 06/11/2026)', () => {
  it('moves every unit the same number of plots per tick (speed and shell speed x2)', () => {
    expect(CONTENT.allUnits().map((u) => u.id).sort()).toEqual(OLD_UNIT_SPEEDS.map(([id]) => id).sort());
    for (const [id, speed, shell] of OLD_UNIT_SPEEDS) {
      const u = CONTENT.unit(id as never);
      expect(u.speed, id).toBeCloseTo(speed * 2);
      expect(u.attack.projectileSpeed ?? null, id).toBe(shell === null ? null : shell * 2);
    }
  });

  it('keeps unit bodies and unit attack ranges in world px', () => {
    expect(CONTENT.unit('militia' as never).radius).toBe(4);
    expect(CONTENT.unit('bandit_archer' as never).attack.range).toBe(56);
    expect(CONTENT.unit('iron_drake' as never).attack.range).toBe(32);
  });

  it('gives every structure that shoots exactly 1.5x its old range', () => {
    const shooters = CONTENT.allCards().filter((c) => { const a = attackOf(c); return a !== undefined && a.range > 0; });
    expect(shooters.map((c) => c.id).sort()).toEqual(Object.keys(OLD_STRUCTURE_RANGE).sort());
    for (const c of shooters) expect(attackOf(c)!.range, c.id).toBe(OLD_STRUCTURE_RANGE[c.id]! * 1.5);
    const flame = attackOf(CONTENT.card('forge_flame_tower' as never))!;
    expect(flame.cone!.range).toBe(60);
  });

  it('keeps structure areas at the same reach in plots (x2 in px)', () => {
    expect(radiusOf('stone_mountain_heart')).toBe(cells(1.5));
    expect(radiusOf('tide_wave_tower')).toBe(cells(2.25));
    expect(radiusOf('arcane_ward')).toBe(cells(2));
    expect(radiusOf('grove_spring')).toBe(cells(2));
    expect(radiusOf('clock_bell_tower')).toBe(cells(2.5));
    expect(radiusOf('stone_wall')).toBe(cells(1.25));
    const at = (id: string) => attackOf(CONTENT.card(id as never))!;
    expect(at('arcane_mage_tower').chain!.radius).toBe(PLOT);
    expect([at('stone_catapult').splash, at('stone_catapult').minRange]).toEqual([32, 48]);
    expect(at('tide_cannon').splash).toBe(24);
    expect(at('clock_steam_cannon').splash).toBe(36);
  });

  it('scales the six new thrones like the old ones (range x1.5, shell speed, splash and knockback x2)', () => {
    for (const [id, range, shell, splash, knock] of NEW_THRONES) {
      const a = attackOf(CONTENT.card(id as never))!;
      expect(a.range, id).toBe(range * 1.5);
      expect(a.projectileSpeed, id).toBe(shell * 2);
      expect(a.splash ?? null, id).toBe(splash === null ? null : splash * 2);
      const k = a.onHit?.find((h) => h.type === 'knockback');
      expect(k ? k.px : null, id).toBe(knock === null ? null : knock * 2);
    }
  });

  it('doubles knockback and pull distances', () => {
    expect(attackOf(CONTENT.card('tide_cannon' as never))!.onHit).toEqual([{ type: 'knockback', px: 32 }]);
    expect(attackOf(CONTENT.card('tide_kraken' as never))!.onHit).toEqual([{ type: 'knockback', px: 16 }]);
    expect(attackOf(CONTENT.card('tide_wave_tower' as never))!.onHit).toEqual([{ type: 'knockback', px: 48 }]);
  });
});
