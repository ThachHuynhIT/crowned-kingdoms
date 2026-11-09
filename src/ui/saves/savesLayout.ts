/**
 * Màn "Tải ván" (2026-11-09): một cột hàng, mỗi hàng là một bản lưu (bản tự lưu ở trên cùng) với chữ bên trái và
 * ba nút Mở · Đổi tên · Xoá bên phải. Thuần: chỉ tính hình chữ nhật; mọi vùng chạm ≥ 44×44.
 */
import type { Rect, Size } from '../hud/layout';

export const SAVES_ROW_H = 44;
const ROW_GAP = 4;
/** Row buttons: narrower on a phone (still ≥ 44 px) so the name and detail have room. */
const BUTTON_W = 64;
const BUTTON_W_NARROW = 52;
const BUTTON_GAP = 6;
const TOP = 56;
const BOTTOM = 96;
const PAGE_W = 52;

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
  /** Page buttons either side of "Về menu": rows that do not fit the screen are on later pages. */
  prev: Rect;
  next: Rect;
  /** Rows shown per page. */
  perPage: number;
  /** Số chữ tối đa của tên trên một hàng (điện thoại hẹp hơn). */
  nameChars: number;
  /** Số chữ tối đa của dòng chi tiết; `narrow` = dòng gọn cho điện thoại. */
  detailChars: number;
  narrow: boolean;
}

/** Bố cục cho `count` hàng; hàng không vừa màn hình sang trang sau (tối đa 11: bản tự lưu + 10). */
export const savesLayout = (screen: Size, count: number): SavesLayout => {
  const w = Math.min(screen.w - 24, screen.w >= 768 ? 720 : 400);
  const fit = Math.max(0, Math.floor((screen.h - 24 - TOP - BOTTOM + ROW_GAP) / (SAVES_ROW_H + ROW_GAP)));
  const n = Math.min(count, fit);
  const h = TOP + Math.max(1, n) * (SAVES_ROW_H + ROW_GAP) - ROW_GAP + BOTTOM;
  const x = Math.round((screen.w - w) / 2);
  const y = Math.round((screen.h - h) / 2);
  const innerX = x + 16;
  const innerW = w - 32;
  const bw = screen.w >= 768 ? BUTTON_W : BUTTON_W_NARROW;
  const rows = Array.from({ length: n }, (_, i): SaveRowLayout => {
    const top = y + TOP + i * (SAVES_ROW_H + ROW_GAP);
    const button = (k: number): Rect => ({
      x: innerX + innerW - (3 - k) * bw - (2 - k) * BUTTON_GAP,
      y: top + (SAVES_ROW_H - 44) / 2,
      w: bw,
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
    prev: { x: innerX, y: bottom + 40, w: PAGE_W, h: 48 },
    back: { x: innerX + PAGE_W + BUTTON_GAP, y: bottom + 40, w: innerW - 2 * (PAGE_W + BUTTON_GAP), h: 48 },
    next: { x: innerX + innerW - PAGE_W, y: bottom + 40, w: PAGE_W, h: 48 },
    perPage: Math.max(1, fit),
    nameChars: screen.w >= 768 ? 40 : 18,
    detailChars: screen.w >= 768 ? 64 : 24,
    narrow: screen.w < 768,
  };
};

/** Tên rút gọn cho vừa hàng, thêm "…" khi bị cắt. */
export const fitName = (name: string, chars: number): string =>
  name.length <= chars ? name : `${name.slice(0, Math.max(1, chars - 1))}…`;

const two = (n: number): string => String(n).padStart(2, '0');

/**
 * Dòng chi tiết dưới tên bản lưu: vua, năm và lúc lưu (`savedAt` null = bản tự lưu). Trên điện thoại (`narrow`) gọn hơn:
 * bỏ chữ "Vua", "N" thay "Năm", chỉ ngày/tháng, để không chạy xuống dưới các nút.
 */
export const slotDetail = (kingName: string, year: number, savedAt: number | null, narrow: boolean): string => {
  const d = savedAt === null ? null : new Date(savedAt);
  if (narrow) {
    const king = kingName.replace(/^Vua\s+/, '');
    const at = d ? ` · ${two(d.getDate())}/${two(d.getMonth() + 1)}` : '';
    return `${king} · N${year}${at}`;
  }
  const at = d
    ? ` · ${two(d.getHours())}:${two(d.getMinutes())} ${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()}`
    : '';
  return `${kingName} · Năm ${year}${at}`;
};
