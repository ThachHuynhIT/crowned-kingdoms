import { describe, expect, it } from 'vitest';
import { ISO, unproject } from '../../core/iso';
import { BATTLE, ENEMY_PORTAL } from '../../data/battle';
import type { Size } from '../hud/layout';
import {
  MAP_BOUNDS,
  ZOOM_MAX,
  clampView,
  overviewView,
  panBy,
  isOverview,
  keepView,
  pinchView,
  pinchZoom,
  snapView,
  wheelZoom,
  zoomLimits,
  plotAtView,
  plotRectAtView,
  resizeView,
  worldAtView,
  worldToScreen,
  zoomAt,
} from './cameraModel';
import { overviewZoom, planningLayout, plotAtScreen, plotScreenRect, realmCamera, screenToWorld } from './realmLayout';

const DESKTOP: Size = { w: 1280, h: 720 };
const MOBILE: Size = { w: 375, h: 812 };

const visible = (v: { zoom: number; scroll: { x: number; y: number } }, s: Size) => {
  const tl = screenToWorld({ x: 0, y: 0 }, v.scroll, s, v.zoom);
  const br = screenToWorld({ x: s.w, y: s.h }, v.scroll, s, v.zoom);
  return { x0: tl.x, y0: tl.y, x1: br.x, y1: br.y };
};

describe('camera model (spec 06/11/2026, P2 zoom)', () => {
  it('starts at the overview camera of the phase; zoom is free between the overview and 3 (spec 2026-11-08 §4)', () => {
    for (const s of [DESKTOP, MOBILE]) {
      expect(overviewView(s, 'planning')).toEqual(realmCamera(s, 'planning'));
      expect(zoomLimits(s, 'planning')).toEqual({ min: overviewZoom(s, 'planning'), max: 3 });
    }
    expect(ZOOM_MAX).toBe(3);
    // zoom_max_is_three_on_wide_screen; a screen whose overview is already past 3 cannot zoom further
    expect(zoomLimits({ w: 2000, h: 994 }, 'battle')).toEqual({ min: 2.03125, max: 3 });
    expect(zoomLimits({ w: 8000, h: 4000 }, 'battle')).toEqual({ min: 3, max: 3 });
  });

  it('fractional_zoom_keeps_pointer_anchor_without_clamp', () => {
    const base = overviewView(DESKTOP, 'planning');
    const p = { x: 700, y: 400 };
    const before = screenToWorld(p, base.scroll, DESKTOP, base.zoom);
    for (const z of [1.5, 1.77, 2.4, 3]) {
      const v = zoomAt(base, p, z, DESKTOP, 'planning');
      expect(v.zoom).toBeCloseTo(z, 12);
      const after = screenToWorld(p, v.scroll, DESKTOP, v.zoom);
      expect(after.x).toBeCloseTo(before.x, 8);
      expect(after.y).toBeCloseTo(before.y, 8);
    }
    expect(zoomAt(base, p, 9, DESKTOP, 'planning').zoom).toBe(3);
    expect(zoomAt(base, p, 0.1, DESKTOP, 'planning').zoom).toBe(overviewZoom(DESKTOP, 'planning'));
  });

  it('zoom_to_min_does_not_reset_pan: zooming out to the overview zoom keeps the point under the cursor', () => {
    const base = overviewView(DESKTOP, 'planning');
    const z2 = panBy(zoomAt(base, { x: 640, y: 360 }, 2, DESKTOP, 'planning'), { x: -60, y: -30 }, DESKTOP, 'planning');
    const out = zoomAt(z2, { x: 640, y: 360 }, 0.5, DESKTOP, 'planning');
    expect(out.zoom).toBe(base.zoom);
    expect(out.scroll).not.toEqual(base.scroll);
  });

  it('wheel and pinch change the zoom by a ratio, not by steps', () => {
    expect(wheelZoom(2, -100)).toBeCloseTo(2.2, 12); // wheel up: +10%
    expect(wheelZoom(2, 100)).toBeCloseTo(1.8, 12);
    expect(wheelZoom(2, -1000)).toBeCloseTo(2.2, 12); // at most ±10% per event
    expect(wheelZoom(2, -10)).toBeCloseTo(2.02, 12); // small deltas still move it
    expect(pinchZoom(1.5, 100 * 100, 150 * 150)).toBeCloseTo(2.25, 12);
    expect(pinchZoom(1.5, 100 * 100, 50 * 50)).toBeCloseTo(0.75, 12);
    expect(pinchZoom(1.5, 0, 50)).toBe(1.5);
    expect(pinchZoom(1.5, 100, Number.NaN)).toBe(1.5);
  });

  it('pinch_moving_midpoint_keeps_original_world_anchor, and pinch_at_limit_still_pans_midpoint', () => {
    const start = zoomAt(overviewView(DESKTOP, 'planning'), { x: 640, y: 360 }, 2, DESKTOP, 'planning');
    const startMid = { x: 640, y: 360 };
    const anchor = screenToWorld(startMid, start.scroll, DESKTOP, start.zoom);
    const nowMid = { x: 660, y: 350 };
    const v = pinchView(start, startMid, nowMid, 100 * 100, 120 * 120, DESKTOP, 'planning');
    expect(v.zoom).toBeCloseTo(2.4, 12);
    const at = screenToWorld(nowMid, v.scroll, DESKTOP, v.zoom);
    expect(at.x).toBeCloseTo(anchor.x, 8);
    expect(at.y).toBeCloseTo(anchor.y, 8);
    // spread far past the limit: the zoom stops at 3, the anchor still follows the moving midpoint
    const capped = pinchView(start, startMid, nowMid, 100 * 100, 400 * 400, DESKTOP, 'planning');
    expect(capped.zoom).toBe(3);
    const at3 = screenToWorld(nowMid, capped.scroll, DESKTOP, 3);
    expect(at3.x).toBeCloseTo(anchor.x, 8);
    expect(at3.y).toBeCloseTo(anchor.y, 8);
    expect(pinchView(start, startMid, startMid, 0, 50, DESKTOP, 'planning').zoom).toBe(start.zoom); // zero_spread_is_safe
  });

  it('isOverview and keepView: a phase change keeps a hand-set view, clamped to the new phase', () => {
    const plan = overviewView(DESKTOP, 'planning');
    expect(isOverview(plan, DESKTOP, 'planning')).toBe(true);
    const z = zoomAt(plan, { x: 700, y: 400 }, 2, DESKTOP, 'planning');
    expect(isOverview(z, DESKTOP, 'planning')).toBe(false);
    const kept = keepView(z, DESKTOP, 'battle');
    expect(kept.zoom).toBe(2);
    const c0 = screenToWorld({ x: 640, y: 360 }, z.scroll, DESKTOP, z.zoom);
    const c1 = screenToWorld({ x: 640, y: 360 }, kept.scroll, DESKTOP, kept.zoom);
    expect(c1.x).toBeCloseTo(c0.x, 6);
    expect(c1.y).toBeCloseTo(c0.y, 6);
    // a view below the battle's overview zoom is raised to it
    const low = { zoom: plan.zoom, scroll: plan.scroll };
    expect(keepView(low, DESKTOP, 'battle').zoom).toBeCloseTo(overviewZoom(DESKTOP, 'battle'), 12);
  });

  it('snapView: the camera translation lands on whole screen pixels, at most half a pixel from the view', () => {
    for (const s of [DESKTOP, MOBILE, { w: 2000, h: 994 }])
      for (const zoom of [1.03125, 1.29375, 1.7, 2.03125, 3])
        for (const scroll of [{ x: -640.3, y: 24.77 }, { x: 12.123, y: 300.5 }]) {
          const v = snapView({ zoom, scroll }, s);
          expect(v.zoom).toBe(zoom);
          for (const [axis, half] of [['x', s.w / 2], ['y', s.h / 2]] as const) {
            const t = (1 - zoom) * half - zoom * v.scroll[axis];
            expect(Math.abs(t - Math.round(t))).toBeLessThan(1e-6);
            expect(Math.abs((v.scroll[axis] - scroll[axis]) * zoom)).toBeLessThanOrEqual(0.5 + 1e-9);
          }
        }
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

  it('zooming out below the overview stops at the overview zoom; any zoom in between is allowed', () => {
    const z2 = zoomAt(overviewView(MOBILE, 'planning'), { x: 10, y: 10 }, 2, MOBILE, 'planning');
    expect(zoomAt(z2, { x: 300, y: 700 }, 1, MOBILE, 'planning').zoom).toBe(33 / 32);
    expect(zoomAt(z2, { x: 0, y: 0 }, 2.5, MOBILE, 'planning').zoom).toBe(2.5);
    expect(zoomAt(z2, { x: 0, y: 0 }, 9, MOBILE, 'planning').zoom).toBe(3);
  });

  it('pan_clamps_to_the_map and never_centres_past_the_cliff: the view stays in the map, its centre on the field south of the wall', () => {
    for (const s of [DESKTOP, MOBILE])
      for (const z of [1, 2, 3]) {
        let v = zoomAt(overviewView(s, 'planning'), { x: s.w / 2, y: s.h / 2 }, z, s, 'planning');
        for (const d of [{ x: 1e5, y: 1e5 }, { x: -1e5, y: 1e5 }, { x: 1e5, y: -1e5 }, { x: -1e5, y: -1e5 }, { x: 1e5, y: 0 }, { x: 0, y: 1e5 }]) {
          v = panBy(v, d, s, 'planning');
          const c = unproject(screenToWorld({ x: s.w / 2, y: s.h / 2 }, v.scroll, s, v.zoom));
          expect(c.y, `${s.w} z${z} ${d.x},${d.y}`).toBeGreaterThanOrEqual(BATTLE.wallY - 1e-6);
          expect(c.x).toBeGreaterThanOrEqual(-BATTLE.plot - 1e-6);
          expect(c.x).toBeLessThanOrEqual(BATTLE.field + BATTLE.plot + 1e-6);
          const r = visible(v, s);
          expect(r.x0).toBeGreaterThanOrEqual(MAP_BOUNDS.x0 - 1e-6);
          expect(r.y0).toBeGreaterThanOrEqual(MAP_BOUNDS.y0 - 1e-6);
          expect(r.x1).toBeLessThanOrEqual(MAP_BOUNDS.x1 + 1e-6);
          expect(r.y1).toBeLessThanOrEqual(MAP_BOUNDS.y1 + 1e-6);
        }
      }
  });

  it('pans at the overview step too: the isometric board is wider than a phone', () => {
    const base = overviewView(MOBILE, 'planning');
    const moved = panBy(base, { x: 120, y: 0 }, MOBILE, 'planning');
    expect(moved.zoom).toBe(base.zoom);
    expect(moved.scroll.x).toBeCloseTo(base.scroll.x - 120 / base.zoom, 6);
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
    const a = plotRectAtView(base, DESKTOP, 12);
    const b = plotScreenRect(lay, 12);
    for (const k of ['x', 'y', 'w', 'h'] as const) expect(a[k]).toBeCloseTo(b[k], 6);
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
    // a point west of the field (and one north of it) is off the field
    expect(worldAtView(z, DESKTOP, worldToScreen(z, DESKTOP, { x: -40, y: 400 }))).toBeNull();
    expect(worldAtView(z, DESKTOP, worldToScreen(z, DESKTOP, { x: 400, y: -20 }))).toBeNull();
  });

  it('battle_aim_accepts_portal_but_plot_hit_does_not (spec 2026-11-08 §3)', () => {
    const z = zoomAt(overviewView(DESKTOP, 'battle'), { x: 640, y: 360 }, 2, DESKTOP, 'battle');
    const portal = worldToScreen(z, DESKTOP, { x: ENEMY_PORTAL.x, y: ENEMY_PORTAL.y });
    const w = worldAtView(z, DESKTOP, portal)!;
    expect(w.x).toBeCloseTo(ENEMY_PORTAL.x, 6);
    expect(w.y).toBeCloseTo(ENEMY_PORTAL.y, 6);
    expect(plotAtView(z, DESKTOP, portal)).toBeNull();
    // past the clamp line it is off the field again
    expect(worldAtView(z, DESKTOP, worldToScreen(z, DESKTOP, { x: 384, y: BATTLE.field + BATTLE.fieldClampMargin + 8 }))).toBeNull();
  });

  it('clamp_centre_stays_south_of_wall_at_fractional_zoom and inverse_roundtrip_all_25_plots_at_fractional_view', () => {
    for (const z of [1.29375, 1.7, 2.6]) {
      let v = zoomAt(overviewView(DESKTOP, 'planning'), { x: 640, y: 360 }, z, DESKTOP, 'planning');
      v = panBy(v, { x: 1e5, y: 1e5 }, DESKTOP, 'planning');
      const c = unproject(screenToWorld({ x: 640, y: 360 }, v.scroll, DESKTOP, v.zoom));
      expect(c.y).toBeGreaterThanOrEqual(BATTLE.wallY - 1e-6);
      const centred = zoomAt(overviewView(DESKTOP, 'planning'), { x: 640, y: 360 }, z, DESKTOP, 'planning');
      for (let plot = 0; plot < 25; plot++) {
        const r = plotRectAtView(centred, DESKTOP, plot);
        expect(plotAtView(centred, DESKTOP, { x: r.x + r.w / 2, y: r.y + r.h / 2 })).toBe(plot);
      }
    }
  });
});
