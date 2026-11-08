import Phaser from 'phaser';
import type { EventBus } from '../core/events';
import { PALETTE } from '../data/palette';
import type { Edge } from '../game/battle/types';
import { drainEvents, structureFoot } from '../game/battle/world';
import { CONTENT } from '../game/cards/registry';
import { maxEnchantStacks } from '../game/run/perks';
import { createGameBus, type GameEvents } from '../game/events';
import { RunController } from '../game/run/RunController';
import { checkTargetStep, targetCount } from '../game/run/board';
import type { SessionPersistence } from '../game/save/types';
import type { PlayTarget, RunState } from '../game/run/state';
import { RULES_FULL } from '../data/rules';
import type { KingId, PerkId } from '../data/types';
import { newRun } from '../game/run/yearFlow';
import { BoardRenderer } from '../render/BoardRenderer';
import { FieldRenderer } from '../render/FieldRenderer';
import { FxRenderer } from '../render/FxRenderer';
import { RangeRenderer } from '../render/RangeRenderer';
import { UnitRenderer } from '../render/UnitRenderer';
import { buildSpritesTexture } from '../render/atlas';
import { DRAG_SLOP, type Size } from '../ui/hud/layout';
import { lockedPlotTap, plotHighlights, plotIllegalReason } from '../ui/planning/targetHints';
import { lockedPlotPrice } from '../ui/realm/calendarModel';
import {
  START_FREE_MOVE,
  freeMoveCommand,
  freeMoveHighlights,
  freeMovesLeft,
  showFreeMove,
  tapFreeMove,
  type FreeMovePick,
} from '../ui/planning/freeMoveModel';
import { buildingRanges, entityRanges } from '../ui/info/rangeModel';
import { unproject } from '../core/iso';
import {
  isOverview,
  keepView,
  panBy,
  pinchView,
  resizeView,
  snapView,
  wheelZoom,
  zoomAt,
  type CameraView,
} from '../ui/realm/cameraModel';
import { realmCamera, realmCameraMix, type RealmPhase } from '../ui/realm/realmLayout';
import { SCENES } from './keys';
import { STORAGE_WARNING_KEY, WARNING_EVENT, getSession } from './sessionRegistry';
import type { RunEndData } from './RunEndScene';

/**
 * Launch data of the realm: a new run (seed, chosen king, perk and thorn level, from the
 * king-select scene) or a saved run to resume exactly as written (`resume`, from the menu's
 * "Tiếp tục").
 */
type RangeTarget = GameEvents['ui:range-selection']['target'];

export type RealmData =
  | { seed: number; kingId: KingId; perk: PerkId | null; difficulty: number }
  | { resume: RunState }
  /** DEV sample run (`src/dev`): its own state and in-memory persistence; ignored in production builds. */
  | { preview: { state: RunState; persistence: SessionPersistence } };

/** Launch data of the HUD scenes layered over the realm. */
export interface RealmHudData {
  bus: EventBus<GameEvents>;
  controller: RunController;
}

/** A card being aimed: its hand slot and the plots picked so far (2 for Dời Nhà). */
interface PendingPlay {
  handIndex: number;
  targets: number[];
}

/** Toast shown when the battle reaches the rage tick (§10.7). */
export const RAGE_TEXT = 'Quân địch nổi cơn cuồng nộ!';

/** Duration of the planning → battle camera ease (only when the two zooms differ, i.e. mobile). */
const CAMERA_EASE_MS = 400;

/**
 * The world of a run (§10.4, §10.7, §12.1): field, board, units and effects in both phases.
 * It owns the run's bus and RunController, is the only caller of `controller.update`, turns
 * board clicks into the pending play, and layers PlanningHudScene / BattleHudScene on top.
 */
export class RealmScene extends Phaser.Scene {
  private bus!: EventBus<GameEvents>;
  private controller!: RunController;
  private field: FieldRenderer | null = null;
  private board: BoardRenderer | null = null;
  private units: UnitRenderer | null = null;
  private fx: FxRenderer | null = null;
  private pending: PendingPlay | null = null;
  /** A locked plot waiting for ✓ to be bought. */
  private pendingBuy: number | null = null;
  /** The Nomad King's free relocation being picked (null = none). */
  private freeMove: FreeMovePick | null = null;
  private inBattle = false;
  /** The controller's auto-start check runs once, on the first frame after the HUD is up. */
  private kicked = false;
  /** A resumed run saved at the year's end goes on to the next year (its summary is not stored). */
  private resumedAtYearEnd = false;
  /** "advance" was sent and its answer (the next year's first step) is still to come. */
  private awaitingAdvance = false;
  /** The battle HUD (and its summary with Tiếp tục) is the screen in charge until the planning HUD comes back. */
  private battleHudUp = false;
  private readonly onResize = (): void => this.resizeCamera();
  /** The live camera (free zoom and scroll, before pixel snapping) and the screen size it was set for. */
  private view: CameraView | null = null;
  private viewScreen: Size = { w: 0, h: 0 };
  /** A modal or the help view is open: the map takes no wheel, pan or pinch. */
  private mapBlocked = false;
  /** Pointers pressed on the map (id -> last screen point). */
  private readonly pointers = new Map<number, { x: number; y: number }>();
  /** The pinch in progress: the view, finger midpoint and squared spread when it started; null = no pinch. */
  private pinch: { view: CameraView; mid: { x: number; y: number }; sq: number } | null = null;
  /** The press became a map drag: its release is not a click. */
  private panning = false;
  /** The running planning ↔ battle camera ease, if any. */
  private cameraEase: Phaser.Tweens.Tween | null = null;
  /** One renderer for every range ring; the chosen and the hovered thing it may follow. */
  private range: RangeRenderer | null = null;
  private rangeSelected: RangeTarget = null;
  private rangeHover: RangeTarget = null;
  /** The press that may become a board click (only that pointer's release counts). */
  private down: { id: number; x: number; y: number } | null = null;

  constructor() {
    super(SCENES.realm);
  }

  create(data: RealmData | undefined): void {
    // Scene instances are reused: reset every per-run field first.
    this.pending = null;
    this.pendingBuy = null;
    this.freeMove = null;
    this.inBattle = false;
    this.kicked = false;
    this.resumedAtYearEnd = false;
    this.awaitingAdvance = false;
    this.battleHudUp = false;
    this.cameraEase = null;
    this.range = null;
    this.rangeSelected = null;
    this.rangeHover = null;
    this.down = null;
    this.view = null;
    this.mapBlocked = false;
    this.pointers.clear();
    this.pinch = null;
    this.panning = false;
    const preview = import.meta.env.DEV && data !== undefined && 'preview' in data ? data.preview : null;
    const resume = data !== undefined && 'resume' in data ? data.resume : null;
    const fresh = data !== undefined && 'seed' in data ? data : { seed: 1, kingId: 'wheat' as KingId, perk: null, difficulty: 0 };
    const session = getSession(this);
    const initial =
      preview?.state ??
      resume ??
      newRun(fresh.seed, fresh.kingId, CONTENT, RULES_FULL, {
        perk: fresh.perk,
        difficulty: fresh.difficulty,
        unlockedCards: session ? session.meta().unlockedCards : [],
      });
    const seed = initial.seed;
    this.resumedAtYearEnd = resume?.phase === 'yearEnd';

    buildSpritesTexture(this.textures, CONTENT); // no-op once PreloadScene built it
    this.bus = createGameBus();
    this.controller = new RunController(
      this.bus,
      CONTENT,
      initial,
      preview ? preview.persistence : session?.persistence,
    );
    this.cameras.main.setBackgroundColor(PALETTE.grass);
    this.field = new FieldRenderer(this, seed, initial.kingId);
    this.board = new BoardRenderer(this, CONTENT);
    this.units = new UnitRenderer(this);
    this.fx = new FxRenderer(this);
    this.range = new RangeRenderer(this);

    const bus = this.bus;
    bus.on('run:state', ({ state }) => this.onState(state));
    bus.on('battle:started', () => this.onBattleStarted());
    bus.on('ui:select-card', ({ handIndex }) => this.select(handIndex));
    bus.on('ui:cancel-play', () => {
      this.setPendingBuy(null);
      this.setFreeMove(null);
      this.bus.emit('ui:select-card', { handIndex: null });
    });
    bus.on('ui:drop-card', ({ handIndex, plot }) => this.drop(handIndex, plot));
    bus.on('ui:confirm-play', () => this.confirm());
    bus.on('ui:free-move', ({ active }) => this.startFreeMove(active));
    bus.on('ui:continue', () => this.onContinue());
    bus.on('ui:range-selection', ({ target, mode }) => {
      if (mode === 'hover') this.rangeHover = target;
      else this.rangeSelected = target;
    });

    bus.on('ui:open-modal', () => (this.mapBlocked = true));
    bus.on('ui:close-modal', () => (this.mapBlocked = false));
    bus.on('ui:help', ({ open }) => (this.mapBlocked = open));

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);

    this.showPlanning(this.controller.state);
    const hud: RealmHudData = { bus: this.bus, controller: this.controller };
    this.scene.launch(SCENES.planningHud, hud);
    // Only a new run replaces the saved one; resuming never rewrites it.
    if (resume === null) void this.controller.checkpointInitial();
    // A save that fails mid-run is told once, through the toast stack of whichever HUD is up.
    this.game.events.on(WARNING_EVENT, this.onStorageWarning, this);
  }

  private readonly onStorageWarning = (text: unknown): void => {
    if (typeof text !== 'string') return;
    this.registry.remove(STORAGE_WARNING_KEY);
    this.bus.emit('log', { text });
  };

  update(_time: number, delta: number): void {
    // Taken before update: the tick that ends the battle drops the runner, and that final
    // state (deaths included) must still be drawn.
    if (!this.kicked) {
      this.kicked = true;
      this.controller.kickoff(); // starts the battle at once when no card in hand is playable
      if (this.resumedAtYearEnd) this.onContinue();
    }
    const runner = this.controller.runner;
    this.controller.update(delta);
    if (runner && this.units && this.fx) {
      const alpha = runner.clock.alpha;
      const events = drainEvents(runner.world);
      this.units.sync(runner.world, alpha);
      this.fx.sync(runner.world, events, alpha);
      if (events.some((e) => e.type === 'rage')) this.bus.emit('log', { text: RAGE_TEXT });
    }
    this.syncRange();
  }

  /** Show the rings of the hovered (else chosen) thing, at its current place; hide when it is gone. */
  private syncRange(): void {
    const range = this.range;
    if (!range) return;
    const target = this.rangeHover ?? this.rangeSelected;
    if (target === null) return range.hide();
    const state = this.controller.state;
    if (target.kind === 'plot') {
      const specs = buildingRanges(state, target.plot, CONTENT);
      return specs.length === 0 ? range.hide() : range.show(structureFoot(target.plot), specs);
    }
    const world = this.controller.runner?.world;
    const specs = world ? entityRanges(world, target.id) : [];
    if (!world || specs.length === 0) return range.hide();
    range.show({ x: world.x[target.id]!, y: world.y[target.id]! }, specs);
  }

  // ---- run flow --------------------------------------------------------------------------

  private onState(state: RunState): void {
    if (state.phase === 'planning') this.showPlanning(state);
    // After "advance" the next year may open straight into a council, a quest or planning; a battle
    // starting at once keeps the battle HUD (onBattleStarted).
    if (this.awaitingAdvance && state.phase !== 'yearEnd') {
      this.awaitingAdvance = false;
      this.continueFlow();
      return;
    }
    // A year ended or the run finished while a card / decree / quest modal was closing (no battle summary
    // is waiting for its Tiếp tục): go on by ourselves.
    if (!this.battleHudUp) {
      if (state.phase === 'yearEnd') this.bus.emit('ui:command', { command: { type: 'advance' } });
      else if (state.phase === 'ended') this.continueFlow();
    }
  }

  /** A new phase has other entities and its own HUD: forget the old selection and hover. */
  private clearRange(): void {
    this.rangeSelected = null;
    this.rangeHover = null;
  }

  private showPlanning(state: RunState): void {
    // Only a fresh view or the way back from a battle re-frames the camera; buying a plot, rerolling or
    // discarding keeps the player's zoom and pan.
    const reframe = this.inBattle || !this.view;
    if (this.inBattle) {
      // Back from a battle: drop its sprites, show the buildings again.
      this.inBattle = false;
      this.clearRange();
      this.units?.destroy();
      this.fx?.destroy();
      this.units = new UnitRenderer(this);
      this.fx = new FxRenderer(this);
      this.board?.setBuildingsVisible(true);
    }
    this.board?.render(state);
    const edges = new Set<Edge>();
    for (const wave of state.army?.waves ?? []) for (const u of wave.units) edges.add(u.edge);
    this.board?.setEdgeArrows([...edges].sort());
    // A finished move (or a new year) may leave no free move: stop picking.
    if (this.freeMove && (!showFreeMove(state) || freeMovesLeft(state, CONTENT) === 0)) this.setFreeMove(null);
    if (state.played) this.setPending(null);
    else this.refreshHighlights();
    if (reframe) this.placeCamera();
  }

  private onBattleStarted(): void {
    this.clearRange();
    this.battleHudUp = true;
    this.inBattle = true;
    this.setPending(null);
    this.setPendingBuy(null);
    this.setFreeMove(null);
    this.board?.setEdgeArrows([]);
    this.board?.setBuildingsVisible(false);
    this.placeCamera(true);
    this.scene.stop(SCENES.planningHud);
    const hud: RealmHudData = { bus: this.bus, controller: this.controller };
    this.scene.launch(SCENES.battleHud, hud);
  }

  /** A resumed or finished battle's summary asked to go on: wait for the pending save, then follow the phase. */
  private onContinue(): void {
    void this.controller.whenIdle().then(() => this.continueFlow());
  }

  private continueFlow(): void {
    const state = this.controller.state;
    if (state.phase === 'yearEnd') {
      this.awaitingAdvance = true;
      this.bus.emit('ui:command', { command: { type: 'advance' } });
    } else if (state.phase === 'ended') {
      const data: RunEndData = { state };
      this.scene.start(SCENES.runEnd, data);
    } else if (state.phase !== 'battle') {
      this.relaunchPlanningHud(); // reward, conquest, council, quest or planning: the planning HUD shows it
    }
  }

  private relaunchPlanningHud(): void {
    this.battleHudUp = false;
    this.scene.stop(SCENES.battleHud);
    const hud: RealmHudData = { bus: this.bus, controller: this.controller };
    this.scene.launch(SCENES.planningHud, hud);
  }

  // ---- pending play --------------------------------------------------------------------

  private select(handIndex: number | null): void {
    if (handIndex !== null) {
      this.setPendingBuy(null);
      this.setFreeMove(null); // a card and a free move are never aimed together
    }
    const state = this.controller.state;
    const ok =
      handIndex !== null &&
      state.phase === 'planning' &&
      !state.played &&
      state.hand[handIndex] !== undefined;
    this.setPending(ok ? { handIndex, targets: [] } : null);
  }

  private setPending(next: PendingPlay | null): void {
    this.pending = next;
    this.refreshHighlights();
    this.bus.emit('ui:pending-play', {
      handIndex: next?.handIndex ?? null,
      targets: next ? [...next.targets] : [],
      ready: this.ready(),
    });
  }

  private ready(): boolean {
    const p = this.pending;
    if (!p) return false;
    const cardId = this.controller.state.hand[p.handIndex];
    return cardId !== undefined && p.targets.length === targetCount(CONTENT.card(cardId));
  }

  private refreshHighlights(): void {
    const board = this.board;
    if (!board) return;
    const p = this.pending;
    const state = this.controller.state;
    if (this.freeMove) {
      board.setHighlights(freeMoveHighlights(state, CONTENT, this.freeMove));
      return;
    }
    const cardId = p ? state.hand[p.handIndex] : undefined;
    if (!p || cardId === undefined) {
      board.setHighlights(this.pendingBuy === null ? new Map() : new Map([[this.pendingBuy, 'selected']]));
      return;
    }
    board.setHighlights(plotHighlights(state.plots, CONTENT.card(cardId), p.targets, maxEnchantStacks(state, CONTENT)));
  }

  /** A click on `plot` while aiming: add it as the next target (replacing the last if full). */
  private pick(plot: number): void {
    const p = this.pending;
    const cardId = p ? this.controller.state.hand[p.handIndex] : undefined;
    if (!p || cardId === undefined) return;
    const card = CONTENT.card(cardId);
    const need = targetCount(card);
    const chosen = p.targets.slice(0, need - 1);
    const state = this.controller.state;
    if (checkTargetStep(state.plots, card, chosen, plot, CONTENT, maxEnchantStacks(state, CONTENT)) !== null) return;
    this.setPending({ handIndex: p.handIndex, targets: [...chosen, plot] });
  }

  /** A card dropped on `plot`: aim at it and, when that was all the card needs, play it. */
  private drop(handIndex: number, plot: number): void {
    this.select(handIndex);
    const cardId = this.controller.state.hand[handIndex];
    if (!this.pending || cardId === undefined) return;
    const count = targetCount(CONTENT.card(cardId));
    if (count > 0) this.pick(plot);
    if (count <= 1 && this.ready()) this.confirm();
  }

  /** Offer to buy the locked `plot` (null clears): the HUD shows the price with ✓/✕. */
  private setPendingBuy(plot: number | null): void {
    if (plot === this.pendingBuy) return;
    this.pendingBuy = plot;
    this.refreshHighlights();
    this.bus.emit('ui:pending-buy', {
      plot,
      price: lockedPlotPrice(this.controller.state),
    });
  }

  /** The "Dời trại" button: start picking (dropping an aimed card or a purchase offer) or stop. */
  private startFreeMove(active: boolean): void {
    const state = this.controller.state;
    if (!active || !showFreeMove(state) || freeMovesLeft(state, CONTENT) === 0) {
      this.setFreeMove(null);
      return;
    }
    this.setPendingBuy(null);
    if (this.pending) this.bus.emit('ui:select-card', { handIndex: null });
    this.setFreeMove(START_FREE_MOVE);
  }

  private setFreeMove(next: FreeMovePick | null): void {
    if (next === null && this.freeMove === null) return;
    this.freeMove = next;
    this.refreshHighlights();
    this.bus.emit('ui:pending-free-move', { active: next !== null, from: next?.from ?? null, to: next?.to ?? null });
  }

  private confirm(): void {
    if (this.freeMove) {
      const command = freeMoveCommand(this.freeMove);
      if (command === null) return;
      this.setFreeMove(null);
      this.bus.emit('ui:command', { command });
      return;
    }
    if (this.pendingBuy !== null) {
      const plot = this.pendingBuy;
      if (this.controller.state.gold < lockedPlotPrice(this.controller.state)) {
        // Keep the offer open: the HUD says why instead of the game rejecting a command.
        this.bus.emit('run:illegal', { reason: 'notEnoughGold' });
        return;
      }
      this.setPendingBuy(null);
      this.bus.emit('ui:command', { command: { type: 'unlockPlot', plot } });
      return;
    }
    const p = this.pending;
    if (!p || !this.ready()) return;
    const [first, second] = p.targets;
    const target: PlayTarget =
      first === undefined
        ? { kind: 'none' }
        : second === undefined
          ? { kind: 'plot', plot: first }
          : { kind: 'two', first, second };
    this.bus.emit('ui:command', { command: { type: 'play', handIndex: p.handIndex, target } });
  }

  // ---- input -----------------------------------------------------------------------------

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    this.pointers.set(pointer.id, { x: pointer.x, y: pointer.y });
    if (this.pointers.size === 2 && !this.mapBlocked) {
      // A second finger on the map: a pinch, never a click or a pan.
      this.pinch = this.view ? { view: this.view, mid: this.midpoint(), sq: this.spreadSq() } : null;
      this.down = null;
      this.panning = false;
      return;
    }
    if (this.pointers.size > 2) return;
    this.down = { id: pointer.id, x: pointer.x, y: pointer.y };
    this.panning = false;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const last = this.pointers.get(pointer.id);
    if (!last || !pointer.isDown) return;
    this.pointers.set(pointer.id, { x: pointer.x, y: pointer.y });
    if (this.mapBlocked || !this.view) return;
    if (this.pinch !== null) {
      // Free zoom (spec 2026-11-08 §4): the zoom follows the finger spread, the map follows the midpoint.
      const p = this.pinch;
      this.applyView(pinchView(p.view, p.mid, this.midpoint(), p.sq, this.spreadSq(), this.screen(), this.phase()));
      return;
    }
    const down = this.down;
    if (!down || down.id !== pointer.id) return;
    if (!this.panning) {
      const dx = pointer.x - down.x;
      const dy = pointer.y - down.y;
      if (dx * dx + dy * dy <= DRAG_SLOP * DRAG_SLOP) return;
      // Pan at every zoom step, the overview too: on a phone the 640 px board is wider than the screen and the
      // player drags to reach the side plots (clampView keeps the view on the map).
      this.panning = true;
    }
    this.applyView(panBy(this.view, { x: pointer.x - last.x, y: pointer.y - last.y }, this.screen(), this.phase()));
  }

  /** Mouse wheel: a smooth zoom in (up) or out (down), keeping the world point under the cursor (spec 2026-11-08 §4). */
  private onWheel(pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number): void {
    if (this.mapBlocked || !this.view || dy === 0) return;
    const next = wheelZoom(this.view.zoom, dy);
    this.applyView(zoomAt(this.view, { x: pointer.x, y: pointer.y }, next, this.screen(), this.phase()));
  }

  /** Midpoint of the two pointers on the map. */
  private midpoint(): { x: number; y: number } {
    const [a, b] = [...this.pointers.values()];
    if (!a || !b) return { x: 0, y: 0 };
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  /** Squared distance between the two pointers on the map. */
  private spreadSq(): number {
    const [a, b] = [...this.pointers.values()];
    if (!a || !b) return 0;
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    this.pointers.delete(pointer.id);
    if (this.pinch !== null) {
      // Lifting a finger ends the pinch; the other finger's release is not a click either.
      if (this.pointers.size < 2) this.pinch = null;
      this.down = null;
      return;
    }
    const down = this.down;
    if (!down || down.id !== pointer.id) return;
    this.down = null;
    if (this.panning) {
      this.panning = false;
      return;
    }
    if (this.inBattle || !this.board) return;
    const dx = pointer.x - down.x;
    const dy = pointer.y - down.y;
    if (dx * dx + dy * dy > DRAG_SLOP * DRAG_SLOP) return;
    // The camera works in projected (isometric) space: back to the square world first.
    const cam = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const world = unproject({ x: cam.x, y: cam.y });
    const plot = this.board.plotAt(world.x, world.y);
    const state = this.controller.state;
    const aimedId = this.pending ? state.hand[this.pending.handIndex] : undefined;
    const aiming = aimedId === undefined ? null : CONTENT.card(aimedId);
    if (this.freeMove) {
      // Picking a free move: every tap is a pick (locked plots are refused, never offered for sale).
      if (plot === null) return;
      const tap = tapFreeMove(state, CONTENT, this.freeMove, plot);
      if ('reject' in tap) this.bus.emit('run:illegal', { reason: tap.reject });
      else this.setFreeMove(tap.next);
      return;
    }
    if (plot !== null && state.plots[plot]?.unlocked === false) {
      if (aiming !== null) {
        // A tap has no hover or long-press: say why the aimed card cannot go on this plot.
        const reason = plotIllegalReason(state.plots, aiming, this.pending?.targets ?? [], plot, maxEnchantStacks(state, CONTENT));
        if (reason !== null) {
          this.bus.emit('run:illegal', { reason });
          return;
        }
      }
      const tap = lockedPlotTap(state, plot, aiming);
      if (tap.kind === 'buy') {
        this.bus.emit('ui:inspect', { plot: null, x: pointer.x, y: pointer.y });
        this.setPendingBuy(plot);
        return;
      }
      if (tap.kind === 'target') {
        this.pick(plot);
        return;
      }
      if (aiming === null) this.bus.emit('run:illegal', { reason: 'notAdjacent' });
    }
    this.setPendingBuy(null);
    if (this.pending) {
      if (plot !== null) this.pick(plot);
      return;
    }
    // Not aiming a card: a tap on a building asks the HUD for its info box, any other tap closes it.
    const built = plot !== null && this.controller.state.plots[plot]?.building ? plot : null;
    this.bus.emit('ui:inspect', { plot: built, x: pointer.x, y: pointer.y });
  }

  // ---- camera ----------------------------------------------------------------------------

  /**
   * One camera for both phases (§10.4, §10.7). A view the player zoomed or panned is kept across a phase change
   * (only clamped to the new phase, spec 2026-11-08 §4); an overview moves to the new phase's overview, sliding
   * there when `ease` is set (every frame goes through `applyView`, so the HUDs follow). A first call or a resize
   * mid-slide sets the overview at once.
   */
  private placeCamera(ease = false): void {
    const screen: Size = { w: this.scale.width, h: this.scale.height };
    this.cameraEase?.stop();
    const easing = this.cameraEase !== null;
    this.cameraEase = null;
    const phase = this.phase();
    const other: RealmPhase = phase === 'battle' ? 'planning' : 'battle';
    if (this.view && !easing && !isOverview(this.view, screen, other) && !isOverview(this.view, screen, phase)) {
      this.applyView(keepView(this.view, screen, phase));
      return;
    }
    const target = realmCamera(screen, phase);
    if (!ease || realmCamera(screen, 'planning').zoom === target.zoom) {
      this.applyView(target);
      return;
    }
    this.cameraEase = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: CAMERA_EASE_MS,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        this.applyView(realmCameraMix(screen, 'planning', 'battle', tween.getValue() ?? 1));
      },
      onComplete: () => {
        this.applyView(target);
        this.cameraEase = null;
      },
    });
  }

  private screen(): Size {
    return { w: this.scale.width, h: this.scale.height };
  }

  private phase(): RealmPhase {
    return this.inBattle ? 'battle' : 'planning';
  }

  /**
   * Keep `view` as the live camera, draw it pixel-snapped (`snapView`: whole-pixel camera translation at any free
   * zoom) and tell the HUDs the view as drawn (`realm:view`). Pan and zoom go on from the unsnapped view.
   */
  private applyView(view: CameraView): void {
    this.view = view;
    this.viewScreen = this.screen();
    const shown = snapView(view, this.viewScreen);
    this.cameras.main.setZoom(shown.zoom).setScroll(shown.scroll.x, shown.scroll.y);
    this.bus.emit('realm:view', { zoom: shown.zoom, scroll: { x: shown.scroll.x, y: shown.scroll.y } });
  }

  /** A resize keeps a zoomed view's centre; the overview stays the overview. */
  private resizeCamera(): void {
    if (!this.view || this.cameraEase) {
      this.placeCamera();
      return;
    }
    this.applyView(resizeView(this.view, this.viewScreen, this.screen(), this.phase()));
  }

  private teardown(): void {
    this.cameraEase?.stop();
    this.cameraEase = null;
    this.range?.destroy();
    this.range = null;
    this.game.events.off(WARNING_EVENT, this.onStorageWarning, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    this.pointers.clear();
    this.scene.stop(SCENES.planningHud);
    this.scene.stop(SCENES.battleHud);
    this.controller.dispose();
    this.units?.destroy();
    this.fx?.destroy();
    this.board?.destroy();
    this.field?.destroy();
    this.units = null;
    this.fx = null;
    this.board = null;
    this.field = null;
    this.pending = null;
    this.freeMove = null;
    this.bus.clear();
  }
}
