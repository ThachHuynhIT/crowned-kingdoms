import { describe, expect, it } from 'vitest';
import { KING_BADGE_FILES, kingBadge } from './kingBadge';

describe('kingBadge', () => {
  it('the Wheat king has a badge in two sizes, both loaded', () => {
    const keys = KING_BADGE_FILES.map((f) => f.key);
    expect(kingBadge('wheat', 40)).toEqual({ key: 'badge-wheat-32', size: 32 });
    expect(kingBadge('wheat', 18)).toEqual({ key: 'badge-wheat-16', size: 16 });
    expect(keys).toContain('badge-wheat-32');
    expect(keys).toContain('badge-wheat-16');
  });

  it('never scales: the 16 px badge even in a smaller box', () => {
    expect(kingBadge('wheat', 10)).toEqual({ key: 'badge-wheat-16', size: 16 });
  });

  it('all nine kings have a badge in two sizes (G5, 2026-11-09); raiders keep their colour square', () => {
    const keys = KING_BADGE_FILES.map((f) => f.key);
    for (const king of ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad'] as const) {
      expect(kingBadge(king, 40)).toEqual({ key: `badge-${king}-32`, size: 32 });
      expect(keys).toContain(`badge-${king}-16`);
    }
    expect(kingBadge('raiders' as never, 40)).toBeNull();
  });
});
