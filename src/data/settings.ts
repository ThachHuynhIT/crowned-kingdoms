/** Cài đặt người chơi lưu trong hồ sơ meta (spec G5 §4). Âm lượng 0–100. */
export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  screenShake: boolean;
}

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
