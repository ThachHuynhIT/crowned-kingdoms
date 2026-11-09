/** Phiên chơi của trình duyệt: kho lưu + cầu checkpoint + đọc ván + hồ sơ meta (G4). `src/game` không import file này. */
import {
  MAX_SAVE_SLOTS,
  SLOT_BROKEN_TEXT,
  SLOT_SAVE_FAILED_TEXT,
  SLOTS_FULL_TEXT,
  META_MEMORY_ONLY_TEXT,
  META_READ_ONLY_TEXT,
  SETTINGS_INVALID_TEXT,
  SETTINGS_SAVE_FAILED_TEXT,
  UNLOCK_REFUSED_TEXT,
  UNLOCK_SAVE_FAILED_TEXT,
} from '../data/save';
import { type AudioSettings, VOLUME_MAX, VOLUME_MIN } from '../data/settings';
import type { CardId, KingId } from '../data/types';
import type { Content } from '../game/cards/registry';
import { decodeMeta, type MetaProfile, settleRun, unlockCard, unlockKing } from '../game/meta';
import type { RunState } from '../game/run/state';
import { decodeRun, encodeRun } from '../game/save/codec';
import { cleanSlotName, makeSlot, nextSlotId, readSlot, slotSummaries, summaryOf, type SlotStore, type SlotSummary } from '../game/save/slots';
import { SaveCoordinator } from '../game/save/SaveCoordinator';
import type { LoadRunResult, SaveStore, SessionPersistence, SettleOutcome } from '../game/save/types';
import { createSaveStore } from './storage/createSaveStore';

/** Kết quả mở khoá: hồ sơ mới đã lưu, hoặc lý do từ chối kèm lời báo cho người chơi. */
export type UnlockResult =
  | { ok: true; profile: MetaProfile }
  | { ok: false; reason: 'readOnly' | 'notAllowed' | 'saveFailed'; message: string };

/** Kết quả một thao tác trên bản lưu có tên. */
export type SlotResult = { ok: true; slot: SlotSummary } | { ok: false; message: string };

export interface GameSession {
  store: SaveStore & SlotStore;
  /** Checkpoint ván + `settle` (chấm điểm cuối ván vào hồ sơ) cho RunController. */
  persistence: SessionPersistence;
  /** Đọc và kiểm ván đã lưu; ván không dùng được bị xoá (không đụng meta) trước khi trả kết quả. */
  load(): Promise<LoadRunResult>;
  /** Bản sao hồ sơ meta hiện tại (đọc một lần khi mở phiên, cập nhật sau mỗi lần ghi thành công); sửa bản sao không đổi phiên. */
  meta(): MetaProfile;
  /** Hồ sơ do bản mới hơn ghi: không bao giờ ghi đè, mọi thay đổi bị từ chối. */
  readonly metaReadOnly: boolean;
  /**
   * Chấm điểm một ván đã kết thúc và kết thúc ván đang lưu: điểm mới → một `endRun` (hồ sơ + xoá ván, một giao
   * dịch); ván đã chấm / hồ sơ chỉ đọc → chỉ xoá ván. Cùng ván chấm hai lần chỉ cộng một lần. Ghi hỏng → reject,
   * ván đang lưu còn nguyên.
   */
  settleRun(state: RunState): Promise<SettleOutcome>;
  /** Xong sau khi hồ sơ đã lưu. */
  unlockKing(king: KingId): Promise<UnlockResult>;
  unlockCard(card: CardId): Promise<UnlockResult>;
  /**
   * Đổi cài đặt (spec G5 §4): xếp cùng hàng đợi hồ sơ, tính từ hồ sơ mới nhất, chỉ công bố sau khi ghi xong.
   * Giá trị sai (không hữu hạn, ngoài 0–100, rung không phải bật/tắt) → notAllowed; hồ sơ mới hơn → readOnly;
   * ghi hỏng → saveFailed và giữ giá trị cũ.
   */
  updateSettings(patch: Partial<AudioSettings>): Promise<UnlockResult>;
  /**
   * Bỏ ván đang chơi: chờ mọi checkpoint đã xếp hàng rồi xoá chỉ kho run (không chấm điểm, không đụng meta).
   * `persistent` = kho trình duyệt xác nhận vẫn ghi đĩa sau khi xoá; false = chỉ chắc chắn trong phiên này
   * (bản trên thiết bị có thể còn khi tải lại). Xoá hỏng → reject.
   */
  discardRun(): Promise<{ persistent: boolean }>;
  /** Bản lưu có tên (2026-11-09), mới nhất trước; bản hỏng hình bị bỏ qua. */
  listSlots(): Promise<SlotSummary[]>;
  /** Lưu `state` thành một bản mới tên `name` (đã làm sạch); rỗng, đủ MAX_SAVE_SLOTS hay ghi hỏng → ok false. */
  saveSlot(state: RunState, name: string): Promise<SlotResult>;
  /** Đổi tên một bản lưu. */
  renameSlot(id: string, name: string): Promise<SlotResult>;
  deleteSlot(id: string): Promise<void>;
  /**
   * Mở một bản lưu: kiểm ván bên trong như `load`; dùng được thì nó thành ván đang chơi (ghi đè bản tự lưu, sau mọi
   * checkpoint đang chờ). Bản lưu vẫn còn. Không có → empty; hỏng → incompatible.
   */
  loadSlot(id: string): Promise<LoadRunResult>;
}

/** Dựng phiên trên một kho có sẵn: đọc hồ sơ meta đúng một lần, không ghi gì khi mở. */
export async function openSession(
  store: SaveStore & SlotStore & { isPersistent?: () => boolean },
  content: Content,
  now: () => number = () => Date.now(),
): Promise<GameSession> {
  const raw = await store.loadMeta();
  // A store with no profile answers null (IndexedDB, memory): that is a first launch, not a broken profile.
  const decoded = decodeMeta(raw === null ? undefined : raw);
  const readOnly = decoded.kind === 'newer';
  let profile = decoded.profile;
  const coordinator = new SaveCoordinator(store, content);

  /** Profile writes run one at a time, each computed from the profile the previous one left. */
  let tail: Promise<unknown> = Promise.resolve();
  const queued = <T>(job: () => Promise<T>): Promise<T> => {
    const run = tail.then(job);
    tail = run.catch(() => undefined);
    return run;
  };
  /** Saves `next` (unlocks); the in-memory profile only changes once the write succeeded. */
  const commit = async (next: MetaProfile): Promise<void> => {
    await store.saveMeta(next);
    profile = next;
  };

  const settle = (state: RunState): Promise<SettleOutcome> =>
    queued(async () => {
      const r = settleRun(profile, state);
      const outcome = (unlocks: string[], credited: boolean): SettleOutcome => ({
        crownPoints: r.breakdown.total,
        breakdown: r.breakdown,
        unlocks,
        credited,
      });
      if (readOnly || r.profile === profile) {
        // Nothing to credit (read-only profile, or this run is already in settledRuns): only drop the ended run.
        // A failed clear keeps the run; ending it again dedupes, so it is not an error here.
        await coordinator.clearRun().catch(() => undefined);
        return outcome(readOnly ? [META_READ_ONLY_TEXT] : r.unlocks, false);
      }
      // One transaction writes the profile and clears the run, queued after every earlier checkpoint:
      // closing the page can never leave the credited profile next to the old run save.
      await coordinator.endRun(r.profile);
      profile = r.profile;
      // Credited, but only into RAM when the browser store has fallen back: say so (a store without the probe make no claim).
      const memoryOnly = store.isPersistent?.() === false;
      return outcome(memoryOnly ? [...r.unlocks, META_MEMORY_ONLY_TEXT] : r.unlocks, true);
    });

  const unlock = (apply: (p: MetaProfile) => MetaProfile): Promise<UnlockResult> =>
    queued(async (): Promise<UnlockResult> => {
      if (readOnly) return { ok: false, reason: 'readOnly', message: META_READ_ONLY_TEXT };
      const next = apply(profile);
      if (next === profile) return { ok: false, reason: 'notAllowed', message: UNLOCK_REFUSED_TEXT };
      try {
        await commit(next);
      } catch {
        return { ok: false, reason: 'saveFailed', message: UNLOCK_SAVE_FAILED_TEXT };
      }
      return { ok: true, profile: structuredClone(profile) };
    });

  const validVolume = (v: unknown): v is number =>
    typeof v === 'number' && Number.isFinite(v) && v >= VOLUME_MIN && v <= VOLUME_MAX;

  const updateSettings = (patch: Partial<AudioSettings>): Promise<UnlockResult> =>
    queued(async (): Promise<UnlockResult> => {
      if (readOnly) return { ok: false, reason: 'readOnly', message: META_READ_ONLY_TEXT };
      const settings = { ...profile.settings };
      for (const key of ['master', 'music', 'sfx'] as const) {
        if (!(key in patch)) continue;
        const v = patch[key];
        if (!validVolume(v)) return { ok: false, reason: 'notAllowed', message: SETTINGS_INVALID_TEXT };
        // Stored volumes are integers (decodeMeta repairs anything else).
        settings[key] = Math.round(v);
      }
      if ('screenShake' in patch) {
        if (typeof patch.screenShake !== 'boolean') {
          return { ok: false, reason: 'notAllowed', message: SETTINGS_INVALID_TEXT };
        }
        settings.screenShake = patch.screenShake;
      }
      try {
        await commit({ ...profile, settings });
      } catch {
        return { ok: false, reason: 'saveFailed', message: SETTINGS_SAVE_FAILED_TEXT };
      }
      return { ok: true, profile: structuredClone(profile) };
    });

  const discardRun = async (): Promise<{ persistent: boolean }> => {
    await coordinator.flush();
    await coordinator.clearRun();
    // A store without the probe (tests, memory) makes no claim beyond this session.
    return { persistent: store.isPersistent?.() === true };
  };

  const slotFailed: SlotResult = { ok: false, message: SLOT_SAVE_FAILED_TEXT };

  const saveSlot = async (state: RunState, rawName: string): Promise<SlotResult> => {
    const name = cleanSlotName(rawName);
    if (name === null) return slotFailed;
    const used = slotSummaries(await store.listSlots()).map((x) => x.id);
    const id = nextSlotId(used);
    if (id === null || used.length >= MAX_SAVE_SLOTS) return { ok: false, message: SLOTS_FULL_TEXT };
    const record = makeSlot(id, name, now(), state, encodeRun(state, content));
    try {
      await store.saveSlot(id, record);
    } catch {
      return slotFailed;
    }
    return { ok: true, slot: summaryOf(record) };
  };

  const renameSlot = async (id: string, rawName: string): Promise<SlotResult> => {
    const name = cleanSlotName(rawName);
    const record = readSlot(await store.loadSlot(id));
    if (name === null || record === null) return slotFailed;
    try {
      await store.saveSlot(id, { ...record, name });
    } catch {
      return slotFailed;
    }
    return { ok: true, slot: summaryOf({ ...record, name }) };
  };

  const loadSlot = async (id: string): Promise<LoadRunResult> => {
    const raw = await store.loadSlot(id);
    if (raw === null || raw === undefined) return { kind: 'empty' };
    const record = readSlot(raw);
    if (record === null) return { kind: 'incompatible', message: SLOT_BROKEN_TEXT };
    const result = decodeRun(record.save, content);
    if (result.kind !== 'ok') return result.kind === 'empty' ? { kind: 'incompatible', message: SLOT_BROKEN_TEXT } : result;
    // The slot becomes the run being played: written after every queued checkpoint, like any other.
    await coordinator.checkpoint(result.state);
    return result;
  };

  return {
    store,
    listSlots: async () => slotSummaries(await store.listSlots()),
    saveSlot,
    renameSlot,
    deleteSlot: (id) => store.deleteSlot(id),
    loadSlot,
    persistence: {
      checkpoint: (state) => coordinator.checkpoint(state),
      flush: () => coordinator.flush(),
      settle,
    },
    async load() {
      const result = decodeRun(await store.loadRun(), content);
      if (result.kind === 'incompatible') await store.clearRun();
      return result;
    },
    meta: () => structuredClone(profile),
    metaReadOnly: readOnly,
    settleRun: settle,
    unlockKing: (king) => unlock((p) => unlockKing(p, king)),
    unlockCard: (card) => unlock((p) => unlockCard(p, card)),
    updateSettings,
    discardRun,
  };
}

export async function createSession(
  factory: IDBFactory | null,
  onWarning: (text: string) => void,
  content: Content,
  now?: () => number,
): Promise<GameSession> {
  return openSession(await createSaveStore({ factory, onWarning }), content, now);
}

/** The browser's IndexedDB, or null when it is missing or access is denied. */
export const browserIdbFactory = (): IDBFactory | null => {
  try {
    return typeof indexedDB === 'undefined' ? null : indexedDB;
  } catch {
    return null;
  }
};
