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

/** A column leaves room for Vietnamese labels and confirmation text on phones. */
export const settingsLayout = (screen: Size): SettingsLayout => {
  const w = Math.min(screen.w - 24, screen.w >= 768 ? 560 : 400);
  const h = 696;
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
