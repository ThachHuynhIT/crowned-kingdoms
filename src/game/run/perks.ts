/**
 * Perk của vua (spec §6.3–6.11). Một ván mang tối đa một perk (`RunState.perk`); hiệu ứng là dữ liệu
 * (`PerkEffect`) và chỉ được đọc ở đây theo `type`: lúc tạo ván (`applyStartPerk`), lúc dựng trận
 * (`perkBattleMods`, nguồn chỉ số (f) trong `collectStatSheet`) và vài móc luật ván (đổi bài, thua trận,
 * giới hạn Bùa, dời nhà, đặt công trình). Thuần, không sửa đầu vào.
 */
import { RUN } from '../../data/run';
import { BATTLE } from '../../data/battle';
import type { CardDef, KingId, PerkDef, PerkEffect, PerkId } from '../../data/types';
import type { PerkBattleMods } from '../battle/types';
import type { Content } from '../cards/registry';
import { THRONE_PLOT, attachEnchant, placeBuilding, unlockPlot } from './board';
import type { RunState } from './state';

export type { PerkBattleMods };

/** Perk `perk` trong danh sách của vua `kingId`, hoặc `undefined` nếu vua không có perk đó. */
export const findPerk = (content: Content, kingId: KingId, perk: PerkId): PerkDef | undefined =>
  content.king(kingId).perks.find((p) => p.id === perk);

/** Hiệu ứng của perk đang mang (rỗng khi không có perk). */
export const perkEffects = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content): readonly PerkEffect[] =>
  state.perk === null ? [] : (findPerk(content, state.kingId, state.perk)?.effects ?? []);

/** Cộng `pick(e)` của mọi hiệu ứng có `type` khớp. */
const sumOf = <T extends PerkEffect['type']>(
  effects: readonly PerkEffect[],
  type: T,
  pick: (e: Extract<PerkEffect, { type: T }>) => number,
): number =>
  effects.reduce((sum, e) => (e.type === type ? sum + pick(e as Extract<PerkEffect, { type: T }>) : sum), 0);

/** Áp các hiệu ứng `start*` của perk lên ván vừa dựng (năm 0, trước `startYear`). */
export function applyStartPerk(input: RunState, content: Content): RunState {
  const effects = perkEffects(input, content);
  if (effects.length === 0) return input;
  const state = structuredClone(input);
  for (const e of effects) {
    switch (e.type) {
      case 'startGold':
        state.gold += e.amount;
        break;
      case 'startLives':
        state.lives = Math.min(e.lives, RUN.maxLives);
        break;
      case 'startUnlocked':
        for (const plot of e.plots) state.plots = unlockPlot(state.plots, plot);
        break;
      case 'startBuilding':
        state.plots = unlockPlot(state.plots, e.plot);
        state.plots = placeBuilding(state.plots, e.plot, {
          uid: state.nextUid,
          cardId: e.card,
          level: 1,
          enchants: [],
          placedYear: 1,
          permanent: {},
          ageBonus: 0,
          counters: {},
          movedYear: null,
        });
        state.nextUid += 1;
        break;
      case 'startDeckCard':
        state.deck = [...state.deck, e.card];
        state.discardPile = [...state.discardPile, e.card];
        break;
      case 'startThroneEnchant':
        for (let i = 0; i < e.stacks; i++) {
          state.plots = attachEnchant(state.plots, THRONE_PLOT, e.card, maxEnchantStacks(state, content));
        }
        break;
      default:
        break; // chỉ số, móc luật ván và mod trận được đọc ở nơi khác
    }
  }
  return state;
}

/** Tổng stack Bùa tối đa trên một công trình của ván (perk Sách Phép Dày nâng lên). */
export const maxEnchantStacks = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content): number => {
  let max: number = RUN.maxEnchantStacks;
  for (const e of perkEffects(state, content)) if (e.type === 'maxEnchantStacks') max = Math.max(max, e.value);
  return max;
};

/** Lượt đổi bài miễn phí mỗi năm do perk (cộng với sắc lệnh). */
export const perkFreeRerolls = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content): number =>
  sumOf(perkEffects(state, content), 'freeRerolls', (e) => e.count);

/** Vàng nhận khi thua trận năm `year` có thưởng `prize`: `floor(prize × pct / 100)`. */
export const perkLossGold = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content, prize: number): number => {
  const pct = sumOf(perkEffects(state, content), 'lossGold', (e) => e.pct);
  return pct > 0 ? Math.floor((prize * pct) / 100) : 0;
};

/** % giảm hồi chiêu Can Thiệp do perk. */
export const perkCooldownPct = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content): number =>
  sumOf(perkEffects(state, content), 'interventionCooldownPct', (e) => e.pct);

/** Lượt dời miễn phí cộng thêm mỗi năm. */
export const perkFreeMoves = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content): number =>
  sumOf(perkEffects(state, content), 'freeMoves', (e) => e.add);

/** Số Hồn cộng vào giá Thu Hồn. */
export const perkSoulCost = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content): number =>
  sumOf(perkEffects(state, content), 'soulCost', (e) => e.add);

/** `ageBonus` của công trình `card` vừa đặt mới. */
export const placedAgeBonus = (state: Pick<RunState, 'kingId' | 'perk'>, content: Content, card: CardDef): number =>
  perkEffects(state, content).reduce(
    (sum, e) => (e.type === 'placedAgeBonus' && card.tags.includes(e.tag) ? sum + e.years : sum),
    0,
  );

/**
 * Mod trận của perk (dữ liệu thuần, chép vào `BattleSetup.perk`): hồi máu Ngai, mốc Cuồng Nộ và giới
 * hạn thời gian (giá trị hiệu lực). Chỉ có trường khi perk đổi nó; rỗng → `{}`.
 */
export function perkBattleMods(state: Pick<RunState, 'kingId' | 'perk'>, content: Content): PerkBattleMods {
  const effects = perkEffects(state, content);
  const regen = sumOf(effects, 'throneRegenPct', (e) => e.pct);
  const ticks = sumOf(effects, 'battleTicks', (e) => e.ticks);
  return {
    ...(regen > 0 ? { throneRegenPct: regen } : {}),
    ...(ticks !== 0 ? { rageTick: BATTLE.rageTick + ticks, hardLimitTick: BATTLE.hardLimitTick + ticks } : {}),
  };
}
