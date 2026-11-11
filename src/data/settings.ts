/** Cài đặt người chơi lưu trong hồ sơ meta (spec G5 §4). Âm lượng 0–100. */
export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  screenShake: boolean;
  /** Đồ hoạ (chủ dự án 11/11/2026): độ nét của canvas trên màn mật độ cao. */
  graphics: GraphicsQuality;
  /** Hiệu ứng phụ trong trận (tia đòn đánh, quầng Cuồng Nộ); false = giảm để máy yếu chạy nhẹ hơn. */
  effects: boolean;
  /** Số sát thương trận trước dưới chân nhà/tháp. */
  damageNumbers: boolean;
}

/**
 * Độ nét: 'high' = đúng mật độ màn hình; 'balanced' = tối đa 2 pixel thiết bị mỗi px; 'saver' = 1 (nhẹ nhất, mờ hơn
 * trên màn mật độ cao).
 */
export type GraphicsQuality = 'high' | 'balanced' | 'saver';
export const GRAPHICS_QUALITIES: readonly GraphicsQuality[] = ['high', 'balanced', 'saver'];
/** Trần mật độ canvas theo độ nét. */
export const GRAPHICS_DENSITY_CAP: Readonly<Record<GraphicsQuality, number>> = {
  high: Number.POSITIVE_INFINITY,
  balanced: 2,
  saver: 1,
};
/** Nhãn tiếng Việt của độ nét. */
export const GRAPHICS_LABEL: Readonly<Record<GraphicsQuality, string>> = { high: 'Cao', balanced: 'Vừa', saver: 'Thấp' };
export const DEFAULT_GRAPHICS: GraphicsQuality = 'high';
export const DEFAULT_EFFECTS = true;
export const DEFAULT_DAMAGE_NUMBERS = true;

/** Rung màn hình bật sẵn; hồ sơ cũ thiếu trường này được sửa về giá trị này. */
export const DEFAULT_SCREEN_SHAKE = true;

/** Một nấc −/+ và nấc snap của slider âm lượng. */
export const VOLUME_STEP = 10;

/** Cạnh nút −/+ trong Settings (px logic). */
export const SETTINGS_BUTTON = 48;

/** Giới hạn âm lượng. */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;

/**
 * Gain of the whole mix at master 100 (owner 09/11/2026 halved it, 10/11/2026 halved it again to 0.25, cut it to a
 * third of that, 0.25 / 3, and then halved it once more: 0.25 / 6 ≈ 0.042). Applied in the AudioManager after the
 * master compressor, so profiles that already saved master 100 get quieter too; the Settings sliders still scale it.
 */
export const MASTER_OUTPUT = 0.25 / 6;
