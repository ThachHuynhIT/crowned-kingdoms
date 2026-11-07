import { describe, expect, it } from 'vitest';
import { ISO, unproject } from '../../core/iso';
import type { Size } from '../hud/layout';
import {
  MAP_BOUNDS,
  ZOOM_MAX,
  clampView,
  overviewView,
  panBy,
  pinchStep,
  plotAtView,
  plotRectAtView,
  resizeView,
  worldAtView,
  zoomAt,
  zoomSteps,
} from './cameraModel';
import { planningLayout, plotAtScreen, plotScreenRect, realmCamera, screenToWorld } from './realmLayout';

const DESKTOP: Size = { w: 1280, h: 720 };
const MOBILE: Size = { w: 375, h: 812 };

const visible = (v: { zoom: number; scroll: { x: number; y: number } }, s: Size) => {
  const tl = screenToWorld({ x: 0, y: 0 }, v.scroll, s, v.zoom);
  const br = screenToWorld({ x: s.w, y: s.h }, v.scroll, s, v.zoom);
  return { x0: tl.x, y0: tl.y, x1: br.x, y1: br.y };
};

describe('camera model (spec 06/11/2026, P2 zoom)', () => {
  it('starts at the overview camera of the phase, and steps whole zooms up to 3', () => {
    for (const s of [DESKTOP, MOBILE]) {
      expect(overviewView(s, 'planning')).toEqual(realmCamera(s, 'planning'));
      expect(zoomSteps(s, 'planning')).toEqual([1, 2, 3]);
    }
    expect(ZOOM_MAX).toBe(3);
    expect(zoomSteps({ w: 4000, h: 2000 }, 'battle')).toEqual([2, 3]);
  });

  it('wheel_steps_keep_the_world_point_under_the_cursor', () => {
    const base = overviewView(DESKTOP, 'planning');
    const p = { x: 760, y: 420 }; // well inside the map: near an edge the clamp wins over the anchor
    const before = screenToWorld(p, base.scroll, DESKTOP, base.zoom);
    for (const z of [2, 3] as const) {
      const v = zoomAt(base, p, z, DESKTOP, 'planning');
      expect(v.zoom).toBe(z);
      const after = screenToWorld(p, v.scroll, DESKTOP, v.zoom);
      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.y).toBeCloseTo(before.y, 6);
    }
  });

  it('zooming back to the overview step returns exactly the overview camera, never a fractional zoom', () => {
    const z2 = zoomAt(overviewView(MOBILE, 'planning'), { x: 10, y: 10 }, 2, MOBILE, 'planning');
    expect(zoomAt(z2, { x: 300, y: 700 }, 1, MOBILE, 'planning')).toEqual(overviewView(MOBILE, 'planning'));
    expect(zoomAt(z2, { x: 0, y: 0 }, 2.5, MOBILE, 'planning').zoom).toBe(2);
    expect(zoomAt(z2, { x: 0, y: 0 }, 9, MOBILE, 'planning').zoom).toBe(3);
  });

  it('pan_clamps_to_the_map: a zoomed view never shows past the map edges', () => {
    let v = zoomAt(overviewView(MOBILE, 'planning'), { x: 187, y: 400 }, 3, MOBILE, 'planning');
    v = panBy(v, { x: 100000, y: 100000 }, MOBILE, 'planning');
    let r = visible(v, MOBILE);
    expect(r.x0).toBeCloseTo(MAP_BOUNDS.x0, 6);
    expect(r.y0).toBeCloseTo(MAP_BOUNDS.y0, 6);
    v = panBy(v, { x: -200000, y: -200000 }, MOBILE, 'planning');
    r = visible(v, MOBILE);
    expect(r.x1).toBeCloseTo(MAP_BOUNDS.x1, 6);
    expect(r.y1).toBeCloseTo(MAP_BOUNDS.y1, 6);
  });

  it('pans at the overview step too: the isometric board is wider than a phone', () => {
    const base = overviewView(MOBILE, 'planning');
    const moved = panBy(base, { x: 120, y: 0 }, MOBILE, 'planning');
    expect(moved.zoom).toBe(base.zoom);
    expect(moved.scroll.x).toBeCloseTo(base.scroll.x - 120, 6);
  });

  it('centres a view wider than the map instead of clamping one side', () => {
    const wide = clampView({ zoom: 2, scroll: { x: -5000, y: 0 } }, { w: 4000, h: 800 });
    const r = visible(wide, { w: 4000, h: 800 });
    expect((r.x0 + r.x1) / 2).toBeCloseTo((MAP_BOUNDS.x0 + MAP_BOUNDS.x1) / 2, 6);
  });

  it('resize_keeps_the_view_centre and the overview stays the overview', () => {
    const z = zoomAt(overviewView(DESKTOP, 'planning'), { x: 640, y: 360 }, 2, DESKTOP, 'planning');
    const centre = screenToWorld({ x: 640, y: 360 }, z.scroll, DESKTOP, z.zoom);
    const next: Size = { w: 1000, h: 700 };
    const r = resizeView(z, DESKTOP, next, 'planning');
    const now = screenToWorld({ x: 500, y: 350 }, r.scroll, next, r.zoom);
    expect(r.zoom).toBe(2);
    expect(now.x).toBeCloseTo(centre.x, 6);
    expect(now.y).toBeCloseTo(centre.y, 6);
    expect(resizeView(overviewView(DESKTOP, 'planning'), DESKTOP, next, 'planning')).toEqual(overviewView(next, 'planning'));
  });

  it('live_drop_uses_the_current_camera: at the overview it matches the planning layout, zoomed it follows the view', () => {
    const lay = planningLayout(DESKTOP);
    const base = overviewView(DESKTOP, 'planning');
    for (const p of [{ x: lay.board.x + 5, y: lay.board.y + 5 }, { x: 700, y: 400 }, { x: 10, y: 10 }]) {
      expect(plotAtView(base, DESKTOP, p)).toBe(plotAtScreen(lay, p));
    }
    expect(plotRectAtView(base, DESKTOP, 12)).toEqual(plotScreenRect(lay, 12));
    const z = zoomAt(base, { x: 640, y: 360 }, 3, DESKTOP, 'planning');
    const r = plotRectAtView(z, DESKTOP, 7);
    expect([r.w, r.h]).toEqual([ISO.plotW * 3, ISO.plotH * 3]);
    const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    expect(plotAtView(z, DESKTOP, c)).toBe(7);
    // half a diamond right and down is the next row south (plot 12); half left and down the next column (plot 8)
    expect(plotAtView(z, DESKTOP, { x: c.x + r.w / 2, y: c.y + r.h / 2 })).toBe(12);
    expect(plotAtView(z, DESKTOP, { x: c.x - r.w / 2, y: c.y + r.h / 2 })).toBe(8);
    expect(plotAtView(z, DESKTOP, { x: r.x + 1, y: r.y + 1 })).not.toBe(7);
  });

  it('maps battle aim through the live view and returns null off the field', () => {
    const z = zoomAt(overviewView(DESKTOP, 'battle'), { x: 640, y: 360 }, 2, DESKTOP, 'battle');
    const w = worldAtView(z, DESKTOP, { x: 640, y: 360 })!;
    expect(w).toEqual(unproject(screenToWorld({ x: 640, y: 360 }, z.scroll, DESKTOP, 2)));
    const far = panBy(z, { x: 100000, y: 0 }, DESKTOP, 'battle');
    expect(worldAtView(far, DESKTOP, { x: 1, y: 360 })).toBeNull();
  });

  it('pinch steps one zoom once the finger spread grows by 25% or shrinks by 20%', () => {
    expect(pinchStep(100 * 100, 124 * 124)).toBe(0);
    expect(pinchStep(100 * 100, 125 * 125)).toBe(1);
    expect(pinchStep(100 * 100, 81 * 81)).toBe(0);
    expect(pinchStep(100 * 100, 80 * 80)).toBe(-1);
    expect(pinchStep(0, 50)).toBe(0);
  });
});
