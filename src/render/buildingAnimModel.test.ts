import { describe, expect, it } from 'vitest';
import { buildingAnimIndex } from './buildingAnimModel';

describe('building activity loop', () => {
  it('plays 0, 1, 2, 1 at 4 frames a second', () => {
    expect([0, 250, 500, 750, 1000].map((t) => buildingAnimIndex(t, 0))).toEqual([0, 1, 2, 1, 0]);
  });

  it('offsets neighbours by their id', () => {
    expect(buildingAnimIndex(0, 1)).toBe(1);
    expect(buildingAnimIndex(0, 2)).toBe(2);
  });
});
