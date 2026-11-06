import { PixelCanvas } from './pixel';

/**
 * A square top-down picture laid onto the isometric ground (spec 2026-11-06): a diamond twice as
 * wide as tall, every output pixel sampled (nearest) from the square through the inverse of the
 * projection in `src/core/iso.ts`. No texture rotation, no filtering: alpha stays 0/255. Used for
 * the field and as the fallback for square plot art until the isometric art replaces it.
 */
export const squareToIso = (src: PixelCanvas): PixelCanvas => {
  const s = src.width;
  const out = new PixelCanvas(2 * s, s);
  for (let v = 0; v < s; v++)
    for (let u = 0; u < 2 * s; u++) {
      // projected point relative to the top corner, then back to the square (src/core/iso.ts: x' = y − x)
      const qx = u + 0.5 - s;
      const qy = v + 0.5;
      const x = Math.floor(qy - qx / 2);
      const y = Math.floor(qy + qx / 2);
      if (x < 0 || y < 0 || x >= s || y >= src.height) continue;
      const i = (y * src.width + x) * 4;
      const o = (v * out.width + u) * 4;
      out.data[o] = src.data[i]!;
      out.data[o + 1] = src.data[i + 1]!;
      out.data[o + 2] = src.data[i + 2]!;
      out.data[o + 3] = src.data[i + 3]!;
    }
  return out;
};
