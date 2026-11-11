import { SETTINGS_BUTTON } from '../../data/settings';
import type { Rect, Size } from '../hud/layout';

export interface VolumeRowLayout {
  label: Rect;
  minus: Rect;
  value: Rect;
  plus: Rect;
}

export interface SettingsLayout {
  panel: Rect;
  title: Rect;
  rows: VolumeRowLayout[];
  shake: Rect;
  /** Graphics (11/11/2026): effects beside the shake toggle, quality and damage numbers on the next row. */
  effects: Rect;
  graphics: Rect;
  damageNumbers: Rect;
  discard: Rect;
  message: Rect;
  confirm: Rect;
  cancel: Rect;
  close: Rect;
}

/** The tall single-column panel needs this much height; shorter landscape screens get the two-column one. */
const TALL_PANEL_H = 696;
/** Widest two-column panel (short landscape screens). */
const WIDE_PANEL_W = 760;

/**
 * Short landscape screens (night 12/11/2026: at 960×540, 844×390 or 667×375 the 696 px panel lost its title and its
 * Đóng button): two columns, volumes on the left, toggles on the right, Đóng beside the title. 372 px tall.
 */
const compactSettingsLayout = (screen: Size): SettingsLayout => {
  const w = Math.min(screen.w - 24, WIDE_PANEL_W);
  const h = 372;
  const x = Math.round((screen.w - w) / 2);
  const y = Math.max(0, Math.round((screen.h - h) / 2));
  const innerX = x + 20;
  const innerW = w - 40;
  const colW = Math.floor((innerW - 16) / 2);
  const rightX = innerX + innerW - colW;
  const B = SETTINGS_BUTTON;
  const closeW = 120;
  const rows = [0, 1, 2].map((i): VolumeRowLayout => {
    const top = y + 64 + i * (B + 4);
    const controlsX = innerX + colW - (B + 4 + 56 + 4 + B);
    return {
      label: { x: innerX, y: top, w: controlsX - innerX - 4, h: B },
      minus: { x: controlsX, y: top, w: B, h: B },
      value: { x: controlsX + B + 4, y: top, w: 56, h: B },
      plus: { x: controlsX + B + 4 + 56 + 4, y: top, w: B, h: B },
    };
  });
  const toggle = (i: number): Rect => ({ x: rightX, y: y + 64 + i * (B + 4), w: colW, h: B });
  const half = Math.floor((innerW - 8) / 2);
  return {
    panel: { x, y, w, h },
    title: { x: innerX, y: y + 8, w: innerW - closeW - 8, h: B },
    rows,
    shake: toggle(0),
    effects: toggle(1),
    graphics: toggle(2),
    damageNumbers: toggle(3),
    discard: { x: innerX, y: y + 64 + 3 * (B + 4) + 4, w: colW, h: B },
    message: { x: innerX, y: y + 280, w: innerW, h: 32 },
    confirm: { x: innerX, y: y + 316, w: half, h: B },
    cancel: { x: innerX + half + 8, y: y + 316, w: innerW - half - 8, h: B },
    close: { x: innerX + innerW - closeW, y: y + 8, w: closeW, h: B },
  };
};

/** A column leaves room for Vietnamese labels and confirmation text on phones. */
export const settingsLayout = (screen: Size): SettingsLayout => {
  if (screen.h < TALL_PANEL_H + 16 && screen.w >= 640) return compactSettingsLayout(screen);
  const w = Math.min(screen.w - 24, screen.w >= 768 ? 560 : 400);
  const h = TALL_PANEL_H;
  const x = Math.round((screen.w - w) / 2);
  const y = Math.round((screen.h - h) / 2);
  const innerX = x + 20;
  const innerW = w - 40;
  const rect = (dy: number, height: number): Rect => ({
    x: innerX,
    y: y + dy,
    w: innerW,
    h: height,
  });
  const rows = [0, 1, 2].map((i): VolumeRowLayout => {
    const top = y + 64 + i * 80;
    const controlsX = Math.round(x + w / 2 - 92);
    return {
      label: { x: innerX, y: top, w: innerW, h: 28 },
      minus: { x: controlsX, y: top + 32, w: SETTINGS_BUTTON, h: SETTINGS_BUTTON },
      value: { x: controlsX + 56, y: top + 32, w: 72, h: 48 },
      plus: { x: controlsX + 136, y: top + 32, w: SETTINGS_BUTTON, h: SETTINGS_BUTTON },
    };
  });
  const half = Math.floor((innerW - 8) / 2);
  const left = (dy: number): Rect => ({ x: innerX, y: y + dy, w: half, h: 48 });
  const right = (dy: number): Rect => ({ x: innerX + half + 8, y: y + dy, w: innerW - half - 8, h: 48 });
  return {
    panel: { x, y, w, h },
    title: rect(16, 32),
    rows,
    shake: left(308),
    effects: right(308),
    graphics: left(364),
    damageNumbers: right(364),
    discard: rect(420, 48),
    message: rect(476, 96),
    confirm: { x: innerX, y: y + 580, w: half, h: 48 },
    cancel: { x: innerX + half + 8, y: y + 580, w: innerW - half - 8, h: 48 },
    close: rect(636, 48),
  };
};
