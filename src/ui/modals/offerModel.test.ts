import { describe, expect, it } from 'vitest';
import type { KingId } from '../../data/types';
import { CONTENT } from '../../game/cards/registry';
import { offerHeading, offerTitle, rewardRerollView } from './offerModel';

const name = (id: KingId) => CONTENT.king(id).nameVi;

describe('offerTitle', () => {
  it('names a plain reward', () => {
    expect(offerTitle({ kind: 'reward' }, name)).toBe('Phần thưởng — chọn 1 thẻ');
  });

  it('names the conquered king on a conquest offer', () => {
    expect(offerTitle({ kind: 'conquest', king: 'stone' }, name)).toBe(
      `Chinh phục ${CONTENT.king('stone').nameVi} — chọn 1 thẻ`,
    );
  });

  it('falls back to the plain title for a conquest offer without a king', () => {
    expect(offerTitle({ kind: 'conquest' }, name)).toBe('Chinh phục — chọn 1 thẻ');
  });
});

describe('offerHeading', () => {
  it('a battle reward says victory and asks for a reward', () => {
    expect(offerHeading('reward')).toEqual({ title: 'CHIẾN THẮNG', subtitle: 'CHỌN PHẦN THƯỞNG' });
  });

  it('a quest reward is not announced as a battle victory', () => {
    expect(offerHeading('questReward')).toEqual({ title: 'THƯỞNG NHIỆM VỤ', subtitle: 'CHỌN PHẦN THƯỞNG' });
  });

  it('a conquest names the conquest, not a plain battle win', () => {
    const h = offerHeading('conquest');
    expect(h.title).toBe('CHINH PHỤC');
    expect(h.subtitle).toBe('CHỌN 1 THẺ');
    expect(h.title).not.toBe(offerHeading('reward').title);
  });
});

describe('rewardRerollView', () => {
  it('is a disabled "coming soon" line with no price and no hand-reroll behaviour', () => {
    const v = rewardRerollView();
    expect(v.enabled).toBe(false);
    expect(v.label).toBe('ĐỔI THƯỞNG — Sắp có');
    expect(v.tooltip).toContain('Sắp có');
    expect(`${v.label} ${v.tooltip}`).not.toMatch(/\d/);
  });
});
