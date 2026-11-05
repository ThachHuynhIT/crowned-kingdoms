import { describe, expect, it } from 'vitest';
import { canConfirmReward, selectReward } from './rewardSelection';

describe('selectReward', () => {
  it('picks a card, moves the pick to another card, and clicking the picked card again drops it', () => {
    expect(selectReward(null, 1, 3)).toBe(1);
    expect(selectReward(1, 2, 3)).toBe(2);
    expect(selectReward(2, 2, 3)).toBeNull();
  });

  it('ignores an index that is not a card of this offer', () => {
    expect(selectReward(null, -1, 3)).toBeNull();
    expect(selectReward(1, 3, 3)).toBe(1);
    expect(selectReward(1, 99, 3)).toBe(1);
    expect(selectReward(0, 1.5, 3)).toBe(0);
    expect(selectReward(null, Number.NaN, 3)).toBeNull();
    expect(selectReward(null, 0, 0)).toBeNull();
  });
});

describe('canConfirmReward', () => {
  it('needs a valid pick that has not been sent yet', () => {
    expect(canConfirmReward(null, 3, false)).toBe(false);
    expect(canConfirmReward(0, 3, false)).toBe(true);
    expect(canConfirmReward(2, 3, false)).toBe(true);
  });

  it('is false once submitted (a double click or Enter after Nhận sends one pick only)', () => {
    expect(canConfirmReward(1, 3, true)).toBe(false);
  });

  it('is false for a pick outside the offer (a stale pick after the offer changed)', () => {
    expect(canConfirmReward(3, 3, false)).toBe(false);
    expect(canConfirmReward(0, 0, false)).toBe(false);
  });
});
