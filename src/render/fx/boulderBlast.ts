import { PALETTE } from '../../data/palette';
import { PixelCanvas, pixelHash } from '../pixel';
import type { CodeFxDef } from '../codeFx';
import { smokePuff } from './smokePuff';

export const boulderBlast: CodeFxDef = {
  id: 'boulderBlast', label: 'Đá tảng nổ', size: { w: 40, h: 40 }, frames: 8,
  frameMs: [75, 45, 45, 55, 60, 70, 80, 90], loop: false, anchor: 'centre',
  note: 'Chớp nổ và sóng bụi tại điểm đá tảng can thiệp chạm đất.',
  paint(i) {
    const c = new PixelCanvas(40, 40);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const dx = x - 20, dy = (y - 24) * 2;
      const d = Math.sqrt(dx * dx + dy * dy), r = 5 + i * 1.7;
      if (Math.abs(d - r) < 1.4 && (i <= 3 || pixelHash(x, y, 41) < 1 - (i - 3) * 0.22)) c.set(x, y, i < 2 ? PALETTE.orange : PALETTE.sand);

    }
    if (i >= 2) for (let k = 0; k < 4; k++) {
      smokePuff(c, 11 + k * 6, 26 - Math.floor((i - 2) * 0.3),
        4 + Math.floor(i * 0.3), 2 + Math.floor(i * 0.2), i >= 5 ? (i - 4) * 0.3 : 0, 52 + k);
    }
    if (i < 2) {
      c.fillEllipse(20, 20, 7 - i * 2, 6 - i, PALETTE.orange);
      c.fillEllipse(19, 18, 4 - i, 4 - i, PALETTE.white);
      c.fillRect(19, 9 + i * 3, 2, 19 - i * 6, PALETTE.white);
    }
    for (let k = 0; k < 9; k++) {
      const a = k * 2.399, d = 4 + i * (1 + k % 3 * 0.3);
      const x = Math.round(20 + Math.cos(a) * d), y = Math.round(21 + Math.sin(a) * d * 0.65 - i * 2 + i * i * 0.35);
      if (pixelHash(k, 0, 87) < 1 - i * 0.12) { c.fillRect(x, y, 2, 2, PALETTE.stoneDark); c.fillRect(x, y, 2, 1, PALETTE.stone); c.set(x, y, PALETTE.stoneLight); }
    }
    return c;
  },
  paintGlow(i) {
    const c = new PixelCanvas(40, 40);
    if (i > 2) return c;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const d = (x - 20) ** 2 + ((y - 21) * 1.5) ** 2;
      if (d < (10 + i * 2) ** 2 && pixelHash(x, y, 98) < 0.32 - i * 0.1) c.set(x, y, PALETTE.orange);
    }
    return c;
  },
};
