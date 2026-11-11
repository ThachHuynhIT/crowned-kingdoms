import { PixelCanvas, pixelHash } from './pixel';

/** Placeholder rock palette (open colour policy; the real wall art replaces this, spec 26/10/2026). */
const ROCK = {
  dark: 0x3f3e48,
  base: 0x5d5c68,
  mid: 0x76747f,
  light: 0x9a98a3,
  moss: 0x4d7a3c,
  mossLight: 0x6a9a4a,
} as const;

const strata = (art: PixelCanvas, w: number, h: number, seed: number): void => {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const band = Math.floor((y + Math.floor(pixelHash(Math.floor(x / 16), 0, seed) * 6)) / 12);
      const n = pixelHash(x, y, seed);
      let c: number = band % 2 === 0 ? ROCK.base : ROCK.mid;
      if (n < 0.08) c = ROCK.dark;
      else if (n > 0.93) c = ROCK.light;
      art.set(x, y, c);
    }
  }
  // Light from the top-left: a bright edge on the left of every crag, with dark crack marks.
  for (let x = 0; x < w; x += 16 + Math.floor(pixelHash(x, 1, seed) * 12)) {
    for (let y = 0; y < h; y++) art.set(x, y, y % 5 === 0 ? ROCK.dark : ROCK.light);
  }
};

/**
 * Placeholder painted in code for one wall piece: `middle_*` is a cliff face, `left`/`right` end
 * caps slope down to the outer side, `foot_*` is a rubble-and-moss strip along the base. Every pixel is
 * fully opaque or fully transparent (alpha 0/255, no anti-aliasing).
 */
export const paintMountainWall = (id: string, w: number, h: number): PixelCanvas => {
  const seed = [...id].reduce((s, ch) => (Math.imul(s, 31) + ch.charCodeAt(0)) | 0, 7);
  const art = new PixelCanvas(w, h);
  if (id.startsWith('foot')) {
    for (let x = 0; x < w; x++) {
      const top = Math.floor(pixelHash(x, 3, seed) * (h / 2));
      for (let y = top; y < h; y++) {
        const n = pixelHash(x, y, seed);
        art.set(x, y, n < 0.3 ? ROCK.dark : n < 0.75 ? ROCK.base : y === top ? ROCK.mossLight : ROCK.moss);
      }
    }
    return art;
  }
  strata(art, w, h, seed);
  if (id === 'left' || id === 'right') {
    // Slope the outer top corner down to the ground in steps so the cap blends into the field.
    for (let y = 0; y < h; y++) {
      const cut = Math.max(0, Math.floor(((h - y) / h) * (w * 0.7)) - Math.floor(pixelHash(y, 2, seed) * 4));
      for (let k = 0; k < Math.min(cut, w); k++) {
        const x = id === 'left' ? k : w - 1 - k;
        art.data[(y * w + x) * 4 + 3] = 0;
      }
    }
  }
  // Moss along the top edge of the face.
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (art.alphaAt(x, y) !== 0) {
        if (pixelHash(x, 9, seed) > 0.4) art.set(x, y, ROCK.moss);
        break;
      }
    }
  }
  return art;
};
