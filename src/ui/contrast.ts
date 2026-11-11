/** WCAG 2.x contrast (12/11/2026 night audit): relative luminance of 0xRRGGBB colours and their contrast ratio. */
const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export const luminance = (rgb: number): number =>
  0.2126 * channel((rgb >> 16) & 0xff) + 0.7152 * channel((rgb >> 8) & 0xff) + 0.0722 * channel(rgb & 0xff);

/** Contrast ratio 1..21; WCAG AA asks ≥ 4.5 for body text, ≥ 3 for large or bold text of 18.66 px and up. */
export const contrastRatio = (a: number, b: number): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
