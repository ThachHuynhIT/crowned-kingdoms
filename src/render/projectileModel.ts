/** Height above the projected ground; source frame height already includes its render scale. */
export const projectileVisualHeight = (
  sourceHeight: number, travelled: number, remaining: number, isStructure: boolean, footDy: number,
): number => {
  if (!isStructure) return 6;
  const total = travelled + remaining;
  const t = total > 0 ? Math.max(0, Math.min(1, travelled / total)) : 1;
  return (0.8 * sourceHeight - footDy) * (1 - t) + 6 * t;
};
