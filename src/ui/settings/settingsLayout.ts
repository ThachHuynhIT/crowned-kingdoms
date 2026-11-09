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
  discard: Rect;
  message: Rect;
  confirm: Rect;
  cancel: Rect;
  close: Rect;
}

/** A column leaves room for Vietnamese labels and confirmation text on phones. */
export const settingsLayout = (screen: Size): SettingsLayout => {
  const w = Math.min(screen.w - 24, screen.w >= 768 ? 560 : 400);
  const h = 672;
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
    const top = y + 64 + i * 92;
    const controlsX = Math.round(x + w / 2 - 92);
    return {
      label: { x: innerX, y: top, w: innerW, h: 28 },
      minus: { x: controlsX, y: top + 32, w: SETTINGS_BUTTON, h: SETTINGS_BUTTON },
      value: { x: controlsX + 56, y: top + 32, w: 72, h: 48 },
      plus: { x: controlsX + 136, y: top + 32, w: SETTINGS_BUTTON, h: SETTINGS_BUTTON },
    };
  });
  const half = Math.floor((innerW - 8) / 2);
  return {
    panel: { x, y, w, h },
    title: rect(16, 32),
    rows,
    shake: rect(340, 48),
    discard: rect(396, 48),
    message: rect(452, 96),
    confirm: { x: innerX, y: y + 556, w: half, h: 48 },
    cancel: { x: innerX + half + 8, y: y + 556, w: innerW - half - 8, h: 48 },
    close: rect(612, 48),
  };
};
