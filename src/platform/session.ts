/** Phiên chơi của trình duyệt: kho lưu + cầu checkpoint + đọc ván + hồ sơ meta (G4). `src/game` không import file này. */
import { META_MEMORY_ONLY_TEXT, META_READ_ONLY_TEXT, UNLOCK_REFUSED_TEXT, UNLOCK_SAVE_FAILED_TEXT } from '../data/save';
import type { CardId, KingId } from '../data/types';
import type { Content } from '../game/cards/registry';
import { decodeMeta, type MetaProfile, settleRun, unlockCard, unlockKing } from '../game/meta';
import type { RunState } from '../game/run/state';
import { decodeRun } from '../game/save/codec';
import { SaveCoordinator } from '../game/save/SaveCoordinator';
import type { LoadRunResult, SaveStore, SessionPersistence, SettleOutcome } from '../game/save/types';
import { createSaveStore } from './storage/createSaveStore';

/** Kết quả mở khoá: hồ sơ mới đã lưu, hoặc lý do từ chối kèm lời báo cho người chơi. */
export type UnlockResult =
  | { ok: true; profile: MetaProfile }
  | { ok: false; reason: 'readOnly' | 'notAllowed' | 'saveFailed'; message: string };

export interface GameSession {
  store: SaveStore;
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
}

/** Dựng phiên trên một kho có sẵn: đọc hồ sơ meta đúng một lần, không ghi gì khi mở. */
export async function openSession(store: SaveStore & { isPersistent?: () => boolean }, content: Content): Promise<GameSession> {
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

  return {
    store,
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
  };
}

export async function createSession(
  factory: IDBFactory | null,
  onWarning: (text: string) => void,
  content: Content,
): Promise<GameSession> {
  return openSession(await createSaveStore({ factory, onWarning }), content);
}

/** The browser's IndexedDB, or null when it is missing or access is denied. */
export const browserIdbFactory = (): IDBFactory | null => {
  try {
    return typeof indexedDB === 'undefined' ? null : indexedDB;
  } catch {
    return null;
  }
};
