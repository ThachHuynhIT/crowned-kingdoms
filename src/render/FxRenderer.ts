import type Phaser from 'phaser';
import { INTERVENTION } from '../data/battle';
import { PALETTE } from '../data/palette';
import type { BattleEvent } from '../game/battle/types';
import type { BattleWorld } from '../game/battle/world';
import { ISO_SPRITE_SCALE, iso } from './isoView';
import { SPRITES_KEY, fxFrame } from './atlas';
import { arrowDir } from './fxArt';

/** Projectiles fly this many px above the ground point they track. */
const FLIGHT_H = 6;
/** The royal boulder starts this many px above its landing point. */
const BOULDER_DROP_H = 96;
/** Ground shadows sit above plots (depth 1–2) and under every y-sorted sprite. */
const SHADOW_DEPTH = 3;
const SPARK_MS = 160;
const RING_MS = 320;
const BUBBLE_MS = 600;
const RING_DEPTH = 99_500;

interface Ring {
  x: number;
  y: number;
  start: number;
  /** Final radius (px) and colour; the royal boulder ring is cream and `INTERVENTION.radius` wide. */
  radius: number;
  color: number;
}

/**
 * Battle effects: projectiles from the world's pool (one pre-drawn arrow per direction,
 * never rotated), a spark on each `hit`, the falling royal boulder with its shadow and an
 * impact ring. The caller passes the events it drained from the world this frame.
 * The `boulder drop` event is intentionally unused: the falling boulder is drawn from
 * `world.boulders` (dropTick/impactTick), which also follows pause and game speed.
 */
export class FxRenderer {
  private readonly scene: Phaser.Scene;
  private readonly projectiles: Phaser.GameObjects.Image[] = [];
  private readonly boulders: Phaser.GameObjects.Image[] = [];
  private readonly shadows: Phaser.GameObjects.Image[] = [];
  private readonly sparks: Phaser.GameObjects.Image[] = [];
  /** Pulse bursts and shield bubbles, pooled separately from the hit sparks. */
  private readonly bursts: Phaser.GameObjects.Image[] = [];
  private readonly rings: Ring[] = [];
  private readonly ringGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ringGfx = scene.add.graphics().setDepth(RING_DEPTH);
  }

  sync(world: BattleWorld, events: readonly BattleEvent[], alpha: number): void {
    const a = Math.min(1, Math.max(0, alpha));
    const now = this.scene.time.now;
    for (const e of events) {
      if (e.type === 'hit') this.spark(world, e.id);
      else if (e.type === 'boulder' && e.phase === 'impact')
        this.rings.push({ x: e.x, y: e.y, start: now, radius: INTERVENTION.radius, color: PALETTE.cream });
      else if (e.type === 'pulse' || e.type === 'revive') this.pulse(world, e.id, now);
      else if (e.type === 'shield') this.bubble(world, e.id);
    }
    this.syncProjectiles(world, a);
    this.syncBoulders(world, a);
    this.drawRings(now);
  }

  destroy(): void {
    for (const list of [this.projectiles, this.boulders, this.shadows, this.sparks, this.bursts]) {
      for (const img of list) {
        this.scene.tweens.killTweensOf(img);
        img.destroy();
      }
      list.length = 0;
    }
    this.rings.length = 0;
    this.ringGfx.destroy();
  }

  /**
   * Each live projectile, drawn a fraction of one step behind its current point so motion
   * between ticks stays smooth (the pool compacts, so there is no per-projectile history).
   */
  private syncProjectiles(world: BattleWorld, a: number): void {
    const p = world.projectiles;
    const n = world.projectileCount;
    let used = 0;
    for (let k = 0; k < n; k++) {
      if (p.alive[k] === 0) continue;
      const t = p.targetId[k]!;
      const dx = world.x[t]! - p.px[k]!;
      const dy = world.y[t]! - p.py[k]!;
      const d = Math.sqrt(dx * dx + dy * dy);
      // Step back at most one tick of motion and never behind the shooter.
      const src = p.sourceId[k]!;
      const sx = p.px[k]! - world.x[src]!;
      const sy = p.py[k]! - world.y[src]!;
      const travelled = Math.sqrt(sx * sx + sy * sy);
      const backDist = Math.min(p.speed[k]! * (1 - a), travelled);
      const back = d > 0 ? backDist / d : 0;
      const at = iso({ x: p.px[k]! - dx * back, y: p.py[k]! - dy * back });
      // The arrow frame follows the flight on screen (projected direction), never a rotated sprite.
      const img = this.image(this.projectiles, used, fxFrame(`arrow_${arrowDir(dy - dx, (dx + dy) / 2)}`));
      img.setPosition(Math.round(at.x), Math.round(at.y - FLIGHT_H)).setDepth(at.y);
      used += 1;
    }
    for (let i = used; i < this.projectiles.length; i++) this.projectiles[i]!.setVisible(false);
  }

  /** Boulders still falling: the shadow grows on the ground, the rock drops over delayTicks. */
  private syncBoulders(world: BattleWorld, a: number): void {
    const list = world.boulders;
    for (let i = 0; i < list.length; i++) {
      const b = list[i]!;
      const span = Math.max(1, b.impactTick - b.dropTick);
      const t = Math.min(1, Math.max(0, (world.tick + a - b.dropTick) / span));
      const at = iso(b);
      const shadow = this.image(this.shadows, i, fxFrame('boulder_shadow'));
      shadow
        .setPosition(at.x, at.y)
        .setDepth(SHADOW_DEPTH)
        .setScale((0.5 + t * 0.5) * ISO_SPRITE_SCALE);
      const rock = this.image(this.boulders, i, fxFrame('boulder'));
      // Accelerating fall: height × (1 − t²), straight down on screen.
      rock
        .setScale(ISO_SPRITE_SCALE)
        .setPosition(at.x, Math.round(at.y + 4 - BOULDER_DROP_H * (1 - t * t)))
        .setDepth(at.y + 4);
    }
    for (let i = list.length; i < this.boulders.length; i++) {
      this.boulders[i]!.setVisible(false);
      this.shadows[i]!.setVisible(false);
    }
  }

  private spark(world: BattleWorld, id: number): void {
    if (id < 0 || id >= world.count) return;
    let img: Phaser.GameObjects.Image | undefined;
    for (const s of this.sparks)
      if (!s.visible) {
        img = s;
        break;
      }
    if (img === undefined) {
      img = this.scene.add.image(0, 0, SPRITES_KEY, fxFrame('spark'));
      this.sparks.push(img);
    }
    const r = world.radius[id]!;
    const { x, y } = iso({ x: world.x[id]!, y: world.y[id]! });
    const s = img;
    this.scene.tweens.killTweensOf(s);
    s.setPosition(Math.round(x), Math.round(y - r))
      .setDepth(y + r + 1)
      .setAlpha(1)
      .setVisible(true);
    this.scene.tweens.add({
      targets: s,
      alpha: 0,
      y: s.y - 3,
      duration: SPARK_MS,
      onComplete: () => s.setVisible(false),
    });
  }

  /** A structure's pulse: a gold burst on it and a ring growing to the pulse radius. */
  private pulse(world: BattleWorld, id: number, now: number): void {
    if (id < 0 || id >= world.count) return;
    const { x, y } = iso({ x: world.x[id]!, y: world.y[id]! });
    this.rings.push({ x, y, start: now, radius: world.pulseRadius[id]!, color: PALETTE.gold });
    this.burst('pulse', x, y - 8, y + 20, 1, 260);
  }

  /** A shield bubble flashing over the unit that just received one. */
  private bubble(world: BattleWorld, id: number): void {
    if (id < 0 || id >= world.count) return;
    const r = world.radius[id]!;
    const at = iso({ x: world.x[id]!, y: world.y[id]! });
    this.burst('shield', at.x, at.y - r, at.y + r + 1, 0.9, BUBBLE_MS);
  }

  /** Fade-out of one pooled fx frame at (x, y) with the given depth. */
  private burst(frame: string, x: number, y: number, depth: number, alpha: number, ms: number): void {
    let img = this.bursts.find((b) => !b.visible && b.frame.name === fxFrame(frame));
    if (img === undefined) {
      img = this.scene.add.image(0, 0, SPRITES_KEY, fxFrame(frame));
      this.bursts.push(img);
    }
    const b = img;
    this.scene.tweens.killTweensOf(b);
    b.setPosition(Math.round(x), Math.round(y)).setDepth(depth).setAlpha(alpha).setVisible(true);
    this.scene.tweens.add({ targets: b, alpha: 0, duration: ms, onComplete: () => b.setVisible(false) });
  }

  private drawRings(now: number): void {
    const g = this.ringGfx;
    g.clear();
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i]!;
      const t = (now - ring.start) / RING_MS;
      if (t >= 1) {
        this.rings.splice(i, 1);
        continue;
      }
      g.lineStyle(2, ring.color, 1 - t);
      // A world circle on the isometric ground: an ellipse r·√2 wide, r/√2 tall (radius in world px).
      const r = 4 + (ring.radius - 4) * t;
      g.strokeEllipse(ring.x, ring.y, 2 * r * Math.SQRT2, (2 * r) / Math.SQRT2);
    }
  }

  /** Pooled image `i` of `list`, created on first use, shown with `frame`. */
  private image(
    list: Phaser.GameObjects.Image[],
    i: number,
    frame: string,
  ): Phaser.GameObjects.Image {
    let img = list[i];
    if (img === undefined) {
      img = this.scene.add.image(0, 0, SPRITES_KEY, frame);
      list.push(img);
    } else if (img.frame.name !== frame) {
      img.setFrame(frame);
    }
    return img.setVisible(true);
  }
}
