import { $, el, loadManifest, tabs, matches, drawImage, frames, imageFor, download, message, groupOptions, sizeText } from './common.js';
const manifest = await loadManifest(), assets = new Map(manifest.items.map((a) => [a.id, a]));
const canvas = $('map'), ctx = canvas.getContext('2d'), viewport = $('viewport');
let state = { version: 1, cols: 12, rows: 8, cell: 64, items: [] };
let selected = new Set(), chosen = null, category = [], drag = null, space = false, animationTime = 0, previousTime = performance.now();
const checked = new Set(), history = [], future = [], storageKey = 'crowned-kingdoms.asset-admin.maps.v1';
const clone = (value) => JSON.parse(JSON.stringify(value));
let animationFrame; const zoom = () => Number($('zoom').value);
function record(before) {
  if (JSON.stringify(before) === JSON.stringify(state)) { update(); return; }
  history.push(before); if (history.length > 100) history.shift(); future.length = 0; update();
}
function edit(fn) { const before = clone(state); fn(); record(before); }
function update() {
  canvas.width = state.cols * 64; canvas.height = state.rows * 64;
  canvas.style.width = `${canvas.width * zoom()}px`; canvas.style.height = `${canvas.height * zoom()}px`;
  $('cols').value = state.cols; $('rows').value = state.rows;
  selected = new Set([...selected].filter((i) => i < state.items.length));
  $('selection').textContent = `${selected.size} mục được chọn`;
  const first = state.items[[...selected][0]]; if (first) $('team').value = first.team;
  if (first) $('selection').textContent += ` · ${sizeText(assets.get(first.id))}`;
  $('dimensions').textContent = `${state.cols * 64}×${state.rows * 64} px ảnh · ${state.cols * 32}×${state.rows * 32} đơn vị thế giới; 1 ô = 64 px ảnh = 32 đơn vị thế giới`;
  $('undo').disabled = !history.length; $('redo').disabled = !future.length;
}
function bounds(item) {
  const a = assets.get(item.id);
  return a.kind === 'tile' ? { x: item.x, y: item.y, w: a.w, h: a.h } : { x: item.x - a.w / 2, y: item.y - a.h, w: a.w, h: a.h };
}
function ordered(scene = state) {
  return scene.items.map((item, index) => ({ item, index, a: assets.get(item.id) })).sort((a, b) => {
    if ((a.a.kind === 'tile') !== (b.a.kind === 'tile')) return a.a.kind === 'tile' ? -1 : 1;
    return a.a.kind === 'tile' ? a.index - b.index : a.item.y - b.item.y || a.index - b.index;
  });
}
function draw(target, overlays = true, scene = state, background = $('bg').value) {
  target.imageSmoothingEnabled = false;
  target.fillStyle = background; target.fillRect(0, 0, scene.cols * 64, scene.rows * 64);
  for (const { item, index, a } of ordered(scene)) {
    const b = bounds(item), list = frames(a, item.team), frame = overlays && $('animate').checked ? Math.floor(animationTime * 6 / 1000) % list.length : 0;
    drawImage(target, a.kind === 'unit' ? list[frame] : a.src, Math.round(b.x), Math.round(b.y), a.w, a.h, item.flip);
    if (overlays && selected.has(index)) { target.strokeStyle = '#ffe49b'; target.lineWidth = 2; target.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2); target.fillStyle = '#ffe49b'; target.fillRect(item.x - 2, item.y - 2, 4, 4); }
  }
  if (overlays && $('grid').checked) {
    target.strokeStyle = '#ffffff35'; target.lineWidth = 1; target.beginPath();
    for (let x = 0; x <= canvas.width; x += 64) { target.moveTo(x + .5, 0); target.lineTo(x + .5, canvas.height); }
    for (let y = 0; y <= canvas.height; y += 64) { target.moveTo(0, y + .5); target.lineTo(canvas.width, y + .5); } target.stroke();
  }
  if (overlays && drag && ['box', 'fill', 'scatter'].includes(drag.mode)) {
    const r = rectangle(drag.start, drag.end); target.fillStyle = '#e5bd7033'; target.fillRect(r.x, r.y, r.w, r.h); target.strokeStyle = '#f3cf86'; target.strokeRect(r.x, r.y, r.w, r.h);
  }
}
function tick(now) {
  const delta = Math.min(100, now - previousTime); previousTime = now;
  if (!document.hidden) { animationTime += delta; draw(ctx); for (const thumb of document.querySelectorAll('.thumb canvas')) { const a = assets.get(thumb.dataset.id); const c = thumb.getContext('2d'); c.clearRect(0, 0, 64, 64); const scale = Math.min(64 / a.w, 64 / a.h, 1); drawImage(c, a.src, Math.floor((64 - a.w * scale) / 2), Math.floor((64 - a.h * scale) / 2), Math.max(1, Math.round(a.w * scale)), Math.max(1, Math.round(a.h * scale))); } }
  if (!document.hidden) animationFrame = requestAnimationFrame(tick);
}
function palette() {
  $('thumbs').replaceChildren();
  for (const a of category.filter((item) => matches(item, $('search').value) && (!$('group').value || item.group === $('group').value))) {
    const card = el('div', undefined, 'thumb'); card.draggable = true; card.classList.toggle('active', chosen === a.id);
    card.title = `${a.label} · ${sizeText(a)}`;
    const check = el('input'); check.type = 'checkbox'; check.checked = checked.has(a.id); check.disabled = a.kind === 'tile'; check.setAttribute('aria-label', `Rải ${a.label}`);
    check.onclick = (event) => event.stopPropagation(); check.onchange = () => { if (check.checked) checked.add(a.id); else checked.delete(a.id); };
    const thumb = el('canvas'); thumb.width = thumb.height = 64; thumb.dataset.id = a.id;
    card.append(check, thumb, el('small', a.label), el('small', sizeText(a))); card.tabIndex = 0;
    card.onclick = () => { chosen = a.id; palette(); message(`Đang chọn: ${a.label}. Kéo thả hoặc dùng công cụ đặt.`); };
    card.onkeydown = (event) => { if (event.key === 'Enter' && event.target === card) card.click(); };
    card.ondragstart = (event) => { event.dataTransfer.setData('text/plain', a.id); event.dataTransfer.effectAllowed = 'copy'; chosen = a.id; };
    $('thumbs').append(card);
  }
}
function point(event) { const r = canvas.getBoundingClientRect(); return { x: Math.max(0, Math.min(canvas.width - 1, Math.round((event.clientX - r.left) / zoom()))), y: Math.max(0, Math.min(canvas.height - 1, Math.round((event.clientY - r.top) / zoom()))) }; }
function rectangle(a, b) { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }; }
function snapPosition(a, p, shift) {
  if (a.kind === 'tile') return { x: Math.floor(p.x / Math.min(64, a.w)) * Math.min(64, a.w), y: Math.floor(p.y / Math.min(64, a.h)) * Math.min(64, a.h) };
  const step = shift ? 8 : 1; return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step };
}
function place(id, p, shift = false) {
  const a = assets.get(id); if (!a) return;
  const pos = snapPosition(a, p, shift);
  if (a.kind === 'tile') state.items = state.items.filter((item) => !(assets.get(item.id).kind === 'tile' && item.x === pos.x && item.y === pos.y));
  state.items.push({ id, ...pos, flip: false, team: 'ally' });
}
function hit(p) { return ordered().reverse().find(({ item }) => { const b = bounds(item); return p.x >= b.x && p.y >= b.y && p.x < b.x + b.w && p.y < b.y + b.h; })?.index; }
canvas.ondragover = (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; };
canvas.ondrop = (event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (assets.has(id)) edit(() => { selected.clear(); place(id, point(event), event.shiftKey); selected.add(state.items.length - 1); }); };
canvas.onpointerdown = (event) => {
  if (event.button !== 0 && event.button !== 1) return;
  event.preventDefault(); canvas.focus(); canvas.setPointerCapture(event.pointerId);
  const p = point(event), tool = $('tool').value;
  if (space || event.button === 1) { drag = { mode: 'pan', clientX: event.clientX, clientY: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop }; return; }
  if (tool === 'place') { if (chosen) edit(() => { selected.clear(); place(chosen, p, event.shiftKey); selected.add(state.items.length - 1); }); else message('Chọn một asset trước.'); return; }
  if (tool === 'fill' || tool === 'scatter') { drag = { mode: tool, start: p, end: p }; return; }
  const index = event.altKey ? undefined : hit(p);
  if (index === undefined) { if (!event.shiftKey) selected.clear(); drag = { mode: 'box', start: p, end: p, additive: event.shiftKey }; }
  else {
    if (event.shiftKey && selected.has(index)) { selected.delete(index); update(); return; }
    if (!selected.has(index)) { if (!event.shiftKey) selected.clear(); selected.add(index); }
    drag = { mode: 'move', start: p, before: clone(state), originals: [...selected].map((i) => ({ index: i, ...state.items[i] })) };
  }
  update();
};
canvas.onpointermove = (event) => {
  if (!drag) return;
  if (drag.mode === 'pan') { viewport.scrollLeft = drag.left - event.clientX + drag.clientX; viewport.scrollTop = drag.top - event.clientY + drag.clientY; return; }
  const p = point(event);
  if (drag.mode !== 'move') { drag.end = p; return; }
  let dx = p.x - drag.start.x, dy = p.y - drag.start.y;
  // Chung một độ dời để giữ nguyên bố cục nhóm; nhóm chứa tile đi theo lưới tile.
  const tiles = drag.originals.map((i) => assets.get(i.id)).filter((a) => a.kind === 'tile');
  const sx = tiles.length ? tiles.reduce((n, a) => lcm(n, Math.min(64, a.w)), 1) : event.shiftKey ? 8 : 1;
  const sy = tiles.length ? tiles.reduce((n, a) => lcm(n, Math.min(64, a.h)), 1) : event.shiftKey ? 8 : 1;
  dx = Math.round(dx / sx) * sx; dy = Math.round(dy / sy) * sy;
  for (const item of drag.originals) { state.items[item.index].x = item.x + dx; state.items[item.index].y = item.y + dy; }
};
function lcm(a, b) { let x = a, y = b; while (y) { const t = y; y = x % y; x = t; } return a / x * b; }
function finish(event) {
  if (!drag) return;
  const d = drag; drag = null;
  if (d.mode === 'move') { deduplicateTiles(); record(d.before); }
  if (d.mode === 'box') {
    const r = rectangle(d.start, d.end); if (!d.additive) selected.clear();
    state.items.forEach((item, i) => { const b = bounds(item); if (b.x < r.x + r.w && b.x + b.w > r.x && b.y < r.y + r.h && b.y + b.h > r.y) selected.add(i); }); update();
  }
  if (d.mode === 'fill') {
    const a = assets.get(chosen); if (!a || a.kind !== 'tile') { message('Chọn một tile để tô vùng chữ nhật.'); return; }
    const r = rectangle(d.start, d.end), sx = Math.min(64, a.w), sy = Math.min(64, a.h);
    edit(() => { selected.clear(); for (let y = Math.floor(r.y / sy) * sy; y <= r.y + r.h; y += sy) for (let x = Math.floor(r.x / sx) * sx; x <= r.x + r.w; x += sx) place(a.id, { x, y }); });
  }
  if (d.mode === 'scatter') {
    const pool = [...checked].filter((id) => assets.get(id).kind !== 'tile'); if (!pool.length) { message('Tick ít nhất một object/lính trong bảng asset để rải.'); return; }
    const count = Number($('count').value); if (!Number.isInteger(count) || count < 1 || count > 2000) { message('N phải là số nguyên từ 1 đến 2000.'); return; }
    const random = seeded($('seed').value), r = rectangle(d.start, d.end);
    edit(() => { selected.clear(); for (let i = 0; i < count; i++) place(pool[Math.floor(random() * pool.length)], { x: r.x + Math.floor(random() * (r.w + 1)), y: r.y + Math.floor(random() * (r.h + 1)) }, event.shiftKey); });
  }
}
// Hash seed và mulberry32: cùng seed + cùng vùng cho cùng kết quả.
function seeded(seed) { let value = 2166136261; for (let i = 0; i < seed.length; i++) value = Math.imul(value ^ seed.charCodeAt(i), 16777619); return () => { let t = value += 0x6d2b79f5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function deduplicateTiles() {
  const keep = new Set(), result = [], selection = new Set();
  // Tile đang di chuyển thay tile cũ ở vị trí đích.
  const priority = state.items.map((_, i) => i).sort((a, b) => Number(selected.has(b)) - Number(selected.has(a)) || b - a);
  for (const i of priority) { const item = state.items[i]; if (assets.get(item.id).kind !== 'tile') continue; const key = `${item.x},${item.y}`; if (!keep.has(key)) keep.add(key); else keep.add(`remove:${i}`); }
  state.items.forEach((item, i) => { if (keep.has(`remove:${i}`)) return; if (selected.has(i)) selection.add(result.length); result.push(item); });
  state.items = result; selected = selection;
}
canvas.onpointerup = (event) => { canvas.onpointermove(event); finish(event); };
canvas.onpointercancel = () => { if (drag?.before) state = drag.before; drag = null; update(); };
function undo() { if (!history.length) return; future.push(clone(state)); state = history.pop(); selected.clear(); update(); }
function redo() { if (!future.length) return; history.push(clone(state)); state = future.pop(); selected.clear(); update(); }
function removeSelected() { edit(() => { state.items = state.items.filter((_, i) => !selected.has(i)); selected.clear(); }); }
function duplicate() { edit(() => { const originals = [...selected].map((i) => clone(state.items[i])); selected.clear(); for (const item of originals) { const a = assets.get(item.id); item.x += a.kind === 'tile' ? Math.min(64, a.w) : 8; item.y += a.kind === 'tile' ? Math.min(64, a.h) : 8; state.items.push(item); selected.add(state.items.length - 1); } deduplicateTiles(); }); }
function reorder(direction) {
  edit(() => {
    const entries = state.items.map((item, i) => ({ item, selected: selected.has(i) }));
    const indices = entries.map((_, i) => i); if (direction > 0) indices.reverse();
    for (const i of indices) { const entry = entries[i]; if (!entry.selected || assets.get(entry.item.id).kind === 'tile') continue; for (let j = i + direction; j >= 0 && j < entries.length; j += direction) { const other = entries[j]; if (assets.get(other.item.id).kind !== 'tile' && other.item.y === entry.item.y) { if (!other.selected) [entries[i], entries[j]] = [other, entry]; break; } } }
    state.items = entries.map((e) => e.item); selected = new Set(entries.flatMap((e, i) => e.selected ? [i] : []));
  });
}
$('undo').onclick = undo; $('redo').onclick = redo; $('delete').onclick = removeSelected; $('duplicate').onclick = duplicate;
$('flip').onclick = () => edit(() => { for (const i of selected) state.items[i].flip = !state.items[i].flip; });
$('team').onchange = () => edit(() => { for (const i of selected) if (assets.get(state.items[i].id).kind === 'unit') state.items[i].team = $('team').value; });
$('up').onclick = () => reorder(1); $('down').onclick = () => reorder(-1);
$('clear').onclick = () => edit(() => { state.items = []; selected.clear(); });
$('resize').onclick = () => { const cols = Number($('cols').value), rows = Number($('rows').value); if (![cols, rows].every((n) => Number.isInteger(n) && n >= 1 && n <= 40)) { message('Kích thước phải là số nguyên từ 1 đến 40 ô.'); return; } edit(() => { state.cols = cols; state.rows = rows; }); };
$('zoom').onchange = update;
addEventListener('keydown', (event) => {
  if (event.target.closest('input,select,textarea')) return;
  if (event.code === 'Space') { event.preventDefault(); space = true; }
  if (event.key === 'Escape') { if (drag?.before) state = drag.before; drag = null; selected.clear(); update(); }
  if (drag && event.key !== 'Escape') return; if (event.key === 'Delete') { event.preventDefault(); removeSelected(); }
  if (event.ctrlKey || event.metaKey) { const key = event.key.toLowerCase(); if (['z', 'y', 'd'].includes(key)) event.preventDefault(); if (key === 'z') { if (event.shiftKey) redo(); else undo(); } if (key === 'y') redo(); if (key === 'd') duplicate(); }
});
addEventListener('keyup', (event) => { if (event.code === 'Space') space = false; });
addEventListener('blur', () => { space = false; if (drag?.before) state = drag.before; drag = null; update(); });
function readSaved() { const raw = localStorage.getItem(storageKey); if (!raw) return {}; const data = JSON.parse(raw); if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Kho bản đồ bị lỗi định dạng'); return data; }
function refreshSaved() { try { const data = readSaved(); $('saved').replaceChildren(...Object.keys(data).sort().map((name) => { const option = el('option', name); option.value = name; return option; })); } catch (error) { message(`Không đọc được localStorage: ${error.message}`); } }
$('save').onclick = () => { const name = $('name').value.trim(); if (!name) { message('Nhập tên bản đồ trước khi lưu.'); return; } try { const data = readSaved(); Object.defineProperty(data, name, { value: clone(state), enumerable: true, configurable: true, writable: true }); localStorage.setItem(storageKey, JSON.stringify(data)); refreshSaved(); $('saved').value = name; message(`Đã lưu: ${name}`); } catch (error) { message(`Không lưu được: ${error.message}`); } };
function validate(data) {
  if (!data || data.version !== 1 || data.cell !== 64 || ![data.cols, data.rows].every((n) => Number.isInteger(n) && n >= 1 && n <= 40) || !Array.isArray(data.items) || data.items.length > 50000) throw new Error('JSON không đúng định dạng bản đồ hoặc quá 50.000 mục');
  const unknown = new Set();
  const items = data.items.map((item) => {
    if (!item || !assets.has(item.id)) { unknown.add(String(item?.id)); return null; }
    if (![item.x, item.y].every((n) => Number.isInteger(n) && Math.abs(n) <= 100000) || typeof item.flip !== 'boolean' || !['ally', 'foe'].includes(item.team)) throw new Error(`Tọa độ/flip/phe không hợp lệ: ${item.id}`);
    const a = assets.get(item.id); if (a.kind === 'tile' && (item.x % Math.min(64, a.w) || item.y % Math.min(64, a.h))) throw new Error(`Tile không khớp lưới: ${item.id}`);
    return { id: item.id, x: item.x, y: item.y, flip: item.flip, team: item.team };
  }).filter(Boolean);
  if (unknown.size) throw new Error(`Manifest thiếu id: ${[...unknown].slice(0, 10).join(', ')}`);
  return { version: 1, cols: data.cols, rows: data.rows, cell: 64, items };
}
function replaceMap(data) { const next = validate(data); edit(() => { state = next; selected.clear(); deduplicateTiles(); }); update(); }
$('load').onclick = () => { try { const data = readSaved()[$('saved').value]; if (!data) throw new Error('Chưa chọn bản lưu'); replaceMap(data); $('name').value = $('saved').value; message('Đã tải bản đồ. Có thể hoàn tác để quay lại.'); } catch (error) { message(`Không tải được: ${error.message}`); } };
$('remove').onclick = () => { try { const data = readSaved(); delete data[$('saved').value]; localStorage.setItem(storageKey, JSON.stringify(data)); refreshSaved(); } catch (error) { message(`Không xoá được: ${error.message}`); } };
const filename = () => ($('name').value.trim() || 'ban-do').replace(/[<>:"/\\|?*]/g, '_').replace(/\p{Cc}/gu, '_');
$('export').onclick = () => download(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), `${filename()}.json`);
$('import').onclick = () => $('file').click();
$('file').onchange = async () => { const file = $('file').files[0]; if (!file) return; try { if (file.size > 15 * 1024 * 1024) throw new Error('Tệp vượt quá 15 MB'); replaceMap(JSON.parse(await file.text())); message('Đã nhập JSON.'); } catch (error) { message(`Không nhập được: ${error.message}`); } $('file').value = ''; };
$('png').onclick = async () => {
  const b = $('png'); b.disabled = true;
  const snapshot = clone(state), background = $('bg').value;
  try {
    const sources = new Set(snapshot.items.map((item) => { const a = assets.get(item.id); return a.kind === 'unit' ? frames(a, item.team)[0] : a.src; }));
    await Promise.all([...sources].map((src) => new Promise((resolve, reject) => { const entry = imageFor(src); if (entry.ready || entry.failed) return resolve(); const timer = setTimeout(() => reject(new Error('Ảnh chưa tải xong; hãy thử xuất lại.')), 5000); const done = () => { clearTimeout(timer); resolve(); }; entry.image.addEventListener('load', done, { once: true }); entry.image.addEventListener('error', done, { once: true }); })));
    const out = document.createElement('canvas'); out.width = snapshot.cols * 64; out.height = snapshot.rows * 64;
    // PNG giữ kích thước pixel ảnh, bỏ lưới và viền chọn; lấy frame idle đầu tiên.
    draw(out.getContext('2d'), false, snapshot, background);
    out.toBlob((blob) => { if (blob) download(blob, `${filename()}.png`); else message('Không tạo được PNG.'); }, 'image/png');
  } catch (error) { message(`Không xuất được PNG: ${error.message}`); } finally { b.disabled = false; }
};
$('search').oninput = palette;
// Chỉ đưa vua có đủ ba trạng thái 64 px vào bản xem trước.
const plotGroups = new Map();
for (const a of manifest.categories.find((c) => c.id === 'plots')?.items || []) {
  if (a.kind !== 'tile' || a.w !== 64 || a.h !== 64) continue;
  if (!plotGroups.has(a.group)) plotGroups.set(a.group, {});
  for (const name of ['locked', 'open', 'throne']) if (a.tags.includes(name)) plotGroups.get(a.group)[name] = a.id;
}
for (const [king, plots] of plotGroups) {
  if (!plots.locked || !plots.open || !plots.throne) continue;
  const option = el('option', king); option.value = king; $('king').append(option);
}
$('preview').disabled = !$('king').options.length;
$('preview').onclick = () => {
  const plots = plotGroups.get($('king').value); if (!plots) return;
  edit(() => {
    state.cols = Math.max(7, state.cols); state.rows = Math.max(7, state.rows);
    state.items = []; selected.clear();
    const left = Math.floor((state.cols - 5) / 2), top = Math.floor((state.rows - 5) / 2);
    for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
      const distance = Math.abs(col - 2) + Math.abs(row - 2);
      place(plots[distance === 0 ? 'throne' : distance === 1 ? 'open' : 'locked'], { x: (left + col) * 64, y: (top + row) * 64 });
    }
    $('emptyX').value = left; $('emptyY').value = top; $('emptyW').value = $('emptyH').value = 5;
  });
  message('Đã tạo 25 ô: Ngai giữa, 4 ô mở, 20 ô khoá. Có thể hoàn tác.');
};
function intersects(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
$('forest').onclick = () => {
  const values = ['emptyX', 'emptyY', 'emptyW', 'emptyH'].map((id) => Number($(id).value));
  const [x, y, w, h] = values, count = Number($('count').value);
  if (!values.every(Number.isInteger) || x < 0 || y < 0 || w < 1 || h < 1 || x + w > state.cols || y + h > state.rows) { message('Vùng trống phải nằm trong bản đồ, dùng số nguyên theo ô.'); return; }
  if (!Number.isInteger(count) || count < 1 || count > 2000) { message('N phải là số nguyên từ 1 đến 2000.'); return; }
  const groups = ['tree', 'rock', 'mountain', 'cliff', 'boulders', 'bush'];
  const pool = (manifest.categories.find((c) => c.id === 'wilds')?.items || []).filter((a) => a.kind === 'object' && groups.includes(a.group)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (!pool.length) { message('Manifest chưa có cây/đá/núi/bụi để rải.'); return; }
  const clearing = { x: x * 64, y: y * 64, w: w * 64, h: h * 64 };
  const random = seeded($('seed').value), width = state.cols * 64, height = state.rows * 64;
  // Xen đá/bụi giữa các cây; xử lý vật cao trước, ưu tiên mép trên.
  const small = pool.filter((a) => ['rock', 'bush'].includes(a.group));
  const tall = pool.filter((a) => !['rock', 'bush'].includes(a.group));
  const plans = Array.from({ length: count }, (_, i) => {
    const choices = (i % 2 ? small : tall); const list = choices.length ? choices : pool;
    return { asset: list[Math.floor(random() * list.length)], order: i };
  }).sort((a, b) => b.asset.h - a.asset.h || a.order - b.order);
  let added = 0;
  edit(() => {
    selected.clear();
    const occupied = state.items.filter((item) => assets.get(item.id).kind !== 'tile').map(bounds);
    for (const { asset: a } of plans) {
      if (a.w > width || a.h > height) continue;
      for (let attempt = 0; attempt < 200; attempt++) {
        const px = Math.floor(random() * (width - a.w + 1));
        const ry = random(), bias = ['tree', 'mountain', 'cliff', 'boulders'].includes(a.group) ? Math.min(ry, random()) : ry;
        const py = Math.floor(bias * (height - a.h + 1));
        const box = { x: px, y: py, w: a.w, h: a.h };
        if (intersects(box, clearing) || occupied.some((other) => intersects(box, other))) continue;
        // Anchor ở chân, x nguyên để JSON round-trip; tránh cắt mép ảnh lẻ.
        const item = { id: a.id, x: px + Math.ceil(a.w / 2), y: py + a.h, flip: random() < .5, team: 'ally' };
        const actual = bounds(item);
        if (actual.x + actual.w > width || intersects(actual, clearing) || occupied.some((other) => intersects(actual, other))) continue;
        state.items.push(item); occupied.push(actual); added++; break;
      }
    }
  });
  message(`Đã rải ${added}/${count} mục với seed “${$('seed').value}”; khung ảnh nằm ngoài vùng trống. Thiếu chỗ sẽ rải ít hơn N. Có thể hoàn tác.`);
};
$('group').onchange = palette;
tabs($('tabs'), manifest, (items) => { category = items; groupOptions($('group'), items); palette(); });
refreshSaved(); update(); message(manifest.error || (manifest.sample ? 'Manifest mẫu rỗng. Thay bằng manifest thật để dùng asset.' : `${manifest.items.length} asset sẵn sàng.`)); if (!document.hidden) animationFrame = requestAnimationFrame(tick);

document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(animationFrame);
  if (document.hidden) { space = false; if (drag?.before) state = drag.before; drag = null; update(); }
  else { previousTime = performance.now(); animationFrame = requestAnimationFrame(tick); }
});
