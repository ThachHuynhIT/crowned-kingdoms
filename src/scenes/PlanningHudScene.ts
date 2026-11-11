import { bindSceneDisplay, logicalSize, logicalPointer, logicalPointerDistance } from '../ui/displayRuntime';
import { HAND_STEP, handWindow } from '../ui/planning/handLayoutModel';
import { shopPrice, buyCardIllegal } from '../game/run/shop';
import Phaser from 'phaser';
import type { EventBus } from '../core/events';
import { toCss } from '../data/palette';
import { RUN } from '../data/run';
import { UI_PALETTE } from '../data/uiPalette';
import { CARD_FLY_MS, COIN_FLY_MS, COIN_RISE_PX } from '../data/juice';
import { playedPlot } from '../ui/planning/cardFlyModel';
import { describeCard } from '../game/cards/describe';
import { CONTENT } from '../game/cards/registry';
import { maxEnchantStacks } from '../game/run/perks';
import type { GameEvents } from '../game/events';
import type { RunController } from '../game/run/RunController';
import { targetCount } from '../game/run/board';
import { canPlayCard } from '../game/run/playable';
import { rerollPrice } from '../game/run/decrees';
import { cardOffer } from '../game/run/flow';
import type { IllegalReason, RunState } from '../game/run/state';
import { SPRITES_KEY, iconFrame } from '../render/atlas';
import { ContentBox } from '../ui/ContentBox';
import { ToastStack } from '../ui/ToastStack';
import { Tooltip } from '../ui/Tooltip';
import { LONG_PRESS_MS, MARGIN, textContent, type TooltipContent } from '../ui/hud/layout';
import { CalendarModal } from '../ui/modals/CalendarModal';
import { DeckModal } from '../ui/modals/DeckModal';
import { CLOSE_BUTTON, centredPanel } from '../ui/modals/modalLayout';
import { fitTextWidth } from '../ui/modals/fitText';
import { createOverlay, fitOverlay } from '../ui/modals/overlay';
import { offerHeadingFor } from '../ui/modals/offerModel';
import { BlessingModal } from '../ui/modals/BlessingModal';
import { CouncilModal } from '../ui/modals/CouncilModal';
import { QuestModal } from '../ui/modals/QuestModal';
import { RewardModal } from '../ui/modals/RewardModal';
import { modalKind } from '../ui/modals/councilModel';
import { DecreeQuestPanel } from '../ui/planning/DecreeQuestPanel';
import { EndlessPanel } from '../ui/planning/EndlessPanel';
import { InspectionView } from '../ui/info/InspectionView';
import { buildingInfoModel } from '../ui/info/inspectionModel';
import { QuestNoticeView } from '../ui/planning/QuestNoticeView';
import { planningControls } from '../ui/info/inspectionReserved';
import { resolveShortcut, shortcutFlags, shortcutLabel } from '../ui/input/shortcuts';
import { openHelp } from './helpLauncher';
import { openSettings } from './SettingsScene';
import { cardBadge, willLevelUpTo } from '../ui/cards/cardText';
import { CalendarStrip } from '../ui/planning/CalendarStrip';
import { allyStatusText, foeStatusText } from '../ui/planning/statusText';
import { HandView } from '../ui/planning/HandView';
import { ScoutPanel } from '../ui/planning/ScoutPanel';
import { planningHint } from '../ui/planning/fightRule';
import { dropOutcome, plotIllegalReason } from '../ui/planning/targetHints';
import {
  freeMoveHint,
  freeMoveLabel,
  freeMoveReady,
  freeMoveReason,
  freeMoveReasonText,
  freeMovesLeft,
  showFreeMove,
  type FreeMovePick,
} from '../ui/planning/freeMoveModel';
import { calendarCells, illegalText, yearLabel } from '../ui/realm/calendarModel';
import {
  centerHand,
  isDesktop,
  confirmFor,
  planningLayout,
  screenToWorld,
  type PlanningLayout,
} from '../ui/realm/realmLayout';
import { overviewView, plotAtView, plotRectAtView, type CameraView } from '../ui/realm/cameraModel';
import { atlasOpacity, boardBuildingBoxes } from '../render/pickBoxes';
import { PICK_SLOP, pickSprite } from '../ui/info/spritePick';
import {
  addUiText,
  textStyle,
  createButton,
  createPanel,
  type Button,
  type TooltipSource,
  type UiBox,
} from '../ui/theme';
import { SCENES } from './keys';
import type { RealmHudData } from './RealmScene';

/** Hand row slots: room for the year-1 hand, more when bought cards make the hand longer (10/11/2026). */
const handSlots = (state: RunState): number => Math.max(RUN.handSize, state.hand.length);
/** How long a rejected command's reason stays in the hint box. */
const ILLEGAL_MS = 2000;
const PLOT_TIP = 'plot';
const SCOUT_MODAL = { w: 300, h: 460 } as const;
const MODAL_DEPTH = 500;

interface Pending {
  handIndex: number | null;
  targets: number[];
  ready: boolean;
}

const NO_PENDING: Pending = { handIndex: null, targets: [], ready: false };

/** The full scout report opened from the mobile summary (§10.5 side panel). */
interface ScoutModal {
  root: Phaser.GameObjects.Container;
  overlay: Phaser.GameObjects.Rectangle;
  panel: ScoutPanel;
  close: Button;
}

/**
 * Planning HUD over RealmScene (§10.4): lives, year, scout report, hand, shop, sell,
 * ✓/✕ for the aimed card, the play hint and the reward modal (§10.6). It only
 * reads `controller.state` and sends intents on the bus; board clicks are RealmScene's.
 */
export class PlanningHudScene extends Phaser.Scene {
  private bus!: EventBus<GameEvents>;
  private controller!: RunController;
  private offs: (() => void)[] = [];
  private lay!: PlanningLayout;
  private tooltip!: Tooltip;
  private livesBox!: UiBox;
  private livesIcon: Phaser.GameObjects.Image | null = null;
  private livesText!: Phaser.GameObjects.Text;
  private yearText!: Phaser.GameObjects.Text;
  private allyText!: Phaser.GameObjects.Text;
  private foeText!: Phaser.GameObjects.Text;
  private scout!: ScoutPanel;
  private hand!: HandView;
  private goldBox!: UiBox;
  private goldIcon: Phaser.GameObjects.Image | null = null;
  private goldText!: Phaser.GameObjects.Text;
  /** Gold of the last refresh (null until the first one): a rise floats `+N` up from the counter (juice §11.5). */
  private lastGold: number | null = null;
  /** Last refreshed state, to fly the played card onto its plot (juice §11.5). */
  private lastFlyState: RunState | null = null;
  private calendar!: CalendarStrip;
  private sellBtn!: Button;
  private rerollBtn!: Button;
  private deckBtn!: Button;
  /** "Dời trại (N)": the Nomad King's free relocation (hidden for every other king). */
  private freeMoveBtn!: Button;
  /** The free relocation being picked on the board, as RealmScene last told it (null = none). */
  private freeMove: FreeMovePick | null = null;
  private scoutBtn!: Button;
  private helpBtn!: Button;
  private settingsBtn!: Button;
  private questNotice!: QuestNoticeView;
  private actionSize = { w: 0, h: 0 };
  private calendarModal: CalendarModal | null = null;
  private deckModal: DeckModal | null = null;
  /** Cards currently in hand, including purchased copies. */
  private handCount = 0;
  /** Info box of a tapped building (§10.7), and the plot it describes. */
  private info!: InspectionView;
  private inspected: number | null = null;
  private hoveredPlot: number | null = null;
  private shopBtn!: Button;
  private handScroll = 0;
  private confirmBtn!: Button;
  private cancelBtn!: Button;
  private hint!: ContentBox;
  private reward: RewardModal | null = null;
  private council: CouncilModal | null = null;
  private quest: QuestModal | null = null;
  /** The Endless blessing offer (mandatory) and the "Phúc lành & Biến thể" panel (Endless only). */
  private blessing: BlessingModal | null = null;
  private endlessPanel!: EndlessPanel;
  private decreePanel!: DecreeQuestPanel;
  /** Which offer the open RewardModal shows (kind + cards). */
  private rewardKey: string | null = null;
  private scoutModal: ScoutModal | null = null;
  private pending: Pending = NO_PENDING;
  /** A locked plot offered for purchase (set by RealmScene), shown with its price and ✓/✕. */
  private buy: { plot: number; price: number } | null = null;
  private toasts!: ToastStack;
  private illegal: IllegalReason | null = null;
  private illegalTimer: Phaser.Time.TimerEvent | null = null;
  private plotTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super(SCENES.planningHud);
  }

  /** The realm camera as RealmScene last set it (`realm:view`): screen points map to plots through it. */
  private view: CameraView = { zoom: 1, scroll: { x: 0, y: 0 } };

  create(data: RealmHudData): void {
    bindSceneDisplay(this, () => this.layout());
    this.handScroll = 0;
    // Scene instances are reused: reset every per-launch field first.
    this.bus = data.bus;
    this.controller = data.controller;
    this.offs = [];
    this.lastGold = null;
    this.lastFlyState = null;
    this.reward = null;
    this.council = null;
    this.quest = null;
    this.blessing = null;
    this.rewardKey = null;
    this.scoutModal = null;
    this.calendarModal = null;
    this.deckModal = null;
    this.actionSize = { w: 0, h: 0 };
    this.inspected = null;
    this.pending = NO_PENDING;
    this.buy = null;
    this.freeMove = null;
    this.illegal = null;
    this.illegalTimer = null;
    this.plotTimer = null;
    this.hoveredPlot = null;
    this.lay = this.currentLayout();
    this.view = overviewView(
      logicalSize(this),
      'planning',
      this.controller.state.mode,
    );

    this.tooltip = new Tooltip(this);
    this.toasts = new ToastStack(this, MODAL_DEPTH + 50);
    this.info = new InspectionView(this, MODAL_DEPTH - 50, () => {
      this.inspected = null;
      this.bus.emit('ui:range-selection', { target: null, mode: 'selected' });
    });
    const tip = (lines: string[]): TooltipSource => ({
      host: this.tooltip,
      content: () => textContent(lines),
    });

    this.livesBox = createPanel(this, 'panel', 120, 52);
    const tex = this.textures;
    this.livesIcon =
      tex.exists(SPRITES_KEY) && tex.get(SPRITES_KEY).has(iconFrame('crown'))
        ? this.add.image(0, 0, SPRITES_KEY, iconFrame('crown')).setScale(2).setOrigin(0, 0.5)
        : null;
    this.livesText = addUiText(this, 0, 0, '', 18).setOrigin(0, 0.5).setFontStyle('bold');
    // Year label and the two status rows float over the world (light text, dark shadow) instead of sitting in frames.
    const floating = (origin: number): Phaser.GameObjects.Text =>
      this.add
        .text(0, 0, '', textStyle(16, UI_PALETTE.creamLight))
        .setOrigin(origin, 0.5)
        .setFontStyle('bold')
        .setShadow(2, 2, toCss(UI_PALETTE.outline), 0, false, true);
    this.yearText = floating(0.5);
    this.allyText = floating(0);
    this.foeText = floating(1);
    this.goldBox = createPanel(this, 'panel', 120, 52);
    this.goldIcon =
      tex.exists(SPRITES_KEY) && tex.get(SPRITES_KEY).has(iconFrame('gold'))
        ? this.add.image(0, 0, SPRITES_KEY, iconFrame('gold')).setScale(2).setOrigin(0, 0.5)
        : null;
    this.goldText = addUiText(this, 0, 0, '', 18).setOrigin(0, 0.5).setFontStyle('bold');
    this.calendar = new CalendarStrip(this, CONTENT, this.tooltip, () =>
      this.bus.emit('ui:open-modal', { modal: 'calendar' }),
    );

    this.scout = new ScoutPanel(this, CONTENT, () =>
      this.bus.emit('ui:open-modal', { modal: 'scout' }),
    );
    this.hand = new HandView(this, CONTENT, this.tooltip, 6);
    this.decreePanel = new DecreeQuestPanel(this, this.bus, this.controller.state);
    this.endlessPanel = new EndlessPanel(
      this,
      this.controller.state,
      this.tooltip,
      () => this.bus.emit('ui:open-modal', { modal: 'endless' }),
      () => this.bus.emit('ui:close-modal', {}),
    ).setDepth(0, MODAL_DEPTH + 20);
    this.hand.onSelect((i) => this.selectCard(i));
    this.hand.onDrop((i, x, y) => this.dropCard(i, x, y));

    this.questNotice = new QuestNoticeView(this, this.tooltip, () => {
      if (!this.decreePanel.openQuests()) this.bus.emit('ui:help', { open: true, tab: 'quests' });
    });
    this.questNotice.setState(this.controller.state);
    this.createActionButtons();
    this.freeMoveBtn = createButton(this, 0, 0, 'Dời trại', {
      width: this.lay.freeMove.w,
      height: this.lay.freeMove.h,
      fontSize: this.lay.desktop ? 15 : 13,
      onClick: () => this.toggleFreeMove(),
      tooltip: { host: this.tooltip, content: () => textContent(this.freeMoveTip()) },
    });
    this.scoutBtn = createButton(this, 0, 0, 'Địch', {
      width: 52,
      height: 52,
      fontSize: 13,
      onClick: () => this.bus.emit('ui:open-modal', { modal: 'scout' }),
      tooltip: tip(['Trinh sát', 'Xem đội quân địch năm nay.']),
    });
    this.helpBtn = createButton(this, 0, 0, '?', {
      width: this.lay.help.w,
      height: this.lay.help.h,
      fontSize: 22,
      onClick: () => this.bus.emit('ui:help', { open: true }),
      tooltip: tip([`Trợ giúp (${shortcutLabel('help')})`, 'Thẻ bài, cơ chế, phím tắt...']),
    });
    this.settingsBtn = createButton(this, 0, 0, '⚙', {
      width: 48,
      height: 48,
      fontSize: 22,
      onClick: () => openSettings(this, this.bus),
      tooltip: tip(['Cài đặt']),
    });
    this.shopBtn = createButton(this, 0, 0, 'Mua thẻ', {
      width: this.lay.shop.w,
      height: this.lay.shop.h,
      fontSize: 13,
      onClick: () => {
        if (this.modalOpen()) return;
        const reason = buyCardIllegal(this.controller.state, CONTENT);
        if (reason) this.flashIllegal(reason);
        else this.bus.emit('ui:command', { command: { type: 'buyCard' } });
      },
      onDisabledClick: () => {
        if (this.modalOpen()) return;
        const reason = buyCardIllegal(this.controller.state, CONTENT);
        if (reason) this.flashIllegal(reason);
      },
      tooltip: { host: this.tooltip, content: () => {
        const reason = buyCardIllegal(this.controller.state, CONTENT);
        return textContent([reason ? this.reasonText(reason) : 'Mua thêm một thẻ của vua.']);
      } },
    });
    this.confirmBtn = createButton(this, 0, 0, '✓\nĐặt', {
      width: 48,
      height: 48,
      fontSize: 13,
      onClick: () => this.bus.emit('ui:confirm-play', {}),
      tooltip: { host: this.tooltip, content: () => textContent(this.confirmTip()) },
    });
    this.cancelBtn = createButton(this, 0, 0, '✕\nHuỷ', {
      width: 48,
      height: 48,
      fontSize: 13,
      onClick: () => this.bus.emit('ui:cancel-play', {}),
      tooltip: tip(['Huỷ (Esc)']),
    });
    this.hint = new ContentBox(this, 'tooltip', this.lay.hint.w, { fontSize: 13 });

    const bus = this.bus;
    this.offs.push(
      bus.on('run:state', ({ state }) => this.refresh(state)),
      bus.on('realm:view', (view) => {
        this.view = view;
        this.tooltip.hide(PLOT_TIP);
      }),
      bus.on('ui:pending-play', (p) => {
        this.pending = { handIndex: p.handIndex, targets: [...p.targets], ready: p.ready };
        this.refreshPending();
      }),
      bus.on('run:illegal', ({ reason }) => {
        // Sync affordability before unlocking a refused pick on an open offer.
        if (reason === 'wrongPhase' || reason === 'badTarget' || reason === 'notEnoughGold') {
          this.reward?.setGold(this.controller.state.gold);
          this.reward?.retry();
        }
        if (reason === 'wrongPhase' || reason === 'badTarget') {
          this.blessing?.retry();
        }
        this.flashIllegal(reason);
      }),
      bus.on('log', ({ text }) => this.toasts.push(text)),
      bus.on('ui:pending-free-move', ({ active, from, to }) => {
        this.freeMove = active ? { from, to } : null;
        if (active) this.tooltip.hide(PLOT_TIP);
        this.refreshPending();
      }),
      bus.on('ui:pending-buy', ({ plot, price }) => {
        this.buy = plot === null ? null : { plot, price };
        this.refreshPending();
      }),
      bus.on('ui:open-modal', ({ modal }) => this.openModal(modal)),
      bus.on('ui:close-modal', () => this.closeModals()),
      bus.on('ui:help', ({ open, tab }) => {
        if (open) openHelp(this, this.bus, null, tab);
      }),
      bus.on('ui:inspect', ({ plot, x, y }) => this.inspect(plot, { x, y })),
      bus.on('ui:select-card', ({ handIndex }) => {
        if (handIndex !== null) this.inspect(null, { x: 0, y: 0 });
      }),
    );

    this.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.input.on('wheel', this.onHandWheel, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);

    this.applySkin();
    this.layout();
    this.refresh(this.controller.state);
  }

  /** The playing king's colours on the HUD panels, buttons and hand. */
  private applySkin(): void {
    const king = this.controller.state.kingId;
    for (const b of [
      this.sellBtn,
      this.rerollBtn,
      this.deckBtn,
      this.freeMoveBtn,
      this.scoutBtn,
      this.helpBtn,
      this.shopBtn,
      this.confirmBtn,
      this.cancelBtn,
    ])
      b.setSkin(king);
    for (const box of [this.livesBox, this.goldBox]) box.setSkin(king);
    this.hand.setTheme(king);
  }

  // ---- state → widgets ---------------------------------------------------------------------

  /** Keep desktop cards at full size inside the scrolling hand window. */
  private placeHand(): void {
    const screen = logicalSize(this);
    if (!this.lay.desktop) {
      this.hand.onScroll(null);
      this.hand.layout(centerHand(this.lay.hand, this.handCount));
      return;
    }
    const window = handWindow(screen, this.handCount, this.handScroll);
    this.handScroll = Math.min(window.scrollMax, Math.max(0, this.handScroll));
    this.hand.onScroll(window.scrollMax > 0 ? (delta) => {
      if (this.modalOpen()) return;
      this.handScroll += delta;
      this.placeHand();
    } : null);
    this.hand.layout(window.cards, window.viewport);
  }

  private onHandWheel(pointer: Phaser.Input.Pointer, _over: unknown, dx: number, dy: number): void {
    if (!this.lay.desktop || this.modalOpen() || this.controller.state.phase !== 'planning') return;
    const { viewport, scroll } = handWindow(logicalSize(this), this.handCount, this.handScroll);
    const point = logicalPointer(this, pointer);
    if (point.x < viewport.x || point.x > viewport.x + viewport.w || point.y < viewport.y - 12 || point.y > viewport.y + viewport.h) return;
    this.handScroll = scroll + Math.sign(dx || dy) * HAND_STEP;
    this.placeHand();
  }
  /** A card-sized panel flies from hand slot `index` to `plot` in CARD_FLY_MS, shrinking and fading (juice §11.5). */
  private flyCard(index: number, handSize: number, plot: number): void {
    const slots = this.lay.desktop
      ? handWindow(logicalSize(this), handSize, this.handScroll).cards
      : centerHand(this.lay.hand, handSize);
    const from = slots[Math.min(Math.max(0, index), slots.length - 1)];
    if (!from) return;
    const to = this.plotRect(plot);
    const card = createPanel(this, 'card', Math.round(from.w), Math.round(from.h));
    const img = card.image.setDepth(60).setPosition(Math.round(from.x), Math.round(from.y));
    const tx = Math.round(to.x + to.w / 2 - from.w / 4);
    const ty = Math.round(to.y + to.h / 2 - from.h / 4);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: CARD_FLY_MS,
      ease: 'Quad.easeIn',
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        img
          .setPosition(
            Math.round(from.x + (tx - from.x) * t),
            Math.round(from.y + (ty - from.y) * t),
          )
          .setAlpha(1 - 0.6 * t);
        card.resize(
          Math.max(8, Math.round(from.w * (1 - 0.5 * t))),
          Math.max(8, Math.round(from.h * (1 - 0.5 * t))),
        );
      },
      onComplete: () => img.destroy(),
    });
  }

  /** `+N` in gold rising from the gold counter for COIN_FLY_MS, whole pixels (juice §11.5). */
  private floatGold(gain: number): void {
    const x = Math.round(this.goldText.x + this.goldText.width + 8);
    const y = Math.round(this.goldText.y);
    const text = addUiText(this, x, y, `+${gain}`, 16, UI_PALETTE.gold)
      .setOrigin(0, 0.5)
      .setFontStyle('bold')
      .setDepth(50);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: COIN_FLY_MS,
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        text.setY(Math.round(y - COIN_RISE_PX * t)).setAlpha(1 - t * t);
      },
      onComplete: () => text.destroy(),
    });
  }

  private refresh(state: RunState): void {
    const flyFrom = this.lastFlyState;
    this.lastFlyState = state;
    if (flyFrom !== null) {
      const plot = playedPlot(flyFrom, state);
      if (plot !== null) this.flyCard(this.pending.handIndex ?? 0, flyFrom.hand.length, plot);
    }
    if (this.lay.hand.length !== handSlots(state)) this.layout(); // a bought card grew the hand row
    this.decreePanel.setState(state);
    this.endlessPanel.setState(state);
    this.questNotice.setState(state);
    this.refreshModals(state);
    this.livesText.setText(`× ${state.lives}`);
    this.goldText.setText(`${state.gold}`);
    if (this.lastGold !== null && state.gold > this.lastGold)
      this.floatGold(state.gold - this.lastGold);
    this.lastGold = state.gold;
    this.yearText.setText(yearLabel(state));
    fitTextWidth(this.yearText, isDesktop(logicalSize(this).w) ? 18 : 15, 11, this.lay.year.w);
    this.allyText.setText(allyStatusText(state.kingId, CONTENT));
    this.foeText.setText(foeStatusText(calendarCells(state, 1)[0], CONTENT));
    this.calendar.setCells(calendarCells(state, 5));
    this.scout.setPlan(state.army);
    if (this.inspected !== null) {
      const model = buildingInfoModel(state, this.inspected, CONTENT, undefined, this.controller.lastBattleDamage);
      if (model === null || state.phase !== 'planning') this.inspect(null, { x: 0, y: 0 });
      else this.info.setBuilding(model);
    }

    const planning = state.phase === 'planning';
    // Any number of cards may be played or sold each year (owner 2026-11-10); rerolls only before the first.
    const choosing = planning;
    this.hand.setHand(
      choosing ? state.hand : [],
      state.hand.map((id) => !canPlayCard(state, CONTENT, id)),
      state.hand.map((id) => {
        const card = CONTENT.card(id);
        return cardBadge(card, willLevelUpTo(state.plots, card));
      }),
    );
    this.sellBtn.setVisible(choosing && state.hand.length > 0);
    this.rerollBtn.setVisible(choosing && !state.played);
    this.deckBtn.setVisible(planning);
    this.shopBtn.setVisible(planning);
    this.shopBtn.setLabel(`Mua thẻ · ${shopPrice(state)} vàng`);
    this.shopBtn.setEnabled(buyCardIllegal(state, CONTENT) === null);
    this.refreshActions(state);
    this.handCount = state.hand.length;
    this.placeHand();

    const offers = state.phase === 'reward' || state.phase === 'conquest' ? cardOffer(state) : null;
    // The reward step is followed by a conquest step: a new offer replaces the open modal.
    const offerKey = offers ? JSON.stringify([offers.kind, offers.cardIds, offers.kind === 'merchant' ? offers.price : null]) : null;
    if (this.reward && offerKey !== this.rewardKey) {
      this.reward.destroy();
      this.reward = null;
    }
    if (offers && !this.reward) {
      this.rewardKey = offerKey;
      this.reward = new RewardModal(
        this,
        CONTENT,
        offers.cardIds,
        this.tooltip,
        (index) => this.bus.emit('ui:command', { command: { type: 'pickOffer', index } }),
        {
          skin: state.kingId,
          heading: offerHeadingFor(offers, (id) => CONTENT.enemyKing(id).nameVi),
          merchant: offers.kind === 'merchant' ? { price: offers.price ?? RUN.merchantPrice, gold: state.gold } : undefined,
        },
      ).setDepth(MODAL_DEPTH);
    }
    this.reward?.setGold(state.gold);
    if (!choosing && this.pending.handIndex !== null) this.pending = NO_PENDING;
    if (!planning) this.buy = null;
    this.refreshPending();
  }

  /** Council and quest modals follow the open offer: made when it opens, kept in sync, dropped when it closes. */
  private refreshModals(state: RunState): void {
    const kind = modalKind(state);
    if (kind === 'council') {
      if (this.council) this.council.setState(state);
      else
        this.council = new CouncilModal(this, this.bus, state, this.tooltip).setDepth(MODAL_DEPTH);
    } else if (this.council) {
      this.council.destroy();
      this.council = null;
    }
    if (kind === 'blessing') {
      if (this.blessing) this.blessing.setState(state);
      else {
        this.blessing = new BlessingModal(
          this,
          state,
          this.tooltip,
          (command) => this.bus.emit('ui:command', { command }),
          () => this.bus.emit('ui:open-modal', { modal: 'endless' }),
        ).setDepth(MODAL_DEPTH);
      }
    } else if (this.blessing) {
      this.blessing.destroy();
      this.blessing = null;
    }
    if (kind === 'quest') {
      if (this.quest) this.quest.setState(state);
      else this.quest = new QuestModal(this, this.bus, state).setDepth(MODAL_DEPTH);
    } else if (this.quest) {
      this.quest.destroy();
      this.quest = null;
    }
  }

  private rerollPrice(state: RunState): number {
    return rerollPrice(state);
  }

  /** Labels, enabled state of Bán bài / Đổi bài / Bộ bài (they stay hoverable to say why not). */
  private refreshActions(state: RunState): void {
    const price = this.rerollPrice(state);
    const desktop = this.lay.desktop;
    this.sellBtn.setLabel(
      desktop ? `Bán bài (+${RUN.skipPlayGold})` : `Bán bài\n+${RUN.skipPlayGold}`,
    );
    this.rerollBtn.setLabel(desktop ? `Đổi bài (${price})` : `Đổi bài\n${price} vàng`);
    this.deckBtn.setLabel(
      desktop ? `Bộ bài (${state.deck.length})` : `Bộ bài\n${state.deck.length}`,
    );
    this.sellBtn.setEnabled(this.pending.handIndex !== null);
    this.rerollBtn.setEnabled(state.gold >= price);
    const left = freeMovesLeft(state, CONTENT);
    this.freeMoveBtn.setVisible(showFreeMove(state));
    this.freeMoveBtn.setLabel(freeMoveLabel(left, desktop, this.freeMove !== null));
    this.freeMoveBtn.setEnabled(left > 0 || this.freeMove !== null);
  }

  private freeMoveTip(): string[] {
    if (this.freeMove !== null) return ['Huỷ dời (Esc)'];
    const left = freeMovesLeft(this.controller.state, CONTENT);
    return left > 0
      ? [
          'Dời trại',
          `Dời một công trình sang ô kề (có công trình thì đổi chỗ), không tốn thẻ. Còn ${left} lượt năm nay.`,
        ]
      : ['Dời trại', 'Năm nay đã hết lượt dời miễn phí.'];
  }

  /** "Dời trại": start picking a free move on the board, or drop the one being picked. */
  private toggleFreeMove(): void {
    if (this.freeMove !== null) {
      this.bus.emit('ui:free-move', { active: false });
      return;
    }
    const state = this.controller.state;
    if (!showFreeMove(state) || this.modalOpen()) return;
    if (freeMovesLeft(state, CONTENT) === 0) {
      this.flashIllegal('noFreeMove');
      return;
    }
    this.inspect(null, { x: 0, y: 0 });
    this.bus.emit('ui:free-move', { active: true });
  }

  /** The free move ready for ✓ (both plots picked), or null. */
  private freeMoveDone(): { from: number; to: number } | null {
    const f = this.freeMove;
    return f !== null && freeMoveReady(f) ? { from: f.from!, to: f.to! } : null;
  }

  /** A refusal said the way the current pick needs it (a relocation words a few reasons differently). */
  private reasonText(reason: IllegalReason): string {
    return this.freeMove !== null ? freeMoveReasonText(reason) : illegalText(reason);
  }

  private sellTip(): string[] {
    return this.pending.handIndex === null
      ? ['Bán bài (S)', 'Chọn một thẻ để bán.']
      : ['Bán bài (S)', `Bán lá đang chọn lấy ${RUN.skipPlayGold} vàng, thay cho việc chơi thẻ.`];
  }

  private rerollTip(): string[] {
    const state = this.controller.state;
    const price = this.rerollPrice(state);
    return state.gold < price
      ? ['Đổi bài (R)', 'Không đủ vàng.']
      : ['Đổi bài (R)', `Bỏ cả tay và rút lại: ${price} vàng (lần sau đắt gấp đôi).`];
  }

  private refreshPending(): void {
    const p = this.pending;
    this.hand.setSelected(p.handIndex);
    this.placeHand();
    this.refreshActions(this.controller.state);
    const buy = this.buy;
    const moved = this.freeMoveDone();
    const last = buy ? buy.plot : moved ? moved.to : p.targets.at(-1);
    const show = buy !== null || p.ready || moved !== null;
    if (show) {
      const screen = logicalSize(this);
      // A no-target tome has no plot: ✓/✕ take their default spot.
      const { confirm, cancel } =
        last === undefined
          ? { confirm: this.lay.confirm, cancel: this.lay.cancel }
          : confirmFor(this.lay, this.plotRect(last), screen);
      this.confirmBtn.container.setPosition(confirm.x + confirm.w / 2, confirm.y + confirm.h / 2);
      this.cancelBtn.container.setPosition(cancel.x + cancel.w / 2, cancel.y + cancel.h / 2);
    }
    this.confirmBtn.setLabel(
      buy ? '✓\nMua' : moved ? '✓\nDời' : p.ready && last === undefined ? '✓\nDùng' : '✓\nĐặt',
    );
    this.confirmBtn.setEnabled(buy === null || this.controller.state.gold >= buy.price);
    this.confirmBtn.setVisible(show);
    this.cancelBtn.setVisible(show);
    if (p.handIndex === null && this.freeMove === null) this.tooltip.hide(PLOT_TIP);
    this.refreshHint();
  }

  private refreshHint(): void {
    const content = this.hintContent();
    // On mobile ✓/✕ take the row above the board, which the hint shares.
    const hidden =
      !this.lay.desktop &&
      (this.pending.ready || this.buy !== null || this.freeMoveDone() !== null) &&
      this.illegal === null;
    this.hint.setContent(hidden ? null : content);
    const { x, y, w } = this.lay.hint;
    this.hint.setPosition(this.lay.desktop ? x + (w - this.hint.width) / 2 : x, y);
  }

  private hintContent(): TooltipContent | null {
    if (this.illegal !== null) return { lines: [[{ text: this.reasonText(this.illegal) }]] };
    const state = this.controller.state;
    if (this.freeMove !== null) {
      const text = freeMoveHint(this.freeMove, this.lay.desktop);
      return this.lay.desktop
        ? { title: 'Dời trại', lines: [[{ text }]] }
        : { lines: [[{ text }]] };
    }
    if (this.buy) {
      const text =
        state.gold >= this.buy.price ? `Mở ô này: ${this.buy.price} vàng.` : 'Không đủ vàng.';
      return this.lay.desktop
        ? { title: 'Mở ô mới', lines: [[{ text }]] }
        : { lines: [[{ text }]] };
    }
    const p = this.pending;
    const cardId = p.handIndex === null ? undefined : state.hand[p.handIndex];
    if (cardId === undefined) return state.phase === 'planning' ? { lines: [[{ text: planningHint(state) }]] } : null;
    const card = CONTENT.card(cardId);
    const two = targetCount(card) === 2;
    let line: string;
    if (p.ready) line = this.lay.desktop ? 'Bấm ✓ để xác nhận, ✕ để huỷ.' : 'Bấm ✓ hoặc ✕.';
    else if (two && p.targets.length === 0) line = 'Chọn công trình đầu tiên (viền xanh).';
    else if (two) line = 'Chọn công trình hoặc ô thứ hai.';
    else if (card.kind === 'enchantment') line = 'Chọn công trình để gắn Bùa.';
    else if (card.kind === 'tome') line = 'Chọn một ô viền xanh.';
    else line = 'Chọn ô trống, hoặc bản cùng loại để lên cấp.';
    return this.lay.desktop
      ? { title: card.nameVi, lines: [[{ text: line }]] }
      : { lines: [[{ text: line }]] };
  }

  /** Tooltip of ✓: what exactly the play will do (level-up preview, enchantment, purchase). */
  private confirmTip(): string[] {
    const state = this.controller.state;
    const moved = this.freeMoveDone();
    if (moved) {
      const swap = (state.plots[moved.to]?.building ?? null) !== null;
      return ['Dời trại (Enter)', swap ? 'Đổi chỗ hai công trình.' : 'Dời công trình sang ô này.'];
    }
    if (this.buy) {
      return [
        `Mua ô (Enter)`,
        state.gold >= this.buy.price ? `Giá ${this.buy.price} vàng.` : 'Không đủ vàng.',
      ];
    }
    const p = this.pending;
    const cardId = p.handIndex === null ? undefined : state.hand[p.handIndex];
    if (cardId === undefined) return ['Đặt (Enter)'];
    const card = CONTENT.card(cardId);
    const plot = p.targets.at(-1);
    const building = plot === undefined ? null : (state.plots[plot]?.building ?? null);
    if (building && building.cardId === card.id && building.level < RUN.maxLevel) {
      const next = (building.level + 1) as 2 | 3 | 4 | 5;
      return [`${card.nameVi} → Cấp ${next} (Enter)`, describeCard(card, next).lines[0] ?? ''];
    }
    if (card.kind === 'enchantment') return ['Gắn Bùa (Enter)', describeCard(card).lines[0] ?? ''];
    if (card.kind === 'tome') return ['Dùng sách (Enter)', describeCard(card).lines[0] ?? ''];
    return ['Đặt (Enter)'];
  }

  private flashIllegal(reason: IllegalReason): void {
    this.illegal = reason;
    this.illegalTimer?.remove(false);
    this.illegalTimer = this.time.delayedCall(ILLEGAL_MS, () => {
      this.illegal = null;
      this.illegalTimer = null;
      this.refreshHint();
    });
    this.refreshHint();
  }

  // ---- intents --------------------------------------------------------------------------

  private selectCard(index: number): void {
    const state = this.controller.state;
    if (state.phase !== 'planning' || state.hand[index] === undefined) return;
    const next = this.pending.handIndex === index ? null : index;
    this.bus.emit('ui:select-card', { handIndex: next });
  }

  /** A hand card released over the board: play it there, aim it (two-target cards) or say why not. */
  private dropCard(index: number, x: number, y: number): void {
    const state = this.controller.state;
    const cardId = state.hand[index];
    if (state.phase !== 'planning' || cardId === undefined) return;
    if (this.modalOpen()) return;
    const plot = this.plotAt({ x, y });
    if (plot === null) return; // released off the board: the card just returns to the hand
    const out = dropOutcome(
      state.plots,
      CONTENT.card(cardId),
      plot,
      maxEnchantStacks(state, CONTENT),
    );
    if (out.action === 'reject') {
      if (this.pending.handIndex !== index) this.bus.emit('ui:select-card', { handIndex: index });
      this.flashIllegal(out.reason);
      return;
    }
    this.bus.emit('ui:drop-card', { handIndex: index, plot });
  }

  /** Bỏ lá đang chọn thay cho việc chơi thẻ (nút Bỏ bài / phím S); không chọn gì thì không làm gì. */
  private sell(): void {
    const handIndex = this.pending.handIndex;
    if (handIndex === null || this.controller.state.hand[handIndex] === undefined) return;
    this.bus.emit('ui:command', { command: { type: 'discard', handIndex } });
  }

  /** Đổi bài (phím R): bỏ cả tay và rút lại; thiếu vàng thì chỉ nhắc lý do. */
  private reroll(): void {
    const state = this.controller.state;
    if (state.phase !== 'planning' || state.played) return;
    if (state.gold < this.rerollPrice(state)) {
      this.flashIllegal('notEnoughGold');
      return;
    }
    this.bus.emit('ui:command', { command: { type: 'reroll' } });
  }

  private modalOpen(): boolean {
    return Boolean(
      this.reward ||
      this.council ||
      this.quest ||
      this.blessing ||
      this.scoutModal ||
      this.calendarModal ||
      this.deckModal ||
      this.decreePanel.isOpen ||
      this.endlessPanel.isOpen,
    );
  }

  /** Keys of the blessing offer: 1–3 and the arrows move the focus (Enter picks it, in `onKey`). */
  private blessingKey(event: KeyboardEvent): boolean {
    const blessing = this.blessing;
    if (!blessing || this.endlessPanel.isOpen || event.ctrlKey || event.altKey || event.metaKey)
      return false;
    const key = event.key;
    if (key === '1' || key === '2' || key === '3') blessing.focusAt(Number(key) - 1);
    else if (key === 'ArrowLeft' || key === 'ArrowUp') blessing.focusBy(-1);
    else if (key === 'ArrowRight' || key === 'ArrowDown') blessing.focusBy(1);
    else return false;
    return true;
  }

  private onKey(event: KeyboardEvent): void {
    if (this.blessingKey(event)) return;
    const mandatory =
      this.reward !== null ||
      this.council !== null ||
      this.quest !== null ||
      this.blessing !== null;
    const action = resolveShortcut(
      event.key,
      'planning',
      shortcutFlags(event, {
        // The summary panel over the blessing offer answers Esc first; the offer itself never does.
        mandatoryOpen: mandatory && !this.endlessPanel.isOpen,
        sideModalOpen:
          this.decreePanel.isOpen ||
          this.scoutModal !== null ||
          this.calendarModal !== null ||
          this.deckModal !== null ||
          this.endlessPanel.isOpen,
      }),
    );
    if (action === null) return;
    if (action === 'help.toggle') {
      event.preventDefault();
      this.bus.emit('ui:help', { open: true });
      return;
    }
    if (this.endlessPanel.isOpen) {
      if (action === 'cancel') this.bus.emit('ui:close-modal', {});
      return;
    }
    if (this.reward) {
      if (action === 'confirm') this.reward.confirm();
      return;
    }
    if (this.blessing) {
      if (action === 'confirm') this.blessing.pickFocused();
      return; // mandatory: Esc does not skip it
    }
    if (this.council || this.quest) return; // mandatory decisions: Esc does not skip them
    if (this.decreePanel.isOpen) {
      if (action === 'cancel') this.decreePanel.closeView();
      return;
    }
    if (this.scoutModal || this.calendarModal || this.deckModal) {
      if (action === 'cancel') this.bus.emit('ui:close-modal', {});
      return;
    }
    const state = this.controller.state;
    if (state.phase !== 'planning') return;
    switch (action) {
      case 'reroll':
        this.reroll();
        break;
      case 'deck':
        this.bus.emit('ui:open-modal', { modal: 'deck' });
        break;
      case 'calendar':
        this.bus.emit('ui:open-modal', { modal: 'calendar' });
        break;
      case 'select.1':
      case 'select.2':
      case 'select.3':
      case 'select.4':
        this.selectCard(Number(action.slice(-1)) - 1);
        break;
      case 'sell':
        this.sell();
        break;
      case 'confirm':
        if (this.buy && state.gold < this.buy.price) this.flashIllegal('notEnoughGold');
        else if (this.pending.ready || this.buy || this.freeMoveDone())
          this.bus.emit('ui:confirm-play', {});

        break;
      case 'cancel':
        if (this.pending.handIndex !== null || this.buy || this.freeMove)
          this.bus.emit('ui:cancel-play', {});
        break;
    }
  }

  // ---- red-plot reasons (hover / long-press) --------------------------------------------

  /** Why `plot` cannot take the aimed card, or null (legal, nothing aimed, or off-board). */
  private plotReason(x: number, y: number): { plot: number; reason: IllegalReason } | null {
    if (this.modalOpen()) return null;
    const p = this.pending;
    const state = this.controller.state;
    if (this.freeMove !== null) {
      const plot = this.plotAt({ x, y });
      const reason = plot === null ? null : freeMoveReason(state, CONTENT, this.freeMove, plot);
      return plot === null || reason === null ? null : { plot, reason };
    }
    const cardId = p.handIndex === null ? undefined : state.hand[p.handIndex];
    if (cardId === undefined) return null;
    const plot = this.plotAt({ x, y });
    if (plot === null) return null;
    const reason = plotIllegalReason(
      state.plots,
      CONTENT.card(cardId),
      p.targets,
      plot,
      maxEnchantStacks(state, CONTENT),
    );
    return reason === null ? null : { plot, reason };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.wasTouch) {
      if (pointer.isDown && logicalPointerDistance(this, pointer) > 8) this.stopPlotTimer();
      return;
    }
    const point = logicalPointer(this, pointer);
    const hit = this.plotReason(point.x, point.y);
    if (hit)
      this.tooltip.showAtPointer({ title: this.reasonText(hit.reason), lines: [] }, PLOT_TIP);
    else this.tooltip.hide(PLOT_TIP);
    this.hoverRange(point);
  }

  /** Mouse over a built plot shows its rings (desktop); leaving, a modal or a chosen card clears them. */
  private hoverRange(point: { x: number; y: number }): void {
    const state = this.controller.state;
    const plot =
      this.modalOpen() || state.phase !== 'planning'
        ? null
        : (this.buildingAt(point) ?? this.plotAt(point));
    const built = plot !== null && state.plots[plot]?.building ? plot : null;
    if (built === this.hoveredPlot) return;
    this.hoveredPlot = built;
    this.bus.emit('ui:range-selection', {
      target: built === null ? null : { kind: 'plot', plot: built },
      mode: 'hover',
    });
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) return;
    this.stopPlotTimer();
    const point = logicalPointer(this, pointer);
    const hit = this.plotReason(point.x, point.y);
    if (!hit) return;
    this.plotTimer = this.time.delayedCall(LONG_PRESS_MS, () => {
      this.plotTimer = null;
      const r = this.plotRect(hit.plot);
      this.tooltip.showAbove({ title: this.reasonText(hit.reason), lines: [] }, r, PLOT_TIP);
    });
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) return;
    this.stopPlotTimer();
    this.tooltip.hide(PLOT_TIP);
  }

  /** Plot under a screen point through the live realm camera (zoom and pan), null off the board. */
  private plotAt(p: { x: number; y: number }): number | null {
    return plotAtView(
      this.view,
      logicalSize(this),
      p,
      this.controller.state.mode,
    );
  }

  /** Building whose drawn art is under screen point `p` (the same pick as a click in RealmScene), else null. */
  private buildingAt(p: { x: number; y: number }): number | null {
    const state = this.controller.state;
    const cam = screenToWorld(p, this.view.scroll, logicalSize(this), this.view.zoom);
    const boxes = boardBuildingBoxes(this.textures, state, CONTENT, state.mode);
    return pickSprite(boxes, cam, PICK_SLOP / this.view.zoom, atlasOpacity(this.textures));
  }

  /** Screen rect of a plot through the live realm camera. */
  private plotRect(plot: number): { x: number; y: number; w: number; h: number } {
    return plotRectAtView(
      this.view,
      logicalSize(this),
      plot,
      this.controller.state.mode,
    );
  }

  private stopPlotTimer(): void {
    this.plotTimer?.remove(false);
    this.plotTimer = null;
  }

  // ---- building info (§10.7) ---------------------------------------------------------------

  private inspect(plot: number | null, anchor: { x: number; y: number }): void {
    const model =
      plot === null || this.modalOpen()
        ? null
        : buildingInfoModel(this.controller.state, plot, CONTENT, undefined, this.controller.lastBattleDamage);
    if (plot === null || model === null) {
      this.inspected = null;
      this.info.hide();
      this.bus.emit('ui:range-selection', { target: null, mode: 'selected' });
      return;
    }
    this.inspected = plot;
    this.bus.emit('ui:range-selection', { target: { kind: 'plot', plot }, mode: 'selected' });
    this.info.showBuilding(
      model,
      anchor,
      logicalSize(this),
      planningControls(this.lay),
    );
  }

  // ---- modals ------------------------------------------------------------------------------

  private openModal(modal: 'scout' | 'calendar' | 'deck' | 'endless'): void {
    // The summary panel may open over the blessing offer (it only reads); everything else needs a free screen.
    if (
      modal === 'endless' &&
      !this.endlessPanel.isOpen &&
      (this.blessing !== null || !this.modalOpen())
    ) {
      this.inspect(null, { x: 0, y: 0 });
      this.tooltip.hide(PLOT_TIP);
      this.endlessPanel.setOpen(true);
      return;
    }
    if (modal === 'endless' || this.modalOpen()) return;
    const state = this.controller.state;
    this.inspect(null, { x: 0, y: 0 });
    this.tooltip.hide(PLOT_TIP);
    if (modal === 'scout') this.openScout();
    else if (modal === 'calendar') {
      this.calendarModal = new CalendarModal(
        this,
        CONTENT,
        state,
        this.tooltip,
        () => this.bus.emit('ui:close-modal', {}),
        state.kingId,
      ).setDepth(MODAL_DEPTH);
    } else {
      this.deckModal = new DeckModal(
        this,
        CONTENT,
        state.deck,
        this.tooltip,
        () => this.bus.emit('ui:close-modal', {}),
        state.kingId,
      ).setDepth(MODAL_DEPTH);
    }
  }

  private closeModals(): void {
    this.endlessPanel.setOpen(false);
    this.closeScout();
    this.calendarModal?.destroy();
    this.calendarModal = null;
    this.deckModal?.destroy();
    this.deckModal = null;
  }

  // ---- scout modal (mobile) ---------------------------------------------------------------

  private openScout(): void {
    if (this.scoutModal) return;
    const overlay = createOverlay(this);
    overlay.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () =>
      this.bus.emit('ui:close-modal', {}),
    );
    const panel = new ScoutPanel(this, CONTENT);
    panel.setPlan(this.controller.state.army);
    const close = createButton(this, 0, 0, '✕', {
      width: CLOSE_BUTTON,
      height: CLOSE_BUTTON,
      fontSize: 20,
      onClick: () => this.bus.emit('ui:close-modal', {}),
      tooltip: { host: this.tooltip, content: () => textContent(['Đóng (Esc)']) },
    });
    const root = this.add
      .container(0, 0, [overlay, panel.container, close.container])
      .setDepth(MODAL_DEPTH);
    this.scoutModal = { root, overlay, panel, close };
    this.layoutScout();
  }

  private layoutScout(): void {
    const modal = this.scoutModal;
    if (!modal) return;
    fitOverlay(this, modal.overlay);
    const r = centredPanel(
      logicalSize(this),
      SCOUT_MODAL.w,
      SCOUT_MODAL.h,
    );
    modal.panel.layout(r, 'full');
    modal.close.container.setPosition(r.x + r.w - CLOSE_BUTTON / 2 - 4, r.y + CLOSE_BUTTON / 2 + 4);
  }

  private closeScout(): void {
    if (!this.scoutModal) return;
    this.scoutModal.panel.destroy();
    this.scoutModal.root.destroy();
    this.scoutModal = null;
  }

  // ---- layout ---------------------------------------------------------------------------

  /** Bán bài / Đổi bài / Bộ bài share a size that differs per layout, so they are rebuilt on change. */
  private createActionButtons(): void {
    const { w, h } = this.lay.sell;
    const fontSize = this.lay.desktop ? 15 : 13;
    const visible = [this.sellBtn, this.rerollBtn, this.deckBtn].map(
      (b) => b?.container.visible ?? false,
    );
    for (const b of [this.sellBtn, this.rerollBtn, this.deckBtn]) b?.container.destroy();
    this.actionSize = { w, h };
    const common = { width: w, height: h, fontSize, skin: this.controller.state.kingId };
    this.sellBtn = createButton(this, 0, 0, 'Bán bài', {
      ...common,
      onClick: () => this.sell(),
      tooltip: { host: this.tooltip, content: () => textContent(this.sellTip()) },
    });
    this.rerollBtn = createButton(this, 0, 0, 'Đổi bài', {
      ...common,
      onClick: () => this.reroll(),
      tooltip: { host: this.tooltip, content: () => textContent(this.rerollTip()) },
    });
    this.deckBtn = createButton(this, 0, 0, 'Bộ bài', {
      ...common,
      onClick: () => this.bus.emit('ui:open-modal', { modal: 'deck' }),
      tooltip: {
        host: this.tooltip,
        content: () => textContent(['Bộ bài (D)', 'Xem mọi thẻ đang có.']),
      },
    });
    this.sellBtn.setVisible(visible[0]!);
    this.rerollBtn.setVisible(visible[1]!);
    this.deckBtn.setVisible(visible[2]!);
  }

  private currentLayout(): PlanningLayout {
    return planningLayout(
      logicalSize(this),
      handSlots(this.controller.state),
      this.controller.state.mode,
    );
  }

  private layout(): void {
    const l = (this.lay = this.currentLayout());
    this.toasts.setAnchor(logicalSize(this).w / 2, l.lives.y + l.lives.h + 8, logicalSize(this).w - 32);
    this.livesBox.resize(l.lives.w, l.lives.h);
    this.livesBox.image.setPosition(l.lives.x, l.lives.y);
    const midY = l.lives.y + l.lives.h / 2;
    const iconX = l.lives.x + 12;
    this.livesIcon?.setPosition(iconX, midY);
    this.livesText.setPosition(iconX + (this.livesIcon ? 36 : 0), midY);
    this.yearText.setPosition(l.year.x + l.year.w / 2, l.year.y + l.year.h / 2);
    fitTextWidth(this.yearText, l.desktop ? 18 : 15, 11, l.year.w);
    const statusSize = l.desktop ? 15 : 13;
    this.allyText
      .setFontSize(statusSize)
      .setPosition(l.allyStatus.x + 4, l.allyStatus.y + l.allyStatus.h / 2)
      .setVisible(l.allyStatus.w >= 100);
    this.foeText
      .setFontSize(statusSize)
      .setPosition(l.foeStatus.x + l.foeStatus.w - 4, l.foeStatus.y + l.foeStatus.h / 2)
      .setVisible(l.foeStatus.w >= 100);

    this.goldBox.resize(l.gold.w, l.gold.h);
    this.goldBox.image.setPosition(l.gold.x, l.gold.y);
    const goldMid = l.gold.y + l.gold.h / 2;
    this.goldIcon?.setPosition(l.gold.x + 12, goldMid);
    this.goldText.setPosition(l.gold.x + 12 + (this.goldIcon ? 36 : 0), goldMid);
    this.calendar.layout(l.calendar, l.calendarLinks);
    this.scout.setVisible(l.scout !== null);
    if (l.scout) this.scout.layout(l.scout, 'full');
    this.helpBtn.container.setPosition(l.help.x + l.help.w / 2, l.help.y + l.help.h / 2);
    this.settingsBtn.container.setPosition(
      l.desktop ? l.help.x + 24 : MARGIN + 24,
      l.desktop ? l.help.y + l.help.h + 32 : l.calendar[0]!.y + l.calendar[0]!.h + 32,
    );
    this.endlessPanel.layoutButton(
      l.desktop
        ? { x: l.help.x + 56, y: l.help.y + l.help.h + 8, w: 96, h: 48 }
        : { x: MARGIN + 56, y: l.calendar[0]!.y + l.calendar[0]!.h + 8, w: 96, h: 48 },
    );
    this.endlessPanel.layout();
    const noticeX = l.help.x + l.help.w + 8;
    const noticeW = Math.min(320, l.calendar[0]!.x - 8 - noticeX);
    this.questNotice.layout(
      l.desktop && noticeW >= 160 ? { x: noticeX, y: l.help.y, w: noticeW, h: l.help.h } : null,
    );
    this.scoutBtn.setVisible(l.scoutButton !== null);
    if (l.scoutButton) {
      this.scoutBtn.container.setPosition(
        l.scoutButton.x + l.scoutButton.w / 2,
        l.scoutButton.y + l.scoutButton.h / 2,
      );
    }
    this.placeHand();
    if (this.actionSize.w !== l.sell.w || this.actionSize.h !== l.sell.h)
      this.createActionButtons();
    for (const [button, r] of [
      [this.sellBtn, l.sell],
      [this.rerollBtn, l.reroll],
      [this.deckBtn, l.deck],
    ] as const) {
      button.container.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    }
    this.shopBtn.resize(l.shop.w, l.shop.h);
    this.shopBtn.container.setPosition(l.shop.x + l.shop.w / 2, l.shop.y + l.shop.h / 2);
    this.freeMoveBtn.resize(l.freeMove.w, l.freeMove.h);
    this.freeMoveBtn.container.setPosition(
      l.freeMove.x + l.freeMove.w / 2,
      l.freeMove.y + l.freeMove.h / 2,
    );
    this.refreshActions(this.controller.state);
    this.hint.setMaxWidth(l.hint.w);
    this.hint.refresh();
    this.tooltip.refresh();
    this.reward?.layout();
    this.council?.layout();
    this.quest?.layout();
    this.blessing?.layout();
    this.decreePanel.layout(l);
    this.layoutScout();
    this.calendarModal?.layout();
    this.deckModal?.layout();
    this.info.layout(logicalSize(this), planningControls(l));
    this.refreshPending();
  }

  private teardown(): void {
    for (const off of this.offs) off();
    this.offs = [];
    this.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.input.off('wheel', this.onHandWheel, this);
    this.illegalTimer?.remove(false);
    this.stopPlotTimer();
    this.closeModals();
    this.calendar.destroy();
    this.questNotice.destroy();
    this.info.destroy();
    this.reward?.destroy();
    this.reward = null;
    this.council?.destroy();
    this.council = null;
    this.quest?.destroy();
    this.quest = null;
    this.blessing?.destroy();
    this.blessing = null;
    this.endlessPanel.destroy();
    this.decreePanel.destroy();
    this.hand.destroy();
    this.scout.destroy();
    this.hint.destroy();
    this.toasts.destroy();
    this.tooltip.destroy();
  }
}
