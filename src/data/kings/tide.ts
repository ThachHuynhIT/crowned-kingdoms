import { cells } from '../boardGeometry';
import type { CardDef, EnemyKingDef, KingDef } from '../types';
import { enemyFromKing } from './enemy';

const pirate = { owner: 'tide' as const, tags: ['pirate'] as const };
const plain = { owner: 'tide' as const, tags: [] as const };

/** Chín thẻ của Vua Thuỷ Triều (spec §6.7), không gồm Ngai; chỉ có được nhờ chinh phục ở G3. */
export const TIDE_CARDS: readonly CardDef[] = [
  {
    ...pirate,
    id: 'tide_pirates',
    nameVi: 'Thuyền Cướp Biển',
    name: 'Pirate Ship',
    kind: 'troop',
    rarity: 'common',
    textVi: 'Sinh {count} cướp biển. Mỗi 8 địch chúng hạ: +1 vàng (tối đa 3 mỗi trận).',
    effects: [
      { type: 'spawn', unit: 'pirate', count: [4, 5, 6, 7, 8] },
      { type: 'killGold', every: 8, gold: 1, max: 3 },
    ],
  },
  {
    ...plain,
    id: 'tide_cannon',
    nameVi: 'Pháo Đài Biển',
    name: 'Sea Fort',
    kind: 'tower',
    rarity: 'common',
    textVi: 'Pháo {dmg} sát thương, nổ lan 12, đẩy lùi 16.',
    effects: [
      {
        type: 'tower',
        attack: {
          dmg: 16,
          type: 'physical',
          range: cells(2.0625),
          interval: 22,
          projectileSpeed: 12,
          splash: cells(0.375),
          onHit: [{ type: 'knockback', px: 32 }],
        },
        targeting: 'closestToThrone',
      },
    ],
  },
  {
    ...plain,
    id: 'tide_harbor',
    nameVi: 'Bến Cảng',
    name: 'Harbor',
    kind: 'economy',
    rarity: 'common',
    textVi: 'Đầu năm +{gold} vàng.',
    effects: [{ type: 'gold', amount: [2, 3, 4, 5, 6] }],
  },
  {
    ...plain,
    id: 'tide_undertow_rune',
    nameVi: 'Bùa Sóng Ngầm',
    name: 'Undertow Rune',
    kind: 'enchantment',
    rarity: 'common',
    textVi: 'Mỗi lần gắn: mỗi đòn đẩy lùi thêm 6; lính +8% tốc độ.',
    targets: ['troop', 'tower', 'throne'],
    perStack: [
      { type: 'stat', scope: 'self', stat: 'knockback', mode: 'flat', value: 12 },
      { type: 'stat', scope: 'self', filter: { kinds: ['troop'] }, stat: 'speed', mode: 'pct', value: 8 },
    ],
  },
  {
    ...plain,
    id: 'tide_wave_tower',
    nameVi: 'Tháp Sóng',
    name: 'Wave Tower',
    kind: 'tower',
    rarity: 'uncommon',
    textVi: 'Mỗi 50 tick tạo sóng {dmg} sát thương phép, đẩy lùi 24.',
    effects: [
      {
        type: 'pulse',
        everyTicks: 50,
        radius: cells(2.25),
        attack: { dmg: 10, type: 'magic', range: 0, interval: 50, onHit: [{ type: 'knockback', px: 48 }] },
      },
    ],
  },
  {
    ...plain,
    id: 'tide_treasure',
    nameVi: 'Rương Châu Báu',
    name: 'Treasure Chest',
    kind: 'economy',
    rarity: 'uncommon',
    textVi: 'Đầu năm +1 vàng cho mỗi 5 vàng đang có, tối đa {cap}.',
    effects: [{ type: 'custom', id: 'treasure_chest', params: { cap: [3, 4, 5, 6, 7] } }],
  },
  {
    ...pirate,
    id: 'tide_hookmen',
    nameVi: 'Đội Móc Câu',
    name: 'Hookmen',
    kind: 'troop',
    rarity: 'uncommon',
    textVi: 'Sinh {count} lính móc câu.',
    effects: [{ type: 'spawn', unit: 'hookman', count: [2, 3, 4, 5, 6] }],
  },
  {
    ...plain,
    id: 'tide_privateers',
    nameVi: 'Hợp Đồng Đánh Thuê',
    name: 'Privateer Contract',
    kind: 'tome',
    rarity: 'rare',
    textVi: 'Trả toàn bộ vàng (tối đa 16); trận năm nay có thêm 1 lính đánh thuê tại Ngai cho mỗi 2 vàng đã trả.',
    target: 'none',
    actions: [{ type: 'custom', id: 'privateers', params: { maxPay: 16, perMercenary: 2 } }],
  },
  {
    ...plain,
    id: 'tide_kraken',
    nameVi: 'Vực Kraken',
    name: 'Kraken Maw',
    kind: 'tower',
    rarity: 'rare',
    textVi: 'Bốn xúc tu đánh bốn mục tiêu khác nhau, mỗi xúc tu {dmg} sát thương, đẩy lùi 8.',
    structureHp: [500, 625, 750, 875, 1000],
    effects: [
      {
        type: 'tower',
        attack: {
          dmg: 14,
          type: 'physical',
          range: cells(1.3125),
          interval: 12,
          onHit: [{ type: 'knockback', px: 16 }],
        },
        targeting: 'nearest',
      },
      { type: 'multiAttack', count: 4 },
    ],
  },
];

/** Vua Thuỷ Triều (spec §6): Ngai, 9 thẻ, đơn vị, cờ hiệu và roster khi làm địch. */
export const TIDE: KingDef = {
  id: 'tide',
  nameVi: 'Vua Thuỷ Triều',
  name: 'Tide King',
  color: 'water',
  blurbVi: 'Cướp biển và pháo nổ: đẩy lùi địch, gom chiến lợi phẩm.',
  perks: [
    {
      id: 'tide_p1',
      nameVi: 'Túi Đầy',
      textVi: '+5 vàng khởi đầu.',
      effects: [{ type: 'startGold', amount: 5 }],
    },
    {
      id: 'tide_p2',
      nameVi: 'Gió Thuận',
      textVi: 'Mọi đẩy lùi của phe mình +50%.',
      effects: [{ type: 'stat', stat: 'knockback', mode: 'pct', value: 50 }],
    },
    {
      id: 'tide_p3',
      nameVi: 'Chuộc Tù',
      textVi: 'Thua trận vẫn nhận một nửa vàng thắng trận (làm tròn xuống).',
      effects: [{ type: 'lossGold', pct: 50 }],
    },
  ],
  throne: {
    id: 'tide_throne',
    owner: 'tide',
    nameVi: 'Ngai San Hô',
    name: 'Coral Throne',
    kind: 'throne',
    rarity: 'common',
    tags: [],
    textVi:
      'Ngai của Vua Thuỷ Triều: pháo nổ lan, đẩy lùi kẻ địch. Chiến Lợi Phẩm: mỗi 10 địch bị hạ trong trận +1 vàng (tối đa 3 vàng mỗi trận, hơn khi lên cấp).',
    hp: 360,
    armor: 0,
    attack: { dmg: 12, type: 'physical', range: cells(1.6875), interval: 16, projectileSpeed: 12, splash: cells(0.3125), onHit: [{ type: 'knockback', px: 16 }] },
    // Chiến Lợi Phẩm: mỗi 10 địch bị hạ trong trận (bởi bất kỳ ai) +1 vàng, tối đa theo cấp Ngai.
    passive: [{ type: 'killGold', every: 10, gold: 1, max: [3, 3, 4, 4, 5], counts: 'all' }],
  },
  units: [
    {
      id: 'pirate',
      nameVi: 'Cướp Biển',
      hp: 30,
      attack: { dmg: 6, type: 'physical', range: 2, interval: 10 },
      speed: 2.2,
      radius: 4,
      armor: 0,
      tags: ['melee', 'pirate'],
      enemyCost: 1.0,
      sprite: { w: 16, h: 16 },
    },
    {
      id: 'hookman',
      nameVi: 'Lính Móc Câu',
      hp: 45,
      attack: {
        dmg: 8,
        type: 'physical',
        range: 40,
        interval: 14,
        projectileSpeed: 12,
        onHit: [{ type: 'pull', px: 32, every: 4 }],
      },
      speed: 1.8,
      radius: 4,
      armor: 0.05,
      tags: ['ranged', 'pirate'],
      enemyCost: 1.8,
      sprite: { w: 16, h: 24 },
    },
    {
      id: 'musketeer',
      nameVi: 'Lính Hoả Mai',
      hp: 28,
      attack: { dmg: 12, type: 'physical', range: 72, interval: 24, projectileSpeed: 20 },
      speed: 1.6,
      radius: 4,
      armor: 0,
      tags: ['ranged', 'pirate'],
      enemyCost: 2.0,
      sprite: { w: 16, h: 24 },
    },
  ],
  enemyRoster: [
    { unit: 'pirate', weight: 55 },
    { unit: 'hookman', weight: 25 },
    { unit: 'musketeer', weight: 20 },
  ],
  banner: {
    id: 'tide_banner',
    nameVi: 'Cướp Bóc',
    textVi: 'Mỗi lần Ngai mất thêm 10% máu tối đa trong trận, bạn mất 1 vàng (tối đa 3 mỗi trận).',
    effects: [{ type: 'throneGoldLoss', everyPct: 10, gold: 1, max: 3 }],
  },
  cards: TIDE_CARDS,
};

/** Phần kẻ địch của tide: cùng dữ liệu, thẻ chinh phục là 9 thẻ của vua. */
export const TIDE_ENEMY: EnemyKingDef = enemyFromKing(TIDE);
