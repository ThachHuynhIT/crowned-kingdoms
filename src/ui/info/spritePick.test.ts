import { describe, expect, it } from 'vitest';
import { pickSprite, spriteBox, type SpriteBox } from './spritePick';

const box = (id: number, x: number, footY: number, w: number, h: number, exact = false): SpriteBox =>
  spriteBox({ id, x, footY, frameW: w, frameH: h, scale: 1, exact, frame: `f${id}` });

describe('spriteBox', () => {
  it('scales the frame and anchors it at its feet (0.5, 1)', () => {
    const b = spriteBox({ id: 3, x: 100, footY: 200, frameW: 40, frameH: 30, scale: 2, exact: true, frame: 'a' });
    expect(b).toMatchObject({ id: 3, left: 60, top: 140, w: 80, h: 60, scale: 2, footY: 200, exact: true, frame: 'a' });
  });
});

describe('pickSprite', () => {
  it('hits anywhere on the visible box, the top of a tall sprite too, and misses outside it', () => {
    const boxes = [box(1, 100, 200, 40, 80)];
    expect(pickSprite(boxes, { x: 100, y: 199 })).toBe(1);
    expect(pickSprite(boxes, { x: 81, y: 121 })).toBe(1); // near the top-left corner, far above the feet
    expect(pickSprite(boxes, { x: 100, y: 119 })).toBeNull();
    expect(pickSprite(boxes, { x: 121, y: 150 })).toBeNull();
  });

  it('a slop grows every box', () => {
    const boxes = [box(1, 100, 200, 40, 80)];
    expect(pickSprite(boxes, { x: 123, y: 150 }, 4)).toBe(1);
    expect(pickSprite(boxes, { x: 125, y: 150 }, 4)).toBeNull();
  });

  it('overlapping sprites: the front-most (largest foot y) wins, ties go to the lowest id', () => {
    const back = box(1, 100, 180, 40, 80);
    const front = box(2, 100, 220, 40, 80);
    expect(pickSprite([back, front], { x: 100, y: 170 })).toBe(2);
    expect(pickSprite([front, back], { x: 100, y: 170 })).toBe(2);
    expect(pickSprite([back, front], { x: 100, y: 130 })).toBe(1); // above the front sprite's top
    expect(pickSprite([box(5, 100, 200, 40, 40), box(4, 100, 200, 40, 40)], { x: 100, y: 190 })).toBe(4);
  });

  it('exact sprites only count where they are opaque, in frame pixels (scale and flip applied)', () => {
    // A 10×10 frame drawn at 2×: only its right half (u ≥ 5) is opaque.
    const b = spriteBox({ id: 7, x: 100, footY: 100, frameW: 10, frameH: 10, scale: 2, exact: true, frame: 'h' });
    const seen: [string, number, number][] = [];
    const opaque = (f: string, u: number, v: number): boolean => {
      seen.push([f, u, v]);
      return u >= 5;
    };
    expect(pickSprite([b], { x: 94, y: 95 }, 0, opaque)).toBeNull(); // u = 2
    expect(pickSprite([b], { x: 104, y: 95 }, 0, opaque)).toBe(7); // u = 7
    expect(seen.at(-1)).toEqual(['h', 7, 7]);
    const flipped = { ...b, flipX: true };
    expect(pickSprite([flipped], { x: 94, y: 95 }, 0, opaque)).toBe(7); // mirrored: u = 7
    expect(pickSprite([flipped], { x: 104, y: 95 }, 0, opaque)).toBeNull();
  });

  it('a transparent part of a front sprite lets the sprite behind it be picked', () => {
    const front = { ...box(2, 100, 220, 40, 80, true) };
    const back = box(1, 100, 180, 40, 80, true);
    const opaque = (f: string, _u: number, v: number): boolean => (f === 'f2' ? v >= 40 : true);
    expect(pickSprite([front, back], { x: 100, y: 150 }, 0, opaque)).toBe(1);
    expect(pickSprite([front, back], { x: 100, y: 190 }, 0, opaque)).toBe(2);
  });

  it('a slop hit just outside an exact sprite counts when its nearest frame pixel is opaque', () => {
    const b = box(1, 100, 200, 40, 80, true);
    expect(pickSprite([b], { x: 122, y: 150 }, 4, () => true)).toBe(1);
  });

  it('without an opacity test, exact sprites fall back to their box', () => {
    expect(pickSprite([box(1, 100, 200, 40, 80, true)], { x: 100, y: 150 })).toBe(1);
  });

  it('nothing to pick: null', () => {
    expect(pickSprite([], { x: 0, y: 0 })).toBeNull();
  });
});
