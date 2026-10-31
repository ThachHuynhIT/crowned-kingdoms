export type Team = 'ally' | 'foe';
export type Animation = 'idle' | 'walk' | 'attack';
export type UnitFrames = Partial<Record<Team, Partial<Record<Animation, string[]>>>>;

export interface Item {
  id: string;
  label: string;
  src: string;
  w: number;
  h: number;
  kind: 'tile' | 'object' | 'unit';
  group?: string;
  tags: string[];
  units?: UnitFrames;
}
export interface Category { id: string; label: string; items: Item[] }
export interface Manifest {
  version: 1;
  pixelScale?: number;
  categories: Category[];
  sample?: boolean;
}
export interface LoadedManifest extends Manifest {
  pixelScale: number;
  items: Item[];
  error?: string;
}
export type AssetPriority = 'P0' | 'P1' | 'P2';
export interface PlannedItem {
  id: string;
  label: string;
  category: string;
  w: number;
  h: number;
  kind: Item['kind'];
  group: string;
  tags: string[];
  frames?: number;
  source: string;
  priority: AssetPriority;
  note?: string;
}
export interface PlannedFile { version: 1; items: PlannedItem[] }
export interface LoadedPlanned extends PlannedFile { error?: string }
export interface Point { x: number; y: number }
export interface Rect extends Point { w: number; h: number }
export interface MapItem extends Point { id: string; flip: boolean; team: Team }
export interface MapFile { version: 1; cols: number; rows: number; cell: 64; items: MapItem[] }

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry: unknown) => typeof entry === 'string');
}
function isPlannedItem(value: unknown): value is PlannedItem {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.label === 'string' && value.label.trim().length > 0
    && typeof value.category === 'string' && value.category.trim().length > 0
    && typeof value.w === 'number' && typeof value.h === 'number'
    && Number.isInteger(value.w) && Number.isInteger(value.h) && value.w >= 0 && value.h >= 0
    && (value.kind === 'tile' || value.kind === 'object' || value.kind === 'unit')
    && typeof value.group === 'string' && isStringArray(value.tags)
    && (value.frames === undefined || (typeof value.frames === 'number' && Number.isInteger(value.frames) && value.frames > 0))
    && typeof value.source === 'string' && value.source.trim().length > 0
    && (value.priority === 'P0' || value.priority === 'P1' || value.priority === 'P2')
    && (value.note === undefined || typeof value.note === 'string')
    && ((value.w > 0 && value.h > 0) || (typeof value.note === 'string' && value.note.trim().length > 0));
}
export function isPlannedFile(value: unknown): value is PlannedFile {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.items)) return false;
  const items: unknown[] = value.items;
  if (!items.every(isPlannedItem)) return false;
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) return false;
    ids.add(item.id);
  }
  return true;
}
function isUnitFrames(value: unknown): value is UnitFrames {
  if (!isRecord(value)) return false;
  for (const team of ['ally', 'foe']) {
    const animations = value[team];
    if (animations === undefined) continue;
    if (!isRecord(animations)) return false;
    for (const name of ['idle', 'walk', 'attack']) {
      if (animations[name] !== undefined && !isStringArray(animations[name])) return false;
    }
  }
  return true;
}
function isItem(value: unknown): value is Item {
  return isRecord(value) && typeof value.id === 'string' && typeof value.label === 'string'
    && typeof value.src === 'string' && typeof value.w === 'number' && typeof value.h === 'number'
    && Number.isInteger(value.w) && Number.isInteger(value.h)
    && value.w >= 1 && value.h >= 1 && value.w <= 4096 && value.h <= 4096
    && (value.kind === 'tile' || value.kind === 'object' || value.kind === 'unit')
    && (value.group === undefined || typeof value.group === 'string') && isStringArray(value.tags)
    && (value.units === undefined || isUnitFrames(value.units));
}
function isCategory(value: unknown): value is Category {
  return isRecord(value) && typeof value.id === 'string' && typeof value.label === 'string'
    && Array.isArray(value.items) && value.items.every(isItem);
}
// JSON luôn đi qua guard trước khi trở thành dữ liệu ứng dụng.
export function isManifest(value: unknown): value is Manifest {
  return isRecord(value) && value.version === 1 && Array.isArray(value.categories)
    && value.categories.every(isCategory)
    && (value.pixelScale === undefined || (typeof value.pixelScale === 'number' && Number.isFinite(value.pixelScale)))
    && (value.sample === undefined || typeof value.sample === 'boolean');
}
export function isTeam(value: unknown): value is Team { return value === 'ally' || value === 'foe'; }
function isMapItem(value: unknown): value is MapItem {
  return isRecord(value) && typeof value.id === 'string'
    && typeof value.x === 'number' && typeof value.y === 'number'
    && Number.isInteger(value.x) && Number.isInteger(value.y)
    && Math.abs(value.x) <= 100000 && Math.abs(value.y) <= 100000
    && typeof value.flip === 'boolean' && isTeam(value.team);
}
export function isMapFile(value: unknown): value is MapFile {
  return isRecord(value) && value.version === 1 && value.cell === 64
    && typeof value.cols === 'number' && typeof value.rows === 'number'
    && Number.isInteger(value.cols) && Number.isInteger(value.rows)
    && value.cols >= 1 && value.cols <= 40 && value.rows >= 1 && value.rows <= 40
    && Array.isArray(value.items) && value.items.length <= 50000 && value.items.every(isMapItem);
}
