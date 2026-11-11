import { PALETTE as P } from '../../data/palette';
import type { CodeFxDef } from '../codeFx';
import { ARROW_DIRS, paintArrow, paintBoulder } from '../fxArt';
import { PixelCanvas } from '../pixel';

/** Expose existing flight art in the same review catalogue as the new projectiles. */
const arrow: CodeFxDef = {
  id: 'fx_arrow', kind: 'projectile', covers: ['fx_arrow'], label: 'Mũi tên',
  directional: true, size: { w: 8, h: 8 }, frames: 8,
  frameMs: [150, 150, 150, 150, 150, 150, 150, 150], loop: false, anchor: 'centre',
  note: 'Tên của cung thủ; tám hướng vẽ sẵn, không xoay sprite.',
  paint(i) { return paintArrow(ARROW_DIRS[i] ?? 'e'); },
};
const boulder: CodeFxDef = {
  id: 'fx_boulder', kind: 'projectile', covers: ['fx_boulder'], label: 'Đá tảng',
  size: { w: 16, h: 16 }, frames: 1, frameMs: [150], loop: false, anchor: 'centre',
  note: 'Đá tảng Can Thiệp đang bay; dùng painter hiện có trong fxArt.', paint: paintBoulder,
};
const shadow: CodeFxDef = {
  id: 'fx_boulder_shadow', kind: 'projectile', covers: ['fx_boulder_shadow'], label: 'Bóng đá tảng',
  size: { w: 24, h: 8 }, frames: 1, frameMs: [150], loop: false, anchor: 'centre',
  note: 'Bóng đất của đá tảng Can Thiệp; bản xem code dùng silhouette alpha 0/255.',
  paint() { const c = new PixelCanvas(24, 8); c.fillEllipse(12, 4, 11.5, 3.5, P.shadow); return c; },
};
const shield: CodeFxDef = {
  id: 'fx_shield', kind: 'effect', group: 'Đặc biệt', covers: ['fx_shield'], label: 'Khiên',
  size: { w: 24, h: 24 }, frames: 4, frameMs: [120, 120, 120, 120], loop: true, anchor: 'centre',
  note: 'Vòng khiên quanh lính còn shield; mép đặc, lòng trong suốt, neo giữa thân.',
  paint(i) {
    const c = new PixelCanvas(24, 24);
    for (let y = 2; y < 22; y++) for (let x = 2; x < 22; x++) {
      const d = (x + 0.5 - 12) ** 2 + (y + 0.5 - 12) ** 2;
      if (d <= 100 && d >= 64) c.set(x, y, d > 82 ? P.waterDeep : P.water);
    }
    c.fillRect(6 + i, 5, 3, 2, P.waterLight); c.set(6 + i, 5, P.white);
    return c;
  },
};
const stun: CodeFxDef = {
  id: 'fx_stun', kind: 'effect', group: 'Đặc biệt', covers: ['fx_stun'], label: 'Choáng',
  size: { w: 24, h: 24 }, frames: 4, frameMs: [110, 110, 110, 110], loop: true, anchor: 'feet',
  note: 'Sao vàng trên đầu lính đang choáng (stunUntil); canvas neo chân, sao nằm sát mép trên.',
  paint(i) {
    const c = new PixelCanvas(24, 24);
    for (let k = 0; k < 3; k++) {
      const x = 5 + k * 6 + i % 2, y = 5 + (i + k) % 3;
      c.fillRect(x - 1, y - 2, 3, 5, P.soilDark); c.fillRect(x - 2, y - 1, 5, 3, P.soilDark);
      c.fillRect(x, y - 1, 1, 3, P.gold); c.fillRect(x - 1, y, 3, 1, P.wheatLight); c.set(x, y, P.white);
    }
    return c;
  },
};

export const LEGACY_FX: readonly CodeFxDef[] = [arrow, boulder, shadow, shield, stun];
