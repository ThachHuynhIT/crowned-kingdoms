import { PALETTE } from '../../data/palette';
import { PixelCanvas, pixelHash } from '../pixel';
import type { CodeFxDef } from '../codeFx';

export const rageAura: CodeFxDef = {
  id: 'rageAura', kind: 'effect', covers: ['fx_rage'], label: 'Cuồng Nộ', size: { w: 24, h: 24 }, frames: 6,
  frameMs: [90, 90, 90, 90, 90, 90], loop: true, anchor: 'feet',
  note: 'Lửa đỏ nhịp nhàng quanh chân địch đang Cuồng Nộ.',
  paint(i) {
    const c = new PixelCanvas(24, 24);
    // A hollow 18×6 ground ellipse ties all six tongues together.
    for (let y = 15; y <= 21; y++) for (let x = 3; x <= 21; x++) {
      const d = ((x + 0.5 - 12) / 9) ** 2 + ((y + 0.5 - 18) / 3) ** 2;
      if (d <= 1 && d >= 0.45) c.set(x, y, y < 18 ? PALETTE.redDark : PALETTE.red);
    }
    const pulse = [3, 1, 0, 3, 1, 0][i] ?? 0;
    // Back flames, sides, then front flames: the middle remains open.
    const roots = [[7, 16], [16, 16], [3, 18], [20, 18], [7, 20], [16, 20]];
    for (const [k, root] of roots.entries()) {
      const x = root[0]!, base = root[1]!;
      const height = 3 + k % 2 * 2 + pulse;
      for (let h = 0; h < height; h++) {
        const bend = h > height / 2 ? ((i + k) % 3 - 1) : 0;
        const tip = h === height - 1;
        c.fillRect(x + bend, base - h, tip ? 1 : 2, 1, PALETTE.redDark);
        c.set(x + bend, base - h, h < 3 ? PALETTE.orange : PALETTE.red);
        if (h < 2) c.set(x + 1, base - h, PALETTE.gold);
      }
    }
    return c;
  },
  paintGlow(i) {
    const c = new PixelCanvas(24, 24), pulse = i % 3 === 0 ? 0.19 : 0.12;
    for (let y = 13; y < 24; y++) for (let x = 1; x < 23; x++) {
      if (((x - 12) / 10) ** 2 + ((y - 19) / 4) ** 2 < 1 && pixelHash(x, y, 418) < pulse) c.set(x, y, PALETTE.redDark);
    }
    return c;
  },
};
