import type Phaser from 'phaser';
import { project, type IsoPoint } from '../core/iso';

/**
 * Drawing helpers of the isometric realm (spec 2026-11-06, P3). Every world point a renderer
 * places goes through `project`; standing sprites stay upright and are drawn at
 * `ISO_SPRITE_SCALE` (a 64 px plot is a 128×64 diamond, so 32-world-px buildings and units are
 * drawn 2× to keep their size against the plots; 2×-density image art is then shown 1:1).
 */
export const ISO_SPRITE_SCALE = 2;

/** World point → camera (projected) point. */
export const iso = (p: IsoPoint): IsoPoint => project(p);

/** The four projected corners of the world rect [x, x + w] × [y, y + h]: top, right, bottom, left. */
export const isoQuad = (x: number, y: number, w: number, h: number): IsoPoint[] => [
  project({ x, y }),
  project({ x: x + w, y }),
  project({ x: x + w, y: y + h }),
  project({ x, y: y + h }),
];

/** Path a closed polygon (no fill or stroke yet). */
const path = (g: Phaser.GameObjects.Graphics, pts: readonly IsoPoint[]): void => {
  g.beginPath();
  g.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i]!.x, pts[i]!.y);
  g.closePath();
};

export const fillPoly = (g: Phaser.GameObjects.Graphics, pts: readonly IsoPoint[]): void => {
  path(g, pts);
  g.fillPath();
};

export const strokePoly = (g: Phaser.GameObjects.Graphics, pts: readonly IsoPoint[]): void => {
  path(g, pts);
  g.strokePath();
};

/** Shrink a polygon toward its centroid by `k` (0..1), to draw an inner outline. */
export const insetPoly = (pts: readonly IsoPoint[], k: number): IsoPoint[] => {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.map((p) => ({ x: cx + (p.x - cx) * (1 - k), y: cy + (p.y - cy) * (1 - k) }));
};

/**
 * Pixels of the outline of a world circle of `radius` on the isometric ground: an ellipse
 * r·√2 wide and r/√2 tall (axis-aligned), relative to its centre, gap-free.
 */
export const isoRingPixels = (radius: number): IsoPoint[] => {
  const rx = radius * Math.SQRT2;
  const ry = radius / Math.SQRT2;
  const seen = new Set<string>();
  const out: IsoPoint[] = [];
  const add = (x: number, y: number): void => {
    const key = `${x},${y}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ x, y });
  };
  const ix = Math.ceil(rx);
  for (let x = -ix; x <= ix; x++) {
    const t = 1 - (x * x) / (rx * rx);
    if (t < 0) continue;
    const y = Math.round(ry * Math.sqrt(t));
    add(x, y);
    add(x, -y);
  }
  const iy = Math.ceil(ry);
  for (let y = -iy; y <= iy; y++) {
    const t = 1 - (y * y) / (ry * ry);
    if (t < 0) continue;
    const x = Math.round(rx * Math.sqrt(t));
    add(x, y);
    add(-x, y);
  }
  return out;
};
