/**
 * Biến thể thập niên của Vô tận (spec 2026-11-09 §6) và phần cộng chỉ số của phúc lành/biến thể cho
 * phe mình. Thuần; không tiêu thụ RNG; ván thường không nhận gì.
 */
import { hashSeed } from '../../core/random';
import {
  ENDLESS_BLESSINGS,
  ENDLESS_MODIFIERS,
  ENDLESS_MODIFIER_FIRST_YEAR,
  ENDLESS_MODIFIER_IDS,
  ENDLESS_MODIFIER_SPAN,
  type EndlessBlessingEffect,
  type EndlessModifierDef,
  type EndlessModifierId,
} from '../../data/endless';
import type { StatKey } from '../../data/types';
import type { RunState } from './state';

/**
 * Biến thể của năm `year`: không có trước 31; từ 31 mỗi khối 10 năm lấy id kế tiếp theo vòng, bắt đầu
 * ở `hashSeed(seed + ':endless-modifier') % 4`.
 */
export function modifierAt(seed: number, year: number): { id: EndlessModifierId; startYear: number } | null {
  if (!Number.isFinite(year) || year < ENDLESS_MODIFIER_FIRST_YEAR) return null;
  const block = Math.floor((Math.floor(year) - ENDLESS_MODIFIER_FIRST_YEAR) / ENDLESS_MODIFIER_SPAN);
  const n = ENDLESS_MODIFIER_IDS.length;
  const offset = hashSeed(`${seed}:endless-modifier`) % n;
  return {
    id: ENDLESS_MODIFIER_IDS[(offset + (block % n)) % n]!,
    startYear: ENDLESS_MODIFIER_FIRST_YEAR + block * ENDLESS_MODIFIER_SPAN,
  };
}

/** Ghi biến thể của `state.year` vào trạng thái Vô tận (đầu năm, trước đạo quân/thu nhập). */
export function withYearModifier(state: RunState): RunState {
  if (state.endless === null) return state;
  const m = modifierAt(state.seed, state.year);
  return {
    ...state,
    endless: { ...state.endless, modifierId: m?.id ?? null, modifierStartYear: m?.startYear ?? 0 },
  };
}

/** Biến thể đang áp của ván, hoặc `null`. */
export const activeModifier = (state: Pick<RunState, 'endless'>): EndlessModifierDef | null => {
  const id = state.endless?.modifierId ?? null;
  return id === null ? null : ENDLESS_MODIFIERS.find((m) => m.id === id)!;
};

const total = (state: Pick<RunState, 'endless'>, effect: EndlessBlessingEffect): number => {
  if (state.endless === null) return 0;
  let sum = 0;
  for (const b of ENDLESS_BLESSINGS) if (b.effect === effect) sum += (state.endless.blessingStacks[b.id] ?? 0) * b.amount;
  return sum;
};

/**
 * % cộng cho phe mình theo nhóm (spec §5, §6): `unit` lính (gồm summon và DOT của chúng), `tower`
 * tháp (đạn, pulse, DOT, tốc đánh; không gồm Ngai), `structure` HP mọi công trình gồm Ngai. Chỉ chứa khoá ≠ 0.
 */
export function endlessStatBonuses(
  state: Pick<RunState, 'endless'>,
  kind: 'unit' | 'tower' | 'structure',
): Partial<Record<StatKey, number>> {
  if (state.endless === null) return {};
  const mod = activeModifier(state);
  const out: Partial<Record<StatKey, number>> = {};
  const put = (stat: StatKey, value: number): void => {
    if (value !== 0) out[stat] = (out[stat] ?? 0) + value;
  };
  if (kind === 'unit') {
    put('hp', total(state, 'unitHpPct'));
    put('dmg', total(state, 'unitDmgPct') + (mod?.allyDmgPct ?? 0));
    put('speed', total(state, 'unitSpeedPct'));
    put('burnDps', total(state, 'unitDmgPct') + (mod?.allyDmgPct ?? 0));
  } else if (kind === 'tower') {
    put('dmg', total(state, 'towerDmgPct') + (mod?.allyDmgPct ?? 0));
    put('attackSpeed', total(state, 'towerAttackSpeedPct'));
    put('burnDps', total(state, 'towerDmgPct') + (mod?.allyDmgPct ?? 0));
  } else {
    put('structureHp', total(state, 'structureHpPct') + (mod?.structureHpPct ?? 0));
  }
  return out;
}
