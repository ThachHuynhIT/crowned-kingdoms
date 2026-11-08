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
 * Chân công trình (và Ngai) đứng giữa ô (chủ dự án chốt 06/11/2026: "nhà đặt ở giữa ô đất").
 * Nhà rộng 32 px nên thân ngang chiếm [−16, +16] quanh tâm ô.
 */
export const BUILDING_FOOT_OFFSET = { x: 0, y: 0 } as const;

/**
 * Khu tập kết lính của một ô, quanh tâm ô (world px): x ∈ [x0, x1], y ∈ [y0, y1]. Là dải đất
 * TRƯỚC CỬA nhà: cửa chính ở mặt tường bên phải khi vẽ isometric, và từ 06/11/2026 (địch vào từ bên
 * phải màn hình) mặt đó nhìn về phía nam world, ra con đường; dải nằm giữa mép nam của nhà (+16) và
 * mép nam của ô (+32).
 */
export const DEPLOY_BOX = { x0: -24, x1: 24, y0: 18, y1: 30 } as const;

/**
 * Các bảng số của spec gốc (§6, §7.3) viết cho ô 32 px. Mọi đại lượng px/tick (tốc độ lính, tốc độ
 * đạn) và khoảng dịch (đẩy lùi, kéo) nhân hệ số này để giữ số ô mỗi tick (spec 06/11/2026, B1).
 */
export const SPEC_MOVE_SCALE = PLOT / 32;

/** Ngai đứng ở ô 2 (hàng 0, cột 2 của bàn trong) ở mọi chế độ (spec 2026-11-09 §4). */
export const THRONE_PLOT = 2;

/** Ô của một bàn theo hệ toạ độ của bàn trong 5×5: hàng/cột ∈ [0,4] ở bàn thường, [-1,5] ở Vô tận. */
export interface PlotCell {
  readonly row: number;
  readonly col: number;
}

/**
 * Mô tả hình học một bàn (spec 2026-11-09 §4). Id 0..24 luôn là bàn trong (`row = floor(id/5)`,
 * `col = id % 5`); bàn Vô tận thêm id 25..48 cho vòng ngoài theo thứ tự hàng trên hệ bàn trong.
 */
export interface BoardGeometryDef {
  readonly id: 'normal' | 'endless';
  readonly plotCount: number;
  /** Số ô mỗi cạnh của toàn bàn. */
  readonly side: number;
  readonly plotSize: number;
  /** Góc tây-bắc của bàn trong 5×5 (giữ nguyên ở mọi chế độ). */
  readonly innerOrigin: number;
  /** Mép toàn bàn [boardMin, boardMax) theo cả hai trục, world px. */
  readonly boardMin: number;
  readonly boardMax: number;
  readonly field: number;
  readonly wallY: number;
  readonly thronePlot: number;
  /** Con đường phía nam bắt đầu ở mép nam của bàn. */
  readonly roadStartY: number;
  readonly portal: { readonly x: number; readonly y: number };
  /** `plotCells[id]` = hàng/cột của ô `id` trên hệ bàn trong. */
  readonly plotCells: readonly PlotCell[];
}

const INNER_CELLS: readonly PlotCell[] = Array.from({ length: BOARD_SIDE * BOARD_SIDE }, (_, id) => ({
  row: Math.floor(id / BOARD_SIDE),
  col: id % BOARD_SIDE,
}));

/** Vòng ngoài của bàn Vô tận: hàng/cột ∈ [-1,5] trừ [0,4]², theo thứ tự hàng (25 = (-1,-1), 48 = (5,5)). */
const OUTER_CELLS: readonly PlotCell[] = Array.from({ length: (BOARD_SIDE + 2) * (BOARD_SIDE + 2) }, (_, i) => ({
  row: Math.floor(i / (BOARD_SIDE + 2)) - 1,
  col: (i % (BOARD_SIDE + 2)) - 1,
})).filter((c) => c.row < 0 || c.row >= BOARD_SIDE || c.col < 0 || c.col >= BOARD_SIDE);

export const NORMAL_GEOMETRY: BoardGeometryDef = {
  id: 'normal',
  plotCount: 25,
  side: BOARD_SIDE,
  plotSize: PLOT,
  innerOrigin: BOARD_ORIGIN,
  boardMin: BOARD_ORIGIN,
  boardMax: BOARD_ORIGIN + BOARD_SIDE * PLOT,
  field: FIELD,
  wallY: WALL_Y,
  thronePlot: THRONE_PLOT,
  roadStartY: BOARD_ORIGIN + BOARD_SIDE * PLOT,
  portal: { x: 384, y: 792 },
  plotCells: INNER_CELLS,
};

export const ENDLESS_GEOMETRY: BoardGeometryDef = {
  id: 'endless',
  plotCount: 49,
  side: BOARD_SIDE + 2,
  plotSize: PLOT,
  innerOrigin: BOARD_ORIGIN,
  boardMin: BOARD_ORIGIN - PLOT,
  boardMax: BOARD_ORIGIN + (BOARD_SIDE + 1) * PLOT,
  field: FIELD,
  /** Tường vẫn cách mép bắc của bàn 48 px. */
  wallY: WALL_Y - PLOT,
  thronePlot: THRONE_PLOT,
  roadStartY: BOARD_ORIGIN + (BOARD_SIDE + 1) * PLOT,
  portal: { x: 384, y: 792 },
  plotCells: [...INNER_CELLS, ...OUTER_CELLS],
};
