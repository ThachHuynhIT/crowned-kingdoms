import { describe, expect, it } from 'vitest';
import { ENDLESS_BLESSINGS, type EndlessBlessingId } from '../../data/endless';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { CONTENT } from '../../game/cards/registry';
import { modifierAt } from '../../game/run/endlessModifiers';
import type { RunState } from '../../game/run/state';
import { newRun } from '../../game/run/yearFlow';
import type { Rect, Size } from '../hud/layout';
import {
  blessingChoices,
  blessingCommand,
  blessingLayout,
  blessingTitle,
  endlessPanelContent,
  modifierSummary,
  visibleBlessingCards,
} from './blessingModel';

const DESKTOP: Size = { w: 1280, h: 720 };
const MOBILE: Size = { w: 375, h: 812 };
const SHORT_PHONE: Size = { w: 375, h: 560 };

const endless = (over: Partial<RunState> = {}): RunState => ({ ...newRun(7, 'wheat', CONTENT, RULES_ENDLESS), ...over });

const offering = (ids: EndlessBlessingId[], stacks: Partial<Record<EndlessBlessingId, number>> = {}, year = 30): RunState => {
  const base = endless({ year });
  return {
    ...base,
    phase: 'blessing',
    offers: { kind: 'blessing', blessingIds: ids, year },
    endless: { ...base.endless!, blessingStacks: stacks, lastBlessingYear: year },
  };
};

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const contains = (o: Rect, r: Rect): boolean =>
  r.x >= o.x && r.y >= o.y && r.x + r.w <= o.x + o.w && r.y + r.h <= o.y + o.h;

describe('blessingChoices', () => {
  it('reads the three saved ids in their saved order, with no RNG and no state change', () => {
    const state = offering(['survey', 'harvest', 'vigor']);
    const before = JSON.stringify(state);
    const choices = blessingChoices(state);
    expect(choices.map((c) => c.id)).toEqual(['survey', 'harvest', 'vigor']);
    expect(choices.map((c) => c.index)).toEqual([0, 1, 2]);
    expect(JSON.stringify(state)).toBe(before);
    expect(blessingChoices(state)).toEqual(choices); // same answer every time
  });

  it('shows name, effect and current / max stacks, and the value after the pick', () => {
    const [harvest] = blessingChoices(offering(['harvest', 'might', 'vitality'], { harvest: 2 }));
    expect(harvest).toMatchObject({ nameVi: 'Mùa màng', stacks: 2, maxStacks: 10, capped: false });
    expect(harvest!.effectVi).toBe('+2 thuế đầu năm');
    expect(harvest!.stackVi).toBe('Đang có: 2/10');
    expect(harvest!.afterVi).toBe('Sau khi chọn: 3/10 (tổng +6 thuế đầu năm)');
  });

  it('a capped blessing says it pays 25 gold instead, before the pick', () => {
    const choices = blessingChoices(offering(['vitality', 'might', 'harvest'], { vitality: 2 }));
    expect(choices[0]).toMatchObject({ capped: true, stacks: 2, maxStacks: 2 });
    expect(choices[0]!.afterVi).toBe('Đã đạt giới hạn — nhận 25 vàng');
    expect(choices[1]!.capped).toBe(false);
  });

  it('is empty with no blessing offer (normal run, planning, council)', () => {
    expect(blessingChoices(newRun(7, 'wheat', CONTENT, RULES_FULL))).toEqual([]);
    expect(blessingChoices(endless())).toEqual([]);
  });
});

describe('blessingCommand', () => {
  it('sends pickBlessing with the index of an open choice only', () => {
    const state = offering(['survey', 'harvest', 'vigor']);
    expect(blessingCommand(state, 1)).toEqual({ type: 'pickBlessing', index: 1 });
    expect(blessingCommand(state, 3)).toBeNull();
    expect(blessingCommand(state, -1)).toBeNull();
    expect(blessingCommand(state, 0.5)).toBeNull();
    expect(blessingCommand(endless(), 0)).toBeNull();
  });
});

describe('blessingTitle', () => {
  it('names the year', () => {
    expect(blessingTitle(35)).toBe('Phúc lành năm 35');
  });
});

describe('modifierSummary', () => {
  it('before year 31: nothing yet, the first decade comes next', () => {
    const s = modifierSummary(endless({ year: 12 }));
    expect(s.current).toBeNull();
    const first = modifierAt(7, 31)!;
    expect(s.next).toMatchObject({ id: first.id, fromYear: 31, toYear: 40 });
  });

  it('inside a decade: the current one and the following one', () => {
    const base = endless({ year: 44 });
    const m = modifierAt(7, 44)!;
    const state: RunState = { ...base, endless: { ...base.endless!, modifierId: m.id, modifierStartYear: m.startYear } };
    const s = modifierSummary(state);
    expect(s.current).toMatchObject({ id: m.id, fromYear: 41, toYear: 50 });
    expect(s.next).toMatchObject({ id: modifierAt(7, 51)!.id, fromYear: 51, toYear: 60 });
    expect(s.current!.effectVi.length).toBeGreaterThan(0);
  });
});

describe('endlessPanelContent', () => {
  it('lists all twelve blessings with stacks, then the current and next decade', () => {
    const state = offering(['survey', 'harvest', 'vigor'], { harvest: 3, vitality: 1 });
    const c = endlessPanelContent(state);
    expect(c.title).toBe('Phúc lành & Biến thể');
    const text = c.lines.map((l) => l.map((p) => ('text' in p ? p.text : '')).join(''));
    for (const b of ENDLESS_BLESSINGS) expect(text.some((t) => t.startsWith(`${b.name} `)), b.id).toBe(true);
    expect(text.filter((t) => /\d+\/\d+/.test(t))).toHaveLength(12);
    expect(text.some((t) => t.startsWith('Mùa màng 3/10'))).toBe(true);
    expect(text.some((t) => t.startsWith('Phúc thọ 1/2'))).toBe(true);
    expect(text.some((t) => t.startsWith('Biến thể hiện tại'))).toBe(true);
    expect(text.some((t) => t.startsWith('Kế tiếp'))).toBe(true);
  });
});

describe('blessingLayout', () => {
  for (const [name, screen] of [
    ['desktop', DESKTOP],
    ['mobile', MOBILE],
    ['short phone', SHORT_PHONE],
    ['tablet 768', { w: 768, h: 1024 }],
  ] as const) {
    it(`fits the screen; ≥ 44 px buttons inside their cards; nothing overlaps (${name})`, () => {
      const l = blessingLayout(screen, 12, 3);
      expect(contains({ x: 0, y: 0, ...screen }, l.panel)).toBe(true);
      expect(l.cards).toHaveLength(3);
      expect(l.picks).toHaveLength(3);
      for (const [i, b] of l.picks.entries()) {
        expect(b.w).toBeGreaterThanOrEqual(44);
        expect(b.h).toBeGreaterThanOrEqual(44);
        expect(contains(l.cards[i]!, b)).toBe(true);
      }
      expect(l.view.w).toBeGreaterThanOrEqual(44);
      expect(l.view.h).toBeGreaterThanOrEqual(44);
      for (const r of [l.title, l.view, l.viewport]) expect(contains(l.panel, r)).toBe(true);
      const shown = visibleBlessingCards(l);
      l.cards.forEach((r, i) => {
        if (shown[i]) expect(contains(l.panel, r)).toBe(true);
      });
      expect(shown[0]).toBe(true);
      expect(overlaps(l.title, l.view)).toBe(false);
      for (let i = 0; i < 3; i++) {
        expect(overlaps(l.cards[i]!, l.title)).toBe(false);
        for (let j = i + 1; j < 3; j++) expect(overlaps(l.cards[i]!, l.cards[j]!)).toBe(false);
      }
    });
  }

  it('desktop puts the three choices side by side', () => {
    const l = blessingLayout(DESKTOP, 12, 3);
    expect(new Set(l.cards.map((c) => c.y)).size).toBe(1);
    expect(l.scrollMax).toBe(0);
    expect(visibleBlessingCards(l)).toEqual([true, true, true]);
  });

  it('phones stack them in one column; a short phone scrolls instead of shrinking the buttons', () => {
    const tall = blessingLayout(MOBILE, 12, 3);
    expect(new Set(tall.cards.map((c) => c.x)).size).toBe(1);
    expect(tall.scrollMax).toBe(0);
    const short = blessingLayout(SHORT_PHONE, 12, 3);
    expect(short.scrollMax).toBeGreaterThan(0);
    expect(visibleBlessingCards(short)).toContain(false);
    const end = blessingLayout(SHORT_PHONE, 12, 3, short.scrollMax);
    expect(visibleBlessingCards(end)[2]).toBe(true);
    expect(end.cards[0]!.h).toBe(short.cards[0]!.h);
  });
});
