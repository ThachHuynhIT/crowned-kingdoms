import { CONE } from '../battle';
import { cells } from '../boardGeometry';
import type { CardDef, EnemyKingDef, KingDef } from '../types';
import { enemyFromKing } from './enemy';

const fire = { owner: 'forge' as const, tags: ['fire'] as const };
const plain = { owner: 'forge' as const, tags: [] as const };

/** Chín thẻ của Vua Lò Rèn (spec §6.8), không gồm Ngai; chỉ có được nhờ chinh phục ở G3. */
export const FORGE_CARDS: readonly CardDef[] = [
  {
    ...plain,
    id: 'forge_swordsmen',
    nameVi: 'Doanh Trại Kiếm Sĩ',
    name: 'Swordsmen Barracks',
    kind: 'troop',
    rarity: 'common',
    textVi: 'Sinh {count} kiếm sĩ thép.',
    effects: [{ type: 'spawn', unit: 'swordsman', count: [3, 4, 5, 6, 7] }],
  },
  {
    ...fire,
    id: 'forge_flame_tower',
    nameVi: 'Tháp Phun Lửa',
    name: 'Flame Tower',
    kind: 'tower',
    rarity: 'common',
    textVi: 'Phun lửa {dmg} sát thương theo hình quạt, bỏng 1 mỗi giây.',
    effects: [
      {
        type: 'tower',
        attack: {
          dmg: 4,
          type: 'fire',
          range: cells(0.9375),
          interval: 4,
          cone: { range: cells(0.9375), halfAngleCos: CONE.cos45 },
          onHit: [{ type: 'burn', dps: 1, ticks: 20 }],
        },
        targeting: 'closestToThrone',
      },
    ],
  },
  {
    ...plain,
    id: 'forge_smithy',
    nameVi: 'Lò Rèn',
    name: 'Smithy',
    kind: 'support',
    rarity: 'common',
    textVi: 'Lân cận: lính +{pct}% sát thương và +0.05 giáp.',
    effects: [
      { type: 'stat', scope: 'neighbours', filter: { kinds: ['troop'] }, stat: 'dmg', mode: 'pct', value: [12, 16, 20, 24, 28] },
      { type: 'stat', scope: 'neighbours', filter: { kinds: ['troop'] }, stat: 'armor', mode: 'flat', value: 0.05 },
    ],
  },
  {
    ...fire,
    id: 'forge_ember_rune',
    nameVi: 'Bùa Than Hồng',
    name: 'Ember Rune',
    kind: 'enchantment',
    rarity: 'common',
    textVi: 'Mỗi lần gắn: mỗi đòn gây thêm bỏng 2 mỗi giây trong 30 tick.',
    targets: ['troop', 'tower', 'throne'],
    perStack: [{ type: 'stat', scope: 'self', stat: 'burnDps', mode: 'flat', value: 2 }],
  },
  {
    ...plain,
    id: 'forge_master_hammer',
    nameVi: 'Búa Thợ Cả',
    name: 'Master Hammer',
    kind: 'tome',
    rarity: 'uncommon',
    textVi: '+1 cấp cho công trình được chọn và +1 cấp cho công trình lân cận thấp cấp nhất.',
    target: 'building',
    actions: [{ type: 'custom', id: 'master_hammer' }],
  },
  {
    ...fire,
    id: 'forge_bombardiers',
    nameVi: 'Đội Ném Lửa',
    name: 'Bombardiers',
    kind: 'troop',
    rarity: 'uncommon',
    textVi: 'Sinh {count} lính ném lửa.',
    effects: [{ type: 'spawn', unit: 'bombardier', count: [2, 3, 3, 4, 5] }],
  },
  {
    ...plain,
    id: 'forge_blast_furnace',
    nameVi: 'Lò Cao',
    name: 'Blast Furnace',
    kind: 'economy',
    rarity: 'uncommon',
    textVi: 'Đầu năm +{gold} vàng. Lân cận: công trình lửa +{pct}% sát thương bỏng.',
    effects: [
      { type: 'gold', amount: [1, 2, 2, 3, 3] },
      { type: 'stat', scope: 'neighbours', filter: { tags: ['fire'] }, stat: 'burnDps', mode: 'pct', value: [25, 30, 35, 40, 50] },
    ],
  },
  {
    ...plain,
    id: 'forge_armory',
    nameVi: 'Kho Giáp',
    name: 'Armory',
    kind: 'support',
    rarity: 'rare',
    textVi: 'Mọi lính trên bàn cờ +0.04/0.05/0.06/0.07/0.08 giáp (chỉ lấy Kho Giáp cao nhất). Lân cận: +10% máu.',
    effects: [
      { type: 'custom', id: 'armory_armor', params: { armor: [0.04, 0.05, 0.06, 0.07, 0.08] } },
      { type: 'stat', scope: 'neighbours', stat: 'hp', mode: 'pct', value: 10 },
      { type: 'stat', scope: 'neighbours', stat: 'structureHp', mode: 'pct', value: 10 },
    ],
  },
  {
    ...fire,
    id: 'forge_iron_drake',
    nameVi: 'Tổ Rồng Sắt',
    name: 'Iron Drake Roost',
    kind: 'troop',
    rarity: 'rare',
    textVi: 'Sinh {count} rồng sắt.',
    effects: [{ type: 'spawn', unit: 'iron_drake', count: [1, 1, 1, 2, 2] }],
  },
];

/** Vua Lò Rèn (spec §6): Ngai, 9 thẻ, đơn vị, cờ hiệu và roster khi làm địch. */
export const FORGE: KingDef = {
  id: 'forge',
  nameVi: 'Vua Lò Rèn',
  name: 'Forge King',
  color: 'orange',
  blurbVi: 'Rèn đúc và lửa: bỏng thiêu đốt, công trình cấp cao mạnh hẳn.',
  perks: [
    {
      id: 'forge_p1',
      nameVi: 'Than Hồng',
      textVi: 'Mọi sát thương bỏng +30%.',
      effects: [{ type: 'stat', stat: 'burnDps', mode: 'pct', value: 30 }],
    },
    {
      id: 'forge_p2',
      nameVi: 'Học Việc',
      textVi: 'Bắt đầu ván với một Lò Rèn cấp 1 ngay trước Ngai.',
      effects: [{ type: 'startBuilding', card: 'forge_smithy', plot: 7 }], // ô (2,1) = plot 7
    },
    {
      id: 'forge_p3',
      nameVi: 'Thép Tốt',
      textVi: 'Mọi lính phe mình +0.1 giáp.',
      effects: [{ type: 'stat', filter: { unitsOnly: true }, stat: 'armor', mode: 'flat', value: 0.1 }],
    },
  ],
  throne: {
    id: 'forge_throne',
    owner: 'forge',
    nameVi: 'Ngai Đe Sắt',
    name: 'Anvil Throne',
    kind: 'throne',
    rarity: 'common',
    tags: [],
    textVi:
      'Ngai của Vua Lò Rèn: bắn lửa gây bỏng. Lửa Tôi: công trình cấp 3 trở lên được +10% sát thương (cao hơn khi Ngai lên cấp).',
    hp: 288,
    armor: 0.1,
    attack: { dmg: 9, type: 'fire', range: cells(1.5), interval: 12, projectileSpeed: 14, onHit: [{ type: 'burn', dps: 2, ticks: 30 }] },
    // Lửa Tôi: công trình cấp ≥ 3 +DMG theo cấp Ngai.
    passive: [{ type: 'stat', scope: 'board', filter: { minLevel: 3 }, stat: 'dmg', mode: 'pct', value: [10, 10, 15, 15, 20] }],
  },
  units: [
    {
      id: 'swordsman',
      nameVi: 'Kiếm Sĩ Thép',
      hp: 55,
      attack: { dmg: 9, type: 'physical', range: 2, interval: 10 },
      speed: 1.8,
      radius: 4,
      armor: 0.15,
      tags: ['melee', 'human'],
      enemyCost: 2.0,
      sprite: { w: 16, h: 16 },
    },
    {
      id: 'bombardier',
      nameVi: 'Lính Ném Lửa',
      hp: 32,
      attack: {
        dmg: 10,
        type: 'fire',
        range: 64,
        interval: 18,
        projectileSpeed: 10,
        splash: 14,
        onHit: [{ type: 'burn', dps: 2, ticks: 30 }],
      },
      speed: 1.6,
      radius: 4,
      armor: 0,
      tags: ['ranged', 'human'],
      enemyCost: 2.2,
      sprite: { w: 16, h: 16 },
    },
    {
      id: 'iron_drake',
      nameVi: 'Rồng Sắt',
      hp: 180,
      attack: {
        dmg: 12,
        type: 'fire',
        range: 32,
        interval: 10,
        cone: { range: 32, halfAngleCos: CONE.cos45 },
        onHit: [{ type: 'burn', dps: 4, ticks: 30 }],
      },
      speed: 2.4,
      radius: 7,
      armor: 0.2,
      tags: ['ranged', 'flying'],
      enemyCost: 9.0,
      sprite: { w: 24, h: 32 },
    },
    {
      id: 'shieldbearer',
      nameVi: 'Lính Khiên',
      hp: 90,
      attack: { dmg: 5, type: 'physical', range: 2, interval: 12 },
      speed: 1.4,
      radius: 5,
      armor: 0.35,
      tags: ['melee', 'human'],
      enemyCost: 2.5,
      sprite: { w: 16, h: 16 },
    },
  ],
  enemyRoster: [
    { unit: 'swordsman', weight: 55 },
    { unit: 'bombardier', weight: 30 },
    { unit: 'shieldbearer', weight: 15 },
  ],
  banner: {
    id: 'forge_banner',
    nameVi: 'Giáp Sắt',
    textVi: 'Địch được +0.15 giáp.',
    effects: [{ type: 'enemyArmor', add: 0.15 }],
  },
  cards: FORGE_CARDS,
};

/** Phần kẻ địch của forge: cùng dữ liệu, thẻ chinh phục là 9 thẻ của vua. */
export const FORGE_ENEMY: EnemyKingDef = enemyFromKing(FORGE);
