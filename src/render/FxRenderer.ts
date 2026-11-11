import type { CardId } from '../data/types';
import { KIND_UNIT, TEAM_FOE } from '../game/battle/world';
import { rageStacks } from '../game/battle/targeting';
import { BUILDING_FOOT_DY } from './BoardRenderer';
import { projectileVisualHeight } from './projectileModel';
import type Phaser from 'phaser';
import { PALETTE } from '../data/palette';
import { FLOAT_MS, FLOAT_POOL, FLOAT_RISE_PX } from '../data/juice';
import { FONT_UI } from '../ui/theme';
import { showsFloatingDamage } from './juiceModel';
import type { BattleEvent } from '../game/battle/types';
import type { BattleWorld } from '../game/battle/world';
import { ISO_SPRITE_SCALE, iso } from './isoView';
import { SPRITES_KEY, buildingFrame, fxFrame, imageFrameScale } from './atlas';
import { arrowDir } from './fxArt';
import { CODE_FX, type CodeFxDef } from './codeFx';
import { statusFxFor } from './fxCues';
import { CODE_FX_DIRS, codeFxFrame, codeFxFrameAt, projectileFxFor } from './projectileFx';

const FX_BY_ID: ReadonlyMap<string, CodeFxDef> = new Map(CODE_FX.map((d) => [d.id, d]));


/** The royal boulder starts this many px above its landing point. */
const BOULDER_DROP_H = 96;
/** Ground shadows sit above plots (depth 1–2) and under every y-sorted sprite. */
const SHADOW_DEPTH = 3;
/** At most this many one-shot code effects at once; extra ones in a crowded frame are skipped. */
const SHOT_POOL = 96;
/** At most this many Rage auras (one per enemy unit) are drawn. */
const AURA_POOL = 60;
/** Status loops and the Rage ring are drawn at half the effect scale, low at the feet (owner 11/11/2026). */
const STATUS_SCALE = 1;
/** At most this many status effects are drawn at once. */
const STATUS_POOL = 80;
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
  /** One-shot code effects (hit, death, collapse, blast…): colour image plus an additive glow image. */
  private readonly shots: { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; def: CodeFxDef; start: number }[] = [];
  /** Looping Rage auras under enemy units while the rage is on. */
  private readonly auras: Phaser.GameObjects.Image[] = [];
  /** Looping status effects (one per affected entity). */
  private readonly statuses: Phaser.GameObjects.Image[] = [];
  /** Pulse bursts and shield bubbles, pooled separately from the hit sparks. */
  private readonly bursts: Phaser.GameObjects.Image[] = [];
  private readonly rings: Ring[] = [];
  private readonly damageTexts: {
    text: Phaser.GameObjects.Text;
    start: number;
    y: number;
  }[] = [];
  private readonly ringGfx: Phaser.GameObjects.Graphics;

  /**
   * @param fullEffects graphics setting (owner 11/11/2026): false skips the decorative hit sparks, the additive glow
   *   layer and the Rage auras; projectiles, boulders, statuses, rings and floating damage always show.
   */
  constructor(
    scene: Phaser.Scene,
    private readonly fullEffects: () => boolean = () => true,
  ) {
    this.scene = scene;
    this.ringGfx = scene.add.graphics().setDepth(RING_DEPTH);
    // Pre-create the Rage and status pools: making ~40 images in the frame the rage starts made that frame stutter
    // (owner 11/11/2026).
    const aura = FX_BY_ID.get('rageAura');
    if (aura) for (let i = 0; i < AURA_POOL; i++) this.image(this.auras, i, codeFxFrame(aura.id, 0)).setVisible(false);
    const burn = FX_BY_ID.get('fx_burn');
    if (burn) for (let i = 0; i < STATUS_POOL; i++) this.image(this.statuses, i, codeFxFrame(burn.id, 0)).setVisible(false);
  }

  sync(world: BattleWorld, events: readonly BattleEvent[], alpha: number): void {
    const a = Math.min(1, Math.max(0, alpha));
    const now = this.scene.time.now;
    for (const e of events) {
      if (e.type === 'hit') {
        if (this.fullEffects()) this.hitFx(world, e.id, e.sourceId, e.dmgType);
        if (showsFloatingDamage(e.dmg)) this.floatDamage(world, e.id, e.dmg, now);
      } else if (e.type === 'boulder' && e.phase === 'impact') {
        this.rings.push({
          x: e.x,
          y: e.y,
          start: now,
          radius: world.boulderRadius,
          color: PALETTE.cream,
        });
        const at = iso(e);
        // The king's own impact (`power_<king>_impact`), else the plain boulder blast.
        const own = world.setup.power ? `power_${world.setup.power}_impact` : null;
        this.play(own !== null && FX_BY_ID.has(own) ? own : 'boulderBlast', at.x, at.y, at.y + 4);
      } else if (e.type === 'pulse' || e.type === 'revive') {
        this.pulse(world, e.id, now);
        if (e.type === 'revive' && e.id >= 0 && e.id < world.count) this.playOn(world, e.id, 'fx_revive');
      } else if (e.type === 'shield') this.bubble(world, e.id);
      else if (e.type === 'death' && e.id >= 0 && e.id < world.count)
        this.playOn(world, e.id, world.kind[e.id] === KIND_UNIT ? 'unitDeath' : 'buildingCollapse');
    }
    this.syncProjectiles(world, a);
    this.syncBoulders(world, a);
    this.syncAuras(world, now);
    this.syncStatuses(world, now);
  }

  /**
   * A one-shot code effect at a screen point on the board (place, move, upgrade): feet-anchored effects stand on
   * the point, others centre on it. Drawn above the buildings of that row.
   */
  playAt(fx: string, x: number, y: number): void {
    this.play(fx, x, y, y + 40);
  }

  /** One looping status effect (stun, disabled, burn, poison, slow) on every living entity that has one. */
  private syncStatuses(world: BattleWorld, now: number): void {
    let used = 0;
    for (let id = 0; id < world.count && used < STATUS_POOL; id++) {
      const fx = statusFxFor(world, id);
      const def = fx === null ? undefined : FX_BY_ID.get(fx);
      if (def === undefined) continue;
      // Small and low at the feet, drawn under the unit so it never hides it (owner 11/11/2026).
      const { x, y } = iso({ x: world.x[id]!, y: world.y[id]! });
      this.image(this.statuses, used, codeFxFrame(def.id, codeFxFrameAt(def.frameMs, now, true) ?? 0))
        .setScale(STATUS_SCALE)
        .setOrigin(0.5, 1)
        .setPosition(Math.round(x), Math.round(y + 3))
        .setDepth(y - 1);
      used += 1;
    }
    for (let i = used; i < this.statuses.length; i++) this.statuses[i]!.setVisible(false);
  }

  /** Damage numbers, rings and death pops finish in real time even after the runner has ended. */
  updateDamage(): void {
    const now = this.scene.time.now;
    this.drawRings(now);
    this.stepShots(now);
    for (const slot of this.damageTexts) {
      if (!slot.text.visible) continue;
      const t = Math.min(1, Math.max(0, (now - slot.start) / FLOAT_MS));
      slot.text.setY(Math.round(slot.y - FLOAT_RISE_PX * t)).setAlpha(1 - t);
      if (t >= 1) slot.text.setVisible(false);
    }
  }

  destroy(): void {
    for (const list of [this.projectiles, this.boulders, this.shadows, this.auras, this.statuses, this.bursts]) {
      for (const img of list) {
        this.scene.tweens.killTweensOf(img);
        img.destroy();
      }
      list.length = 0;
    }
    for (const p of this.shots) {
      p.img.destroy();
      p.glow.destroy();
    }
    this.shots.length = 0;
    this.rings.length = 0;
    for (const slot of this.damageTexts) slot.text.destroy();
    this.damageTexts.length = 0;
    this.ringGfx.destroy();
  }

  /**
   * Each live projectile, drawn a fraction of one step behind its current point so motion
   * between ticks stays smooth (the pool compacts, so there is no per-projectile history).
   */
  private syncProjectiles(world: BattleWorld, a: number): void {
    const p = world.projectiles;
    const n = world.projectileCount;
    const now = this.scene.time.now;
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
      const point = { x: p.px[k]! - dx * back, y: p.py[k]! - dy * back };
      const at = iso(point);
      const structure = world.kind[src] !== KIND_UNIT;
      const frame = buildingFrame(world.label[src]! as CardId);
      const texture = this.scene.textures.get(SPRITES_KEY);
      const height = structure && texture.has(frame)
        ? texture.get(frame).height * imageFrameScale(frame) * ISO_SPRITE_SCALE : 0;
      const fromX = point.x - world.x[src]!;
      const fromY = point.y - world.y[src]!;
      const toX = world.x[t]! - point.x;
      const toY = world.y[t]! - point.y;
      const offset = projectileVisualHeight(height, Math.sqrt(fromX * fromX + fromY * fromY),
        Math.sqrt(toX * toX + toY * toY), structure, structure ? BUILDING_FOOT_DY : 0);
      // The frame follows the flight on screen (projected direction), never a rotated sprite.
      const dir = arrowDir(dy - dx, (dx + dy) / 2 + offset - 6);
      const fx = projectileFxFor(world.label[src]!);
      const def = fx === null ? undefined : FX_BY_ID.get(fx);
      let shotFrame = fxFrame(`arrow_${dir}`);
      if (def !== undefined) {
        const i = def.directional ? CODE_FX_DIRS.indexOf(dir) : def.frames > 1 ? (codeFxFrameAt(def.frameMs, now, true) ?? 0) : 0;
        shotFrame = codeFxFrame(def.id, Math.max(0, i));
      }
      const img = this.image(this.projectiles, used, shotFrame);
      img
        .setScale(def === undefined ? 1 : ISO_SPRITE_SCALE)
        .setPosition(Math.round(at.x), Math.round(at.y - offset))
        .setDepth(at.y);
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
      // The king's own falling object (`power_<king>_drop`), else the royal boulder.
      const drop = world.setup.power ? FX_BY_ID.get(`power_${world.setup.power}_drop`) : undefined;
      const frame = drop
        ? codeFxFrame(drop.id, codeFxFrameAt(drop.frameMs, this.scene.time.now, true) ?? 0)
        : fxFrame('boulder');
      const rock = this.image(this.boulders, i, frame);
      // Accelerating fall: height × (1 − t²), straight down on screen.
      rock
        .setScale((drop ? 1 : imageFrameScale(frame)) * ISO_SPRITE_SCALE)
        .setPosition(at.x, Math.round(at.y + 4 - BOULDER_DROP_H * (1 - t * t)))
        .setDepth(at.y + 4);
    }
    for (let i = list.length; i < this.boulders.length; i++) {
      this.boulders[i]!.setVisible(false);
      this.shadows[i]!.setVisible(false);
    }
  }

  /** Hit effect by how the blow landed: magic burst, a projectile's splinters, or the melee impact. */
  private hitFx(world: BattleWorld, id: number, sourceId: number, dmgType: string): void {
    if (id < 0 || id >= world.count) return;
    const ranged = sourceId >= 0 && sourceId < world.count && world.projSpeed[sourceId]! > 0;
    const fx = dmgType === 'magic' ? 'fx_magic_hit' : ranged ? 'arrowHit' : 'impact';
    const r = world.radius[id]!;
    const { x, y } = iso({ x: world.x[id]!, y: world.y[id]! });
    this.play(fx, x, y - r, y + r + 2);
  }

  /** A code effect on entity `id`: at its feet for 'feet' effects, else at its body centre. */
  private playOn(world: BattleWorld, id: number, fx: string): void {
    const def = FX_BY_ID.get(fx);
    if (def === undefined) return;
    const r = world.radius[id]!;
    const { x, y } = iso({ x: world.x[id]!, y: world.y[id]! });
    this.play(fx, x, def.anchor === 'feet' ? y : y - r, y + r + 2);
  }

  /** Starts one-shot code effect `fx` at screen point (x, y): feet-anchored effects stand on it, others centre on it. */
  private play(fx: string, x: number, y: number, depth: number): void {
    const def = FX_BY_ID.get(fx);
    if (def === undefined) return;
    let shot = this.shots.find((p) => !p.img.visible);
    if (shot === undefined) {
      if (this.shots.length >= SHOT_POOL) return;
      shot = {
        img: this.scene.add.image(0, 0, SPRITES_KEY, codeFxFrame(def.id, 0)).setScale(ISO_SPRITE_SCALE).setVisible(false),
        glow: this.scene.add
          .image(0, 0, SPRITES_KEY, codeFxFrame(def.id, 0))
          .setScale(ISO_SPRITE_SCALE)
          .setBlendMode('ADD')
          .setVisible(false),
        def,
        start: 0,
      };
      this.shots.push(shot);
    }
    const oy = def.anchor === 'feet' ? 1 : 0.5;
    shot.def = def;
    shot.start = this.scene.time.now;
    shot.img
      .setOrigin(0.5, oy)
      .setPosition(Math.round(x), Math.round(y))
      .setDepth(depth)
      .setFrame(codeFxFrame(def.id, 0))
      .setVisible(true);
    shot.glow.setOrigin(0.5, oy).setPosition(Math.round(x), Math.round(y)).setDepth(depth - 1);
    if (def.paintGlow && this.fullEffects()) shot.glow.setFrame(codeFxFrame(def.id, 0, true)).setVisible(true);
    else shot.glow.setVisible(false);
  }

  private stepShots(now: number): void {
    for (const p of this.shots) {
      if (!p.img.visible) continue;
      const f = codeFxFrameAt(p.def.frameMs, now - p.start, false);
      if (f === null) {
        p.img.setVisible(false);
        p.glow.setVisible(false);
        continue;
      }
      p.img.setFrame(codeFxFrame(p.def.id, f));
      if (p.glow.visible) p.glow.setFrame(codeFxFrame(p.def.id, f, true));
    }
  }

  /** While the rage is on, a looping fire ring under every living enemy unit. */
  private syncAuras(world: BattleWorld, now: number): void {
    const def = FX_BY_ID.get('rageAura');
    let used = 0;
    if (def !== undefined && rageStacks(world) > 0 && this.fullEffects()) {
      const f = codeFxFrameAt(def.frameMs, now, true) ?? 0;
      for (let id = 0; id < world.count && used < AURA_POOL; id++) {
        if (world.alive[id] === 0 || world.team[id] !== TEAM_FOE || world.kind[id] !== KIND_UNIT) continue;
        const { x, y } = iso({ x: world.x[id]!, y: world.y[id]! });
        this.image(this.auras, used, codeFxFrame(def.id, f))
          .setScale(STATUS_SCALE)
          .setOrigin(0.5, 1)
          .setPosition(Math.round(x), Math.round(y + 3))
          .setDepth(y - 1);
        used += 1;
      }
    }
    for (let i = used; i < this.auras.length; i++) this.auras[i]!.setVisible(false);
  }

  private floatDamage(world: BattleWorld, id: number, dmg: number, now: number): void {
    if (id < 0 || id >= world.count) return;
    let slot = this.damageTexts.find((s) => !s.text.visible || now - s.start >= FLOAT_MS);
    if (!slot) {
      if (this.damageTexts.length >= FLOAT_POOL) return;
      const text = this.scene.add
        .text(0, 0, '', {
          fontFamily: FONT_UI,
          fontSize: '16px',
          color: '#ffffff',
          stroke: '#201820',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 1)
        .setDepth(RING_DEPTH + 1);
      slot = { text, start: now, y: 0 };
      this.damageTexts.push(slot);
    }
    const at = iso({ x: world.x[id]!, y: world.y[id]! });
    slot.start = now;
    slot.y = Math.round(at.y - world.radius[id]!);
    slot.text
      .setText(`${Math.round(dmg)}`)
      .setPosition(Math.round(at.x), slot.y)
      .setAlpha(1)
      .setVisible(true);
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
  private burst(
    frame: string,
    x: number,
    y: number,
    depth: number,
    alpha: number,
    ms: number,
  ): void {
    let img = this.bursts.find((b) => !b.visible && b.frame.name === fxFrame(frame));
    if (img === undefined) {
      img = this.scene.add.image(0, 0, SPRITES_KEY, fxFrame(frame));
      this.bursts.push(img);
    }
    const b = img;
    this.scene.tweens.killTweensOf(b);
    b.setPosition(Math.round(x), Math.round(y)).setDepth(depth).setAlpha(alpha).setVisible(true);
    this.scene.tweens.add({
      targets: b,
      alpha: 0,
      duration: ms,
      onComplete: () => b.setVisible(false),
    });
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
