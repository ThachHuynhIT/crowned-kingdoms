import { PALETTE } from '../../data/palette';
import { PixelCanvas, pixelHash } from '../pixel';
import type { CodeFxDef } from '../codeFx';

export const arrowHit: CodeFxDef = {
  id: 'arrowHit', kind: 'effect', label: 'Tên trúng', size: { w: 16, h: 16 }, frames: 5,
  frameMs: [45, 30, 30, 35, 40], loop: false, anchor: 'centre',
  note: 'Vụn gỗ bật ngược khi tên hoặc đạn nhẹ trúng lính.',
  paint(i) {
    const c = new PixelCanvas(16, 16);
    const colors = [PALETTE.soilDark, PALETTE.soil, PALETTE.cream, PALETTE.gold];
    // Incoming from the right; splinters recoil to the right.
    for (let k = 0; k < 7; k++) {
      const x = 7 + i * (0.7 + k % 3 * 0.4);
      const y = 8 + (k - 3) * (0.8 + i * 0.45) + i * i * 0.12;
      for (let s = 0; s < 4 - Math.floor(i / 2); s++) {
        const px = Math.round(x + s), py = Math.round(y + s * (k - 3) * 0.15);
        if (pixelHash(px, py, 71 + k) < 1 - i * 0.2)
          c.set(px, py, colors[(k + s) % 4] ?? PALETTE.soilDark);
      }
    }
    if (i === 0) { c.fillRect(6, 6, 2, 5, PALETTE.gold); c.fillRect(5, 7, 4, 2, PALETTE.cream); }
    return c;
  },
};
