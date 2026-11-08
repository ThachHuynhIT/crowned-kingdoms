import { cells } from '../boardGeometry';
import type { CardDef, EnemyKingDef, KingDef } from '../types';
import { enemyFromKing } from './enemy';

const gear = { owner: 'clock' as const, tags: ['clockwork'] as const };
const plain = { owner: 'clock' as const, tags: [] as const };

/** Chín thẻ của Vua Đồng Hồ (spec §6.9), không gồm Ngai; chỉ có được nhờ chinh phục ở G3. */
export const CLOCK_CARDS: readonly CardDef[] = [
  {
    ...gear,
    id: 'clock_windup_soldiers',
    nameVi: 'Xưởng Lính Thiếc',
    name: 'Windup Soldiers',
    kind: 'troop',
    rarity: 'common',
    textVi: 'Sinh {count} lính thiếc.',
    effects: [{ type: 'spawn', unit: 'tin_soldier', count: [4, 5, 6, 7, 8] }],
  },
  {
    ...gear,
    id: 'clock_gear_tower',
    nameVi: 'Tháp Bánh Răng',
    name: 'Gear Tower',
    kind: 'tower',
    rarity: 'common',
    textVi: 'Bắn {dmg} sát thương; mỗi giây đánh nhanh thêm 2% (tối đa +100%).',
    effects: [
      {
        type: 'tower',
        attack: { dmg: 5, type: 'physical', range: cells(1.6875), interval: 10, projectileSpeed: 16 },
        targeting: 'closestToThrone',
      },
      { type: 'rampAttackSpeed', pctPerSecond: 2, cap: 100 },
    ],
  },
  {
    ...plain,
    id: 'clock_spring_workshop',
    nameVi: 'Xưởng Lò Xo',
    name: 'Spring Workshop',
    kind: 'economy',
    rarity: 'common',
    textVi: 'Đầu năm +{gold} vàng. Lân cận: mọi tăng tiến lên dây trước 10/12/14/16/20 giây.',
    effects: [
      { type: 'gold', amount: [1, 1, 2, 2, 3] },
      { type: 'stat', scope: 'neighbours', stat: 'prewind', mode: 'flat', value: [10, 12, 14, 16, 20] },
    ],
  },
  {
    ...plain,
    id: 'clock_tick_rune',
    nameVi: 'Bùa Tích Tắc',
    name: 'Tick Rune',
    kind: 'enchantment',
    rarity: 'common',
    textVi: 'Mỗi lần gắn: +1% tốc độ đánh mỗi giây (tối đa +30% mỗi stack).',
    targets: ['troop', 'tower', 'throne'],
    perStack: [
      { type: 'stat', scope: 'self', stat: 'rampAs', mode: 'flat', value: 1 },
      { type: 'stat', scope: 'self', stat: 'rampAsCap', mode: 'flat', value: 30 },
    ],
  },
  {
    ...gear,
    id: 'clock_bell_tower',
    nameVi: 'Tháp Chuông',
    name: 'Bell Tower',
    kind: 'support',
    rarity: 'uncommon',
    textVi: 'Mỗi 100 tick: lính mình trong 160 px đánh nhanh thêm 25/30/35/40/45% trong 30 tick; từ cấp 3 địch trong 160 px bị choáng 5 tick.',
    effects: [
      {
        type: 'bellPulse',
        everyTicks: 100,
        radius: cells(2.5),
        attackSpeedPct: [25, 30, 35, 40, 45],
        buffTicks: 30,
        stunFromLevel: 3,
        stunTicks: 5,
      },
    ],
  },
  {
    ...gear,
    id: 'clock_spiders',
    nameVi: 'Ổ Nhện Cơ Khí',
    name: 'Spider Nest',
    kind: 'troop',
    rarity: 'uncommon',
    textVi: 'Sinh {count} nhện cơ khí. Mỗi 150 tick, thiếu nhện thì sinh lại 1 con.',
    effects: [
      { type: 'spawn', unit: 'spider', count: [3, 4, 5, 6, 7] },
      { type: 'respawnLost', everyTicks: 150 },
    ],
  },
  {
    ...plain,
    id: 'clock_rewind',
    nameVi: 'Tua Ngược',
    name: 'Rewind',
    kind: 'tome',
    rarity: 'uncommon',
    textVi: 'Công trình được chọn vĩnh viễn lên dây trước thêm 5 giây (tối đa 30 giây).',
    target: 'building',
    actions: [{ type: 'custom', id: 'rewind', params: { seconds: 5, cap: 30 } }],
  },
  {
    ...gear,
    id: 'clock_steam_cannon',
    nameVi: 'Pháo Hơi Nước',
    name: 'Steam Cannon',
    kind: 'tower',
    rarity: 'rare',
    textVi: 'Pháo {dmg} sát thương, nổ lan 18; mỗi giây đánh nhanh thêm 1.5% (tối đa +90%).',
    effects: [
      {
        type: 'tower',
        attack: { dmg: 30, type: 'physical', range: cells(2.4375), interval: 40, projectileSpeed: 10, splash: cells(0.5625) },
        targeting: 'closestToThrone',
      },
      { type: 'rampAttackSpeed', pctPerSecond: 1.5, cap: 90 },
    ],
  },
  {
    ...gear,
    id: 'clock_colossus',
    nameVi: 'Lò Khổng Lồ Đồng',
    name: 'Brass Colossus Forge',
    kind: 'troop',
    rarity: 'rare',
    textVi: 'Sinh {count} khổng lồ đồng.',
    effects: [{ type: 'spawn', unit: 'colossus', count: [1, 1, 1, 2, 2] }],
  },
];

/** Vua Đồng Hồ (spec §6): Ngai, 9 thẻ, đơn vị, cờ hiệu và roster khi làm địch. */
export const CLOCK: KingDef = {
  id: 'clock',
  nameVi: 'Vua Đồng Hồ',
  name: 'Clock King',
  color: 'gold',
  blurbVi: 'Máy móc lên dây: quân và tháp đánh nhanh dần trong trận.',
  throne: {
    id: 'clock_throne',
    owner: 'clock',
    nameVi: 'Ngai Bánh Răng',
    name: 'Cogwheel Throne',
    kind: 'throne',
    rarity: 'common',
    tags: [],
    textVi:
      'Ngai của Vua Đồng Hồ: bắn trong tầm. Lên Dây: mọi lính và tháp của mình đánh nhanh dần mỗi giây trong trận (tối đa +40% tốc đánh).',
    hp: 300,
    armor: 0.1,
    attack: { dmg: 8, type: 'physical', range: cells(1.6875), interval: 12, projectileSpeed: 16 },
    // Lên Dây: mọi lính và tháp +% tốc đánh mỗi giây (theo cấp Ngai), tối đa +40%.
    passive: [
      { type: 'stat', scope: 'board', filter: { kinds: ['troop', 'tower'] }, stat: 'rampAs', mode: 'flat', value: [0.5, 0.6, 0.7, 0.8, 1.0] },
      { type: 'stat', scope: 'board', filter: { kinds: ['troop', 'tower'] }, stat: 'rampAsCap', mode: 'flat', value: 40 },
    ],
  },
  units: [
    {
      id: 'tin_soldier',
      nameVi: 'Lính Thiếc',
      hp: 34,
      attack: { dmg: 5, type: 'physical', range: 2, interval: 10 },
      speed: 1.8,
      radius: 4,
      armor: 0.1,
      tags: ['melee', 'clockwork'],
      behaviours: [{ type: 'rampDmg', pctPerSecond: 2, cap: 80 }],
      enemyCost: 1.2,
      sprite: { w: 16, h: 16 },
    },
    {
      id: 'spider',
      nameVi: 'Nhện Cơ Khí',
      hp: 28,
      attack: { dmg: 6, type: 'physical', range: 2, interval: 8 },
      speed: 3,
      radius: 4,
      armor: 0.1,
      tags: ['melee', 'clockwork'],
      enemyCost: 1.1,
      sprite: { w: 16, h: 16 },
    },
    {
      id: 'colossus',
      nameVi: 'Khổng Lồ Đồng',
      hp: 300,
      attack: { dmg: 10, type: 'physical', range: 4, interval: 14 },
      speed: 1,
      radius: 9,
      armor: 0.3,
      tags: ['melee', 'clockwork'],
      behaviours: [{ type: 'stepBuff', everyTicks: 100, dmgPct: 20, speedPct: 10, maxStacks: 6 }],
      enemyCost: 10.0,
      sprite: { w: 24, h: 32 },
    },
    {
      id: 'gear_gunner',
      nameVi: 'Xạ Thủ Bánh Răng',
      hp: 30,
      attack: { dmg: 6, type: 'physical', range: 64, interval: 12, projectileSpeed: 16 },
      speed: 1.6,
      radius: 4,
      armor: 0.1,
      tags: ['ranged', 'clockwork'],
      behaviours: [{ type: 'rampAttackSpeed', pctPerSecond: 1, cap: 60 }],
      enemyCost: 1.6,
      sprite: { w: 16, h: 16 },
    },
  ],
  enemyRoster: [
    { unit: 'tin_soldier', weight: 55 },
    { unit: 'spider', weight: 30 },
    { unit: 'gear_gunner', weight: 15 },
  ],
  banner: {
    id: 'clock_banner',
    nameVi: 'Đếm Ngược',
    textVi: 'Địch +1% sát thương mỗi giây (tối đa +50%).',
    effects: [{ type: 'enemyRampDmg', pctPerSecond: 1, cap: 50 }],
  },
  cards: CLOCK_CARDS,
};

/** Phần kẻ địch của clock: cùng dữ liệu, thẻ chinh phục là 9 thẻ của vua. */
export const CLOCK_ENEMY: EnemyKingDef = enemyFromKing(CLOCK);
