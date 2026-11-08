/** Hiệu ứng `custom` của thẻ trung lập (spec §6.1). */
import { RUN } from '../../../data/run';
import { clonePlots, duplicateIllegal, raiseThrone } from '../../run/board';
import type { IncomeHandler, TomeGuard, TomeHandler } from './types';

/** Trại Đánh Thuê: phí duy trì `params.gold` (mặc định 1) vàng mỗi đầu năm — trả về số âm. */
export const mercenaryUpkeep: IncomeHandler = (_ctx, params) => {
  const gold = params.gold;
  return -(typeof gold === 'number' ? gold : 1);
};

/** Nhân Bản: bản sao sạch (cùng thẻ, cùng cấp, không Bùa) của một công trình lên ô trống đã mở. */
export const duplicateBuilding: TomeHandler = (state, _content, _params, target) => {
  if (target.kind !== 'two') return 'badTarget';
  const reason = duplicateIllegal(state.plots, target.first, target.second);
  if (reason !== null) return reason;
  const source = state.plots[target.first]!.building!;
  const plots = clonePlots(state.plots);
  plots[target.second]!.building = {
    uid: state.nextUid,
    cardId: source.cardId,
    level: source.level,
    enchants: [],
    placedYear: state.year,
    ageBonus: 0,
    counters: {},
    movedYear: null,
    permanent: {},
  };
  return { ...state, plots, nextUid: state.nextUid + 1 };
};

/** Ấn Triện bất hợp lệ khi Ngai (`throneLevel`) đã đạt `RUN.maxLevel`. */
export const royalSealGuard: TomeGuard = (state) => (state.throneLevel >= RUN.maxLevel ? 'maxLevel' : null);

/** Ấn Triện: Ngai +1 cấp — `throneLevel` và công trình Ngai cùng lên (đã tối đa thì bất hợp lệ). */
export const royalSeal: TomeHandler = (state, _content, params) => royalSealGuard(state, params) ?? raiseThrone(state);
