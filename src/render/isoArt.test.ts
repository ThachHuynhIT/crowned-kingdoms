import { describe, expect, it } from 'vitest';
import { squareToIso } from './isoArt';
import { PixelCanvas } from './pixel';

const rgbAt = (c: PixelCanvas, x: number, y: number): number => {
  const i = (y * c.width + x) * 4;
  return (c.data[i]! << 16) | (c.data[i + 1]! << 8) | c.data[i + 2]!;
};

describe('squareToIso (nearest sampling, no texture rotation)', () => {
  // A 4×4 square with a distinct colour per quadrant.
  const src = new PixelCanvas(4, 4);
  src.fillRect(0, 0, 2, 2, 0x110000); // north-west quadrant
  src.fillRect(2, 0, 2, 2, 0x002200); // north-east
  src.fillRect(0, 2, 2, 2, 0x000033); // south-west
  src.fillRect(2, 2, 2, 2, 0x444444); // south-east
  const iso = squareToIso(src);

  it('makes a diamond twice as wide as tall', () => {
    expect([iso.width, iso.height]).toEqual([8, 4]);
  });

  it('puts world north-west on top, south-west on the right, north-east on the left, south-east at the bottom', () => {
    expect(rgbAt(iso, 4, 0)).toBe(0x110000);
    expect(rgbAt(iso, 6, 2)).toBe(0x000033);
    expect(rgbAt(iso, 1, 2)).toBe(0x002200);
    expect(rgbAt(iso, 4, 3)).toBe(0x444444);
  });

  it('leaves the corners outside the diamond transparent and the inside opaque', () => {
    expect(iso.alphaAt(0, 0)).toBe(0);
    expect(iso.alphaAt(7, 3)).toBe(0);
    expect(iso.alphaAt(4, 2)).toBe(255);
    for (let i = 3; i < iso.data.length; i += 4) expect([0, 255]).toContain(iso.data[i]);
  });
});
