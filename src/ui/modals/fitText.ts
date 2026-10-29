/**
 * The largest font size from `max` down to `min` for which `fits(size)` holds (`min` when none does):
 * long texts shrink to stay inside their box instead of running under the buttons.
 */
export const largestFitting = (max: number, min: number, fits: (size: number) => boolean): number => {
  const hi = Math.max(max, min);
  for (let size = hi; size > min; size--) if (fits(size)) return size;
  return min;
};
