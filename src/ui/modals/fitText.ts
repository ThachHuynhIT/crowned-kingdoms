/**
 * The largest font size from `max` down to `min` for which `fits(size)` holds (`min` when none does):
 * long texts shrink to stay inside their box instead of running under the buttons.
 */
export const largestFitting = (max: number, min: number, fits: (size: number) => boolean): number => {
  const hi = Math.max(max, min);
  for (let size = hi; size > min; size--) if (fits(size)) return size;
  return min;
};

/** Shrinks `text` from `max` px (down to `min`) until it is at most `width` px wide; returns the size used. */
export const fitTextWidth = (
  text: { setFontSize: (size: number) => unknown; readonly width: number },
  max: number,
  min: number,
  width: number,
): number => {
  const size = largestFitting(max, min, (s) => {
    text.setFontSize(s);
    return text.width <= width;
  });
  text.setFontSize(size);
  return size;
};
