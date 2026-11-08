/** Phiên chơi của trình duyệt: kho lưu + cầu checkpoint + đọc ván + hồ sơ meta (G4). `src/game` không import file này. */
import { META_READ_ONLY_TEXT, UNLOCK_REFUSED_TEXT, UNLOCK_SAVE_FAILED_TEXT } from '../data/save';
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
  /** Chấm điểm một ván đã kết thúc và lưu hồ sơ; cùng ván chấm hai lần chỉ cộng một lần. Ghi hỏng → reject. */
  settleRun(state: RunState): Promise<SettleOutcome>;
  /** Xong sau khi hồ sơ đã lưu. */
  unlockKing(king: KingId): Promise<UnlockResult>;
  unlockCard(card: CardId): Promise<UnlockResult>;
}

/** Dựng phiên trên một kho có sẵn: đọc hồ sơ meta đúng một lần, không ghi gì khi mở. */
export async function openSession(store: SaveStore, content: Content): Promise<GameSession> {
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
  /** Saves `next`; the in-memory profile only changes once the write succeeded. */
  const commit = async (next: MetaProfile): Promise<void> => {
    await store.saveMeta(next);
    profile = next;
  };

  const settle = (state: RunState): Promise<SettleOutcome> =>
    queued(async () => {
      const r = settleRun(profile, state);
      const outcome = (unlocks: string[]): SettleOutcome => ({ crownPoints: r.breakdown.total, breakdown: r.breakdown, unlocks });
      if (readOnly) return outcome([META_READ_ONLY_TEXT]);
      if (r.profile !== profile) await commit(r.profile); // same run already settled: nothing to write
      return outcome(r.unlocks);
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
