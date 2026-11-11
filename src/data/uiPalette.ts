import type { KingId } from './types';

/**
 * UI palette — the deliberate exception to "every pixel from PALETTE": the interface is
 * warm and bright (wood frames, cream paper) so it reads over the world, the way Stardew
 * puts a wooden frame over every scene. World pixels still come from PALETTE (Hearth 32).
 * See docs/ART_STYLE.md.
 */
export const UI_PALETTE = {
  outline: 0x2b1408, // viền ngoài cùng, gần đen nâu
  woodDark: 0x5b2c0f, // bóng gỗ, rãnh vân
  wood: 0xb5651d, // thân gỗ
  woodLight: 0xe0a050, // gờ sáng, highlight vân
  cream: 0xf5deb3, // lõi panel
  creamDark: 0xd9b77a, // bóng trong lõi, viền ô hotbar
  creamLight: 0xfff4dc, // lõi tooltip, ô đang hover
  text: 0x3b1d0a, // chữ chính
  textShadow: 0xd9b77a, // bóng chữ (lệch +1,+1) trên nền kem
  gold: 0xf2c94c, // số tài nguyên, sao
  select: 0xd03a2c, // viền ô hotbar đang chọn (đỏ kiểu Stardew)
  good: 0x5a9e3a, // thanh nhu cầu đầy
  warn: 0xe08a1e, // thanh nhu cầu thấp
  bad: 0xb8322a, // thanh nhu cầu nguy hiểm, lỗi đặt
  sky: [0xf6b26b, 0xf08a5d, 0xb85c7a, 0x6b4a8a], // gradient trời menu, trên → dưới
} as const;

/** Every colour of UI_PALETTE in one flat list (the sky gradient expanded). */
export const UI_COLORS: readonly number[] = Object.values(UI_PALETTE).flatMap((value) =>
  typeof value === 'number' ? [value] : [...value],
);

/**
 * Colours of one king's screens (king select, cards, bars): `bgDark` / `bgMid` fill the
 * background, `panel` and `light` are paper tones that keep `UI_PALETTE.text` readable,
 * `accent` is the vivid title/selection colour. Each is near-monochrome in the hue of that
 * king's portrait so the whole screen changes with the king.
 */
export interface KingTheme {
  readonly bgDark: number;
  readonly bgMid: number;
  readonly panel: number;
  readonly light: number;
  readonly accent: number;
}

export const KING_THEMES: Readonly<Record<KingId, KingTheme>> = {
  arcane: { bgDark: 0x120a24, bgMid: 0x2d1b52, panel: 0xd9c9f2, light: 0xeee6fb, accent: 0x9a6cf0 },
  clock: { bgDark: 0x2a160c, bgMid: 0x5e3418, panel: 0xe8c8a0, light: 0xf6e4cc, accent: 0xd08a3c },
  forge: { bgDark: 0x24100a, bgMid: 0x5c2412, panel: 0xf0c4a8, light: 0xf9e2d2, accent: 0xf06a3a },
  grove: { bgDark: 0x0c1f10, bgMid: 0x1f4a28, panel: 0xc6e0b0, light: 0xe4f2d6, accent: 0x5cc070 },
  moon: { bgDark: 0x0c1030, bgMid: 0x242c66, panel: 0xc4caee, light: 0xe2e5f8, accent: 0x7c88f0 },
  nomad: { bgDark: 0x2a1c10, bgMid: 0x6a4a24, panel: 0xead0b4, light: 0xf6e8d8, accent: 0xe07a3a },
  stone: { bgDark: 0x10161e, bgMid: 0x2c3a4c, panel: 0xc9d3de, light: 0xe6ecf2, accent: 0x7ea0c8 },
  tide: { bgDark: 0x08202a, bgMid: 0x14505e, panel: 0xb8e0e2, light: 0xdff2f2, accent: 0x3cc4cc },
  wheat: { bgDark: 0x2a1a08, bgMid: 0x5a3a12, panel: 0xf2dc9a, light: 0xfbefc4, accent: 0xf0b030 },
};

/** Grey theme of a king the player has not unlocked yet. */
export const LOCKED_THEME: KingTheme = {
  bgDark: 0x14161a,
  bgMid: 0x3a3a3a,
  panel: 0xc4c4c4,
  light: 0xe2e2e2,
  accent: 0x909090,
};
