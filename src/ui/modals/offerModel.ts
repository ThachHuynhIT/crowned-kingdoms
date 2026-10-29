import type { KingId } from '../../data/types';
import type { CardOfferState } from '../../game/run/state';

/** Title of the reward / conquest picker (§10.6). */
export const offerTitle = (
  offers: Pick<CardOfferState, 'kind' | 'king'>,
  kingName: (id: KingId) => string,
): string =>
  offers.kind === 'conquest'
    ? `Chinh phục${offers.king ? ` ${kingName(offers.king)}` : ''} — chọn 1 thẻ`
    : 'Phần thưởng — chọn 1 thẻ';

/** The two headings of the reward picker, by what the offer is (not every offer is a battle win). */
export const offerHeading = (kind: CardOfferState['kind']): { title: string; subtitle: string } => {
  switch (kind) {
    case 'questReward':
      return { title: 'THƯỞNG NHIỆM VỤ', subtitle: 'CHỌN PHẦN THƯỞNG' };
    case 'conquest':
      return { title: 'CHINH PHỤC', subtitle: 'CHỌN 1 THẺ' };
    case 'reward':
      return { title: 'CHIẾN THẮNG', subtitle: 'CHỌN PHẦN THƯỞNG' };
  }
};

/**
 * The "ĐỔI THƯỞNG" line under the offered cards. Rerolling a reward has no rules yet (price, count,
 * RNG), so it is only shown, disabled; it is not the hand reroll.
 */
export const rewardRerollView = (): { label: string; enabled: false; tooltip: string } => ({
  label: 'ĐỔI THƯỞNG — Sắp có',
  enabled: false,
  tooltip: 'Đổi thưởng: Sắp có',
});
