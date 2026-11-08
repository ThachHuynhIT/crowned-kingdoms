/** Nấc âm lượng cho Settings (spec G5 §4): giá trị cũ lệch nấc được giữ khi tải, chỉ về nấc khi người chơi chạm. */
import { VOLUME_MAX, VOLUME_MIN, VOLUME_STEP } from '../../data/settings';

const clamp = (v: number): number => Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, v));

/** Nút −/+: lệch nấc thì lên/xuống nấc gần nhất theo hướng bấm, đúng nấc thì ±10; kẹp 0–100. */
export const stepVolume = (value: number, direction: 1 | -1): number => {
  const onStep = value % VOLUME_STEP === 0;
  if (onStep) return clamp(value + direction * VOLUME_STEP);
  const next =
    direction > 0
      ? Math.ceil(value / VOLUME_STEP) * VOLUME_STEP
      : Math.floor(value / VOLUME_STEP) * VOLUME_STEP;
  return clamp(next);
};

/** Kéo slider: về nấc gần nhất. */
export const snapVolume = (value: number): number => clamp(Math.round(value / VOLUME_STEP) * VOLUME_STEP);
