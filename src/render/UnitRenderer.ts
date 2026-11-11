import Phaser from 'phaser';
import { HIT_FLASH_FRAMES } from '../data/juice';
import type { BattleEvent } from '../game/battle/types';
import { UI_PALETTE } from '../data/uiPalette';
import type { CardId } from '../data/types';
import { KIND_UNIT, TEAM_ALLY, type BattleWorld } from '../game/battle/world';
import { BUILDING_FOOT_DY } from './BoardRenderer';
import { ISO_SPRITE_SCALE, iso } from './isoView';
import { SPRITES_KEY, fxFrame, imageFrameScale, pickBuildingFrame, unitFrame } from './atlas';
import { plotAtWorld } from './endlessBoardModel';
import type { RunMode } from '../data/rules';
import type { UnitAnim } from './unitArt';

/** Frames per second of each unit animation (spec §11.3: 6–8 idle/walk, 10–12 attack). */
const ANIM_FPS: Readonly<Record<UnitAnim, number>> = { idle: 6, walk: 8, attack: 11 };
/** A unit shows its attack frames for this many ticks after striking. */
const ATTACK_SHOW_TICKS = 2;
/** HP bars draw above every world sprite. */
const BAR_DEPTH = 99_000;
const BAR_H = 2;
const DEATH_MS = 180;

interface Slot {
  sprite: Phaser.GameObjects.Image;
  frame: string;
  facingLeft: boolean;
  dead: boolean;
  flashFrames: number;
  /** Has lost HP at least once this battle: buildings and the throne show their bar only from then on (owner 2026-11-10). */
  wounded: boolean;
  tint: { colors: [number, number, number, number]; mode: number } | null;
}

/**
 * Every battle entity (units and structures, the throne included) as one sprite of the
 * `sprites` atlas, anchored at its feet and depth-sorted by foot y. Positions are
 * interpolated between ticks; sprites never rotate, only flip horizontally.
 */
export class UnitRenderer {
  private readonly scene: Phaser.Scene;
  private readonly slots: (Slot | null)[] = [];
  private readonly bars: Phaser.GameObjects.Graphics;
  /** Stars over stunned units, pooled and reused each frame. */
  private readonly stars: Phaser.GameObjects.Image[] = [];
  private starsUsed = 0;
  private readonly frameOk = new Map<string, boolean>();
  private readonly warned = new Set<string>();
  private world: BattleWorld | null = null;
  /** Level of the building on each plot (and the throne's), so structures show their L2/L3 architecture. */
  private levels: ReadonlyMap<number, number> = new Map();
  private mode: RunMode = 'normal';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bars = scene.add.graphics().setDepth(BAR_DEPTH);
  }

  /** Building levels by plot for the coming battle (render only). */
  setStructureLevels(levels: ReadonlyMap<number, number>, mode: RunMode): void {
    this.levels = levels;
    this.mode = mode;
  }

  /** Draw `world` at `alpha` (0..1) of the way from the previous tick to the current one. */
  sync(world: BattleWorld, alpha: number, events: readonly BattleEvent[] = []): void {
    if (world !== this.world) {
      this.clearSlots();
      this.world = world;
    }
    const a = Math.min(1, Math.max(0, alpha));
    const now = this.scene.time.now;
    const hits = new Set<number>();
    for (const event of events) if (event.type === 'hit') hits.add(event.id);
    this.bars.clear();
    this.starsUsed = 0;
    for (let id = 0; id < world.count; id++) {
      const known = this.slots[id];
      // Never create a sprite for an entity already dead on first sight (no flash).
      if (known === undefined && world.alive[id] === 0) continue;
      const slot = known === undefined ? this.create(world, id) : known;
      if (slot === null) continue;
      if (hits.has(id)) this.syncFlash(slot, true);
      if (slot.dead) continue;
      if (world.alive[id] === 0) {
        this.kill(slot);
        continue;
      }
      const x = world.prevX[id]! + (world.x[id]! - world.prevX[id]!) * a;
      const y = world.prevY[id]! + (world.y[id]! - world.prevY[id]!) * a;
      const isUnit = world.kind[id] === KIND_UNIT;
      // Isometric (spec 2026-11-06): stand on the projected point; depth = projected foot y.
      const p = iso({ x, y });
      const foot = isUnit ? p.y + world.radius[id]! : p.y + BUILDING_FOOT_DY;
      const sprite = slot.sprite;
      sprite.setPosition(Math.round(p.x), Math.round(foot)).setDepth(foot);
      if (isUnit) this.animate(world, id, slot, now);
      if (world.hp[id]! < world.maxHp[id]!) slot.wounded = true;
      if (isUnit || slot.wounded) this.drawBar(world, id, sprite, isUnit);
      if (isUnit && world.stunTicks[id]! > 0) this.showStun(sprite);
    }
    for (let i = this.starsUsed; i < this.stars.length; i++) this.stars[i]!.setVisible(false);
  }

  destroy(): void {
    this.clearSlots();
    this.bars.destroy();
    for (const s of this.stars) s.destroy();
    this.stars.length = 0;
    this.world = null;
  }

  /** A structure's frame: its L2/L3 architecture by the level of the building on its plot, else the base. */
  private structureFrame(world: BattleWorld, id: number, cardId: CardId): string {
    const plot = plotAtWorld(world.x[id]!, world.y[id]!, this.mode);
    const level = plot === null ? 1 : (this.levels.get(plot) ?? 1);
    return pickBuildingFrame(cardId, level, (f) => this.hasFrame(f));
  }

  /** Keep render-frame flashes advancing even after the final simulation tick. */
  updateFlashes(): void {
    for (const slot of this.slots) {
      if (slot) this.syncFlash(slot, false);
    }
  }

  private create(world: BattleWorld, id: number): Slot | null {
    const label = world.label[id] ?? '';
    const frame =
      world.kind[id] === KIND_UNIT
        ? unitFrame(label, world.team[id] === TEAM_ALLY ? 'ally' : 'foe', 'idle', 0)
        : this.structureFrame(world, id, label as CardId);
    if (label === '' || !this.hasFrame(frame)) {
      this.slots[id] = null;
      return null;
    }
    const at = iso({ x: world.x[id]!, y: world.y[id]! });
    const sprite = this.scene.add.image(at.x, at.y, SPRITES_KEY, frame);
    sprite.setOrigin(0.5, 1).setScale(imageFrameScale(frame) * ISO_SPRITE_SCALE);
    const slot: Slot = {
      sprite,
      frame,
      facingLeft: world.team[id] !== TEAM_ALLY,
      dead: false,
      wounded: false,
      flashFrames: 0,
      tint: null,
    };
    sprite.setFlipX(slot.facingLeft);
    this.slots[id] = slot;
    return slot;
  }

  private animate(world: BattleWorld, id: number, slot: Slot, now: number): void {
    const dx = world.x[id]! - world.prevX[id]!;
    const dy = world.y[id]! - world.prevY[id]!;
    const interval = world.interval[id]!;
    const attacking = interval > 0 && interval - world.cooldown[id]! < ATTACK_SHOW_TICKS;
    const anim: UnitAnim = attacking ? 'attack' : dx !== 0 || dy !== 0 ? 'walk' : 'idle';
    const n = Math.floor((now / 1000) * ANIM_FPS[anim]) % 2;
    const team = world.team[id] === TEAM_ALLY ? 'ally' : 'foe';
    const frame = unitFrame(world.label[id]!, team, anim, n);
    if (frame !== slot.frame && this.hasFrame(frame)) {
      slot.sprite.setFrame(frame).setScale(imageFrameScale(frame) * ISO_SPRITE_SCALE);
      slot.frame = frame;
    }
    // Face the way we move on screen (projected x = y − x); standing still, face the target.
    let face = dy - dx;
    const t = world.target[id]!;
    if (face === 0 && t >= 0 && world.alive[t] === 1) face = world.y[t]! - world.x[t]! - (world.y[id]! - world.x[id]!);
    if (face !== 0 && face < 0 !== slot.facingLeft) {
      slot.facingLeft = face < 0;
      slot.sprite.setFlipX(slot.facingLeft);
    }
  }

  private syncFlash(slot: Slot, hit: boolean): void {
    const s = slot.sprite;
    if (hit) {
      slot.tint ??= {
        colors: [s.tintTopLeft, s.tintTopRight, s.tintBottomLeft, s.tintBottomRight],
        mode: s.tintMode,
      };
      slot.flashFrames = HIT_FLASH_FRAMES;
    }
    if (slot.flashFrames > 0) {
      s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      slot.flashFrames -= 1;
    } else if (slot.tint) {
      s.setTint(...slot.tint.colors).setTintMode(slot.tint.mode);
      slot.tint = null;
    }
  }

  private drawBar(
    world: BattleWorld,
    id: number,
    sprite: Phaser.GameObjects.Image,
    isUnit: boolean,
  ): void {
    const hp = world.hp[id]!;
    const max = world.maxHp[id]!;
    const shield = world.shield[id]!;
    if (max <= 0 || (isUnit && hp >= max && shield <= 0)) return;
    const w = isUnit ? Math.max(8, sprite.displayWidth - 4) : 24 * ISO_SPRITE_SCALE;
    const x = Math.round(sprite.x - w / 2);
    const y = Math.round(sprite.y - sprite.displayHeight - BAR_H - 2);
    const fill = Math.max(0, Math.min(1, hp / max));
    const g = this.bars;
    g.fillStyle(UI_PALETTE.outline, 1);
    g.fillRect(x - 1, y - 1, w + 2, BAR_H + 2);
    g.fillStyle(world.team[id] === TEAM_ALLY ? UI_PALETTE.good : UI_PALETTE.bad, 1);
    g.fillRect(x, y, Math.max(1, Math.round(w * fill)), BAR_H);
    if (shield > 0) {
      // A pale strip just above the HP bar: the shield as a share of max HP (full width at ≥ max).
      const sw = Math.max(1, Math.round(w * Math.min(1, shield / max)));
      g.fillStyle(UI_PALETTE.outline, 1);
      g.fillRect(x - 1, y - BAR_H - 2, sw + 2, BAR_H + 2);
      g.fillStyle(UI_PALETTE.creamLight, 1);
      g.fillRect(x, y - BAR_H - 1, sw, BAR_H);
    }
  }

  /** Stun stars floating over a unit's head. */
  private showStun(sprite: Phaser.GameObjects.Image): void {
    let star = this.stars[this.starsUsed];
    if (!star) {
      star = this.scene.add.image(0, 0, SPRITES_KEY, fxFrame('stun')).setOrigin(0.5, 1).setDepth(BAR_DEPTH);
      this.stars.push(star);
    }
    star.setPosition(sprite.x, Math.round(sprite.y - sprite.displayHeight - 2)).setVisible(true);
    this.starsUsed += 1;
  }

  /** Short pop: fade out and rise a few px, then hide. */
  private kill(slot: Slot): void {
    slot.dead = true;
    const s = slot.sprite;
    this.scene.tweens.add({
      targets: s,
      alpha: 0,
      y: s.y - 4,
      duration: DEATH_MS,
      onComplete: () => s.setVisible(false),
    });
  }

  private hasFrame(frame: string): boolean {
    let ok = this.frameOk.get(frame);
    if (ok === undefined) {
      ok = this.scene.textures.get(SPRITES_KEY).has(frame);
      this.frameOk.set(frame, ok);
    }
    if (!ok && !this.warned.has(frame)) {
      this.warned.add(frame);
      console.warn(`UnitRenderer: missing sprite frame "${frame}" in "${SPRITES_KEY}"`);
    }
    return ok;
  }

  private clearSlots(): void {
    for (const slot of this.slots) {
      if (slot === null || slot === undefined) continue;
      this.scene.tweens.killTweensOf(slot.sprite);
      slot.sprite.destroy();
    }
    this.slots.length = 0;
  }
}
