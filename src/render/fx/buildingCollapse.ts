import { PALETTE } from '../../data/palette';
import { PixelCanvas } from '../pixel';
import type { CodeFxDef } from '../codeFx';
import { smokePuff } from './smokePuff';

export const buildingCollapse: CodeFxDef = {
  id: 'buildingCollapse', label: 'Công trình sụp đổ', size: { w: 48, h: 48 }, frames: 9,
  frameMs: [90, 55, 60, 65, 70, 75, 85, 95, 105], loop: false, anchor: 'feet',
  note: 'Cột khói cùng gạch và gỗ rơi tại nền công trình bị phá.',
  paint(i) {
    const c = new PixelCanvas(48, 48);
    // Back lobes first, then the low billows at the foundation.
    for (let k = 0; k < 5; k++) {
      const x = 24 + (k % 2 ? -1 : 1) * (3 + k);
      const y = 22 + k * 4 - Math.round(i * (0.8 + (4 - k) * 0.12));
      smokePuff(c, x, y, 5 + Math.floor(i * 0.65) + k % 2,
        4 + Math.floor(i * 0.4), i >= 6 ? (i - 5) * 0.29 : 0, 204 + k);
    }
    for (let k = 0; k < 12; k++) {
      const x = Math.round(24 + (k - 5.5) * (1 + i * 0.22));
      const y = Math.round(19 + k % 4 * 5 - i * 1.5 + i * i * 0.52);
      if (y < 46 && k < 12 - Math.max(0, i - 3) * 2) {
        c.fillRect(x, y, 2, k % 2 ? 1 : 2, k % 2 ? PALETTE.soil : PALETTE.stoneDark);
        c.set(x, y, PALETTE.sand);
      }
    }
    return c;
  },
};
