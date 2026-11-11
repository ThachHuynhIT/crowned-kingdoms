import { describe, expect, it } from 'vitest';
import { blessingLayout } from '../modals/blessingModel';
import { detailLayout, perkDialogLayout } from './detailLayout';

const on = (r: { x: number; y: number; w: number; h: number }, s: { w: number; h: number }): boolean =>
  r.x >= 0 && r.y >= 0 && r.x + r.w <= s.w && r.y + r.h <= s.h;

describe('king select and blessing on landscape phones (night 12/11/2026)', () => {
  for (const screen of [
    { w: 667, h: 375 },
    { w: 844, h: 390 },
    { w: 932, h: 430 },
  ]) {
    it(`${screen.w}×${screen.h}: every king-select control is on screen`, () => {
      const l = detailLayout(screen, 16);
      for (const [name, r] of Object.entries({ back: l.back, play: l.play, previous: l.previous, next: l.next, reroll: l.reroll, perks: l.perks, difficulty: l.difficulty }))
        expect(on(r, screen), `${name} ${JSON.stringify(r)}`).toBe(true);
      for (const m of l.modes) expect(on(m, screen), `mode ${JSON.stringify(m)}`).toBe(true);
      const d = perkDialogLayout(screen, 16);
      expect(on(d.close, screen)).toBe(true);
      for (const r of d.rows) expect(on(r, screen), `perk row ${JSON.stringify(r)}`).toBe(true);
    });
    it(`${screen.w}×${screen.h}: the blessing picks are on screen`, () => {
      const b = blessingLayout(screen, 16, 3);
      expect(on(b.view, screen)).toBe(true);
      for (const p of b.picks) expect(on(p, screen) || p.y > b.viewport.y + b.viewport.h, JSON.stringify(p)).toBe(true);
    });
  }
});
