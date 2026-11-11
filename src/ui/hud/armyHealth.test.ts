import { describe, expect, it } from 'vitest';
import { TEAM_ALLY, TEAM_FOE, KIND_UNIT, addUnit, createBattle, spawnWave } from '../../game/battle/world';
import { bossWorld } from '../../game/battle/bossKit';
import { battleSetup, unitStats } from '../../game/testing/fixtures';
import { ENEMY_ARMY_TOOLTIP, armyHealth, healthText, throneHealth } from './armyHealth';

const twoWaves = () =>
  battleSetup({
    waves: [
      { spawnTick: 0, spawns: [{ stats: unitStats({ hp: 40 }), edge: 'S' }, { stats: unitStats({ hp: 60 }), edge: 'S' }] },
      { spawnTick: 120, spawns: [{ stats: unitStats({ hp: 100 }), edge: 'S' }] },
    ],
  });

const snapshot = (w: ReturnType<typeof createBattle>) =>
  JSON.stringify([w.count, Array.from(w.hp.slice(0, w.count)), Array.from(w.maxHp.slice(0, w.count)), Array.from(w.alive.slice(0, w.count))]);

describe('throneHealth', () => {
  it('shows 44 | 60 as the absolute numbers and the fraction', () => {
    const w = createBattle(twoWaves());
    w.maxHp[w.throneId] = 60;
    w.hp[w.throneId] = 44;
    const r = throneHealth(w);
    expect(r).toEqual({ label: 'Ngai', hp: 44, maxHp: 60, fraction: 44 / 60 });
    expect(healthText(r)).toBe('44 | 60');
  });

  it('never goes below 0 or above 1 and copes with a max of 0', () => {
    const w = createBattle(twoWaves());
    w.hp[w.throneId] = -5;
    expect(throneHealth(w)).toMatchObject({ hp: 0, fraction: 0 });
    w.maxHp[w.throneId] = 0;
    expect(throneHealth(w)).toMatchObject({ maxHp: 0, fraction: 0 });
    w.maxHp[w.throneId] = 50;
    w.hp[w.throneId] = 80;
    expect(throneHealth(w).fraction).toBe(1);
  });
});

describe('armyHealth', () => {
  it('is null (not 0 | 0) before any enemy has come out, and says so in words', () => {
    const w = createBattle(twoWaves());
    expect(armyHealth(w, TEAM_FOE)).toBeNull();
    expect(healthText(armyHealth(w, TEAM_FOE))).toBe('Chưa xuất quân');
  });

  it('counts only the enemy units present: the first wave, not the waves still to come', () => {
    const w = createBattle(twoWaves());
    spawnWave(w, 0);
    const r = armyHealth(w, TEAM_FOE)!;
    expect(r.label).toBe('Máu quân địch');
    expect(r.maxHp).toBe(100);
    expect(r.hp).toBe(100);
    expect(r.fraction).toBe(1);
    expect(healthText(r)).toBe('100 | 100');
  });

  it('the total can grow when a new wave appears (the bar is not the whole battle)', () => {
    const w = createBattle(twoWaves());
    spawnWave(w, 0);
    for (let id = 0; id < w.count; id++) if (w.team[id] === TEAM_FOE && w.kind[id] === KIND_UNIT) w.hp[id] = w.maxHp[id]! / 2;
    expect(armyHealth(w, TEAM_FOE)!.fraction).toBe(0.5);
    spawnWave(w, 1);
    const r = armyHealth(w, TEAM_FOE)!;
    expect(r.maxHp).toBe(200);
    expect(r.fraction).toBeCloseTo((50 + 100) / 200, 5);
  });

  it('a dead unit leaves the total and a revived or summoned one joins it', () => {
    const w = createBattle(twoWaves());
    spawnWave(w, 0);
    const foes = [...Array(w.count).keys()].filter((i) => w.team[i] === TEAM_FOE && w.kind[i] === KIND_UNIT);
    w.alive[foes[0]!] = 0;
    expect(armyHealth(w, TEAM_FOE)!.maxHp).toBe(60);
    w.alive[foes[0]!] = 1;
    expect(armyHealth(w, TEAM_FOE)!.maxHp).toBe(100);
    addUnit(w, unitStats({ hp: 30 }), TEAM_FOE, 100, 100, 100, 100, 99);
    expect(armyHealth(w, TEAM_FOE)!.maxHp).toBe(130);
    for (const id of foes) w.alive[id] = 0;
    w.alive[w.count - 1] = 0;
    expect(armyHealth(w, TEAM_FOE)).toBeNull();
  });

  it('keeps the two teams apart and rounds hp up like the boss bar', () => {
    const w = createBattle(twoWaves());
    expect(armyHealth(w, TEAM_ALLY)).toBeNull();
    const id = addUnit(w, unitStats({ hp: 50 }), TEAM_ALLY, 200, 200, 200, 200, 7);
    w.hp[id] = 12.2;
    const r = armyHealth(w, TEAM_ALLY)!;
    expect(r.label).toBe('Máu quân ta');
    expect(r).toMatchObject({ hp: 13, maxHp: 50 });
    expect(armyHealth(w, TEAM_FOE)).toBeNull();
  });

  it('leaves the boss out of the enemy total (the boss has its own bar)', () => {
    const w = bossWorld(1);
    let expected = 0;
    for (let id = 0; id < w.count; id++) {
      if (w.alive[id] === 1 && w.team[id] === TEAM_FOE && w.kind[id] === KIND_UNIT && id !== w.bossId) expected += Math.round(w.maxHp[id]!);
    }
    const r = armyHealth(w, TEAM_FOE);
    expect(r === null ? 0 : r.maxHp).toBe(expected);
  });

  it('only reads the world', () => {
    const w = createBattle(twoWaves());
    spawnWave(w, 0);
    const before = snapshot(w);
    throneHealth(w);
    armyHealth(w, TEAM_FOE);
    armyHealth(w, TEAM_ALLY);
    expect(snapshot(w)).toBe(before);
  });

  it('explains in the tooltip what the number is, and is not called the king or the whole wave', () => {
    expect(ENEMY_ARMY_TOOLTIP).toContain('Tổng máu quân địch đang hiện diện');
    expect(ENEMY_ARMY_TOOLTIP).toContain('thay đổi khi có quân mới');
    expect(ENEMY_ARMY_TOOLTIP).not.toMatch(/HP vua|toàn đợt/);
  });
});
