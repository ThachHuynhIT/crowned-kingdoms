/** Trạng thái xem Trợ giúp (thuần): tab, bộ lọc thẻ, mục đang chọn, cuộn. Giữ nguyên khi đổi cỡ/đổi tab. */
import type { HelpTab } from '../../data/help';
import type { CardKind, KingId, Level, Rarity } from '../../data/types';
import { DEFAULT_HELP_FILTER, type HelpFilter } from './helpModel';

export const EMPTY_CARDS_TEXT = 'Không có thẻ phù hợp.';

export interface HelpView {
  readonly tab: HelpTab;
  readonly filter: HelpFilter;
  readonly entryId: string | null;
  readonly scroll: number;
}

export const initialHelpView = (tab: HelpTab = 'cards'): HelpView => ({
  tab,
  filter: DEFAULT_HELP_FILTER,
  entryId: null,
  scroll: 0,
});

export const setHelpTab = (view: HelpView, tab: HelpTab): HelpView =>
  tab === view.tab ? view : { ...view, tab, scroll: 0 };

export const selectEntry = (view: HelpView, entryId: string | null): HelpView => ({ ...view, entryId });

export const setHelpScroll = (view: HelpView, scroll: number): HelpView => ({ ...view, scroll });

export const KINDS: readonly CardKind[] = ['throne', 'troop', 'tower', 'economy', 'support', 'enchantment', 'tome'];
export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare'];
const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

const next = <T>(options: readonly T[], current: T): T => options[(options.indexOf(current) + 1) % options.length]!;

/** Chuyển bộ lọc `key` sang giá trị kế (vòng); đổi lọc thì về đầu danh sách và bỏ mục đang chọn. */
export const cycleFilter = (
  view: HelpView,
  key: 'owner' | 'kind' | 'rarity' | 'level',
  owners: readonly (KingId | 'neutral')[],
): HelpView => {
  const f = view.filter;
  const filter: HelpFilter =
    key === 'owner'
      ? { ...f, owner: next(['all', ...owners], f.owner) }
      : key === 'kind'
        ? { ...f, kind: next(['all', ...KINDS], f.kind) }
        : key === 'rarity'
          ? { ...f, rarity: next(['all', ...RARITIES], f.rarity) }
          : { ...f, level: next(LEVELS, f.level) };
  return { ...view, filter, entryId: null, scroll: 0 };
};

export const KIND_LABEL: Record<CardKind, string> = {
  throne: 'Ngai',
  troop: 'Lính',
  tower: 'Tháp',
  economy: 'Kinh tế',
  support: 'Hỗ trợ',
  enchantment: 'Bùa',
  tome: 'Sách phép',
};
export const RARITY_LABEL: Record<Rarity, string> = { common: 'Thường', uncommon: 'Vừa', rare: 'Hiếm' };

/** One choice of a help filter dropdown (night 12/11/2026: the four filters open a list instead of cycling). */
export interface FilterChoice {
  readonly value: string;
  readonly label: string;
}

export type FilterKey = 'owner' | 'kind' | 'rarity' | 'level';

/** Every choice of filter `key`, in the cycling order ("Tất cả" first); `ownerName` names a king or 'neutral'. */
export const filterChoices = (
  key: FilterKey,
  owners: readonly (KingId | 'neutral')[],
  ownerName: (owner: KingId | 'neutral') => string,
): FilterChoice[] => {
  const all: FilterChoice = { value: 'all', label: 'Tất cả' };
  switch (key) {
    case 'owner':
      return [all, ...owners.map((o) => ({ value: o, label: ownerName(o) }))];
    case 'kind':
      return [all, ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))];
    case 'rarity':
      return [all, ...RARITIES.map((r) => ({ value: r, label: RARITY_LABEL[r] }))];
    case 'level':
      return LEVELS.map((l) => ({ value: String(l), label: `Cấp ${l}` }));
  }
};

/** The current value of filter `key` as a choice value. */
export const filterValue = (view: HelpView, key: FilterKey): string => String(view.filter[key]);

/** Set filter `key` to choice `value`; like cycling, a change goes back to the top and drops the selection. */
export const setFilterValue = (view: HelpView, key: FilterKey, value: string): HelpView => {
  const f = view.filter;
  const filter: HelpFilter =
    key === 'level'
      ? { ...f, level: (LEVELS.find((l) => String(l) === value) ?? f.level) }
      : ({ ...f, [key]: value } as HelpFilter);
  return { ...view, filter, entryId: null, scroll: 0 };
};
