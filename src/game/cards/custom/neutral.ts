/** Hiệu ứng `custom` của thẻ trung lập (spec §6.1). */
import { THRONE_PLOT, clonePlots, duplicateIllegal, levelUpBuilding, throneCanLevel } from '../../run/board';
import type { IncomeHandler, TomeHandler } from './types';

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

/** Ấn Triện: Ngai +1 cấp (kẹp `RUN.maxLevel`; đã tối đa thì bất hợp lệ). */
export const royalSeal: TomeHandler = (state) => {
  if (!throneCanLevel(state.plots)) return 'maxLevel';
  return { ...state, plots: levelUpBuilding(state.plots, THRONE_PLOT, 1) };
};
