import { describe, expect, it } from 'vitest';
import { throneLandRange } from './boardGeometry';

describe('throneLandRange (owner 11/11/2026)', () => {
  it('reaches the far corners of the board from the throne plot', () => {
    // throne at row 0, col 2: farthest corner is 2.5 cols and 4.5 rows away
    expect(throneLandRange('normal')).toBeCloseTo(Math.sqrt(2.5 * 2.5 + 4.5 * 4.5) * 64, 9);
    expect(throneLandRange('endless')).toBeGreaterThan(throneLandRange('normal'));
  });
});
