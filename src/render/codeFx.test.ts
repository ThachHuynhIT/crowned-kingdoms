import { describe, expect, it } from 'vitest';
import { CODE_FX } from './codeFx';
import type { PixelCanvas } from './pixel';

function solidCount(canvas: PixelCanvas): number {
  let count = 0;
  for (let n = 3; n < canvas.data.length; n += 4) {
    expect([0, 255]).toContain(canvas.data[n]);
    if (canvas.data[n] === 255) count++;
  }
  return count;
}

describe('CODE_FX', () => {
  it('has unique ids', () => {
    expect(new Set(CODE_FX.map((fx) => fx.id)).size).toBe(CODE_FX.length);
  });
  for (const fx of CODE_FX) describe(fx.id, () => {
    it('has valid timing and deterministic hard-edged frames at the declared size', () => {
      expect(fx.frameMs).toHaveLength(fx.frames);
      const counts: number[] = [];
      for (let i = 0; i < fx.frames; i++) {
        expect(fx.frameMs[i]).toBeGreaterThan(0);
        const c = fx.paint(i);
        expect([c.width, c.height]).toEqual([fx.size.w, fx.size.h]);
        expect(c.data).toEqual(fx.paint(i).data);
        counts.push(solidCount(c));
        if (fx.paintGlow) {
          const glow = fx.paintGlow(i);
          expect([glow.width, glow.height]).toEqual([fx.size.w, fx.size.h]);
          expect(glow.data).toEqual(fx.paintGlow(i).data);
          solidCount(glow);
        }
      }
      expect(counts[0]).toBeGreaterThan(0);
      const last = counts[fx.frames - 1] ?? 0;
      if (fx.loop) {
        expect(last).toBeGreaterThan(0);
        expect(fx.paint(fx.frames - 1).data).not.toEqual(fx.paint(0).data);
      } else expect(last).toBeLessThan(Math.max(...counts));
    });
  });
});
