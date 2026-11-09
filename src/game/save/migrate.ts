/**
 * Nâng cấp RunState đã lưu lên phiên bản hiện tại (thuần, không sửa đầu vào): state 3 → 4 → 5 → 6 → 7 → 8.
 * State 1 và 2 chưa từng có định dạng trên đĩa; phiên bản khác được trả nguyên để `decodeRun` từ chối.
 */
import { hashSeed } from '../../core/random';

type Loose = Record<string, unknown>;

const isObject = (v: unknown): v is Loose => typeof v === 'object' && v !== null && !Array.isArray(v);

/** State 3 → 4: thêm các trường của ván đầy đủ với giá trị trung tính, lấy seed hội đồng / nhiệm vụ từ seed ván. */
const v3to4 = (raw: Loose): Loose => {
  const seed = typeof raw.seed === 'number' ? raw.seed : 0;
  const rng = isObject(raw.rng) ? raw.rng : {};
  const stats = isObject(raw.stats) ? raw.stats : {};
  const plots = Array.isArray(raw.plots) ? raw.plots : [];
  return {
    ...raw,
    version: 4,
    plots: plots.map((p) => {
      if (!isObject(p) || !isObject(p.building)) return p;
      return { ...p, building: { ageBonus: 0, counters: {}, movedYear: null, ...p.building } };
    }),
    pendingOffers: [],
    decrees: [],
    quests: [],
    offeredQuestIds: [],
    freeRerollsLeft: 0,
    interventionDmgPct: 0,
    difficulty: 0,
    yearStartPendingDraw: false,
    paidRerollsThisYear: typeof raw.rerollsThisYear === 'number' ? raw.rerollsThisYear : 0,
    rng: {
      ...rng,
      council: hashSeed(`${seed}:council`),
      quest: hashSeed(`${seed}:quest`),
    },
    stats: {
      ...stats,
      bossesWon: 0,
      bossesDefeated: [],
      completedYears: Number(stats.battlesWon ?? 0) + Number(stats.battlesLost ?? 0),
    },
  };
};

/** Ô của Ngai tới state 4 (giữa bàn) và từ state 5 (giữa hàng sau cùng, spec 06/11/2026). */
const OLD_THRONE_PLOT = 12;
const NEW_THRONE_PLOT = 2;
const moved = (plot: unknown): boolean => plot === OLD_THRONE_PLOT || plot === NEW_THRONE_PLOT;

/** Hội đồng đang chờ có chọn ô 2 hoặc 12: bỏ phần chọn ô (người chơi chọn lại), giữ sắc lệnh đã chọn. */
const clearMovedPlotChoice = (offer: unknown): unknown => {
  if (!isObject(offer) || offer.kind !== 'council' || !isObject(offer.selection)) return offer;
  const plots = offer.selection.plots;
  if (!Array.isArray(plots) || !plots.some(moved)) return offer;
  return { ...offer, selection: { ...offer.selection, plots: [] } };
};

/**
 * State 4 → 5: Ngai chuyển từ ô giữa (12) lên ô giữa hàng sau cùng (2). Đổi chỗ công trình hai ô
 * (công trình đang ở ô 2, nếu có, về ô 12) và mở cả hai, nên không mất công trình nào. Dữ liệu sai
 * vẫn được đổi chỗ y nguyên để `decodeRun` kiểm và từ chối, không "chữa" thành ván hợp lệ.
 */
const v4to5 = (raw: Loose): Loose => {
  const plots = Array.isArray(raw.plots) ? [...(raw.plots as unknown[])] : [];
  const oldP = plots[OLD_THRONE_PLOT];
  const newP = plots[NEW_THRONE_PLOT];
  if (isObject(oldP) && isObject(newP)) {
    plots[NEW_THRONE_PLOT] = { ...newP, unlocked: true, building: oldP.building ?? null };
    plots[OLD_THRONE_PLOT] = { ...oldP, unlocked: true, building: newP.building ?? null };
  }
  const out: Loose = { ...raw, version: 5, plots };
  if ('offers' in raw) out.offers = clearMovedPlotChoice(raw.offers);
  if (Array.isArray(raw.pendingOffers)) out.pendingOffers = raw.pendingOffers.map(clearMovedPlotChoice);
  return out;
};

/** State 5 → 6 (G4): chưa có perk, thẻ meta nào, và chưa dùng lượt dời miễn phí. */
const v5to6 = (raw: Loose): Loose => ({ ...raw, version: 6, perk: null, unlockedCards: [], freeMovesUsed: 0 });

/**
 * State 6 → 7 (Vô tận, spec 2026-11-09 §8): mọi save cũ là ván thường; thêm luồng RNG `blessing`
 * trung tính (không ván thường nào dùng). Không đổi bàn, quân, luật, bộ bài hay RNG cũ.
 */
const v6to7 = (raw: Loose): Loose => {
  const seed = typeof raw.seed === 'number' ? raw.seed : 0;
  const rng = isObject(raw.rng) ? raw.rng : {};
  return { ...raw, version: 7, mode: 'normal', endless: null, rng: { ...rng, blessing: hashSeed(`${seed}:blessing`) } };
};

/**
 * State 7 → 8 (Mua thẻ, spec 2026-11-10 §4): chưa mua lần nào trong năm, thêm luồng RNG `shop`.
 * Giữ nguyên tay, chồng bài, `played`, pha và các bước đang chờ: không rút lại giữa năm.
 */
const v7to8 = (raw: Loose): Loose => {
  const seed = typeof raw.seed === 'number' ? raw.seed : 0;
  const rng = isObject(raw.rng) ? raw.rng : {};
  return { ...raw, version: 8, shopPurchasesThisYear: 0, rng: { ...rng, shop: hashSeed(`${seed}:shop`) } };
};

export function migrateRunState(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  let out = raw;
  if (out.version === 3) out = v3to4(out);
  if (out.version === 4) out = v4to5(out);
  if (out.version === 5) out = v5to6(out);
  if (out.version === 6) out = v6to7(out);
  if (out.version === 7) out = v7to8(out);
  return out;
}
