import {
  $, el, button, loadManifest, tabs, matches, frames, drawImage, safeSrc,
  message, groupOptions, sizeText, context2d, queryAll, requireAt,
} from './common';
import type { Item, Team, Animation } from './types';

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

const manifest = await loadManifest();
let category: Item[] = [], players: Player[] = [], detail: Detail | null = null;
const visible = new Set<Element>();
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
  }
});

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
  const list = category.filter((item) => (!group || item.group === group) && matches(item, $('search', HTMLInputElement).value));
  $('cards', HTMLElement).replaceChildren();
  for (const item of list) {
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
  message(manifest.error || (manifest.sample ? 'Manifest mẫu rỗng. Thay manifest.json bằng dữ liệu thật để xem asset.' : `${list.length} asset`));
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

tabs($('tabs', HTMLElement), manifest, (items) => {
  category = items; groupOptions($('group', HTMLSelectElement), items); render();
});
if (!document.hidden) animationFrame = requestAnimationFrame(tick);
