const validIndex = (index: number, count: number): boolean =>
  Number.isInteger(index) && index >= 0 && index < count;

/**
 * The pick after the player clicks card `index` of `count`: that card, or none when it was
 * already picked; an index that is not a card of this offer changes nothing.
 */
export const selectReward = (
  selected: number | null, index: number, count: number, enabled?: readonly boolean[],
): number | null => {
  if (!validIndex(index, count) || (enabled !== undefined && !enabled[index])) return selected;
  return selected === index ? null : index;
};

/** Nhận works with a pick that is a card of this offer and only until the pick has been sent. */
export const canConfirmReward = (
  selected: number | null, count: number, submitted: boolean, enabled?: readonly boolean[],
): boolean =>
  !submitted && selected !== null && validIndex(selected, count) && (enabled === undefined || enabled[selected] === true);
