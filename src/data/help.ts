/** Các tab của màn Trợ giúp (G3e); nội dung từng tab dựng từ registry và số liệu luật ở `ui/help`. */
export type HelpTab =
  | 'cards'
  | 'mechanics'
  | 'shortcuts'
  | 'units'
  | 'decrees'
  | 'quests'
  | 'banners'
  | 'bosses';

/** Câu giải thích hướng địch (G3e, góc nhìn xéo); dùng ở tab Cơ chế. */
export const BATTLE_DIRECTION_HELP =
  'Địch tiến từ phía trước (mép dưới); tường núi phía bắc không có đường đi.';

/** Thứ tự hiển thị và nhãn của các tab. */
export const HELP_TABS: readonly { readonly id: HelpTab; readonly labelVi: string }[] = [
  { id: 'cards', labelVi: 'Thẻ bài' },
  { id: 'mechanics', labelVi: 'Cơ chế' },
  { id: 'shortcuts', labelVi: 'Phím tắt' },
  { id: 'units', labelVi: 'Lính' },
  { id: 'decrees', labelVi: 'Sắc lệnh' },
  { id: 'quests', labelVi: 'Nhiệm vụ' },
  { id: 'banners', labelVi: 'Cờ hiệu' },
  { id: 'bosses', labelVi: 'Boss' },
];
