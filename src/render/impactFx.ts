/**
 * Hit impact effect drawn in code (sample 10/11/2026; the method follows the ideas of
 * patch-gg/pixelfx, written from scratch): a few frames painted once into the atlas, each a
 * function of its frame index only. Rules: a 4-tone ramp per effect, a dithered fade instead
 * of soft alpha, a separate glow layer drawn with additive blending, a big burst in the first
 * frames and a slow fade after.
 */
import { PALETTE } from '../data/palette';
import { PixelCanvas, pixelHash } from './pixel';

export const IMPACT_FRAMES = 6;
export const IMPACT_SIZE = 24;
/** Milliseconds per frame; the first frame is held longer for weight. */
export const IMPACT_FRAME_MS = [50, 40, 40, 45, 50, 55] as const;

const C = IMPACT_SIZE / 2;
/** Ramp from hot to cool: white core, gold, orange, dark red embers. */
const RAMP = [PALETTE.white, PALETTE.gold, PALETTE.orange, PALETTE.redDark] as const;
/** Eight burst directions (unit vectors), long and short rays alternating. */
const RAYS: readonly (readonly [number, number, boolean])[] = [
  [1, 0, true],
  [0.7071, 0.7071, false],
  [0, 1, true],
  [-0.7071, 0.7071, false],
  [-1, 0, true],
  [-0.7071, -0.7071, false],
  [0, -1, true],
  [0.7071, -0.7071, false],
];
/** Debris specks: direction and speed (px per frame); they fall a little each frame. */
const DEBRIS: readonly (readonly [number, number, number])[] = [
  [0.92, -0.38, 2.2],
  [-0.85, -0.53, 2.0],
  [0.38, -0.92, 1.6],
  [-0.3, -0.95, 1.8],
  [0.98, 0.2, 1.4],
  [-0.96, 0.28, 1.5],
];

const rampAt = (t: number): number => RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))]!;

/** Dithered plot: keeps the pixel when its hash is below `keep` (0..1), so fades stay hard-edged. */
const dot = (c: PixelCanvas, x: number, y: number, color: number, keep: number, seed: number): void => {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= IMPACT_SIZE || py >= IMPACT_SIZE) return;
  if (keep < 1 && (pixelHash(px, py, seed) % 1000) / 1000 >= keep) return;
  c.set(px, py, color);
};

/** Colour frame `i` (0-based) of the impact. */
export const paintImpactFrame = (i: number): PixelCanvas => {
  const c = new PixelCanvas(IMPACT_SIZE, IMPACT_SIZE);
  const t = i / (IMPACT_FRAMES - 1);
  // Flash: a solid white core for the first two frames, rimmed with gold.
  if (i === 0) {
    c.fillEllipse(C, C, 3.5, 3.5, PALETTE.gold);
    c.fillEllipse(C, C, 2.5, 2.5, PALETTE.white);
  } else if (i === 1) {
    c.fillEllipse(C, C, 2.5, 2.5, PALETTE.white);
  }
  // Rays shoot out fast, then shrink and cool down.
  for (const [dx, dy, long] of RAYS) {
    const from = 2 + t * 6;
    const len = (long ? 6 : 3.5) * (1 - t * 0.8);
    const color = rampAt(t + (long ? 0 : 0.2));
    for (let s = 0; s <= len; s += 0.5) dot(c, C + dx * (from + s), C + dy * (from + s), color, 1 - t * 0.9, i * 31 + 7);
  }
  // A ring that grows and breaks up.
  if (i >= 1 && i <= 3) {
    const r = 3 + t * 8;
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * Math.PI * 2;
      dot(c, C + Math.cos(a) * r, C + Math.sin(a) * r * 0.75, rampAt(t), 1 - t * 1.3, i * 17 + 3);
    }
  }
  // Debris specks fly out and fall.
  if (i >= 1) {
    for (const [dx, dy, v] of DEBRIS) {
      const d = 3 + v * i;
      dot(c, C + dx * d, C + dy * d + 0.35 * i * i, rampAt(t + 0.25), 1.15 - t, 99);
    }
  }
  return c;
};

/** Glow frame `i`: a soft orange halo for the additive layer, gone after frame 2. */
export const paintImpactGlow = (i: number): PixelCanvas => {
  const c = new PixelCanvas(IMPACT_SIZE, IMPACT_SIZE);
  if (i > 2) return c;
  const r = 4 + i * 1.5;
  const keep = [0.8, 0.45, 0.2][i]!;
  for (let y = 0; y < IMPACT_SIZE; y++)
    for (let x = 0; x < IMPACT_SIZE; x++) {
      const dx = x - C;
      const dy = (y - C) / 0.8;
      const d2 = dx * dx + dy * dy;
      if (d2 > r * r) continue;
      const inner = d2 < (r * 0.5) * (r * 0.5);
      dot(c, x, y, inner ? PALETTE.gold : PALETTE.orange, inner ? keep : keep * 0.5, 501 + i);
    }
  return c;
};
