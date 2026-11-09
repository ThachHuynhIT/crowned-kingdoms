import type { KingId } from './types';

/** Luật một ván (spec §3.2, §14): số năm, lịch kẻ địch, và trận có tự bắt đầu hay không. */
export interface Rules {
  readonly years: number;
  /**
   * `raiders`: mọi năm Thổ Phỉ (G1); `short`: 15 năm với 2 vua địch (G2); `full`: 30 năm (G3);
   * `endless`: Vô tận — lặp mẫu 30 năm của `full`, không có năm kết thúc (spec 2026-11-09 §3).
   */
  readonly calendar: 'raiders' | 'short' | 'full' | 'endless';
  /** Trận tự bắt đầu sau khi chơi/bán thẻ (G1); từ G2 tắt để còn đổi bài, mua ô. */
  readonly autoStart: boolean;
}

/** Các vua chơi được ở G2; hai vua còn lại (trừ vua người chơi) là kẻ địch. */
export const PLAYABLE_KINGS_G2: readonly KingId[] = ['wheat', 'stone', 'arcane'];

/** Cả chín vua theo id, thứ tự cố định để xáo bằng `Rng(calendar)` ổn định. */
export const ALL_KINGS: readonly KingId[] = [
  'arcane',
  'clock',
  'forge',
  'grove',
  'moon',
  'nomad',
  'stone',
  'tide',
  'wheat',
];

export const RULES_G1: Rules = { years: 10, calendar: 'raiders', autoStart: true };
export const RULES_G2: Rules = { years: 15, calendar: 'short', autoStart: false };
/** Ván đầy đủ G3: 30 năm, lịch §3.5, hội đồng, nhiệm vụ và boss. */
export const RULES_FULL: Rules = { years: 30, calendar: 'full', autoStart: false };

/** Chế độ chơi của một ván (spec 2026-11-09): thường hay Vô tận. */
export type RunMode = 'normal' | 'endless';

/**
 * Vô tận (spec 2026-11-09 §3): `years` là độ dài mẫu lịch, KHÔNG phải hạn kết thúc; ván chỉ hết khi
 * hết mạng.
 */
export const RULES_ENDLESS: Rules = { years: 30, calendar: 'endless', autoStart: false };

/** Chế độ suy từ luật: chỉ lịch `endless` là Vô tận. */
export const modeForRules = (rules: Rules): RunMode => (rules.calendar === 'endless' ? 'endless' : 'normal');

/** Lịch có hội đồng, nhiệm vụ và boss (lịch đầy đủ hoặc Vô tận). */
export const hasFullCalendar = (rules: Rules): boolean => rules.calendar === 'full' || rules.calendar === 'endless';
