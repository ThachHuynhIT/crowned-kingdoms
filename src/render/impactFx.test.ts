import { describe, expect, it } from 'vitest';
import { IMPACT_FRAMES, IMPACT_FRAME_MS, IMPACT_SIZE, paintImpactFrame, paintImpactGlow } from './impactFx';

const count = (f: (x: number, y: number) => number): { solid: number; partial: number } => {
  let solid = 0;
  let partial = 0;
  for (let y = 0; y < IMPACT_SIZE; y++)
    for (let x = 0; x < IMPACT_SIZE; x++) {
      const a = f(x, y);
      if (a === 255) solid++;
      else if (a !== 0) partial++;
    }
  return { solid, partial };
};

describe('impactFx', () => {
  it('every frame has hard-edged pixels only (alpha 0 or 255) and is not empty', () => {
    for (let i = 0; i < IMPACT_FRAMES; i++) {
      const c = paintImpactFrame(i);
      const n = count((x, y) => c.alphaAt(x, y));
      expect(n.partial).toBe(0);
      expect(n.solid).toBeGreaterThan(0);
    }
  });
  it('is the same every time (a function of the frame index only)', () => {
    for (let i = 0; i < IMPACT_FRAMES; i++) expect(paintImpactFrame(i)).toEqual(paintImpactFrame(i));
  });
  it('the glow fades out after frame 2; timing has one entry per frame', () => {
    const g = paintImpactGlow(3);
    expect(count((x, y) => g.alphaAt(x, y)).solid).toBe(0);
    expect(IMPACT_FRAME_MS).toHaveLength(IMPACT_FRAMES);
  });
});
