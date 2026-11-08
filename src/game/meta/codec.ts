/**
 * Giải mã hồ sơ meta (spec §9.2). Meta không bao giờ bị xoá: hàm này không ném lỗi và luôn trả hồ sơ dùng
 * được, sửa từng trường hỏng về mặc định thay vì bỏ cả hồ sơ.
 */
import { CARD_UNLOCK, META_SAVE_VERSION, SETTLED_RUNS_KEPT, STARTING_KINGS } from '../../data/meta';
import { RUN } from '../../data/run';
import { ALL_KINGS } from '../../data/rules';
import type { CardId, KingId } from '../../data/types';
import { defaultProfile, type MetaProfile, perKing } from './profile';

export type DecodeMetaResult =
  | { kind: 'ok' | 'repaired'; profile: MetaProfile }
  | { kind: 'newer'; profile: MetaProfile };

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

export const decodeMeta = (raw: unknown): DecodeMetaResult => {
  if (raw === undefined) return { kind: 'ok', profile: defaultProfile() };
  let repaired = false;
  const fix = <T>(v: T, ok: boolean, fallback: T): T => {
    if (ok) return v;
    repaired = true;
    return fallback;
  };
  const src: Rec = isRec(raw) ? raw : {};
  if (!isRec(raw)) repaired = true;
  const count = (v: unknown): number => fix(v as number, Number.isInteger(v) && (v as number) >= 0, 0);
  const sub = (v: unknown): Rec => (isRec(v) ? v : (fix(0, false, 0), {}));

  const versionRaw = src.version;
  const newer = typeof versionRaw === 'number' && Number.isFinite(versionRaw) && versionRaw > META_SAVE_VERSION;
  if (!newer && versionRaw !== META_SAVE_VERSION) repaired = true;

  const perKingCount = (v: unknown): Record<KingId, number> => {
    const rec = sub(v);
    const out = perKing(0);
    for (const k of ALL_KINGS) out[k] = count(rec[k]);
    return out;
  };

  const kingsRaw = Array.isArray(src.unlockedKings) ? src.unlockedKings : (fix(0, false, 0), []);
  const kings = new Set<KingId>(STARTING_KINGS);
  for (const k of kingsRaw) {
    if (ALL_KINGS.includes(k as KingId)) kings.add(k as KingId);
    else repaired = true;
  }
  if (!STARTING_KINGS.every((k) => (kingsRaw as unknown[]).includes(k))) repaired = true;

  const cardsRaw = Array.isArray(src.unlockedCards) ? src.unlockedCards : (fix(0, false, 0), []);
  const cards = new Set<CardId>();
  for (const c of cardsRaw) {
    if (typeof c === 'string' && CARD_UNLOCK[c as CardId] !== undefined) cards.add(c as CardId);
    else repaired = true;
  }

  const hd = src.highestDifficultyWon;
  const highest = Number.isInteger(hd) ? Math.min(Math.max(hd as number, -1), RUN.difficultyLevels) : fix(0, false, -1);
  if (Number.isInteger(hd) && highest !== hd) repaired = true;

  const set = sub(src.settings);
  const volume = (v: unknown): number =>
    fix(v as number, Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100, 100);

  const runsRaw = Array.isArray(src.settledRuns) ? src.settledRuns : (fix(0, false, 0), []);
  const runs = runsRaw.filter((r): r is string => typeof r === 'string');
  if (runs.length !== runsRaw.length || runs.length > SETTLED_RUNS_KEPT) repaired = true;

  const profile: MetaProfile = {
    version: META_SAVE_VERSION,
    crownPoints: count(src.crownPoints),
    mastery: perKingCount(src.mastery),
    unlockedKings: [...kings].sort(),
    unlockedCards: [...cards].sort(),
    wins: perKingCount(src.wins),
    highestDifficultyWon: highest,
    settings: { master: volume(set.master), music: volume(set.music), sfx: volume(set.sfx) },
    settledRuns: runs.slice(-SETTLED_RUNS_KEPT),
  };
  // Callers must never write a 'newer' profile back: it would downgrade the version and drop unknown fields.
  if (newer) return { kind: 'newer', profile };
  return { kind: repaired ? 'repaired' : 'ok', profile };
};
