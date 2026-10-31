import {
  $, el, button, loadManifest, loadPlanned, matches, frames, drawImage, safeSrc,
  message, groupOptions, sizeText, context2d, queryAll, requireAt, download, errorText,
} from './common';
import type { Item, PlannedItem, Team, Animation } from './types';

interface Player {
  item: Item;
  card: HTMLElement;
  canvas: HTMLCanvasElement;
  team: Team;
  anim: Animation;
  fps: number;
  paused: boolean;
  flip: boolean;
  patrol: boolean;
  elapsed: number;
  info?: HTMLElement;
}

interface Detail {
  item: Item;
  canvas: HTMLCanvasElement;
}

type CatalogueEntry = { state: 'available'; item: Item } | { state: 'missing'; item: PlannedItem };
interface CatalogueCategory { id: string; label: string; items: CatalogueEntry[] }
const [manifest, planned] = await Promise.all([loadManifest(), loadPlanned()]);
const categoryLabels: Record<string, string> = {
  units: 'Lính', buildings: 'Công trình', terrain: 'Nền đất', plots: 'Ô bàn cờ', wilds: 'Hoang dã',
  thrones: 'Ngai', bosses: 'Trùm', cards: 'Tranh thẻ', portraits: 'Chân dung vua',
  projectiles: 'Đạn', vfx: 'Hiệu ứng', decor: 'Trang trí', ui_icons: 'Biểu tượng và khung giao diện',
  menu: 'Nền menu và minh hoạ', release: 'Hình phát hành',
};
const availableIds = new Set(manifest.items.map((item) => item.id));
// Manifest sinh lại có thể đã bổ sung ảnh sau lần sinh planned gần nhất.
const missing = planned.items.filter((item) => !availableIds.has(item.id));
const categories: CatalogueCategory[] = manifest.categories.map((entry) => ({
  id: entry.id, label: entry.label,
  items: entry.items.map<CatalogueEntry>((item) => ({ state: 'available', item })),
}));
for (const item of missing) {
  let target = categories.find((entry) => entry.id === item.category);
  if (!target) {
    target = { id: item.category, label: categoryLabels[item.category] || `Danh mục ${item.category}`, items: [] };
    categories.push(target);
  }
  target.items.push({ state: 'missing', item });
}
const allEntries = categories.flatMap((entry) => entry.items);
let category: CatalogueEntry[] = [], players: Player[] = [], detail: Detail | null = null;
let currentCategory = 'all';
$('load-status', HTMLElement).textContent = [manifest.error, planned.error].filter(Boolean).join(' ');
$('summary', HTMLElement).textContent = `Tổng toàn bộ: đã có ${manifest.items.length} / cần ${allEntries.length} · còn thiếu ${missing.length}`;
const exportUnavailable = Boolean(manifest.error || planned.error);
$('copy-missing', HTMLButtonElement).disabled = exportUnavailable;
$('download-missing', HTMLButtonElement).disabled = exportUnavailable;
const visible = new Set<Element>();
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
  }
});

function plannedSize(item: PlannedItem): string {
  if (!item.w || !item.h) return `${item.w}×${item.h} px ảnh · chưa chốt kích thước`;
  return `${item.w}×${item.h} px ảnh · ${item.w / 2}×${item.h / 2} đơn vị thế giới`;
}
function plannedMetadata(item: PlannedItem): HTMLElement[] {
  return [el('p', plannedSize(item)), el('p', `${item.frames === undefined ? 'Chưa chốt số frame' : `${item.frames} frame dự kiến`} · ${item.priority}`),
    el('p', `Nguồn: ${item.source}`, 'muted'), ...(item.note ? [el('p', item.note, 'muted')] : [])];
}
function showMissingDetail(item: PlannedItem): void {
  detail = null;
  $('detail', HTMLElement).replaceChildren(el('h2', item.label), el('strong', 'Chưa có', 'missing-badge'),
    el('code', item.id), ...plannedMetadata(item));
}
function missingCard(item: PlannedItem): HTMLElement {
  const card = el('article', undefined, 'card missing-card');
  const preview = el('div', undefined, 'missing-preview');
  preview.append(el('strong', 'Chưa có'), el('small', plannedSize(item)));
  card.append(preview, el('h3', item.label), el('code', item.id), ...plannedMetadata(item));
  card.tabIndex = 0; card.setAttribute('aria-label', `Chưa có asset: ${item.label}`);
  card.onclick = () => showMissingDetail(item);
  card.onkeydown = (event) => { if (event.target === card && event.key === 'Enter') showMissingDetail(item); };
  return card;
}
function renderTabs(): void {
  try { currentCategory = decodeURIComponent(location.hash.slice(1)) || 'all'; } catch { currentCategory = 'all'; }
  const choices = [{ id: 'all', label: 'Tất cả', items: allEntries }, ...categories];
  const current = choices.find((entry) => entry.id === currentCategory) ?? requireAt(choices, 0);
  currentCategory = current.id;
  $('tabs', HTMLElement).replaceChildren(...choices.map((entry) => {
    const have = entry.items.filter((item) => item.state === 'available').length;
    const control = button(`${entry.label}: đã có ${have} / cần ${entry.items.length}`, () => { location.hash = encodeURIComponent(entry.id); });
    control.classList.toggle('active', entry.id === currentCategory); return control;
  }));
  category = current.items;
  groupOptions($('group', HTMLSelectElement), category.map((entry) => entry.item));
  render();
}

function showDetail(item: Item): void {
  const pane = $('detail', HTMLElement);
  pane.replaceChildren(el('h2', item.label));
  const stage = el('div', undefined, `stage ${$('background', HTMLSelectElement).value}`);
  const canvas = el('canvas');
  canvas.width = item.w; canvas.height = item.h;
  canvas.style.width = `${item.w * 3}px`; canvas.style.height = `${item.h * 3}px`;
  stage.append(canvas);
  pane.append(stage, el('code', item.id), el('p', sizeText(item)), el('code', item.src));
  pane.append(button('Sao chép đường dẫn', async () => {
    try {
      await navigator.clipboard.writeText(item.src);
      message('Đã sao chép đường dẫn.');
    } catch {
      message('Không truy cập được clipboard. Hãy chọn và sao chép đường dẫn hiển thị.');
    }
  }));
  const link = el('a', 'Mở ảnh gốc ↗');
  link.href = safeSrc(item.src); link.target = '_blank'; link.rel = 'noopener';
  pane.append(link);
  detail = { item, canvas };
}

function render(): void {
  observer.disconnect(); visible.clear(); players = [];
  const group = $('group', HTMLSelectElement).value;
  const status = $('availability', HTMLSelectElement).value, priority = $('priority', HTMLSelectElement).value;
  const list = category.filter((entry) => (!group || entry.item.group === group)
    && matches(entry.item, $('search', HTMLInputElement).value)
    && (!status || entry.state === status)
    && (!priority || (entry.state === 'missing' && entry.item.priority === priority)));
  $('cards', HTMLElement).replaceChildren();
  for (const entry of list) {
    if (entry.state === 'missing') { $('cards', HTMLElement).append(missingCard(entry.item)); continue; }
    const item = entry.item;
    const card = el('article', undefined, 'card');
    const stage = el('div', undefined, `stage ${$('background', HTMLSelectElement).value}`);
    const canvas = el('canvas');
    const unit = item.kind === 'unit';
    // Giữ kích thước thẻ lính đã duyệt ở bản JavaScript.
    canvas.width = unit ? Math.max(item.w, 112) : item.w;
    canvas.height = unit ? Math.max(item.h + 16, 50) : item.h;
    canvas.style.width = `${canvas.width * Number($('zoom', HTMLInputElement).value)}px`;
    canvas.style.height = `${canvas.height * Number($('zoom', HTMLInputElement).value)}px`;
    stage.append(canvas);
    card.append(stage, el('h3', item.label), el('code', item.id), el('small', sizeText(item)), el('p', item.tags.join(' · '), 'muted'));
    card.tabIndex = 0; card.setAttribute('aria-label', `Chi tiết ${item.label}`);
    card.onclick = () => showDetail(item);
    card.onkeydown = (event) => { if (event.target === card && event.key === 'Enter') showDetail(item); };
    const player: Player = { item, card, canvas, team: 'ally', anim: 'idle', fps: 6, paused: false, flip: false, patrol: false, elapsed: 0 };
    if (unit) {
      const controls = el('div', undefined, 'unit-controls');
      controls.onclick = (event) => event.stopPropagation();
      function action(label: string, fn: () => void, restart = false): HTMLButtonElement {
        const control = button(label, () => {
          fn();
          if (restart) player.elapsed = 0;
          sync();
        });
        controls.append(control);
        return control;
      }
      const ally = action('Ta', () => { player.team = 'ally'; });
      const foe = action('Địch', () => { player.team = 'foe'; });
      const animButtons = new Map<Animation, HTMLButtonElement>();
      const animations: Array<[string, Animation]> = [['Đứng', 'idle'], ['Đi', 'walk'], ['Đánh', 'attack']];
      for (const [label, anim] of animations) {
        animButtons.set(anim, action(label, () => {
          player.anim = anim; player.fps = anim === 'attack' ? 10 : 6;
          speed.value = String(player.fps); player.paused = false; player.patrol = false;
        }, true));
      }
      action('Dừng', () => { player.paused = true; });
      const flip = action('Lật ngang', () => { player.flip = !player.flip; });
      const patrol = action('Đi qua lại', () => {
        player.anim = 'walk'; player.patrol = true; player.paused = false; player.fps = 6; speed.value = '6';
      }, true);
      action('Đánh liên tục', () => {
        player.anim = 'attack'; player.patrol = false; player.paused = false; player.fps = 10; speed.value = '10';
      }, true);
      const speed = el('input');
      speed.type = 'range'; speed.min = '1'; speed.max = '24'; speed.value = '6';
      speed.setAttribute('aria-label', 'Tốc độ animation');
      speed.oninput = () => { player.fps = Number(speed.value); };
      controls.append(el('span', 'FPS'), speed);
      player.info = el('small'); controls.append(player.info); card.append(controls);
      function sync(): void {
        ally.classList.toggle('active', player.team === 'ally');
        foe.classList.toggle('active', player.team === 'foe');
        flip.classList.toggle('active', player.flip);
        patrol.classList.toggle('active', player.patrol);
        for (const [anim, control] of animButtons) control.classList.toggle('active', anim === player.anim && !player.paused);
      }
      sync();
    }
    players.push(player); $('cards', HTMLElement).append(card); observer.observe(card);
  }
  if (!list.length) $('cards', HTMLElement).append(el('p', 'Không có asset khớp bộ lọc.', 'muted'));
  const have = category.filter((entry) => entry.state === 'available').length;
  message(`Danh mục: đã có ${have} / cần ${category.length} · đang hiện ${list.length} mục theo bộ lọc.`);
}

let last = performance.now(), animationFrame = 0;
// Không cộng thời gian tab ẩn vào animation khi quay lại.
addEventListener('visibilitychange', () => {
  cancelAnimationFrame(animationFrame);
  if (!document.hidden) { last = performance.now(); animationFrame = requestAnimationFrame(tick); }
});

function tick(now: number): void {
  const delta = Math.min(now - last, 100); last = now;
  if (!document.hidden) {
    for (const player of players) {
      if (!visible.has(player.card)) continue;
      if (!player.paused) player.elapsed += delta;
      const ctx = context2d(player.canvas);
      const list = frames(player.item, player.team, player.anim);
      const index = Math.floor(player.elapsed * player.fps / 1000) % list.length;
      ctx.clearRect(0, 0, player.canvas.width, player.canvas.height);
      let x = (player.canvas.width - player.item.w) / 2, flip = player.flip;
      if (player.patrol) {
        const span = Math.max(1, player.canvas.width - player.item.w);
        const phase = (player.elapsed * .04) % (2 * span);
        x = phase <= span ? phase : 2 * span - phase;
        flip = (phase > span) !== player.flip;
        ctx.strokeStyle = '#bbb'; ctx.beginPath();
        ctx.moveTo(0, player.canvas.height - 8); ctx.lineTo(player.canvas.width, player.canvas.height - 8); ctx.stroke();
      }
      const y = player.canvas.height - player.item.h - (player.item.kind === 'unit' ? 8 : 0);
      drawImage(ctx, requireAt(list, index), Math.round(x), y, player.item.w, player.item.h, flip);
      if ($('guides', HTMLInputElement).checked) {
        ctx.strokeStyle = '#ffbb6699'; ctx.beginPath();
        for (let gx = 0; gx < player.canvas.width; gx += 64) { ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, player.canvas.height); }
        for (let gy = 0; gy < player.canvas.height; gy += 64) { ctx.moveTo(0, gy + .5); ctx.lineTo(player.canvas.width, gy + .5); }
        ctx.stroke();
      }
      if ($('border', HTMLInputElement).checked) {
        ctx.strokeStyle = '#eaa647'; ctx.strokeRect(Math.round(x) + .5, y + .5, player.item.w - 1, player.item.h - 1);
      }
      if (player.info) player.info.textContent = `${requireAt(list, index).split('/').pop()} · ${player.fps} fps${player.paused ? ' · dừng' : ''}`;
    }
    if (detail) {
      const ctx = context2d(detail.canvas);
      ctx.clearRect(0, 0, detail.item.w, detail.item.h);
      drawImage(ctx, detail.item.src, 0, 0, detail.item.w, detail.item.h);
    }
  }
  if (!document.hidden) animationFrame = requestAnimationFrame(tick);
}

$('search', HTMLInputElement).oninput = render;
$('group', HTMLSelectElement).onchange = render;
$('availability', HTMLSelectElement).onchange = render;
$('priority', HTMLSelectElement).onchange = render;
$('zoom', HTMLInputElement).oninput = () => {
  $('zoomLabel', HTMLOutputElement).value = `${$('zoom', HTMLInputElement).value}×`;
  for (const player of players) {
    player.canvas.style.width = `${player.canvas.width * Number($('zoom', HTMLInputElement).value)}px`;
    player.canvas.style.height = `${player.canvas.height * Number($('zoom', HTMLInputElement).value)}px`;
  }
};
$('background', HTMLSelectElement).onchange = () => {
  for (const stage of queryAll('.stage', HTMLElement)) stage.className = `stage ${$('background', HTMLSelectElement).value}`;
};

// Xuất toàn bộ danh sách thiếu, không phụ thuộc tab hoặc bộ lọc hiện tại.
$('copy-missing', HTMLButtonElement).onclick = async () => {
  const lines = ['# Asset chưa có ảnh', ''];
  for (const entry of categories) {
    const items = missing.filter((item) => item.category === entry.id);
    if (!items.length) continue;
    lines.push(`## ${entry.label} (${items.length})`, '');
    for (const item of items) lines.push(`- [ ] ${item.label} (\`${item.id}\`) — ${plannedSize(item)}; ${item.frames ?? '?'} frame; ${item.priority}; ${item.source}${item.note ? `; ${item.note}` : ''}`);
    lines.push('');
  }
  try { await navigator.clipboard.writeText(lines.join('\n')); message(`Đã sao chép toàn bộ ${missing.length} mục chưa có.`); }
  catch (error) { message(`Không sao chép được: ${errorText(error)}. Có thể tải JSON bằng nút bên cạnh.`); }
};
$('download-missing', HTMLButtonElement).onclick = () => {
  download(new Blob([JSON.stringify({ version: 1, items: missing }, null, 2)], { type: 'application/json' }), 'planned-missing.json');
  message(`Đã yêu cầu tải toàn bộ ${missing.length} mục chưa có.`);
};
addEventListener('hashchange', renderTabs);
renderTabs();
if (!document.hidden) animationFrame = requestAnimationFrame(tick);
