import type { KingId } from '../../data/types';
import type { CardOfferState, IllegalReason } from '../../game/run/state';
import { merchantPickIllegal } from '../../game/run/merchant';

/** Merchant price and eligibility share the command's affordability rule. */
export const merchantOfferView = (offer: { price: number }, gold: number): {
  priceLabel: string; disabledReason: IllegalReason | null; canBuy: boolean;
} => {
  const disabledReason = merchantPickIllegal({ gold }, offer);
  return { priceLabel: `${offer.price} vàng`, disabledReason, canBuy: disabledReason === null };
};

/** Title of the card offer picker (§10.6). */
export const offerTitle = (
  offers: Pick<CardOfferState, 'kind' | 'king'>,
  kingName: (id: KingId) => string,
): string =>
  offers.kind === 'merchant'
    ? 'Thương nhân ghé qua'
    : offers.kind === 'conquest'
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
    case 'merchant':
      return { title: 'THƯƠNG NHÂN GHÉ QUA', subtitle: 'MUA TỐI ĐA 1 THẺ' };
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

/**
 * `offerHeading` with the conquered king's name in capitals on a conquest ("CHINH PHỤC VUA ĐÁ NÚI").
 */
export const offerHeadingFor = (
  offers: Pick<CardOfferState, 'kind' | 'king'>,
  kingName: (id: KingId) => string,
): { title: string; subtitle: string } => {
  const heading = offerHeading(offers.kind);
  if (offers.kind !== 'conquest' || !offers.king) return heading;
  return { ...heading, title: `${heading.title} ${kingName(offers.king).toLocaleUpperCase('vi')}` };
};
