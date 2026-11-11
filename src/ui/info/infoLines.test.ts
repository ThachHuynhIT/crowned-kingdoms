import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../game/cards/registry';
import { createBattle, spawnWave, type BattleWorld } from '../../game/battle/world';
import type { RunState } from '../../game/run/state';
import { battleSetup, structure, unitStats } from '../../game/testing/fixtures';
import { UI_PALETTE } from '../../data/uiPalette';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { endlessSurvivalScore } from '../../game/run/endlessRules';
import { bossWorld } from '../../game/battle/bossKit';
import { addDot } from '../../game/battle/statuses';
import { runState, withBuilding } from '../../game/testing/fixtures';
import { buildingInfoModel, unitInfoModel } from './inspectionModel';
import { buildingModelLines, unitModelLines, crownTally, entityAt, infoContent, lineIcon, placeInfoBox, runSummary, statusLines } from './infoLines';
import { IMAGE_ART_FILES, STAT_ICONS } from '../../render/imageArt';
import { crownPoints } from '../../game/meta';
import { META_MEMORY_ONLY_TEXT, META_READ_ONLY_TEXT, META_SAVE_FAILED_TEXT, RUN_ALREADY_SCORED_TEXT } from '../../data/save';

describe('lineIcon', () => {
  it.each([
    ['Máu: 100', 'life'], ['Máu lính: 32 → 40', 'life'],
    ['Sát thương: 5 (vật lý)', 'attack'], ['Không tấn công', 'attack'],
    ['Tầm đánh: 20 · Tốc độ: 10', 'range'], ['Giáp: 25%', 'armor'],
    ['Khiên: 10', 'shield'], ['Bùa: Lửa ×2', 'enchantment'],
    ['Cấp sau:', 'upgrade'], ['Tuổi: 3 năm', 'cooldown'], ['Lính: Dân Quân ×6', 'support'],
    ['Đang bỏng: 3/s (còn 2s)', 'burn'], ['Nhiễm độc: 2/s (còn 3s)', 'poison'],
    ['Bị làm chậm 25% (còn 2s)', 'slow'], ['Đang choáng', 'stun'],
    ['Loại: cận chiến, bay, thú', 'flying'], ['bay', 'flying'], ['Bị vô hiệu', 'disabled'],
    ['Hồi 5 máu mỗi giây cho lính cùng phe trong 30 px', 'heal'],
    ['Hạ địch hồi 10 máu', 'heal'], ['Hồi máu mỗi giây', 'heal'],
    ['Sống lại một lần với 50% máu', 'revive'], ['Đã hồi sinh', 'revive'],
    ['Hiến tế lính', 'sacrifice'], ['Thu linh hồn', 'soul'],
    ['Mỗi lính cùng phe đã chết: +5% máu và sát thương', 'soul'],
    ['Nhận 5 vàng', 'economy'], ['Kinh tế: +10%', 'economy'],
  ])('maps %s to %s', (line, icon) => {
    expect(lineIcon(line)).toBe(icon);
    expect(STAT_ICONS[icon]).toBe(`icons/icon_${icon}-16`);
    expect(IMAGE_ART_FILES).toContain(STAT_ICONS[icon]);
  });

  it.each(['', 'Cấp 2/5', 'Không từ công trình của bạn', 'Sinh lính.', 'Loại: cận chiến', 'Đang hạ cánh: nhận thêm sát thương'])('leaves %s without an icon', (line) => {
    expect(lineIcon(line)).toBeNull();
  });

  it('keeps the title separate even when its name matches an icon label', () => {
    const content = infoContent(['Máu linh hồn', 'Cấp 1/5', 'Máu: 100']);
    expect(content.title).toBe('Máu linh hồn');
    expect(content.lines.map((line) => lineIcon(line[0]!.text))).toEqual([null, 'life']);
  });
});

describe('infoContent', () => {
  it('titles the first line and tints level, HP and spawned-unit lines from UI_PALETTE', () => {
    const c = infoContent(['Dân Quân', 'Cấp 2', 'Máu: 100', 'Lính: Dân Quân ×6', 'Máu lính 32 · Giáp 25%', 'Sinh lính.']);
    expect(c.title).toBe('Dân Quân');
    const colorOf = (i: number) => c.lines[i]![0]!.color;
    expect(colorOf(0)).toBe(UI_PALETTE.wood);
    expect(colorOf(1)).toBe(UI_PALETTE.good);
    expect(colorOf(2)).toBe(UI_PALETTE.woodDark);
    expect(colorOf(3)).toBe(UI_PALETTE.woodDark);
    expect(colorOf(4)).toBeUndefined();
  });
});

describe('building model lines', () => {
  it('works for every building card and throne in the content', () => {
    for (const card of CONTENT.allCards()) {
      if (card.kind === 'tome' || card.kind === 'enchantment') continue;
      const m = buildingInfoModel(withBuilding(runState(), card.kind === 'throne' ? 12 : 6, card.id, 1), card.kind === 'throne' ? 12 : 6, CONTENT);
      const lines = buildingModelLines(m!);
      expect(lines.length, card.id).toBeGreaterThanOrEqual(3);
      for (const l of lines) expect(l.trim().length, card.id).toBeGreaterThan(0);
    }
  });
});

const entityLines = (w: BattleWorld, id: number): readonly string[] =>
  unitModelLines(unitInfoModel(w, id, runState(), CONTENT)!);

const militia = unitStats({ unit: 'militia', hp: 32, dmg: 5, range: 2, armor: 0.25, radius: 4 });
const bandit = unitStats({ unit: 'bandit', hp: 30, dmg: 5, radius: 4, speed: 0 });

/** Ally troop building on plot 6 (spawns 2 militia) and a foe wave of 2 bandits. */
const world = (): BattleWorld => {
  const w = createBattle(
    battleSetup({
      structures: [structure(6, { cardId: 'wheat_militia', spawn: { stats: militia, count: 2 } })],
      waves: [{ spawnTick: 0, spawns: [bandit, bandit].map((stats) => ({ stats, edge: 'N' as const })) }],
    }),
  );
  spawnWave(w, 0);
  return w;
};

describe('entityAt', () => {
  it('finds the structure under a point and ignores empty ground', () => {
    const w = world();
    const id = entityAt(w, w.x[1]!, w.y[1]!);
    expect(id).toBe(1);
    expect(entityAt(w, 5, 380)).toBeNull();
  });

  it('allows a few px of slop around an entity', () => {
    const w = world();
    // left of the structure: the two militia stand above and to the right of it
    expect(entityAt(w, w.x[1]! - w.radius[1]! - 3, w.y[1]!)).toBe(1);
    expect(entityAt(w, w.x[1]! - w.radius[1]! - 20, w.y[1]!)).toBeNull();
  });

  it('picks the nearest entity, then the lowest id, and skips dead ones', () => {
    const w = world();
    const a = w.count - 2;
    const b = w.count - 1;
    w.x[a] = 100;
    w.y[a] = 100;
    w.x[b] = 100;
    w.y[b] = 100;
    expect(entityAt(w, 100, 100)).toBe(a); // tie → lowest id
    w.x[b] = 102;
    expect(entityAt(w, 103, 100)).toBe(b); // nearer centre wins
    w.alive[b] = 0;
    expect(entityAt(w, 103, 100)).toBe(a);
  });
});

describe('entityInfoLines', () => {
  it('describes a unit: name, HP, damage, range, armor', () => {
    const w = world();
    const id = w.count - 1; // a foe bandit
    w.hp[id] = 12.2;
    const lines = entityLines(w, id);
    expect(lines[0]).toBe('Thổ Phỉ');
    expect(lines).toContain('Máu: 13 / 30');
    expect(lines.some((l) => l.startsWith('Sát thương: 5 (vật lý)'))).toBe(true);
    expect(lines.some((l) => l.startsWith('Tầm đánh: 2'))).toBe(true);
    expect(lines).toContain('Giáp: 0%');
  });

  it('shows armor as a percentage and the damage type', () => {
    const w = world();
    const lines = entityLines(w, 2); // first spawned militia
    expect(lines[0]).toBe('Dân Quân');
    expect(lines).toContain('Giáp: 25%');
    w.dmgType[2] = 2;
    expect(entityLines(w, 2).some((l) => l.startsWith('Sát thương: 5 (phép)'))).toBe(true);
  });

  it('shows the shield while it lasts and says when a unit is stunned', () => {
    const w = world();
    const id = 2;
    expect(entityLines(w, id).some((l) => l.startsWith('Khiên'))).toBe(false);
    expect(entityLines(w, id)).not.toContain('Đang choáng');
    w.shield[id] = 14.2;
    w.stunTicks[id] = 6;
    const lines = entityLines(w, id);
    expect(lines).toContain('Khiên: 15');
    expect(lines).toContain('Đang choáng');
  });
});

describe('placeInfoBox', () => {
  const screen = { w: 400, h: 300 };
  const size = { w: 120, h: 80 };

  it('opens to the lower right of the anchor when there is room', () => {
    const p = placeInfoBox({ x: 50, y: 50 }, size, screen);
    expect(p.x).toBeGreaterThan(50);
    expect(p.y).toBeGreaterThan(50);
  });

  it('flips left and up near the right and bottom edges and stays on screen', () => {
    for (const anchor of [{ x: 395, y: 295 }, { x: 0, y: 0 }, { x: 200, y: 299 }]) {
      const p = placeInfoBox(anchor, size, screen);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + size.w).toBeLessThanOrEqual(screen.w);
      expect(p.y + size.h).toBeLessThanOrEqual(screen.h);
    }
  });
});

describe('statusLines', () => {
  it('lists burn and poison with their damage per second and time left', () => {
    const w = world();
    const id = 2;
    expect(statusLines(w, id)).toEqual([]);
    addDot(w, id, 'burn', 7, 4, 30, 1); // 4 per second for 30 ticks
    addDot(w, id, 'poison', 8, 2, 50, 3);
    addDot(w, id, 'poison', 8, 2, 50, 3); // second stack
    const lines = statusLines(w, id);
    expect(lines).toContain('Đang bỏng: 4/s (còn 3s)');
    expect(lines).toContain('Nhiễm độc: 4/s (còn 5s)');
    expect(entityLines(w, id)).toEqual(expect.arrayContaining(lines));
  });

  it('says slowed, disabled, enraged and revived', () => {
    const w = world();
    const id = 2;
    w.slowPct[id] = 30;
    w.slowTicks[id] = 25;
    w.disabledUntil[id] = w.tick + 5;
    w.enrageDmgPct[id] = 40;
    w.enrageBelow[id] = 50;
    w.hp[id] = w.maxHp[id]! * 0.4;
    w.revived[id] = 1;
    const lines = statusLines(w, id);
    expect(lines).toContain('Bị làm chậm 30% (còn 3s)');
    expect(lines).toContain('Bị vô hiệu');
    expect(lines).toContain('Nổi giận: +40% sát thương');
    expect(lines).toContain('Đã hồi sinh');
    w.hp[id] = w.maxHp[id]!;
    expect(statusLines(w, id)).not.toContain('Nổi giận: +40% sát thương');
  });

  it('names a boss and shows its landing', () => {
    const w = bossWorld(2);
    expect(entityLines(w, w.bossId)[0]).toBe('Nữ Hoàng Ong Bắp Cày');
    expect(statusLines(w, w.bossId)).not.toContain('Đang hạ cánh: nhận thêm sát thương');
    w.bossLanded = true;
    expect(statusLines(w, w.bossId)).toContain('Đang hạ cánh: nhận thêm sát thương');
  });
});

describe('runSummary', () => {
  const full = (over: Partial<RunState['stats']> = {}): RunState => {
    const s = runState({ rules: RULES_FULL, enemyKings: ['grove', 'tide', 'forge', 'clock', 'moon', 'nomad'] });
    return { ...s, stats: { ...s.stats, completedYears: 12, battlesWon: 10, battlesLost: 2, kills: 345, conquered: 4, goldEarned: 99, ...over } };
  };

  it('shows completed years, conquered kings, bosses and no meta points', () => {
    const lines = runSummary(full({ bossesDefeated: ['boss_bog_ogre'], bossesWon: 1 }));
    expect(lines).toContain('Năm hoàn thành: 12 / 30');
    expect(lines).toContain('Vua đã chinh phục: 4 / 6');
    expect(lines).toContain('Boss đã hạ: 1 / 3');
    expect(lines).toContain('Trận thắng: 10 · Trận thua: 2');
    expect(lines.join(' ')).not.toMatch(/điểm vương miện|mở khoá/i);
  });

  it('gives the golden crown line only when boss 3 was defeated', () => {
    expect(runSummary(full({ bossesDefeated: ['boss_bog_ogre', 'boss_hornet_queen'] })).join('|')).not.toContain('Vương Miện Vàng');
    expect(runSummary(full({ bossesDefeated: ['boss_crownless_king'] })).join('|')).toContain('Vương Miện Vàng');
  });

  it('has no boss line in the short rules', () => {
    expect(runSummary(runState()).join('|')).not.toContain('Boss đã hạ');
  });
});

describe('crownTally', () => {
  const ended = (over: Partial<RunState> = {}, stats: Partial<RunState['stats']> = {}): RunState => {
    const s = runState({ rules: RULES_FULL, phase: 'ended', ...over });
    return { ...s, stats: { ...s.stats, completedYears: 30, conquered: 4, bossesWon: 3, ...stats } };
  };
  const tallyOf = (state: RunState, unlocks: string[] = [], credited: boolean | null = true) => {
    const breakdown = crownPoints(state);
    return { crownPoints: breakdown.total, breakdown, unlocks, credited };
  };

  it('a won run at Gai 2: each term, the thorn multiplier with a comma decimal, then the total that was credited', () => {
    const state = ended({ won: true, difficulty: 2 });
    const lines = crownTally(state, tallyOf(state, ['Mở đặc quyền: Mùa Bội Thu']));
    expect(lines.map((l) => l.text)).toEqual([
      'Năm hoàn thành × 1: +30',
      'Chinh phục × 3: +12',
      'Boss × 5: +15',
      'Thắng ván: +20',
      'Gai 2: ×1,4',
      `Tổng: ${crownPoints(state).total} điểm Vương Miện`,
      'Mở đặc quyền: Mùa Bội Thu',
    ]);
    expect(crownPoints(state).total).toBe(Math.round(77 * 1.4));
    expect(lines.find((l) => l.text.startsWith('Tổng'))!.tone).toBe('total');
    expect(lines.at(-1)!.tone).toBe('unlock');
  });

  it('a lost run at Gai 0 has no victory and no thorn line', () => {
    const state = ended({ won: false, difficulty: 0 }, { completedYears: 7, conquered: 1, bossesWon: 0 });
    const texts = crownTally(state, tallyOf(state)).map((l) => l.text);
    expect(texts).toEqual(['Năm hoàn thành × 1: +7', 'Chinh phục × 3: +3', 'Boss × 5: +0', 'Tổng: 10 điểm Vương Miện']);
  });

  it('shows the credited total from the tally, not a number recomputed in the UI', () => {
    const state = ended({ won: false });
    const tally = { ...tallyOf(state), breakdown: { ...crownPoints(state), total: 999 } };
    expect(crownTally(state, tally).map((l) => l.text)).toContain('Tổng: 999 điểm Vương Miện');
  });

  it('marks the "progress not saved" notices as warnings', () => {
    const state = ended({ won: false });
    const lines = crownTally(state, tallyOf(state, [META_SAVE_FAILED_TEXT, META_READ_ONLY_TEXT]));
    expect(lines.slice(-2).map((l) => l.tone)).toEqual(['warning', 'warning']);
  });

  it('styles the memory-only notice as a warning and does not add the already-scored line', () => {
    const state = ended({ won: false });
    const lines = crownTally(state, tallyOf(state, [META_MEMORY_ONLY_TEXT], true));
    expect(lines.at(-1)).toEqual({ text: META_MEMORY_ONLY_TEXT, tone: 'warning' });
    expect(lines.map((l) => l.text)).not.toContain(RUN_ALREADY_SCORED_TEXT);
    expect(crownTally(state, tallyOf(state, [META_MEMORY_ONLY_TEXT], false)).map((l) => l.text)).not.toContain(RUN_ALREADY_SCORED_TEXT);
  });

  it('says the run was already scored only when a profile deduped it', () => {
    const state = ended({ won: false });
    const texts = (unlocks: string[], credited: boolean | null) => crownTally(state, tallyOf(state, unlocks, credited)).map((l) => l.text);
    const dedupe = crownTally(state, tallyOf(state, [], false));
    expect(dedupe.at(-1)).toEqual({ text: RUN_ALREADY_SCORED_TEXT, tone: 'warning' });
    expect(RUN_ALREADY_SCORED_TEXT).toBe('Ván này đã được tính điểm trước đó.');
    expect(texts([], true)).not.toContain(RUN_ALREADY_SCORED_TEXT); // credited
    expect(texts([], null)).not.toContain(RUN_ALREADY_SCORED_TEXT); // no session: nothing to say
    expect(texts([META_READ_ONLY_TEXT], false)).toEqual([...texts([], true), META_READ_ONLY_TEXT]);
    expect(texts([META_SAVE_FAILED_TEXT], false)).toEqual([...texts([], true), META_SAVE_FAILED_TEXT]);
  });
});

describe('model lines', () => {
  const unit = {
    title: 'Dân Quân', sourceLevel: null, hp: 10, maxHp: 20, dmg: 5, damageType: 'vật lý', range: 8,
    attacksPerSecond: 0, armorPct: 25, shield: 0, speed: 20, tags: ['cận chiến'], behaviours: [], statuses: ['Đang choáng'],
  } as const;

  it('formats a unit with unknown origin, no attack and statuses', () => {
    const lines = unitModelLines(unit);
    expect(lines).toContain('Không từ công trình của bạn');
    expect(lines).toContain('Không tấn công');
    expect(lines).toContain('Máu: 10 / 20');
    expect(lines).toContain('Đang choáng');
  });

  it('formats a building with stars, age, enchants and the next level', () => {
    const lines = buildingModelLines({
      plot: 6, uid: 1, title: 'Dân Quân', stars: { filled: 3, total: 5, label: 'Cấp 3/5' }, hp: 225, liveHp: null,
      description: ['Sinh lính.'], next: ['Máu: 225 → 262.5'], enchants: ['Mài ×2'], age: { years: 7, bonus: 2 }, spawn: null,
    });
    expect(lines.slice(0, 3)).toEqual(['Dân Quân', 'Cấp 3/5', 'Máu: 225']);
    expect(lines).toContain('Tuổi: 7 năm (thêm 2)');
    expect(lines).toContain('Bùa: Mài ×2');
    expect(lines).toContain('Máu: 225 → 262.5');
  });
});

describe('Endless run end (spec 2026-11-09 §3, §7, §8)', () => {
  const endless = (over: Partial<RunState> = {}, stats: Partial<RunState['stats']> = {}): RunState => {
    const s = runState({ rules: RULES_ENDLESS, mode: 'endless', phase: 'ended', won: false, year: 31, ...over });
    return { ...s, stats: { ...s.stats, completedYears: 31, battlesWon: 25, battlesLost: 6, conquered: 2, bossesWon: 4, ...stats } };
  };
  const tallyOf = (state: RunState, unlocks: string[] = [], credited: boolean | null = true) => {
    const breakdown = crownPoints(state);
    return { crownPoints: breakdown.total, breakdown, unlocks, credited };
  };

  it('survival = completed years − 1 once the last life is gone (31 → 30, 1 → 0)', () => {
    expect(endlessSurvivalScore(endless())).toBe(30);
    expect(endlessSurvivalScore(endless({ year: 1 }, { completedYears: 1 }))).toBe(0);
  });

  it('a run still going (year 40, lives left) is not an ended score: the years completed so far', () => {
    expect(endlessSurvivalScore(endless({ phase: 'planning', year: 40 }, { completedYears: 39 }))).toBe(39);
  });

  it('the summary says years survived and the year it ended, with no "/ 30" and the real boss count', () => {
    const lines = runSummary(endless());
    expect(lines[0]).toBe('Sống sót: 30 năm');
    expect(lines[1]).toBe('Kết thúc ở năm 31');
    expect(lines.join('|')).not.toContain('/ 30');
    expect(lines).toContain('Boss đã hạ: 4');
  });

  it('keeps a very large year readable', () => {
    const lines = runSummary(endless({ year: 1_000_000 }, { completedYears: 1_000_000 }));
    expect(lines.slice(0, 2)).toEqual(['Sống sót: 999999 năm', 'Kết thúc ở năm 1000000']);
  });

  it('the tally names the capped scored years and bosses; real stats are not cut', () => {
    const state = endless({}, { completedYears: 100, bossesWon: 10, conquered: 6 });
    const texts = crownTally(state, tallyOf(state)).map((l) => l.text);
    expect(texts).toEqual([
      'Năm tính điểm: 60 (tối đa 60)',
      'Chinh phục × 3: +18',
      'Boss × 5: +15 (tối đa 3 boss)',
      'Tổng: 93 điểm Vương Miện',
    ]);
    expect(runSummary(state)).toContain('Boss đã hạ: 10');
  });

  it('credited=false never claims the points were added', () => {
    const state = endless();
    const texts = crownTally(state, tallyOf(state, [META_READ_ONLY_TEXT], false)).map((l) => l.text);
    expect(texts.at(-1)).toBe(META_READ_ONLY_TEXT);
    expect(texts.join('|')).not.toMatch(/đã cộng/i);
  });

  it('normal runs keep the old first line', () => {
    const s = runState({ rules: RULES_FULL });
    expect(runSummary({ ...s, stats: { ...s.stats, completedYears: 12 } })[0]).toBe('Năm hoàn thành: 12 / 30');
  });
});
