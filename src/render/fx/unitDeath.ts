import { PALETTE } from '../../data/palette';
import { PixelCanvas } from '../pixel';
import type { CodeFxDef } from '../codeFx';
import { smokePuff } from './smokePuff';

export const unitDeath: CodeFxDef = {
  id: 'unitDeath', label: 'Lính tan biến', size: { w: 24, h: 24 }, frames: 7,
  frameMs: [65, 45, 50, 55, 60, 65, 80], loop: false, anchor: 'feet',
  note: 'Bụi và đốm hồn xuất hiện tại chân lính vừa bị hạ.',
  paint(i) {
    const c = new PixelCanvas(24, 24);
    for (let k = 0; k < 3; k++) {
      const x = 8 + k * 4;
      const y = 18 + k % 2 * 2 - Math.floor(i * (k === 1 ? 1 : 0.7));
      smokePuff(c, x, y, 3 + Math.floor(i * 0.5), 3 + Math.floor(i * 0.3),
        i >= 4 ? (i - 3) * 0.3 : 0, 123 + k);
    }
    for (let k = 0; k < 3; k++) {
      const x = 7 + k * 5 + (i + k) % 2, y = 14 - i * 2 + k % 2;
      if (i < 6 || k === 1) { c.set(x, y, PALETTE.cream); if (i < 3) c.set(x, y + 1, PALETTE.stoneLight); }
    }
    return c;
  },
};
