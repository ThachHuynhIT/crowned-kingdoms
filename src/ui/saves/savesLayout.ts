/**
 * Màn "Tải ván" (2026-11-09): một cột hàng, mỗi hàng là một bản lưu (bản tự lưu ở trên cùng) với chữ bên trái và
 * ba nút Mở · Đổi tên · Xoá bên phải. Thuần: chỉ tính hình chữ nhật; mọi vùng chạm ≥ 44×44.
 */
import type { Rect, Size } from '../hud/layout';

export const SAVES_ROW_H = 44;
const ROW_GAP = 4;
const BUTTON_W = 64;
const BUTTON_GAP = 6;
const TOP = 56;
const BOTTOM = 96;

export interface SaveRowLayout {
  row: Rect;
  text: Rect;
  open: Rect;
  rename: Rect;
  remove: Rect;
}

export interface SavesLayout {
  panel: Rect;
  title: Rect;
  rows: SaveRowLayout[];
  message: Rect;
  back: Rect;
  /** Số chữ tối đa của tên trên một hàng (điện thoại hẹp hơn). */
  nameChars: number;
}

/** Bố cục cho `count` hàng; hàng không vừa màn hình thì bị bỏ (tối đa 11: bản tự lưu + 10). */
export const savesLayout = (screen: Size, count: number): SavesLayout => {
  const w = Math.min(screen.w - 24, screen.w >= 768 ? 720 : 400);
  const fit = Math.max(0, Math.floor((screen.h - 24 - TOP - BOTTOM + ROW_GAP) / (SAVES_ROW_H + ROW_GAP)));
  const n = Math.min(count, fit);
  const h = TOP + Math.max(1, n) * (SAVES_ROW_H + ROW_GAP) - ROW_GAP + BOTTOM;
  const x = Math.round((screen.w - w) / 2);
  const y = Math.round((screen.h - h) / 2);
  const innerX = x + 16;
  const innerW = w - 32;
  const rows = Array.from({ length: n }, (_, i): SaveRowLayout => {
    const top = y + TOP + i * (SAVES_ROW_H + ROW_GAP);
    const button = (k: number): Rect => ({
      x: innerX + innerW - (3 - k) * BUTTON_W - (2 - k) * BUTTON_GAP,
      y: top + (SAVES_ROW_H - 44) / 2,
      w: BUTTON_W,
      h: 44,
    });
    const open = button(0);
    return {
      row: { x: innerX, y: top, w: innerW, h: SAVES_ROW_H },
      text: { x: innerX + 8, y: top, w: open.x - BUTTON_GAP - innerX - 8, h: SAVES_ROW_H },
      open,
      rename: button(1),
      remove: button(2),
    };
  });
  const bottom = y + h - BOTTOM;
  return {
    panel: { x, y, w, h },
    title: { x: innerX, y: y + 12, w: innerW, h: 32 },
    rows,
    message: { x: innerX, y: bottom + 4, w: innerW, h: 32 },
    back: { x: innerX, y: bottom + 40, w: innerW, h: 48 },
    nameChars: screen.w >= 768 ? 40 : 18,
  };
};

/** Tên rút gọn cho vừa hàng, thêm "…" khi bị cắt. */
export const fitName = (name: string, chars: number): string =>
  name.length <= chars ? name : `${name.slice(0, Math.max(1, chars - 1))}…`;
