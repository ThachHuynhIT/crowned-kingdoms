import { describe, expect, it } from 'vitest';
import { projectileVisualHeight } from './projectileModel';
describe('projectile visual height', () => {
  for (const height of [32, 64, 198, 396]) {
    it(`starts at eighty percent of a ${height}px building, then fades to six`, () => {
      expect(projectileVisualHeight(height, 0, 100, true, 16)).toBeCloseTo(height * 0.8 - 16);
      expect(projectileVisualHeight(height, 50, 50, true, 16)).toBeCloseTo((height * 0.8 - 16 + 6) / 2);
      expect(projectileVisualHeight(height, 100, 0, true, 16)).toBe(6);
    });
  }
  it('keeps units at six and handles zero distance', () => {
    expect(projectileVisualHeight(396, 50, 50, false, 0)).toBe(6);
    expect(projectileVisualHeight(396, 0, 0, true, 16)).toBe(6);
    expect(projectileVisualHeight(396, -10, 100, true, 16)).toBeCloseTo(396 * 0.8 - 16);
  });
});
