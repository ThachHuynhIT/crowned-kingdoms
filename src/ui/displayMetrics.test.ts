import { describe, expect, it } from 'vitest';
import {
  cameraBackingView,
  logicalPressDistance,
  makeDisplayMetrics,
  snapTranslation,
  toBackingPoint,
  toLogicalPoint,
} from './displayMetrics';
import { screenToWorld } from './realm/realmLayout';

const SIZES = [
  { w: 1280, h: 720 },
  { w: 375, h: 812 },
  { w: 767, h: 811 },
  { w: 768, h: 813 },
  { w: 769, h: 815 },
];
const DENSITIES = [1, 1.25, 1.5, 1.75, 2, 3];

describe('density_preserves_logical_box', () => {
  for (const size of SIZES) {
    for (const d of DENSITIES) {
      it(`${size.w}×${size.h} at D ${d}`, () => {
        const m = makeDisplayMetrics(size, d);
        expect(m.logical).toEqual(size);
        expect(m.density).toBe(d);
        expect(m.backing).toEqual({ w: Math.round(size.w * d), h: Math.round(size.h * d) });
        expect(m.ratio.x).toBeCloseTo(m.backing.w / size.w, 12);
        expect(m.ratio.y).toBeCloseTo(m.backing.h / size.h, 12);
      });
    }
  }

  it('gives the expected D2 backing sizes', () => {
    expect(makeDisplayMetrics({ w: 1280, h: 720 }, 2).backing).toEqual({ w: 2560, h: 1440 });
    expect(makeDisplayMetrics({ w: 375, h: 812 }, 2).backing).toEqual({ w: 750, h: 1624 });
  });

  it('uses density 1 for invalid densities', () => {
    for (const d of [Number.NaN, Number.POSITIVE_INFINITY, 0, -2]) {
      const m = makeDisplayMetrics({ w: 1280, h: 720 }, d);
      expect(m.density).toBe(1);
      expect(m.backing).toEqual({ w: 1280, h: 720 });
      expect(m.ratio).toEqual({ x: 1, y: 1 });
    }
  });

  it('keeps D 1 an exact identity', () => {
    const m = makeDisplayMetrics({ w: 769, h: 815 }, 1);
    expect(m.ratio).toEqual({ x: 1, y: 1 });
    expect(toLogicalPoint({ x: 12.5, y: 7 }, m)).toEqual({ x: 12.5, y: 7 });
  });

  it('rejects an empty box (the runtime keeps the last valid metrics)', () => {
    expect(() => makeDisplayMetrics({ w: 0, h: 720 }, 2)).toThrow();
    expect(() => makeDisplayMetrics({ w: 1280, h: -1 }, 2)).toThrow();
  });
});

describe('pointer_round_trip_and_slop', () => {
  for (const size of SIZES) {
    for (const d of DENSITIES) {
      it(`${size.w}×${size.h} at D ${d}`, () => {
        const m = makeDisplayMetrics(size, d);
        const back = toLogicalPoint(toBackingPoint({ x: 44, y: 88 }, m), m);
        expect(back.x).toBeCloseTo(44, 9);
        expect(back.y).toBeCloseTo(88, 9);
        const down = toBackingPoint({ x: 100, y: 200 }, m);
        const at = (dx: number, dy: number) => toBackingPoint({ x: 100 + dx, y: 200 + dy }, m);
        expect(logicalPressDistance(at(8, 0), down, m)).toBeCloseTo(8, 9);
        expect(logicalPressDistance(at(0, 8), down, m)).toBeCloseTo(8, 9);
        expect(logicalPressDistance(at(6, 8), down, m)).toBeCloseTo(10, 9);
      });
    }
  }

  it('converts each axis by its own ratio when rounding makes them differ', () => {
    const m = makeDisplayMetrics({ w: 769, h: 815 }, 1.25);
    expect(m.ratio.x).not.toBe(m.ratio.y);
    const corner = toLogicalPoint({ x: m.backing.w, y: m.backing.h }, m);
    expect(corner.x).toBeCloseTo(769, 9);
    expect(corner.y).toBeCloseTo(815, 9);
  });
});

/** Phaser's projection of world point q for a camera with origin 0.5 (`zoom·(q − scroll − size/2) + size/2`). */
const phaserCentred = (q: number, zoom: number, scroll: number, size: number): number =>
  zoom * (q - scroll - size / 2) + size / 2;

describe('camera_matrix_matches_logical_projection', () => {
  const views = [
    { zoom: 1, scroll: { x: 0, y: 0 } },
    { zoom: 33 / 32, scroll: { x: -120.5, y: 64 } },
    { zoom: 1.7, scroll: { x: 300, y: -45.25 } },
    { zoom: 3, scroll: { x: 812, y: 410 } },
  ];
  const points = [
    { x: 0, y: 0 },
    { x: 640, y: 360 },
    { x: 1279, y: 719 },
    { x: 37.5, y: 801 },
  ];
  for (const size of [SIZES[0]!, SIZES[1]!, SIZES[4]!]) {
    for (const d of DENSITIES) {
      it(`realm camera at ${size.w}×${size.h}, D ${d}`, () => {
        const m = makeDisplayMetrics(size, d);
        for (const view of views) {
          const cam = cameraBackingView(view, m);
          for (const p of points) {
            // The world point under logical screen point p, by the existing logical model.
            const q = screenToWorld(p, view.scroll, size, view.zoom);
            const bx = phaserCentred(q.x, cam.zoom.x, cam.scroll.x, m.backing.w);
            const by = phaserCentred(q.y, cam.zoom.y, cam.scroll.y, m.backing.h);
            const back = toLogicalPoint({ x: bx, y: by }, m);
            expect(back.x).toBeCloseTo(p.x, 6);
            expect(back.y).toBeCloseTo(p.y, 6);
          }
        }
      });
    }
  }

  it('keeps the realm camera unchanged at D 1', () => {
    const m = makeDisplayMetrics({ w: 1280, h: 720 }, 1);
    const view = { zoom: 1.7, scroll: { x: 300, y: -45.25 } };
    expect(cameraBackingView(view, m)).toEqual({ zoom: { x: 1.7, y: 1.7 }, scroll: { x: 300, y: -45.25 } });
  });

  it('puts HUD corners and centre at the same CSS px with origin 0, zoom = ratio, scroll 0', () => {
    for (const d of DENSITIES) {
      const m = makeDisplayMetrics({ w: 1280, h: 720 }, d);
      for (const q of [{ x: 0, y: 0 }, { x: 640, y: 360 }, { x: 1280, y: 720 }]) {
        const backing = { x: m.ratio.x * q.x, y: m.ratio.y * q.y };
        expect(toLogicalPoint(backing, m)).toEqual(q);
      }
    }
  });
});

describe('snapTranslation', () => {
  it('lands on whole device pixels within half a device pixel', () => {
    for (const r of [1, 1.25, 1.5, 2, 3, 961 / 769]) {
      for (const t of [0, 0.3, -12.71, 100.49, 333.333]) {
        const s = snapTranslation(t, r);
        expect(Math.abs(s * r - Math.round(s * r))).toBeLessThan(1e-6);
        expect(Math.abs(s - t) * r).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(snapTranslation(s, r)).toBeCloseTo(s, 9);
      }
    }
  });

  it('is Math.round at ratio 1', () => {
    for (const t of [0.3, -12.71, 100.5, 7]) expect(snapTranslation(t, 1)).toBe(Math.round(t));
  });
});
