import { ISO_SPRITE_SCALE } from '../../../src/render/isoView';
import { arrowDir, ARROW_DIRS } from '../../../src/render/fxArt';
import { CODE_FX } from '../../../src/render/codeFx';
import type { CodeFxDef } from '../../../src/render/codeFx';
import type { PixelCanvas } from '../../../src/render/pixel';
import { $, el, button, context2d, requireAt, loadManifest } from './common';

interface Player {
  card: HTMLElement;
  def: CodeFxDef;
  frames: HTMLCanvasElement[];
  glows: HTMLCanvasElement[];
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  toggle: HTMLButtonElement;
  strip: HTMLButtonElement[];
  readout: HTMLElement;
  frame: number;
  elapsed: number;
  playing: boolean;
}

const zoom = $('zoom', HTMLInputElement), background = $('background', HTMLSelectElement);
const speed = $('speed', HTMLSelectElement), repeat = $('repeat', HTMLSelectElement);
const glow = $('glow', HTMLInputElement), selected = $('selected', HTMLSelectElement);
const field = $('field', HTMLCanvasElement);
const search = $('search', HTMLInputElement);
const manifest = await loadManifest();
const militia = manifest.items.find((item) => item.src === '/public/assets/art/ai-v1/militia_0.png');
const pixelScale = manifest.pixelScale;
const soldier = new Image();
let soldierReady = false;
soldier.onload = () => { soldierReady = true; $('image-status', HTMLElement).textContent = ''; redraw(); };
soldier.onerror = () => { $('image-status', HTMLElement).textContent = 'Không tải được lính mẫu militia_0.png.'; };

function bitmap(pixels: PixelCanvas): HTMLCanvasElement {
  const canvas = el('canvas'); canvas.width = pixels.width; canvas.height = pixels.height;
  context2d(canvas).putImageData(new ImageData(pixels.data, pixels.width, pixels.height), 0, 0);
  return canvas;
}

const directionLabels = ['Đông', 'Đông Bắc', 'Bắc', 'Tây Bắc', 'Tây', 'Tây Nam', 'Nam', 'Đông Nam'];
const groups = new Map<string, HTMLElement>();
for (const kind of ['effect', 'projectile']) {
  const section = el('section');
  section.append(el('h2', kind === 'effect' ? 'Hiệu ứng' : 'Đạn'));
  $('effects', HTMLElement).append(section);
  if (kind === 'effect') {
    for (const name of new Set(CODE_FX.filter((def) => def.kind === 'effect').map((def) => def.group ?? 'Đặc biệt'))) {
      const subgroup = el('section'), children = el('div', undefined, 'cards fx-cards');
      subgroup.append(el('h3', name), children); section.append(subgroup); groups.set(name, children);
    }
  } else {
    const cards = el('div', undefined, 'cards fx-cards');
    section.append(cards); groups.set(kind, cards);
  }
}
let flightTime = 0;
const players: Player[] = CODE_FX.map((def) => {
  const card = el('article', undefined, 'card'), stage = el('div', undefined, 'stage fx-stage');
  card.id = def.id;
  const canvas = el('canvas'); canvas.setAttribute('aria-label', def.label); stage.append(canvas);
  const frames = Array.from({ length: def.frames }, (_, i) => bitmap(def.paint(i)));
  const paintGlow = def.paintGlow;
  const glows = paintGlow ? Array.from({ length: def.frames }, (_, i) => bitmap(paintGlow(i))) : [];
  const readout = el('p', undefined, 'muted');
  const toggle = button('Dừng', () => {
    if (!player.playing && player.frame === def.frames - 1) { player.frame = 0; player.elapsed = 0; }
    player.playing = !player.playing; redraw();
  });
  const player: Player = { card, def, frames, glows, canvas, stage, toggle, strip: [], readout, frame: 0, elapsed: 0, playing: true };
  const controls = el('div', undefined, 'unit-controls');
  controls.append(toggle, button('Thử trên sân', () => { selected.value = def.id; redraw(); }));
  const strip = el('div', undefined, 'fx-strip'); strip.setAttribute('aria-label', `Dải khung ${def.label}`);
  player.strip = frames.map((frame, i) => {
    const thumb = button('', () => { player.frame = i; player.elapsed = 0; player.playing = false; selected.value = def.id; redraw(); });
    thumb.setAttribute('aria-label', `Dừng ở khung ${i + 1}`);
    const image = el('canvas'); image.width = frame.width * 2; image.height = frame.height * 2;
    const ctx = context2d(image); ctx.imageSmoothingEnabled = false; ctx.drawImage(frame, 0, 0, image.width, image.height);
    thumb.append(image, el('small', def.directional ? requireAt(directionLabels, i) : `${i + 1} · ${requireAt(def.frameMs, i)} ms`)); strip.append(thumb); return thumb;
  });
  card.append(el('h3', def.label), el('code', def.id),
    el('p', `${def.size.w}×${def.size.h} px · ${def.frames} khung · ${def.frameMs.reduce((a, b) => a + b, 0)} ms · ${def.loop ? 'Vòng lặp' : 'Một lượt'}`),
    el('p', def.note), stage, controls, readout, strip);
  groups.get(def.kind === 'effect' ? def.group ?? 'Đặc biệt' : def.kind)?.append(card);
  const option = el('option', def.label); option.value = def.id; selected.append(option);
  return player;
});

function filterCards(): void {
  const query = search.value.trim().toLocaleLowerCase('vi');
  for (const player of players) {
    player.card.hidden = !`${player.def.id} ${player.def.label}`.toLocaleLowerCase('vi').includes(query);
  }
  for (const cards of groups.values()) {
    const section = cards.parentElement;
    if (section) section.hidden = !Array.from(cards.children).some((child) => child instanceof HTMLElement && !child.hidden);
  }
}
search.addEventListener('input', filterCards);

function drawEffect(ctx: CanvasRenderingContext2D, player: Player, x: number, y: number, scale: number, index = player.frame): void {
  ctx.imageSmoothingEnabled = false;
  const frame = requireAt(player.frames, index);
  ctx.drawImage(frame, Math.round(x), Math.round(y), frame.width * scale, frame.height * scale);
  const halo = player.glows[index];
  if (glow.checked && halo) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(halo, Math.round(x), Math.round(y), halo.width * scale, halo.height * scale); ctx.restore();
  }
}

function redraw(): void {
  const scale = Number(zoom.value);
  $('zoom-label', HTMLOutputElement).value = `${scale}×`;
  for (const player of players) {
    player.stage.className = `stage fx-stage ${background.value === 'grass' ? 'fx-grass' : background.value}`;
    player.canvas.width = player.def.size.w * scale + 16; player.canvas.height = player.def.size.h * scale + 16;
    drawEffect(context2d(player.canvas), player, 8, 8, scale);
    player.toggle.textContent = player.playing ? 'Dừng' : 'Phát';
    player.readout.textContent = player.def.directional
      ? `Hướng ${requireAt(directionLabels, player.frame)}`
      : `Khung ${player.frame + 1}/${player.def.frames} · ${requireAt(player.def.frameMs, player.frame)} ms`;
    player.strip.forEach((thumb, i) => { thumb.classList.toggle('active', i === player.frame); thumb.setAttribute('aria-pressed', String(i === player.frame)); });
  }
  const player = players.find((entry) => entry.def.id === selected.value) ?? requireAt(players, 0);
  const worldZoom = scale;
  field.width = 200 * worldZoom; field.height = 100 * worldZoom;
  const ctx = context2d(field); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#5d9b3a'; ctx.fillRect(0, 0, field.width, field.height);
  // Match FxRenderer: dense PNG pixels divide by pixelScale before the shared ISO scale.
  const feetX = player.def.kind === 'projectile' ? 35 * worldZoom : field.width / 2;
  const soldierWorldH = soldier.naturalHeight / pixelScale;
  const feetY = field.height / 2 + soldierWorldH * ISO_SPRITE_SCALE * worldZoom / 2;
  const soldierW = soldier.naturalWidth / pixelScale * ISO_SPRITE_SCALE * worldZoom;
  const soldierH = soldier.naturalHeight / pixelScale * ISO_SPRITE_SCALE * worldZoom;
  if (soldierReady) ctx.drawImage(soldier, Math.round(feetX - soldierW / 2), Math.round(feetY - soldierH), soldierW, soldierH);
  const effectScale = ISO_SPRITE_SCALE * worldZoom;
  const w = player.def.size.w * effectScale, h = player.def.size.h * effectScale;
  const y = player.def.anchor === 'feet' ? feetY - h : feetY - soldierH / 2 - h / 2;
  if (player.def.kind === 'projectile') {
    const progress = (flightTime % 2400) / 1200, outward = progress < 1;
    const distance = (outward ? progress : 2 - progress) * 120 * worldZoom;
    const index = player.def.directional ? ARROW_DIRS.indexOf(arrowDir(outward ? 1 : -1, 0)) : player.frame;
    ctx.fillStyle = '#e8c68a'; ctx.fillRect(feetX + 120 * worldZoom, feetY - soldierH / 2, worldZoom * 2, worldZoom * 2);
    drawEffect(ctx, player, feetX + distance - w / 2, y, effectScale, index);
  } else drawEffect(ctx, player, feetX - w / 2, y, effectScale);
  $('field-note', HTMLElement).textContent = `${player.def.label} · neo ${player.def.anchor === 'feet' ? 'chân' : 'giữa'} · world ${worldZoom}× · FX ${ISO_SPRITE_SCALE}× · pixelScale ${pixelScale}${militia ? '' : ' · ảnh mẫu dùng đường dẫn cố định'}`;
}

function restart(): void {
  flightTime = 0;
  for (const player of players) { player.frame = 0; player.elapsed = 0; player.playing = true; }
  redraw();
}
for (const control of [zoom, background, speed, glow, selected]) control.addEventListener('input', redraw);
repeat.addEventListener('change', restart);
$('restart', HTMLButtonElement).onclick = restart;

let raf = 0, previous: number | undefined;
function tick(now: number): void {
  const delta = previous === undefined ? 0 : now - previous; previous = now;
  const active = players.find((entry) => entry.def.id === selected.value);
  if (active?.playing) flightTime += delta * Number(speed.value);
  let changed = active?.def.kind === 'projectile' && active.playing;
  for (const player of players) {
    if (!player.playing) continue;
    player.elapsed += delta * Number(speed.value);
    while (player.elapsed >= requireAt(player.def.frameMs, player.frame)) {
      changed = true;
      player.elapsed -= requireAt(player.def.frameMs, player.frame);
      if (player.frame + 1 < player.def.frames) player.frame++;
      else if (player.def.loop || repeat.value === 'repeat') player.frame = 0;
      else { player.playing = false; player.elapsed = 0; break; }
    }
  }
  if (changed) redraw();
  raf = requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(raf); previous = undefined;
  if (!document.hidden) raf = requestAnimationFrame(tick);
});
$('status', HTMLElement).textContent = manifest.error ? `Dữ liệu ảnh: ${manifest.error}` : 'Bấm một khung để dừng và thử hiệu ứng trên sân.';
function selectLinked(): void {
  const linked = players.find((entry) => entry.def.id === location.hash.slice(1));
  if (linked) { selected.value = linked.def.id; redraw(); }
}
addEventListener('hashchange', selectLinked);
selectLinked();
redraw();
soldier.src = '/public/assets/art/ai-v1/militia_0.png';
if (!document.hidden) raf = requestAnimationFrame(tick);
