import type Phaser from 'phaser';
import type { CardId, KingId } from '../../data/types';
import type { Content } from '../../game/cards/registry';
import { CardView } from '../cards/CardView';
import type { Rect } from '../hud/layout';
import type { TooltipHost } from '../theme';

/** The planning hand grows with purchases. Pure display; clicks go to `onSelect`. */
export class HandView {
  private readonly cards: CardView[] = [];
  private handCount = 0;
  private king: KingId | null = null;
  private scroller: ((delta: number) => void) | null = null;
  private handler: ((index: number) => void) | null = null;
  private dropper: ((index: number, x: number, y: number) => void) | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly content: Content, private readonly tooltip: TooltipHost, slots = 4) {
    this.ensureSlots(slots);
  }

  ensureSlots(count: number): void {
    while (this.cards.length < count) {
      const i = this.cards.length;
      const card = new CardView(this.scene, this.content, { w: 120, h: 176 }, this.tooltip);
      card.setTheme(this.king);
      card.onClick(() => this.handler?.(i));
      card.onDrop((x, y) => this.dropper?.(i, x, y));
      card.onScroll(this.scroller);
      this.cards.push(card);
    }
  }

  onScroll(handler: ((delta: number) => void) | null): void {
    this.scroller = handler;
    for (const card of this.cards) card.onScroll(handler);
  }
  onSelect(handler: (index: number) => void): void {
    this.handler = handler;
  }

  /** A card dragged off its slot and released at screen (x, y). */
  onDrop(handler: (index: number, x: number, y: number) => void): void {
    this.dropper = handler;
  }

  /** Cards in hand order; missing slots are hidden and ignore input (`[]` hides the hand). */
  setHand(
    hand: readonly CardId[],
    dimmed: readonly boolean[] = [],
    badges: readonly (string | null)[] = [],
  ): void {
    this.handCount = hand.length;
    this.ensureSlots(hand.length);
    this.cards.forEach((card, i) => {
      card.setCard(hand[i] ?? null, { badge: badges[i] ?? null });
      card.setDimmed(dimmed[i] ?? false);
    });
  }

  /** Paint every card frame in a king's colours (`null`: the neutral frame). */
  setTheme(king: KingId | null): void {
    this.king = king;
    for (const card of this.cards) card.setTheme(king);
  }

  setSelected(index: number | null): void {
    this.cards.forEach((card, i) => card.setSelected(i === index));
  }

  layout(slots: readonly Rect[], viewport?: Rect): void {
    this.cards.forEach((card, i) => {
      const r = slots[i];
      if (!r) { card.container.setVisible(false); return; }

      card.resize({ w: r.w, h: r.h });
      card.setPosition(r.x, r.y);
      card.setWindow(viewport ?? null);
      if (i >= this.handCount) card.container.setVisible(false);
    });
  }

  /** Screen bounds of each card (for browser checks and anchoring). */
  bounds(): Phaser.Geom.Rectangle[] {
    return this.cards.map((c) => c.container.getBounds());
  }

  destroy(): void {
    for (const card of this.cards) card.destroy();
    this.cards.length = 0;
  }
}
