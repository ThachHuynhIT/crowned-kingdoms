/**
 * Pure model of the Endless blessing modal and the "Phúc lành & Biến thể" panel (spec 2026-11-09
 * §5–§7): the choices of the saved offer, their texts, the command a pick sends, the decade
 * modifiers and the layout. Reads state only (no RNG, no state change); no Phaser.
 */
import {
  ENDLESS_BLESSINGS,
  ENDLESS_INTEREST_CAP_PER_STACK,
  ENDLESS_MAXED_BLESSING_GOLD,
  ENDLESS_MODIFIERS,
  ENDLESS_MODIFIER_FIRST_YEAR,
  ENDLESS_MODIFIER_SPAN,
  type EndlessBlessingDef,
  type EndlessBlessingId,
  type EndlessModifierDef,
  type EndlessModifierId,
} from '../../data/endless';
import { UI_PALETTE } from '../../data/uiPalette';
import { blessingStacks } from '../../game/run/endlessBlessings';
import { modifierAt } from '../../game/run/endlessModifiers';
import type { RunCommand, RunState } from '../../game/run/state';
import { MARGIN, type Rect, type Size, type TooltipContent, type TooltipLine } from '../hud/layout';
import { isDesktop } from '../realm/realmLayout';
import { centredPanel } from './modalLayout';

/** Title of the blessing modal. */
export const blessingTitle = (year: number): string => `Phúc lành năm ${year}`;
/** Title of the summary panel and of its HUD button's tooltip. */
export const ENDLESS_PANEL_TITLE = 'Phúc lành & Biến thể';
/** The capped-blessing line (spec §5). */
export const CAPPED_BLESSING_TEXT = `Đã đạt giới hạn — nhận ${ENDLESS_MAXED_BLESSING_GOLD} vàng`;

const blessingDef = (id: EndlessBlessingId): EndlessBlessingDef => ENDLESS_BLESSINGS.find((b) => b.id === id)!;

/** What `stacks` stacks of a blessing give together ("+6 thuế đầu năm"). */
export const blessingEffectText = (def: EndlessBlessingDef, stacks = 1): string => {
  const n = def.amount * stacks;
  switch (def.effect) {
    case 'taxFlat':
      return `+${n} thuế đầu năm`;
    case 'battleGoldFlat':
      return `+${n} vàng thưởng khi thắng trận`;
    case 'unitHpPct':
      return `+${n}% máu lính (gồm lính triệu hồi)`;
    case 'unitDmgPct':
      return `+${n}% sát thương lính (gồm lính triệu hồi)`;
    case 'unitSpeedPct':
      return `+${n}% tốc độ di chuyển của lính`;
    case 'towerDmgPct':
      return `+${n}% sát thương tháp (không gồm Ngai)`;
    case 'towerAttackSpeedPct':
      return `+${n}% tốc đánh tháp`;
    case 'structureHpPct':
      return `+${n}% máu mọi công trình (gồm Ngai)`;
    case 'maxLives':
      return stacks === 1 ? `+${n} mạng tối đa, hồi ngay ${n} mạng` : `+${n} mạng tối đa`;
    case 'interestPct':
      return `+${n}% lãi vàng đầu năm (tối đa ${ENDLESS_INTEREST_CAP_PER_STACK * stacks} vàng)`;
    case 'freeRerolls':
      return `+${n} lần đổi bài miễn phí mỗi năm`;
    case 'plotDiscountPct':
      return `−${n}% giá mua ô`;
  }
};

/** One choice of the open blessing offer, ready to draw. */
export interface BlessingChoice {
  readonly index: number;
  readonly id: EndlessBlessingId;
  readonly nameVi: string;
  /** What one more stack gives. */
  readonly effectVi: string;
  readonly stacks: number;
  readonly maxStacks: number;
  readonly capped: boolean;
  readonly stackVi: string;
  /** The total after the pick, or the 25-gold notice when the blessing is capped. */
  readonly afterVi: string;
}

/** The choices of the saved blessing offer, in its saved order; [] without one. */
export const blessingChoices = (state: RunState): BlessingChoice[] => {
  const offer = state.offers;
  if (state.phase !== 'blessing' || offer?.kind !== 'blessing') return [];
  return offer.blessingIds.map((id, index) => {
    const def = blessingDef(id);
    const stacks = blessingStacks(state, id);
    const capped = stacks >= def.maxStacks;
    return {
      index,
      id,
      nameVi: def.name,
      effectVi: blessingEffectText(def),
      stacks,
      maxStacks: def.maxStacks,
      capped,
      stackVi: `Đang có: ${stacks}/${def.maxStacks}`,
      afterVi: capped
        ? CAPPED_BLESSING_TEXT
        : `Sau khi chọn: ${stacks + 1}/${def.maxStacks} (tổng ${blessingEffectText(def, stacks + 1)})`,
    };
  });
};

/** The command for a tap on choice `index`; null when there is no such open choice. */
export const blessingCommand = (state: RunState, index: number): RunCommand | null =>
  Number.isInteger(index) && index >= 0 && index < blessingChoices(state).length ? { type: 'pickBlessing', index } : null;

// ---- decade modifiers ------------------------------------------------------------------------

/** A decade modifier with its years and its effect in words. */
export interface ModifierInfo {
  readonly id: EndlessModifierId;
  readonly nameVi: string;
  readonly fromYear: number;
  readonly toYear: number;
  readonly effectVi: string;
}

const pct = (n: number): string => `${n > 0 ? '+' : '−'}${Math.abs(n)}%`;

/** The effect of a modifier, built from its data (no hard-coded numbers). */
export const modifierEffectText = (m: EndlessModifierDef): string => {
  const parts: string[] = [];
  if (m.foeHpPct !== 0) parts.push(`địch ${pct(m.foeHpPct)} máu`);
  if (m.foeDmgPct !== 0 && m.foeDmgPct === m.allyDmgPct) parts.push(`cả hai phe ${pct(m.foeDmgPct)} sát thương`);
  else {
    if (m.foeDmgPct !== 0) parts.push(`địch ${pct(m.foeDmgPct)} sát thương`);
    if (m.allyDmgPct !== 0) parts.push(`phe mình ${pct(m.allyDmgPct)} sát thương`);
  }
  if (m.taxFlat !== 0) parts.push(`thuế ${m.taxFlat > 0 ? '+' : '−'}${Math.abs(m.taxFlat)} (không dưới 0)`);
  if (m.battleGoldFlat !== 0) parts.push(`+${m.battleGoldFlat} vàng thưởng khi thắng trận`);
  if (m.budgetPct !== 100) parts.push(`quân địch ×${String(m.budgetPct / 100).replace('.', ',')}`);
  if (m.structureHpPct !== 0) parts.push(`công trình ${pct(m.structureHpPct)} máu (gồm Ngai)`);
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
};

const info = (seed: number, year: number): ModifierInfo | null => {
  const at = modifierAt(seed, year);
  if (at === null) return null;
  const def = ENDLESS_MODIFIERS.find((m) => m.id === at.id)!;
  return {
    id: def.id,
    nameVi: def.name,
    fromYear: at.startYear,
    toYear: at.startYear + ENDLESS_MODIFIER_SPAN - 1,
    effectVi: modifierEffectText(def),
  };
};

/** The modifier of a year (null before 31), for the calendar; pure, no RNG. */
export const modifierFor = (seed: number, year: number): ModifierInfo | null => info(seed, year);

/** The decade modifier in force now (null before year 31) and the next one. */
export const modifierSummary = (
  state: Pick<RunState, 'seed' | 'year'>,
): { current: ModifierInfo | null; next: ModifierInfo } => {
  const current = info(state.seed, state.year);
  const nextYear = current === null ? ENDLESS_MODIFIER_FIRST_YEAR : current.toYear + 1;
  return { current, next: info(state.seed, nextYear)! };
};

// ---- the summary panel ----------------------------------------------------------------------

const line = (text: string, color?: number): TooltipLine => [{ text, color }];

/** Content of "Phúc lành & Biến thể": the twelve blessings with stacks, then this and the next decade. */
export const endlessPanelContent = (state: RunState): TooltipContent => {
  const lines: TooltipLine[] = [];
  for (const def of ENDLESS_BLESSINGS) {
    const stacks = blessingStacks(state, def.id);
    const total = stacks > 0 ? ` — ${blessingEffectText(def, stacks)}` : ` — mỗi lần ${blessingEffectText(def)}`;
    lines.push(line(`${def.name} ${stacks}/${def.maxStacks}${total}`, stacks > 0 ? UI_PALETTE.good : undefined));
  }
  const { current, next } = modifierSummary(state);
  lines.push(line(''));
  lines.push(
    line(
      current === null
        ? `Biến thể hiện tại: chưa có (bắt đầu từ năm ${ENDLESS_MODIFIER_FIRST_YEAR})`
        : `Biến thể hiện tại: ${current.nameVi} (năm ${current.fromYear}–${current.toYear})`,
      UI_PALETTE.woodDark,
    ),
  );
  if (current !== null) lines.push(line(current.effectVi));
  lines.push(line(`Kế tiếp: ${next.nameVi} (năm ${next.fromYear}–${next.toYear})`, UI_PALETTE.woodDark));
  lines.push(line(next.effectVi));
  return { title: ENDLESS_PANEL_TITLE, lines };
};

// ---- layout ----------------------------------------------------------------------------------

export interface BlessingLayout {
  panel: Rect;
  title: Rect;
  /** "Xem tổng hợp": opens the summary panel over the modal. */
  view: Rect;
  /** Clips the choice cards; a short phone scrolls them inside it. */
  viewport: Rect;
  cards: readonly Rect[];
  /** "Chọn" inside each card. */
  picks: readonly Rect[];
  scrollMax: number;
}

const TITLE_H = 44;
const GAP = 12;
const VIEW_W = 150;
const PICK = { w: 120, h: 44 } as const;
const CARD_DESK = { w: 260, h: 240, gap: 12 } as const;
const CARD_PHONE = { w: 355, h: 176, gap: 8 } as const;

/**
 * The blessing modal: title and "Xem tổng hợp" on top, then `count` choice cards side by side
 * (desktop) or stacked in one column (phones), each with its own "Chọn" at the bottom. A screen too
 * short for the column scrolls it (`scroll` px, clamped) instead of shrinking anything.
 */
export const blessingLayout = (screen: Size, inset: number, count = 3, scroll = 0): BlessingLayout => {
  const desktop = isDesktop(screen.w);
  const n = Math.max(1, count);
  const card = desktop ? CARD_DESK : CARD_PHONE;
  const maxInner = screen.w - 2 * MARGIN - 2 * inset;
  const cardW = Math.min(card.w, desktop ? Math.floor((maxInner - (n - 1) * card.gap) / n) : maxInner);
  const rowW = desktop ? n * cardW + (n - 1) * card.gap : cardW;
  const grid = desktop ? card.h : n * card.h + (n - 1) * card.gap;
  const fixed = 2 * inset + TITLE_H + GAP;
  const room = screen.h - 2 * MARGIN - fixed;
  const visible = Math.max(card.h, Math.min(grid, room));
  const scrollMax = Math.max(0, grid - visible);
  const at = Math.max(0, Math.min(scroll, scrollMax));
  const panel = centredPanel(screen, Math.max(rowW, VIEW_W + 160) + 2 * inset, fixed + visible);
  const innerX = panel.x + inset;
  const innerW = panel.w - 2 * inset;
  const view = { x: innerX + innerW - VIEW_W, y: panel.y + inset, w: VIEW_W, h: TITLE_H };
  const title = { x: innerX, y: panel.y + inset, w: Math.max(0, innerW - VIEW_W - 8), h: TITLE_H };
  const x0 = Math.round(panel.x + (panel.w - rowW) / 2);
  const viewport = { x: x0, y: title.y + TITLE_H + GAP, w: rowW, h: visible };
  const cards = Array.from({ length: n }, (_, i) => ({
    x: desktop ? x0 + i * (cardW + card.gap) : x0,
    y: desktop ? viewport.y : viewport.y + i * (card.h + card.gap) - at,
    w: cardW,
    h: card.h,
  }));
  const picks = cards.map((c) => ({
    x: Math.round(c.x + (c.w - PICK.w) / 2),
    y: c.y + c.h - PICK.h - 8,
    w: PICK.w,
    h: PICK.h,
  }));
  return { panel, title, view, viewport, cards, picks, scrollMax };
};

/** Which choice cards lie fully inside the viewport (the others are hidden until scrolled in). */
export const visibleBlessingCards = (l: BlessingLayout): boolean[] =>
  l.cards.map((r) => r.y >= l.viewport.y && r.y + r.h <= l.viewport.y + l.viewport.h);
