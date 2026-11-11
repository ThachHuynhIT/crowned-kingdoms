import { PALETTE } from '../../data/palette';
import { PixelCanvas, pixelHash } from '../pixel';

/** Solid layered lobes; only the silhouette and final dissolve lose pixels. */
export function smokePuff(c: PixelCanvas, x: number, y: number, rx: number, ry: number, dissolve: number, seed: number): void {
  const puff = new PixelCanvas(c.width, c.height);
  puff.fillEllipse(x, y + 1, rx, ry, PALETTE.stoneDark);
  puff.fillEllipse(x, y, rx, ry, PALETTE.stone);
  puff.fillEllipse(x - 1, y - 1, Math.max(1, rx - 2), Math.max(1, ry - 1), PALETTE.stoneLight);
  for (let py = 0; py < puff.height; py++) for (let px = 0; px < puff.width; px++) {
    if (!puff.alphaAt(px, py)) continue;
    const edge = !puff.alphaAt(px - 1, py) || !puff.alphaAt(px + 1, py)
      || !puff.alphaAt(px, py - 1) || !puff.alphaAt(px, py + 1);
    if (pixelHash(px, py, seed) < (dissolve > 0 ? dissolve : edge ? 0.08 : 0))
      puff.set(px, py, 0, 0);
  }
  c.blit(puff, 0, 0);
}
