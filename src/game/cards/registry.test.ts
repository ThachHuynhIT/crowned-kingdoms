import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../../data/rules';
import type { CardId, KingId } from '../../data/types';
import { CONTENT } from './registry';

describe('CONTENT registry', () => {
  it('looks up cards, units and kings', () => {
    expect(CONTENT.card('wheat_militia').kind).toBe('troop');
    expect(CONTENT.unit('bandit').enemyCost).toBe(1);
    expect(CONTENT.king('wheat').throne.id).toBe('wheat_throne');
  });

  it('registers all nine kings with a throne each', () => {
    expect(CONTENT.kings().map((k) => k.id)).toEqual([...ALL_KINGS]);
    const thrones = ['grove_throne', 'tide_throne', 'forge_throne', 'clock_throne', 'moon_throne', 'nomad_throne'];
    for (const id of thrones) expect(CONTENT.card(id as CardId).kind, id).toBe('throne');
    for (const king of CONTENT.kings()) {
      expect(CONTENT.card(`${king.id}_throne` as CardId).kind, king.id).toBe('throne');
      expect(king.throne.owner).toBe(king.id);
      expect(king.cards, king.id).toHaveLength(9);
      const count = (r: string) => king.cards.filter((c) => c.rarity === r).length;
      expect([count('common'), count('uncommon'), count('rare')], king.id).toEqual([4, 3, 2]);
      expect(king.blurbVi.length, king.id).toBeGreaterThan(0);
      expect(CONTENT.conquestCards(king.id), king.id).toBe(king.cards);
    }
  });

  it('throws on unknown ids', () => {
    expect(() => CONTENT.card('nope_x' as CardId)).toThrow(/Unknown card id/);
    expect(() => CONTENT.unit('nope')).toThrow(/Unknown unit id/);
    expect(() => CONTENT.king('nope' as KingId)).toThrow(/Unknown king id/);
  });

  it('exposes the raider roster and neutral pool', () => {
    const roster = CONTENT.raiderRoster();
    expect(roster).toHaveLength(4);
    expect(roster.reduce((s, r) => s + r.weight, 0)).toBe(100);
    expect(roster[0]?.unit.id).toBe('bandit');
    const pool = CONTENT.neutralPool().map((c) => c.id);
    for (const id of ['neutral_barracks', 'neutral_archer_tower', 'neutral_clear_land', 'neutral_move']) expect(pool).toContain(id);
    expect(pool.every((id) => id.startsWith('neutral_'))).toBe(true);
  });

  it('lists all cards sorted by id without duplicates', () => {
    const ids = CONTENT.allCards().map((c) => c.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('wheat_throne');
  });

  it('lists all units sorted by id without duplicates', () => {
    const ids = CONTENT.allUnits().map((u) => u.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['bandit', 'bandit_archer', 'boar_rider', 'footman', 'mercenary', 'militia', 'ogre', 'reaper']) {
      expect(ids).toContain(id);
    }
  });
});
