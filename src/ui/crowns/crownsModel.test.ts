import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../../data/rules';
import type { KingId } from '../../data/types';
import { CONTENT } from '../../game/cards/registry';
import { defaultProfile, unlockCard, unlockKing, type MetaProfile } from '../../game/meta';
import { CROWNS_KING_ORDER, crownsModel, decimalVi } from './crownsModel';

const profile = (over: Partial<MetaProfile> = {}): MetaProfile => ({ ...defaultProfile(), ...over });
const row = (p: MetaProfile, id: KingId) => crownsModel(CONTENT, p).kings.find((k) => k.id === id)!;

describe('crownsModel', () => {
  it('default profile: balance 0, three kings open, six priced, both meta cards priced, no win yet', () => {
    const m = crownsModel(CONTENT, defaultProfile());
    expect(m.balanceLabel).toBe('Điểm Vương Miện: 0');
    expect(m.kings.map((k) => k.id)).toEqual(['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad']);
    expect(m.kings.filter((k) => k.status === 'Đã mở').map((k) => k.id)).toEqual(['wheat', 'stone', 'arcane']);
    expect(m.kings.filter((k) => !k.unlocked).map((k) => k.status)).toEqual([
      '25 điểm', '25 điểm', '40 điểm', '40 điểm', '60 điểm', '80 điểm · cần thắng 1 ván',
    ]);
    expect(m.cards.map((c) => [c.id, c.status])).toEqual([
      ['neutral_duplicate', '15 điểm'],
      ['neutral_royal_seal', '20 điểm'],
    ]);
    expect(m.highestLabel).toBe('Độ khó cao nhất đã thắng: chưa thắng');
  });

  it('lists every king once, cheapest first', () => {
    expect([...CROWNS_KING_ORDER].sort()).toEqual([...ALL_KINGS].sort());
  });

  it('names every king, locked ones too (this screen sells them)', () => {
    for (const k of crownsModel(CONTENT, defaultProfile()).kings) expect(k.nameVi).toBe(CONTENT.king(k.id).nameVi);
  });

  it('short of points: unlock buttons shown but disabled, and building the model never changes the profile', () => {
    const p = profile({ crownPoints: 14 });
    const before = JSON.stringify(p);
    const m = crownsModel(CONTENT, p);
    const grove = m.kings.find((k) => k.id === 'grove')!;
    expect(grove.unlockLabel).toBe('Mở khoá (25)');
    expect(grove.canUnlock).toBe(false);
    expect(m.cards.every((c) => !c.canUnlock && c.unlockLabel !== null)).toBe(true);
    expect(m.cards.find((c) => c.id === 'neutral_duplicate')!.canUnlock).toBe(false);
    expect(JSON.stringify(p)).toBe(before);
    // The rule behind the disabled button: an unlock that cannot be paid leaves the profile as it was.
    expect(unlockKing(p, 'grove')).toBe(p);
  });

  it('enough points: the unlock button is live; an owned king has no button', () => {
    const p = profile({ crownPoints: 40 });
    expect(row(p, 'forge').canUnlock).toBe(true);
    expect(row(p, 'moon').canUnlock).toBe(false);
    expect(row(p, 'wheat').unlockLabel).toBeNull();
    expect(row(p, 'wheat').canUnlock).toBe(false);
    const after = unlockKing(p, 'forge');
    expect(row(after, 'forge')).toMatchObject({ unlocked: true, status: 'Đã mở', unlockLabel: null });
    expect(crownsModel(CONTENT, after).balanceLabel).toBe('Điểm Vương Miện: 0');
  });

  it('nomad needs a win as well as 80 points', () => {
    expect(row(profile({ crownPoints: 200 }), 'nomad').canUnlock).toBe(false);
    expect(row(profile({ crownPoints: 200, wins: { ...defaultProfile().wins, stone: 1 } }), 'nomad').canUnlock).toBe(true);
  });

  it('meta cards: live when affordable, "Đã mở" once bought', () => {
    const p = profile({ crownPoints: 20 });
    const m = crownsModel(CONTENT, p);
    expect(m.cards.map((c) => c.canUnlock)).toEqual([true, true]);
    expect(m.cards[0]!.nameVi).toBe(CONTENT.card('neutral_duplicate').nameVi);
    const bought = crownsModel(CONTENT, unlockCard(p, 'neutral_royal_seal'));
    expect(bought.cards[1]).toMatchObject({ unlocked: true, status: 'Đã mở', unlockLabel: null, canUnlock: false });
    expect(bought.cards[0]!.canUnlock).toBe(false); // 0 points left
  });

  it('mastery bar: marks at 10 / 30 / 60, filled up to the last mark', () => {
    const p = profile({ mastery: { ...defaultProfile().mastery, stone: 30 } });
    const stone = row(p, 'stone');
    expect(stone.marks.map((m) => m.value)).toEqual([10, 30, 60]);
    expect(stone.marks.map((m) => m.at)).toEqual([10 / 60, 0.5, 1]);
    expect(stone.marks.map((m) => m.reached)).toEqual([true, true, false]);
    expect(stone.masteryFraction).toBe(0.5);
    expect(stone.masteryLabel).toBe('Thông thạo 30 · 2/3 đặc quyền');
    expect(row(profile({ mastery: { ...defaultProfile().mastery, stone: 95 } }), 'stone').masteryFraction).toBe(1);
    expect(row(defaultProfile(), 'wheat').masteryFraction).toBe(0);
  });

  it('highest thorn won: "Nông dân" for 0, "Gai d" above', () => {
    expect(crownsModel(CONTENT, profile({ highestDifficultyWon: 0 })).highestLabel).toBe('Độ khó cao nhất đã thắng: Nông dân');
    expect(crownsModel(CONTENT, profile({ highestDifficultyWon: 3 })).highestLabel).toBe('Độ khó cao nhất đã thắng: Gai 3');
  });
});

describe('decimalVi', () => {
  it('writes a comma decimal, at most two places', () => {
    expect(decimalVi(1)).toBe('1');
    expect(decimalVi(1.2)).toBe('1,2');
    expect(decimalVi(1 + 0.2 * 3)).toBe('1,6');
    expect(decimalVi(2)).toBe('2');
  });
});
