import { describe, expect, it } from 'vitest';
import { ENEMY_PORTAL } from './battle';
import { FIELD_DECOR } from './fieldDecoration';

describe('FIELD_DECOR (spec 2026-11-08 §5)', () => {
  it('clear_zone_numbers_are_pinned: the battlefield south of the board and the portal stay empty', () => {
    expect(FIELD_DECOR.combatClear).toEqual({ x0: 256, x1: 512, y0: 544, y1: 832 });
    expect(FIELD_DECOR.portalClear).toEqual({ x0: 328, x1: 440, y0: 736, y1: 848 });
    expect(FIELD_DECOR.low.count).toBe(12);
    expect(FIELD_DECOR.low.edge).toEqual({ west: 192, east: 576 });
    const p = FIELD_DECOR.portalClear;
    expect(ENEMY_PORTAL.x).toBeGreaterThan(p.x0);
    expect(ENEMY_PORTAL.x).toBeLessThan(p.x1);
    expect(ENEMY_PORTAL.y).toBeGreaterThan(p.y0);
    expect(ENEMY_PORTAL.y).toBeLessThan(p.y1);
  });
});
