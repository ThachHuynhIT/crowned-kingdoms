/**
 * HiDPI display maths (spec 2026-11-11-hidpi-rendering-design.md §4). Pure: no Phaser, no DOM.
 *
 * Logical px = CSS px of the `#game` box: every layout, pointer and touch-target rule works in them. The canvas
 * backing store has `round(logical × D)` pixels per axis, so each axis has its own ratio backing / logical
 * (they differ slightly at odd densities because the backing size is rounded to whole pixels).
 */
import type { CameraView } from './realm/cameraBounds';
import type { Point, Size } from './hud/layout';

export interface DisplayMetrics {
  /** CSS px of the game box: what layout code sees. */
  readonly logical: Size;
  /** Canvas pixels. */
  readonly backing: Size;
  /** The density used (device pixels per CSS px); 1 when the input was invalid. */
  readonly density: number;
  /** Backing px per logical px, per axis. */
  readonly ratio: Point;
}

const validDensity = (d: number): number => (Number.isFinite(d) && d > 0 ? d : 1);

/** Metrics for a non-empty logical box at density `density` (invalid densities fall back to 1). */
export const makeDisplayMetrics = (logical: Size, density: number): DisplayMetrics => {
  if (!(logical.w > 0 && logical.h > 0)) throw new Error(`empty display box ${logical.w}×${logical.h}`);
  const d = validDensity(density);
  const backing = { w: Math.max(1, Math.round(logical.w * d)), h: Math.max(1, Math.round(logical.h * d)) };
  return {
    logical: { w: logical.w, h: logical.h },
    backing,
    density: d,
    ratio: { x: backing.w / logical.w, y: backing.h / logical.h },
  };
};

/** A point in backing (Phaser screen) px → logical px. */
export const toLogicalPoint = (p: Point, m: DisplayMetrics): Point => ({ x: p.x / m.ratio.x, y: p.y / m.ratio.y });

/** A point in logical px → backing px. */
export const toBackingPoint = (p: Point, m: DisplayMetrics): Point => ({ x: p.x * m.ratio.x, y: p.y * m.ratio.y });

/** Distance between two backing points, measured in logical px (each axis by its own ratio). */
export const logicalPressDistance = (current: Point, down: Point, m: DisplayMetrics): number => {
  const a = toLogicalPoint(current, m);
  const b = toLogicalPoint(down, m);
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * The backing camera (origin 0.5, viewport = the whole backing canvas) that draws the logical realm view exactly as
 * today's camera draws it in logical px: zoom × ratio, scroll shifted by half the size difference so the centre
 * stays put (spec §4, proof there). At D 1 it is the view itself.
 */
export const cameraBackingView = (view: CameraView, m: DisplayMetrics): { zoom: Point; scroll: Point } => ({
  zoom: { x: m.ratio.x * view.zoom, y: m.ratio.y * view.zoom },
  scroll: {
    x: view.scroll.x + (m.logical.w - m.backing.w) / 2,
    y: view.scroll.y + (m.logical.h - m.backing.h) / 2,
  },
});

/** A logical translation rounded so that `value × ratio` is a whole device pixel (ratio 1: `Math.round`). */
export const snapTranslation = (value: number, ratio: number): number =>
  ratio === 1 ? Math.round(value) : Math.round(value * ratio) / ratio;

const DECIMAL = /^\d+(?:\.\d+)?$|^\.\d+$/;

/**
 * The density to use (spec §5): a valid override (a positive decimal string, trimmed; odd values allowed) wins,
 * else the device density, else 1.
 */
export const effectiveDensity = (deviceDpr: number, override?: string): number => {
  const raw = override?.trim() ?? '';
  if (DECIMAL.test(raw)) {
    const o = Number(raw);
    if (Number.isFinite(o) && o > 0) return o;
  }
  return validDensity(deviceDpr);
};

/**
 * Rollout policy (spec §5): while HiDPI is disabled the game draws at 1 unless a DEV `?density=` override is given;
 * once enabled it uses the device density. Production builds ignore the override.
 */
export const resolveDensity = (o: { device: number; enabled: boolean; dev: boolean; override?: string }): number => {
  const override = o.dev ? o.override : undefined;
  if (!o.enabled) return effectiveDensity(1, override);
  return effectiveDensity(o.device, override);
};
