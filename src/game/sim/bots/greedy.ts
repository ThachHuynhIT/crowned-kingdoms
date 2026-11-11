/**
 * Greedy bot (G5, spec §14 G5): scores every legal play by the change of an estimated army power and plays the best.
 * Deterministic: it never draws from the bot Rng, never mutates its input and breaks ties by enumeration order
 * (handIndex, then plot, then first/second ascending).
 *
 * Power = Σ HP × DPS over our side of `buildBattleSetup` (throne once, structures by plot, their units, start summons
 * and throne mercenaries; never the enemy waves). It ignores future value (economy, summonEvery, ramp, DOT, healing,
 * splash): a stated limit of the heuristic, not something the rules bend to. It never plays a card that costs a life
 * (lives are not power; without this rule it spent every life on Eclipse Pact and Moon won 2.8%).
 */
import { canStartBattle } from '../../run/turn';
import { GREEDY_MAX_REROLLS, GREEDY_MAX_SHOP_PURCHASES, GREEDY_SHOP_RESERVE } from '../../../data/balance';
import { buyCardIllegal, shopPrice } from '../../run/shop';
import { ENDLESS_BLESSINGS } from '../../../data/endless';
import { unlockCost } from '../../../data/run';
import type { CardDef, CardId } from '../../../data/types';
import type { AttackStats, BattleSetup, StructureSetup, UnitStats } from '../../battle/types';
import { freeMoveIllegal, freeMovesAllowed } from '../../cards/custom/nomad';
import type { Content } from '../../cards/registry';
import { buildBattleSetup } from '../../run/battleSetup';
import { blessingStacks } from '../../run/endlessBlessings';
import { adjacentToUnlocked, checkPlay, targetCount } from '../../run/board';
import { applyCommand } from '../../run/commands';
import { rerollPrice } from '../../run/decrees';
import { cardOffer } from '../../run/flow';
import { maxEnchantStacks } from '../../run/perks';
import type { PlayTarget, RunCommand, RunState } from '../../run/state';
import type { Bot } from './random';
import { scriptedBot } from './scripted';

const TICKS_PER_SECOND = 10;

/** Damage per second of one attack profile; no attack or a non-positive interval gives 0. */
const dps = (attack: AttackStats | null | undefined): number =>
  attack && attack.interval > 0 ? (attack.dmg * TICKS_PER_SECOND) / attack.interval : 0;

const unitPower = (group: { stats: UnitStats; count: number } | null | undefined): number =>
  group ? group.count * group.stats.hp * dps(group.stats) : 0;

const structurePower = (s: StructureSetup): number => {
  const pulseDps =
    s.pulse && s.pulse.everyTicks > 0 ? (s.pulse.dmg * TICKS_PER_SECOND) / s.pulse.everyTicks : 0;
  const own = s.hp * (dps(s.attack) * (s.multiAttack ?? 1) + pulseDps);
  return own + unitPower(s.spawn) + unitPower(s.startSummon) + unitPower(s.spawnAtThrone);
};

/** Estimated power of our side of a battle setup (Σ HP × DPS). */
export function estimatePower(setup: BattleSetup): number {
  const structures = [...setup.structures].sort((a, b) => a.plot - b.plot);
  return structures.reduce((sum, s) => sum + structurePower(s), structurePower(setup.throne));
}

const powerOf = (state: RunState, content: Content): number =>
  estimatePower(buildBattleSetup(state, content));

/** Every target to try for a card, in enumeration order (not yet filtered); `plots` is 25, or 49 in Endless. */
const candidateTargets = (card: CardDef, plots: number): PlayTarget[] => {
  const count = targetCount(card);
  if (count === 0) return [{ kind: 'none' }];
  const targets: PlayTarget[] = [];
  for (let first = 0; first < plots; first++) {
    if (count === 1) {
      targets.push({ kind: 'plot', plot: first });
      continue;
    }
    for (let second = 0; second < plots; second++) targets.push({ kind: 'two', first, second });
  }
  return targets;
};

interface Scored {
  command: RunCommand;
  gain: number;
}

/** The best legal play of `state` (the reducer decides legality), or null when no card can be played. */
const bestPlay = (state: RunState, content: Content): Scored | null => {
  const base = powerOf(state, content);
  let best: Scored | null = null;
  state.hand.forEach((cardId, handIndex) => {
    const card = content.card(cardId);
    for (const target of candidateTargets(card, state.plots.length)) {
      if (checkPlay(state.plots, card, target, content, maxEnchantStacks(state, content)) !== null)
        continue;
      const command: RunCommand = { type: 'play', handIndex, target };
      const r = applyCommand(state, command, content);
      if ('error' in r) continue; // custom refusals (lastLife, max level, …)
      if (r.state.lives < state.lives) continue; // a life is not army power: never trade one (Eclipse Pact)
      const gain = powerOf(r.state, content) - base;
      if (best === null || gain > best.gain) best = { command, gain };
    }
  });
  return best;
};

/** Nomad: the free move with the largest strictly positive gain, or null. */
const bestFreeMove = (state: RunState, content: Content): Scored | null => {
  if (state.kingId !== 'nomad' || state.freeMovesUsed >= freeMovesAllowed(state, content))
    return null;
  const base = powerOf(state, content);
  let best: Scored | null = null;
  for (let from = 0; from < state.plots.length; from++) {
    for (let to = 0; to < state.plots.length; to++) {
      if (freeMoveIllegal(state, content, from, to) !== null) continue;
      const command: RunCommand = { type: 'freeMove', from, to };
      const r = applyCommand(state, command, content);
      if ('error' in r) continue;
      const gain = powerOf(r.state, content) - base;
      if (gain > 0 && (best === null || gain > best.gain)) best = { command, gain };
    }
  }
  return best;
};

/** The lowest buyable plot whose purchase makes a card playable, or null. */
const enablingPlot = (state: RunState, content: Content): RunCommand | null => {
  if (state.gold < unlockCost(state.purchasedPlots)) return null;
  for (let plot = 0; plot < state.plots.length; plot++) {
    if (state.plots[plot]!.unlocked || !adjacentToUnlocked(state.plots, plot)) continue;
    const command: RunCommand = { type: 'unlockPlot', plot };
    const r = applyCommand(state, command, content);
    if ('error' in r) continue;
    if (bestPlay(r.state, content) !== null) return command;
  }
  return null;
};

const legal = (state: RunState, command: RunCommand, content: Content): boolean =>
  !('error' in applyCommand(state, command, content));

const planning = (state: RunState, content: Content): RunCommand => {
  if (!state.autoFire) return { type: 'setAutoFire', on: true };
  // The battle starts by itself at the hand target (10/11/2026): mirror that so bot-driven loops match headless.
  if (canStartBattle(state)) return { type: 'startBattle' };
  const move = bestFreeMove(state, content);
  if (move !== null) return move.command;
  const play = bestPlay(state, content);
  if (play !== null) return play.command;
  const buy = enablingPlot(state, content);
  if (buy !== null) return buy;
  // Nothing worth playing: buy a card (bounded per year, a gold reserve kept), then try to play it.
  if (
    state.shopPurchasesThisYear < GREEDY_MAX_SHOP_PURCHASES &&
    buyCardIllegal(state, content) === null &&
    state.gold - shopPrice(state) >= GREEDY_SHOP_RESERVE
  )
    return { type: 'buyCard' };
  const reroll: RunCommand = { type: 'reroll' };
  if (
    state.rerollsThisYear < GREEDY_MAX_REROLLS &&
    state.gold >= rerollPrice(state) &&
    legal(state, reroll, content)
  )
    return reroll;
  // Nothing worth playing: sell down to the battle hand (owner 2026-11-10), then fight.
  if (!canStartBattle(state)) return { type: 'discard', handIndex: 0 };
  return { type: 'startBattle' };
};

/** Value of taking `cardId` now: the best play gain it would have on the current board (0 when unplayable). */
const offerValue = (state: RunState, content: Content, cardId: CardId): number => {
  const probe: RunState = {
    ...state,
    phase: 'planning',
    hand: [cardId],
    played: false,
    offers: null,
    pendingOffers: [],
  };
  return bestPlay(probe, content)?.gain ?? 0;
};

const pick = (state: RunState, content: Content): RunCommand => {
  const offer = cardOffer(state);
  const ids = offer?.cardIds ?? [];
  // Thương nhân: mua lá giá trị cao nhất nếu sau khi trả vẫn còn GREEDY_SHOP_RESERVE vàng, không thì bỏ qua.
  if (offer?.kind === 'merchant') {
    const price = offer.price ?? 0;
    if (ids.length === 0 || state.gold - price < GREEDY_SHOP_RESERVE) return { type: 'pickOffer', index: null };
    let bestAt = 0;
    let bestValue = offerValue(state, content, ids[0]!);
    for (let i = 1; i < ids.length; i++) {
      const value = offerValue(state, content, ids[i]!);
      if (value > bestValue) {
        bestAt = i;
        bestValue = value;
      }
    }
    return { type: 'pickOffer', index: bestAt };
  }
  if (ids.length === 0)
    return {
      type: 'pickOffer',
      index: state.phase === 'reward' && offer?.kind === 'reward' ? null : 0,
    };
  let best = 0;
  let bestValue = offerValue(state, content, ids[0]!);
  for (let i = 1; i < ids.length; i++) {
    const value = offerValue(state, content, ids[i]!);
    if (value > bestValue) {
      best = i;
      bestValue = value;
    }
  }
  return { type: 'pickOffer', index: best };
};

/**
 * Endless blessing: the first offered id in a fixed order of survival value (lives, throne and building HP, army
 * HP and damage, towers, then economy); a capped blessing (it only pays gold) goes last. Deterministic.
 */
const BLESSING_ORDER = [
  'vitality',
  'masonry',
  'vigor',
  'might',
  'tower_might',
  'tower_haste',
  'haste',
  'harvest',
  'treasury',
  'interest',
  'reroll',
  'survey',
] as const;
const pickBlessing = (state: RunState): RunCommand => {
  const offer = state.offers;
  const ids = offer?.kind === 'blessing' ? offer.blessingIds : [];
  const capped = (id: string): boolean => {
    const def = ENDLESS_BLESSINGS.find((b) => b.id === id);
    return def !== undefined && blessingStacks(state, def.id) >= def.maxStacks;
  };
  const rank = (id: string): number =>
    (capped(id) ? 100 : 0) + BLESSING_ORDER.indexOf(id as (typeof BLESSING_ORDER)[number]);
  let best = 0;
  for (let i = 1; i < ids.length; i++) if (rank(ids[i]!) < rank(ids[best]!)) best = i;
  return { type: 'pickBlessing', index: best };
};

export const greedyBot: Bot = (state, content, rng) => {
  switch (state.phase) {
    case 'blessing':
      return pickBlessing(state);
    case 'planning':
      return planning(state, content);
    case 'reward':
    case 'conquest':
      return pick(state, content);
    default:
      // Council, quests and year end: the scripted bot's stable, always-legal policy.
      return scriptedBot(state, content, rng);
  }
};
