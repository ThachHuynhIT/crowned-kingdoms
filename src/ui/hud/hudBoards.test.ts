import { describe, expect, it } from 'vitest';
import { handWindow } from '../planning/handLayoutModel';
import { battleLayout, planningLayout } from '../realm/realmLayout';
import { battleBoards, hudBoards } from './hudBoards';

const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const contains = (o: { x: number; y: number; w: number; h: number }, r: { x: number; y: number; w: number; h: number }): boolean =>
  r.x >= o.x && r.y >= o.y && r.x + r.w <= o.x + o.w && r.y + r.h <= o.y + o.h;

describe('desktop HUD backboards (12/11/2026)', () => {
  for (const screen of [
    { w: 1280, h: 720 },
    { w: 1920, h: 1080 },
    { w: 1024, h: 768 },
    { w: 960, h: 540 },
    { w: 844, h: 390 },
  ]) {
    it(`${screen.w}×${screen.h}: each board holds its controls and none covers the board or another board`, () => {
      const l = planningLayout(screen, 5);
      const { viewport } = handWindow(screen, 5, 0);
      const enemy = l.scoutButton ?? l.calendar[l.calendar.length - 1]!;
      const b = hudBoards(screen, l, viewport, enemy);
      expect(contains(b.top, l.lives)).toBe(true);
      for (const c of l.calendar) expect(contains(b.top, c)).toBe(true);
      for (const r of [l.shop, l.reroll, l.sell]) expect(contains(b.left, r)).toBe(true);
      expect(contains(b.right, l.deck)).toBe(true);
      expect(contains(b.hand, viewport)).toBe(true);
      const boards = [b.top, b.left, b.hand, b.right];
      for (const [i, r] of boards.entries()) for (const o of boards.slice(i + 1)) expect(overlaps(r, o)).toBe(false);
      expect(b.top.y + b.top.h).toBeLessThanOrEqual(l.board.y);
      expect(b.hand.y).toBeGreaterThanOrEqual(l.board.y + l.board.h);
    });
  }
});

describe('battle HUD backboards', () => {
  for (const screen of [{ w: 1280, h: 720 }, { w: 1024, h: 768 }, { w: 844, h: 390 }, { w: 667, h: 375 }]) {
    it(`${screen.w}×${screen.h}: the boards hold the top row and the speed buttons without covering the bars`, () => {
      const l = battleLayout(screen);
      const b = battleBoards(screen, l);
      expect(contains(b.top, l.lives)).toBe(true);
      const speedBoard = b.speed ?? b.top;
      for (const s of l.speed) expect(contains(speedBoard, s)).toBe(true);
      for (const r of [b.top, ...(b.speed ? [b.speed] : [])]) {
        expect(overlaps(r, l.allyStatus)).toBe(false);
        expect(overlaps(r, l.foeStatus)).toBe(false);
        expect(overlaps(r, l.year)).toBe(false);
        expect(overlaps(r, l.clock)).toBe(false);
      }
    });
  }
});
