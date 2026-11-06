/**
 * Hình học bàn cờ và sân trận (spec 06/11/2026, P1): ô 64 world px, sân 768, bàn 5×5 từ 224.
 * Các khoảng cách gắn với bàn cờ (tầm công trình, bán kính hiệu ứng của công trình) khai báo bằng
 * số ô qua `cells`, để đổi cỡ ô không phải chỉnh lại từng số.
 */

/** Cạnh một ô, world px. */
export const PLOT = 64;
/** Số ô mỗi cạnh bàn. */
export const BOARD_SIDE = 5;
/** Cạnh sân trận vuông, world px. */
export const FIELD = 768;
/** Góc tây-bắc của bàn trong sân. */
export const BOARD_ORIGIN = 224;
/** Chân tường núi phía bắc. */
export const WALL_Y = 176;

/** `n` ô đổi ra world px. */
export const cells = (n: number): number => n * PLOT;

/**
 * Chân công trình (và Ngai) lệch khỏi tâm ô về phía tây world; nửa đông của ô là khu tập kết lính.
 * Nhà rộng 32 px nên thân ngang chiếm [−30, +2] quanh tâm ô.
 */
export const BUILDING_FOOT_OFFSET = { x: -14, y: 0 } as const;

/** Khu tập kết lính của một ô, quanh tâm ô (world px): x ∈ [x0, x1], y ∈ [y0, y1]. */
export const DEPLOY_BOX = { x0: 4, x1: 28, y0: -24, y1: 24 } as const;

/**
 * Các bảng số của spec gốc (§6, §7.3) viết cho ô 32 px. Mọi đại lượng px/tick (tốc độ lính, tốc độ
 * đạn) và khoảng dịch (đẩy lùi, kéo) nhân hệ số này để giữ số ô mỗi tick (spec 06/11/2026, B1).
 */
export const SPEC_MOVE_SCALE = PLOT / 32;
