import { $, el, button, loadManifest, tabs, matches, frames, drawImage, safeSrc, message, groupOptions, sizeText } from './common.js';
const manifest = await loadManifest();
let category = [], players = [], detail = null;
const visible = new Set();
const observer = new IntersectionObserver((entries) => { for (const entry of entries) { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); } });
function showDetail(item) {
  const pane = $('detail'); pane.replaceChildren(el('h2', item.label));
  const stage = el('div', undefined, `stage ${$('background').value}`), canvas = el('canvas');
  canvas.width = item.w; canvas.height = item.h;
  canvas.style.width = `${item.w * 3}px`; canvas.style.height = `${item.h * 3}px`;
  stage.append(canvas); pane.append(stage, el('code', item.id), el('p', sizeText(item)), el('code', item.src));
  pane.append(button('Sao chép đường dẫn', async () => {
    try { await navigator.clipboard.writeText(item.src); message('Đã sao chép đường dẫn.'); } catch { message('Không truy cập được clipboard. Hãy chọn và sao chép đường dẫn hiển thị.'); }
  }));
  const a = el('a', 'Mở ảnh gốc ↗'); a.href = safeSrc(item.src); a.target = '_blank'; a.rel = 'noopener'; pane.append(a);
  detail = { item, canvas };
}
function render() {
  observer.disconnect(); visible.clear(); players = [];
  const list = category.filter((item) => (!$('group').value || item.group === $('group').value) && matches(item, $('search').value));
  $('cards').replaceChildren();
  for (const item of list) {
    const card = el('article', undefined, 'card'), stage = el('div', undefined, `stage ${$('background').value}`), canvas = el('canvas');
    const unit = item.kind === 'unit'; canvas.width = unit ? Math.max(item.w, 112) : item.w; canvas.height = unit ? Math.max(item.h + 16, 50) : item.h;
    canvas.style.width = `${canvas.width * Number($('zoom').value)}px`; canvas.style.height = `${canvas.height * Number($('zoom').value)}px`;
    stage.append(canvas); card.append(stage, el('h3', item.label), el('code', item.id), el('small', sizeText(item)), el('p', item.tags.join(' · '), 'muted'));
    card.tabIndex = 0; card.setAttribute('aria-label', `Chi tiết ${item.label}`);
    card.onclick = () => showDetail(item); card.onkeydown = (event) => { if (event.target === card && event.key === 'Enter') showDetail(item); };
    const player = { item, card, canvas, team: 'ally', anim: 'idle', fps: 6, paused: false, flip: false, patrol: false, elapsed: 0 };
    if (unit) {
      const controls = el('div', undefined, 'unit-controls'); controls.onclick = (event) => event.stopPropagation();
      const actions = [];
      function action(label, fn, restart = false) { const b = button(label, () => { fn(); if (restart) player.elapsed = 0; sync(); }); actions.push(b); controls.append(b); return b; }
      const ally = action('Ta', () => { player.team = 'ally'; }), foe = action('Địch', () => { player.team = 'foe'; });
      const animButtons = new Map();
      for (const [label, anim] of [['Đứng', 'idle'], ['Đi', 'walk'], ['Đánh', 'attack']]) animButtons.set(anim, action(label, () => { player.anim = anim; player.fps = anim === 'attack' ? 10 : 6; speed.value = player.fps; player.paused = false; player.patrol = false; }, true));
      action('Dừng', () => { player.paused = true; });
      const flip = action('Lật ngang', () => { player.flip = !player.flip; });
      const patrol = action('Đi qua lại', () => { player.anim = 'walk'; player.patrol = true; player.paused = false; player.fps = 6; speed.value = 6; }, true);
      action('Đánh liên tục', () => { player.anim = 'attack'; player.patrol = false; player.paused = false; player.fps = 10; speed.value = 10; }, true);
      const speed = el('input'); speed.type = 'range'; speed.min = 1; speed.max = 24; speed.value = 6; speed.setAttribute('aria-label', 'Tốc độ animation'); speed.oninput = () => { player.fps = Number(speed.value); };
      controls.append(el('span', 'FPS'), speed); player.info = el('small'); controls.append(player.info); card.append(controls);
      function sync() { ally.classList.toggle('active', player.team === 'ally'); foe.classList.toggle('active', player.team === 'foe'); flip.classList.toggle('active', player.flip); patrol.classList.toggle('active', player.patrol); for (const [anim, b] of animButtons) b.classList.toggle('active', anim === player.anim && !player.paused); }
      sync();
    }
    players.push(player); $('cards').append(card); observer.observe(card);
  }
  message(manifest.error || (manifest.sample ? 'Manifest mẫu rỗng. Thay manifest.json bằng dữ liệu thật để xem asset.' : `${list.length} asset`));
}
let last = performance.now(), animationFrame = 0;
// Không cộng thời gian tab ẩn vào animation khi quay lại.
addEventListener('visibilitychange', () => {
  cancelAnimationFrame(animationFrame);
  if (!document.hidden) { last = performance.now(); animationFrame = requestAnimationFrame(tick); }
});
function tick(now) {
  const dt = Math.min(now - last, 100); last = now;
  if (!document.hidden) {
    for (const p of players) {
      if (!visible.has(p.card)) continue;
      if (!p.paused) p.elapsed += dt;
      const ctx = p.canvas.getContext('2d'), list = frames(p.item, p.team, p.anim), index = Math.floor(p.elapsed * p.fps / 1000) % list.length;
      ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
      let x = (p.canvas.width - p.item.w) / 2, flip = p.flip;
      if (p.patrol) { const span = Math.max(1, p.canvas.width - p.item.w), phase = (p.elapsed * .04) % (2 * span); x = phase <= span ? phase : 2 * span - phase; flip = (phase > span) !== p.flip; ctx.strokeStyle = '#bbb'; ctx.beginPath(); ctx.moveTo(0, p.canvas.height - 8); ctx.lineTo(p.canvas.width, p.canvas.height - 8); ctx.stroke(); }
      const y = p.canvas.height - p.item.h - (p.item.kind === 'unit' ? 8 : 0);
      drawImage(ctx, list[index], Math.round(x), y, p.item.w, p.item.h, flip);
      if ($('guides').checked) { ctx.strokeStyle = '#ffbb6699'; ctx.beginPath(); for (let gx = 0; gx < p.canvas.width; gx += 64) { ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, p.canvas.height); } for (let gy = 0; gy < p.canvas.height; gy += 64) { ctx.moveTo(0, gy + .5); ctx.lineTo(p.canvas.width, gy + .5); } ctx.stroke(); }
      if ($('border').checked) { ctx.strokeStyle = '#eaa647'; ctx.strokeRect(Math.round(x) + .5, y + .5, p.item.w - 1, p.item.h - 1); }
      if (p.info) p.info.textContent = `${String(list[index]).split('/').pop()} · ${p.fps} fps${p.paused ? ' · dừng' : ''}`;
    }
    if (detail) { const ctx = detail.canvas.getContext('2d'); ctx.clearRect(0, 0, detail.item.w, detail.item.h); drawImage(ctx, detail.item.src, 0, 0, detail.item.w, detail.item.h); }
  }
  if (!document.hidden) animationFrame = requestAnimationFrame(tick);
}
$('search').oninput = render;
$('group').onchange = render;
$('zoom').oninput = () => { $('zoomLabel').value = `${$('zoom').value}×`; for (const p of players) { p.canvas.style.width = `${p.canvas.width * Number($('zoom').value)}px`; p.canvas.style.height = `${p.canvas.height * Number($('zoom').value)}px`; } };
$('background').onchange = () => { for (const stage of document.querySelectorAll('.stage')) stage.className = `stage ${$('background').value}`; };
tabs($('tabs'), manifest, (items) => { category = items; groupOptions($('group'), items); render(); }); if (!document.hidden) animationFrame = requestAnimationFrame(tick);
