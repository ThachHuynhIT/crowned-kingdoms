import { isManifest, isRecord } from './types';
import type { Animation, Item, LoadedManifest, Team } from './types';

type ElementClass<T extends Element> = { new(): T };
export function $<T extends HTMLElement>(id: string, expected: ElementClass<T>): T {
  const node = document.getElementById(id);
  if (!(node instanceof expected)) throw new Error(`Thiếu phần tử hoặc sai kiểu DOM: #${id}`);
  return node;
}
// Danh sách có thể rỗng khi bộ lọc không khớp asset nào.
export function queryAll<T extends Element>(selector: string, expected: ElementClass<T>): T[] {
  return Array.from(document.querySelectorAll(selector), (node) => {
    if (!(node instanceof expected)) throw new Error(`Sai kiểu DOM: ${selector}`);
    return node;
  });
}
export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Không tạo được context canvas 2D');
  return context;
}
export function requireAt<T>(list: readonly T[], index: number): T {
  const entry = list[index];
  if (entry === undefined) throw new Error(`Không tìm thấy mục tại chỉ số ${index}`);
  return entry;
}
export function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function button(text: string, action: () => void | Promise<void>): HTMLButtonElement {
  const node = el('button', text); node.type = 'button'; node.onclick = action; return node;
}
interface ImageEntry { image: HTMLImageElement; ready: boolean; failed: boolean }
export const images = new Map<string, ImageEntry>();
// Chỉ dùng URL cùng nguồn; không tải phụ thuộc mạng.
export function safeSrc(src: string): string {
  if (!src.trim()) return '';
  try { const url = new URL(src, location.href); return url.origin === location.origin && /^https?:$/.test(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function imageFor(src: string): ImageEntry {
  const url = safeSrc(src), cached = images.get(url);
  if (cached) return cached;
  const image = new Image(), entry: ImageEntry = { image, ready: false, failed: !url };
  images.set(url, entry);
  image.onload = () => { entry.ready = true; };
  image.onerror = () => { entry.failed = true; };
  if (url) image.src = url;
  return entry;
}
export function drawImage(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, w: number, h: number, flip = false): void {
  ctx.imageSmoothingEnabled = false;
  const entry = imageFor(src);
  ctx.save();
  if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); x = 0; y = 0; }
  if (entry.ready) ctx.drawImage(entry.image, Math.round(x), Math.round(y), w, h);
  else { ctx.fillStyle = '#513342'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#ef97a5'; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(entry.failed ? 'Thiếu ảnh' : 'Đang tải…', x + 3, y + Math.min(16, h)); }
  ctx.restore();
}
// Giữ cách chuẩn hoá label/tags và bỏ mục trùng/sai kích thước của bản JS.
function normalizeManifest(value: unknown): unknown {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.categories)) throw new Error('Manifest không đúng định dạng version 1');
  const seen = new Set<string>();
  const categories = value.categories.map((category: unknown) => {
    if (!isRecord(category)) throw new Error('Danh mục manifest không hợp lệ');
    const candidates: unknown[] = Array.isArray(category.items) ? category.items : [];
    const items: unknown[] = [];
    for (const item of candidates) {
      if (!isRecord(item) || typeof item.id !== 'string' || seen.has(item.id)
        || (item.kind !== 'tile' && item.kind !== 'object' && item.kind !== 'unit')
        || typeof item.w !== 'number' || typeof item.h !== 'number'
        || !Number.isInteger(item.w) || !Number.isInteger(item.h)
        || item.w < 1 || item.h < 1 || item.w > 4096 || item.h > 4096) continue;
      seen.add(item.id);
      const tags: unknown[] = Array.isArray(item.tags) ? item.tags : [];
      items.push({ ...item, label: String(item.label || item.id), tags: tags.map(String) });
    }
    return { id: String(category.id), label: String(category.label || category.id), items };
  });
  const pixelScale = Number(value.pixelScale) > 0 ? Number(value.pixelScale) : 2;
  return { ...value, categories, pixelScale };
}
export async function loadManifest(): Promise<LoadedManifest> {
  try {
    const response = await fetch('./manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Không tìm thấy manifest.json');
    const parsed: unknown = await response.json();
    const data = normalizeManifest(parsed);
    if (!isManifest(data)) throw new Error('Manifest không đúng định dạng version 1');
    return { ...data, pixelScale: data.pixelScale ?? 2, items: data.categories.flatMap((category) => category.items) };
  } catch (error) { return { version: 1, pixelScale: 2, categories: [], items: [], error: errorText(error) }; }
}
export function frames(item: Item, team: Team = 'ally', anim: Animation = 'idle'): string[] {
  const list = item.units?.[team]?.[anim];
  return list?.length ? list : [item.src];
}
export function matches(item: Item, query: string): boolean { return [item.id, item.label, item.group || '', ...item.tags].join(' ').toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')); }
export function sizeText(item: Item): string { return `${item.w}×${item.h} px ảnh · ${item.w / 2}×${item.h / 2} đơn vị thế giới`; }
const groupLabels: Record<string, string> = {
  wheat: 'Vua Lúa Mì', stone: 'Vua Đá Núi', arcane: 'Vua Phép Thuật', grove: 'Vua Rừng',
  tide: 'Vua Thuỷ Triều', forge: 'Vua Lò Rèn', clock: 'Vua Đồng Hồ', moon: 'Vua Mặt Trăng', nomad: 'Vua Du Mục',
  tree: 'Cây', rock: 'Đá nhỏ', boulders: 'Đá tảng', bush: 'Bụi cây', mountain: 'Núi', cliff: 'Vách đá',
  log: 'Thân cây đổ', stump: 'Gốc cây', unit: 'Lính', building: 'Công trình',
  grass: 'Cỏ', meadow_flowers: 'Đồng cỏ hoa', meadow_tall: 'Cỏ cao', path: 'Đường đất', sand: 'Cát',
  water_a: 'Nước A', water_b: 'Nước B',
};
export function groupOptions(select: HTMLSelectElement, items: Item[]): void {
  const groups = [...new Set(items.map((item) => item.group || '').filter(Boolean))].sort();
  const all = el('option', 'Tất cả nhóm'); all.value = '';
  select.replaceChildren(all, ...groups.map((group) => {
    const option = el('option', `${groupLabels[group] || group} (${items.filter((item) => item.group === group).length})`);
    option.value = group; return option;
  }));
  select.value = ''; select.disabled = !groups.length;
}
export function tabs(container: HTMLElement, manifest: LoadedManifest, onChange: (items: Item[]) => void): void {
  const choices = [{ id: 'all', label: 'Tất cả', items: manifest.items }, ...manifest.categories];
  function update(): void {
    let current: string;
    try { current = decodeURIComponent(location.hash.slice(1)) || 'all'; } catch { current = 'all'; }
    const category = choices.find((entry) => entry.id === current) ?? requireAt(choices, 0);
    container.replaceChildren(...choices.map((entry) => {
      const node = button(`${entry.label} (${entry.items.length})`, () => { location.hash = encodeURIComponent(entry.id); });
      node.classList.toggle('active', entry === category); return node;
    }));
    onChange(category.items);
  }
  addEventListener('hashchange', update); update();
}
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob), anchor = el('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function message(text: string): void { $('status', HTMLElement).textContent = text; }
