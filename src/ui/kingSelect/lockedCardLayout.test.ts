import { describe, expect, it } from 'vitest';
import { carouselScreen, carouselSlots, unlockButtonRect } from './carouselLayout';
import { lockedCardLayout } from './lockedCardLayout';
import { detailLayout } from './detailLayout';

const inside = (inner: { x: number; y: number; w: number; h: number }, outer: { x: number; y: number; w: number; h: number }): boolean =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;

describe('lockedCardLayout', () => {
  it('desktop middle card (×3, 198×288): a 48 px padlock centred in the window, the note under it, above the unlock button', () => {
    const card = { x: 541, y: 160, w: 198, h: 288 };
    const l = lockedCardLayout(card);
    expect(l.lock).toEqual({ x: 541 + 75, y: 160 + 81, scale: 3 });
    expect(l.note).toEqual({ x: 541 + 27, y: 160 + 138, w: 144, h: 224 - 138 });
    expect(l.note.y + l.note.h).toBeLessThanOrEqual(unlockButtonRect(card).y);
  });

  it('every carousel card on desktop and phone: whole px, padlock and note inside the portrait window, note below the padlock', () => {
    for (const screen of [{ w: 1280, h: 720 }, { w: 375, h: 812 }, { w: 1920, h: 1080 }]) {
      const cs = carouselScreen(screen);
      for (const slot of carouselSlots(cs.area, 4, 9)) {
        const card = slot.rect;
        const s = card.w / 66;
        const win = { x: card.x + 9 * s - 1, y: card.y + 8 * s - 1, w: 48 * s + 2, h: 72 * s + 2 };
        const l = lockedCardLayout(card);
        const size = 16 * l.lock.scale;
        expect(Number.isInteger(l.lock.scale) && l.lock.scale >= 1).toBe(true);
        for (const v of [l.lock.x, l.lock.y, l.note.x, l.note.y, l.note.w, l.note.h]) expect(Number.isInteger(v)).toBe(true);
        expect(inside({ x: l.lock.x, y: l.lock.y, w: size, h: size }, win)).toBe(true);
        expect(inside(l.note, win)).toBe(true);
        expect(Math.abs(l.lock.x + size / 2 - (card.x + card.w / 2))).toBeLessThanOrEqual(1);
        expect(l.note.y).toBeGreaterThan(l.lock.y + size);
      }
    }
  });

  it('works for the detail portrait as well (integer card scale)', () => {
    const portrait = detailLayout({ w: 1280, h: 720 }, 6).portrait;
    const card = { ...portrait, w: 66 * Math.floor(portrait.w / 66), h: 96 * Math.floor(portrait.w / 66) };
    const l = lockedCardLayout(card);
    expect(l.lock.scale).toBe(Math.floor(portrait.w / 66));
    expect(l.note.h).toBeGreaterThan(0);
  });
});
