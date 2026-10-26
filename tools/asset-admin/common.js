export const $ = (id) => document.getElementById(id);
export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function button(text, action) { const b = el('button', text); b.type = 'button'; b.onclick = action; return b; }
export const images = new Map();
// Chỉ dùng URL cùng nguồn; không tải phụ thuộc mạng.
export function safeSrc(src) {
  if (typeof src !== 'string' || !src.trim()) return '';
  try { const url = new URL(src, location.href); return url.origin === location.origin && /^https?:$/.test(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function imageFor(src) {
  const url = safeSrc(src);
  if (!images.has(url)) {
    const image = new Image();
    const entry = { image, ready: false, failed: !url };
    images.set(url, entry);
    image.onload = () => { entry.ready = true; };
    image.onerror = () => { entry.failed = true; };
    if (url) image.src = url;
  }
  return images.get(url);
}
export function drawImage(ctx, src, x, y, w, h, flip = false) {
  ctx.imageSmoothingEnabled = false;
  const entry = imageFor(src);
  ctx.save();
  if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); x = 0; y = 0; }
  if (entry.ready) ctx.drawImage(entry.image, Math.round(x), Math.round(y), w, h);
  else { ctx.fillStyle = '#513342'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#ef97a5'; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(entry.failed ? 'Thiếu ảnh' : 'Đang tải…', x + 3, y + Math.min(16, h)); }
  ctx.restore();
}
export async function loadManifest() {
  try {
    const response = await fetch('./manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Không tìm thấy manifest.json');
    const data = await response.json();
    if (data.version !== 1 || !Array.isArray(data.categories)) throw new Error('Manifest không đúng định dạng version 1');
    const seen = new Set();
    const categories = data.categories.map((category) => ({ id: String(category.id), label: String(category.label || category.id), items: (Array.isArray(category.items) ? category.items : []).filter((item) => {
      if (!item || typeof item.id !== 'string' || seen.has(item.id) || !['tile', 'object', 'unit'].includes(item.kind) || !Number.isInteger(item.w) || !Number.isInteger(item.h) || item.w < 1 || item.h < 1 || item.w > 4096 || item.h > 4096) return false;
      seen.add(item.id); return true;
    }).map((item) => ({ ...item, label: String(item.label || item.id), tags: Array.isArray(item.tags) ? item.tags.map(String) : [] })) }));
    return { ...data, pixelScale: Number(data.pixelScale) > 0 ? Number(data.pixelScale) : 2, categories, items: categories.flatMap((c) => c.items) };
  } catch (error) { return { pixelScale: 2, categories: [], items: [], error: error.message }; }
}
export function frames(item, team = 'ally', anim = 'idle') {
  const list = item.units?.[team]?.[anim];
  return Array.isArray(list) && list.length ? list : [item.src];
}
export function matches(item, query) { return [item.id, item.label, item.group || '', ...item.tags].join(' ').toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')); }
export function sizeText(item) { return `${item.w}×${item.h} px ảnh · ${item.w / 2}×${item.h / 2} đơn vị thế giới`; }
const groupLabels = {
  wheat: 'Vua Lúa Mì', stone: 'Vua Đá Núi', arcane: 'Vua Phép Thuật', grove: 'Vua Rừng',
  tide: 'Vua Thuỷ Triều', forge: 'Vua Lò Rèn', clock: 'Vua Đồng Hồ', moon: 'Vua Mặt Trăng', nomad: 'Vua Du Mục',
  tree: 'Cây', rock: 'Đá nhỏ', boulders: 'Đá tảng', bush: 'Bụi cây', mountain: 'Núi', cliff: 'Vách đá',
  log: 'Thân cây đổ', stump: 'Gốc cây', unit: 'Lính', building: 'Công trình',
  grass: 'Cỏ', meadow_flowers: 'Đồng cỏ hoa', meadow_tall: 'Cỏ cao', path: 'Đường đất', sand: 'Cát',
  water_a: 'Nước A', water_b: 'Nước B',
};
// Đổi tab luôn trả về tất cả nhóm, tránh giữ bộ lọc không thuộc tab mới.
export function groupOptions(select, items) {
  const groups = [...new Set(items.map((item) => item.group || '').filter(Boolean))].sort();
  const options = [el('option', 'Tất cả nhóm'), ...groups.map((group) => {
    const option = el('option', `${groupLabels[group] || group} (${items.filter((item) => item.group === group).length})`);
    option.value = group; return option;
  })];
  options[0].value = '';
  select.replaceChildren(...options); select.value = ''; select.disabled = !groups.length;
}
export function tabs(container, manifest, onChange) {
  let current;
  const choices = [{ id: 'all', label: 'Tất cả', items: manifest.items }, ...manifest.categories];
  function update() {
    try { current = decodeURIComponent(location.hash.slice(1)) || 'all'; } catch { current = 'all'; }
    if (!choices.some((c) => c.id === current)) current = 'all';
    container.replaceChildren(...choices.map((c) => {
      const b = button(`${c.label} (${c.items.length})`, () => { location.hash = encodeURIComponent(c.id); });
      b.classList.toggle('active', c.id === current); return b;
    }));
    onChange(choices.find((c) => c.id === current).items);
  }
  addEventListener('hashchange', update); update();
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob); const a = el('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function message(text) { $('status').textContent = text; }
