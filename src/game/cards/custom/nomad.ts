/** Hiệu ứng riêng của thẻ chinh phục Vua Du Mục (spec §6.11). */
import type { BuildingKind } from '../../../data/types';
import { THRONE_PLOT, neighbours } from '../../run/board';
import type { IllegalReason, RunState } from '../../run/state';
import type { Content } from '../registry';
import type { FullRunCardHooks } from './fullRunTypes';
import type { IncomeHandler, StatHandler } from './types';

const KINDS: readonly BuildingKind[] = ['troop', 'tower', 'economy', 'support'];
const CARAVAN = 'nomad_caravan';
const CARAVAN_MAX_PER_YEAR = 3;

/** Chợ Phiên: +1 vàng cho mỗi loại công trình (lính / tháp / kinh tế / hỗ trợ) khác nhau ở lân cận. */
export const bazaarKinds: IncomeHandler = (ctx) => {
  const seen = new Set<BuildingKind>();
  for (const n of neighbours(ctx.source.plot)) {
    const b = ctx.state.plots[n]?.building;
    if (b === null || b === undefined) continue;
    const kind = ctx.content.card(b.cardId).kind as BuildingKind;
    if (KINDS.includes(kind)) seen.add(kind);
  }
  return seen.size;
};

/** Chòi Canh: +`pct`% sát thương cho mỗi ô lân cận đã mở mà còn trống (chỉ cho chính nó). */
export const watchtowerOpen: StatHandler = (ctx, params) => {
  if (ctx.source.plot !== ctx.target.plot) return [];
  const pct = typeof params.pct === 'number' ? params.pct : 0;
  const open = neighbours(ctx.source.plot).filter((n) => {
    const p = ctx.state.plots[n]!;
    return p.unlocked && p.building === null;
  }).length;
  return open > 0 ? [{ stat: 'dmg', mode: 'pct', value: pct * open }] : [];
};

/** Số lượt dời miễn phí mỗi năm theo cấp Ngai (0 nếu Ngai không có Lều Di Động). */
export function freeMovesAllowed(state: RunState, content: Content): number {
  for (const e of content.king(state.kingId).throne.passive) {
    if (e.type !== 'custom' || e.id !== 'nomad_mobile_camp') continue;
    const moves = e.params?.moves;
    if (moves === undefined) return 0;
    return typeof moves === 'number' ? moves : (moves[state.throneLevel - 1] ?? 0);
  }
  return 0;
}

/**
 * Luật duy nhất cho lệnh `freeMove` (cũng dùng để tô ô hợp lệ trên giao diện): trả lý do bị từ chối,
 * hoặc `null` nếu dời được `from` → `to` (ô đích có công trình thì đổi chỗ).
 */
export function freeMoveIllegal(state: RunState, content: Content, from: number, to: number): IllegalReason | null {
  if (state.phase !== 'planning') return 'wrongPhase';
  if (state.kingId !== 'nomad') return 'wrongKing';
  if (state.freeMovesUsed >= freeMovesAllowed(state, content)) return 'noFreeMove';
  const valid = (p: number): boolean => Number.isInteger(p) && p >= 0 && p < state.plots.length;
  if (!valid(from) || !valid(to) || from === to) return 'badTarget';
  if (from === THRONE_PLOT || to === THRONE_PLOT) return 'throne';
  if (!state.plots[from]!.unlocked || !state.plots[to]!.unlocked) return 'locked';
  if (state.plots[from]!.building === null) return 'noBuilding';
  if (!neighbours(from).includes(to)) return 'notAdjacent';
  return null;
}

/**
 * Đoàn Lữ Hành: mỗi hành động dời công trình (kể cả đổi chỗ, chỉ tính một lần) cho +1 vàng ngay,
 * tối đa 3 mỗi năm cho mỗi đoàn; bộ đếm nằm trong `counters` của đoàn.
 */
const afterMove: FullRunCardHooks['afterMove'] = (state) => {
  if (!state.plots.some((p) => p.building?.cardId === CARAVAN)) return state;
  let gold = 0;
  const plots = state.plots.map((p) => ({ ...p, building: p.building ? structuredClone(p.building) : null }));
  for (const p of plots) {
    const b = p.building;
    if (b?.cardId !== CARAVAN) continue;
    if (b.counters.caravanYear !== state.year) {
      b.counters.caravanYear = state.year;
      b.counters.caravanMoves = 0;
    }
    if (b.counters.caravanMoves! < CARAVAN_MAX_PER_YEAR) {
      b.counters.caravanMoves = b.counters.caravanMoves! + 1;
      gold += 1;
    }
  }
  return { ...state, plots, gold: state.gold + gold, stats: { ...state.stats, goldEarned: state.stats.goldEarned + gold } };
};

export const NOMAD_HOOKS: Partial<FullRunCardHooks> = { afterMove };
