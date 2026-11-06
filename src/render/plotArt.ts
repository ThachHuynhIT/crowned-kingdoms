import { PALETTE } from '../data/palette';
import { PixelCanvas, pixelHash } from './pixel';

export const PLOT_SIZE = 32;

/** `built`: a plot with a building on it, paved with stone (owner, 2026-11-06). */
export type PlotState = 'open' | 'locked' | 'throne' | 'built';

/** A 32x32 ground plot: cleared earth (open), stone-covered (locked), a gold-edged yard (throne) or flagstones (built). */
export const paintPlot = (state: PlotState): PixelCanvas => {
  const n = PLOT_SIZE;
  const c = new PixelCanvas(n, n);
  const locked = state === 'locked';
  const base = locked ? PALETTE.stoneDark : PALETTE.path;
  const speck = locked ? PALETTE.stone : PALETTE.sand;
  const edge = locked ? PALETTE.outline : PALETTE.soilDark;
  c.fillRect(1, 1, n - 2, n - 2, base);
  for (let y = 2; y < n - 2; y++)
    for (let x = 2; x < n - 2; x++) if (pixelHash(x, y, 11) < 0.12) c.set(x, y, speck);
  // Dashed border so the cell edge is readable on the grass.
  for (let i = 1; i < n - 1; i++) {
    const color = (i >> 1) % 2 === 0 ? edge : base;
    c.set(i, 0, color);
    c.set(i, n - 1, color);
    c.set(0, i, color);
    c.set(n - 1, i, color);
  }
  if (locked) {
    for (let i = 6; i < n - 6; i++) {
      c.set(i, i, PALETTE.plum);
      c.set(n - 1 - i, i, PALETTE.plum);
    }
  } else if (state === 'built') {
    // Flagstones: a grid of pale stones with dark joints.
    c.fillRect(2, 2, n - 4, n - 4, PALETTE.stoneLight);
    for (let i = 2; i < n - 2; i += 6) {
      c.fillRect(2, i, n - 4, 1, PALETTE.stone);
      c.fillRect(i + ((i / 6) % 2) * 3, 2, 1, n - 4, PALETTE.stone);
    }
  } else if (state === 'throne') {
    c.fillRect(2, 2, n - 4, 1, PALETTE.gold);
    c.fillRect(2, n - 3, n - 4, 1, PALETTE.gold);
    c.fillRect(2, 2, 1, n - 4, PALETTE.gold);
    c.fillRect(n - 3, 2, 1, n - 4, PALETTE.gold);
  }
  return c;
};
