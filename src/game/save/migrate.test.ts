import { describe, expect, it } from 'vitest';
import { hashSeed } from '../../core/random';
import { RULES_ENDLESS, RULES_FULL, RULES_G2 } from '../../data/rules';
import type { RunState } from '../run/state';
import { THRONE_PLOT } from '../run/board';
import { newRun } from '../run/yearFlow';
import { CONTENT } from '../cards/registry';
import { decodeRun } from './codec';
import { migrateRunState } from './migrate';
import { modifierAt } from '../run/endlessModifiers';

type Loose = Record<string, unknown>;
type LoosePlot = { unlocked: boolean; building: Loose | null };

/** A state exactly as the version-4 game wrote it: the Ngai on the board centre (12), plot 2 a locked ring plot. */
const asV4 = (s: RunState): Loose => {
  const v4 = structuredClone(s) as unknown as Loose;
  v4.version = 4;
  const plots = v4.plots as LoosePlot[];
  const [atThrone, atCentre] = [plots[2]!, plots[12]!];
  plots[12] = { ...atCentre, unlocked: true, building: atThrone.building };
  plots[2] = { ...atThrone, unlocked: atCentre.building !== null, building: atCentre.building };
  return v4;
};

/** A state exactly as the version-3 game wrote it: the version 4 layout without the version 4 fields. */
const asV3 = (s: RunState): Loose => {
  const v3 = asV4(s);
  v3.version = 3;
  for (const k of ['pendingOffers', 'decrees', 'quests', 'offeredQuestIds', 'freeRerollsLeft', 'interventionDmgPct', 'difficulty', 'yearStartPendingDraw', 'paidRerollsThisYear']) {
    delete v3[k];
  }
  const rng = v3.rng as Record<string, number>;
  delete rng.council;
  delete rng.quest;
  const stats = v3.stats as Record<string, unknown>;
  for (const k of ['bossesWon', 'bossesDefeated', 'completedYears']) delete stats[k];
  for (const p of v3.plots as { building: Record<string, unknown> | null }[]) {
    if (p.building) for (const k of ['ageBonus', 'counters', 'movedYear']) delete p.building[k];
  }
  return v3;
};

/** A state exactly as the version-5 game wrote it: version 6 without perk, unlockedCards and freeMovesUsed. */
const asV5 = (s: RunState): Loose => {
  const v5 = structuredClone(s) as unknown as Loose;
  v5.version = 5;
  for (const k of ['perk', 'unlockedCards', 'freeMovesUsed']) delete v5[k];
  return v5;
};

describe('migrate_v5_to6', () => {
  const base = (): RunState => {
    const s = newRun(8, 'stone', CONTENT, RULES_G2);
    return { ...s, gold: 11, rerollsThisYear: 2, difficulty: 0, stats: { ...s.stats, battlesWon: 3, kills: 40 } };
  };

  it('adds perk null, no meta cards and no free moves used, keeping everything else', () => {
    const original = base();
    const migrated = migrateRunState(asV5(original)) as RunState;
    expect(migrated.version).toBe(8);
    expect(migrated).toEqual(original);
    expect(migrated).toMatchObject({ perk: null, unlockedCards: [], freeMovesUsed: 0 });
  });

  it('does not change its input and keeps an existing difficulty', () => {
    const v5 = { ...asV5(base()), difficulty: 2 };
    const copy = structuredClone(v5);
    const migrated = migrateRunState(v5) as RunState;
    expect(v5).toEqual(copy);
    expect(migrated.difficulty).toBe(2);
  });

  it('migrates all the way from version 3 and decodeRun accepts a version 5 envelope', () => {
    const original = base();
    expect((migrateRunState(asV3(original)) as RunState).version).toBe(8);
    const r = decodeRun({ formatVersion: 1, version: 5, contentHash: 1, state: asV5(original) }, CONTENT);
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') expect(r.state).toEqual(original);
  });
});

describe('migrate_v3_to4', () => {
  const base = (): RunState => {
    const s = newRun(8, 'stone', CONTENT, RULES_G2);
    return { ...s, gold: 11, rerollsThisYear: 2, stats: { ...s.stats, battlesWon: 3, battlesLost: 1, kills: 40 } };
  };

  it('turns a version 3 state into version 6 (through 4 and 5) keeping the run and adding neutral defaults', () => {
    const original = base();
    const migrated = migrateRunState(asV3(original)) as RunState;
    expect(migrated.version).toBe(8);
    expect(migrated).toMatchObject({
      seed: original.seed,
      year: original.year,
      rules: original.rules,
      hand: original.hand,
      drawPile: original.drawPile,
      discardPile: original.discardPile,
      army: original.army,
      gold: 11,
      enemies: original.enemies,
      enemyKings: original.enemyKings,
    });
    expect(migrated).toMatchObject({
      decrees: [],
      quests: [],
      offeredQuestIds: [],
      pendingOffers: [],
      freeRerollsLeft: 0,
      interventionDmgPct: 0,
      difficulty: 0,
      yearStartPendingDraw: false,
    });
    expect(migrated.paidRerollsThisYear).toBe(2);
    expect(migrated.stats).toMatchObject({ bossesWon: 0, bossesDefeated: [], completedYears: 4 });
    expect(migrated.plots[THRONE_PLOT]!.building).toMatchObject({ ageBonus: 0, counters: {}, movedYear: null });
  });

  it('seeds the council and quest streams from the run seed, and keeps the calendar stream as it was', () => {
    const original = base();
    const migrated = migrateRunState(asV3(original)) as RunState;
    expect(migrated.rng.council).toBe(original.rng.council);
    expect(migrated.rng.quest).toBe(original.rng.quest);
    expect(migrated.rng.calendar).toBe(original.rng.calendar);
    expect(migrated.rng.draw).toBe(original.rng.draw);
  });

  it('is exactly what a new version 6 run looks like when nothing was played yet', () => {
    const original = base();
    expect(migrateRunState(asV3({ ...original, stats: newRun(8, 'stone', CONTENT, RULES_G2).stats, rerollsThisYear: 0, gold: original.gold }))).toEqual(
      { ...original, stats: newRun(8, 'stone', CONTENT, RULES_G2).stats, rerollsThisYear: 0 },
    );
  });

  it('does not change its input', () => {
    const v3 = asV3(base());
    const copy = structuredClone(v3);
    migrateRunState(v3);
    expect(v3).toEqual(copy);
  });

  it('leaves the current version 8, versions 1, 2 and non-objects untouched', () => {
    const v6 = base();
    expect(migrateRunState(v6)).toBe(v6);
    for (const version of [1, 2, 8]) {
      const s = { ...asV3(v6), version };
      expect(migrateRunState(s)).toBe(s);
    }
    expect(migrateRunState('x')).toBe('x');
    expect(migrateRunState(null)).toBeNull();
  });

  it('decodeRun accepts a version 3 envelope and a bare version 3 state, as a valid version 6 run', () => {
    const original = base();
    const v3 = asV3(original);
    const inEnvelope = decodeRun({ formatVersion: 1, version: 3, contentHash: 1, state: v3 }, CONTENT);
    expect(inEnvelope.kind).toBe('ok');
    if (inEnvelope.kind === 'ok') expect(inEnvelope.state.version).toBe(8);
    expect(decodeRun(v3, CONTENT).kind).toBe('ok');
  });

  it('a state 3 that is damaged is still refused after migration', () => {
    const v3 = asV3(base());
    (v3.deck as string[])[0] = 'wheat_ghost';
    expect(decodeRun({ formatVersion: 1, version: 3, contentHash: 1, state: v3 }, CONTENT).kind).toBe('incompatible');
  });
});

describe('migrate_v4_to5', () => {
  const militiaOn2 = (): RunState => {
    const s = newRun(5, 'wheat', CONTENT, RULES_G2);
    const plots = s.plots.map((p) => ({ ...p }));
    // A militia with runes on the centre (12); the version-4 layout kept it on plot 2.
    plots[12] = {
      unlocked: true,
      building: { uid: 7, cardId: 'wheat_militia', level: 3, enchants: [{ cardId: 'neutral_sharpen', stacks: 2 }], placedYear: 1, permanent: { hp: 4 }, ageBonus: 1, counters: { x: 2 }, movedYear: 1 },
    };
    return { ...s, plots, nextUid: 8 };
  };

  it('moves the Ngai from the centre (12) to the back row (2) and the building on 2 to 12, opening both', () => {
    const original = militiaOn2();
    const v4 = asV4(original);
    expect((v4.plots as LoosePlot[])[12]!.building!.cardId).toBe('wheat_throne');
    expect((v4.plots as LoosePlot[])[2]!.building!.cardId).toBe('wheat_militia');
    const migrated = migrateRunState(v4) as RunState;
    expect(migrated).toEqual(original);
    expect(migrated.plots[2]).toMatchObject({ unlocked: true, building: { uid: 0, cardId: 'wheat_throne' } });
    expect(migrated.plots[12]!.building).toEqual(original.plots[12]!.building);
  });

  it('opens plot 12 for the old Ngai and plot 2 for the new one even when plot 2 was locked and empty', () => {
    const fresh = newRun(5, 'wheat', CONTENT, RULES_G2);
    const v4 = asV4(fresh);
    expect((v4.plots as LoosePlot[])[2]).toEqual({ unlocked: false, building: null });
    const migrated = migrateRunState(v4) as RunState;
    expect(migrated).toEqual(fresh);
    expect(decodeRun({ formatVersion: 1, version: 4, contentHash: 1, state: v4 }, CONTENT).kind).toBe('ok');
  });

  it('does not change its input and does not swap a version 5 state again', () => {
    const v4 = asV4(militiaOn2());
    const copy = structuredClone(v4);
    const once = migrateRunState(v4);
    expect(v4).toEqual(copy);
    expect(migrateRunState(once)).toBe(once);
  });

  it('clears a pending council plot choice that touched plot 2 or 12, keeping the decree picked', () => {
    const base = militiaOn2();
    const council = (plots: number[]) =>
      ({ kind: 'council', decreeIds: ['decree_expand_borders'], selected: 'decree_expand_borders', selection: { plots, cardId: null, deckIndices: [] } }) as const;
    const s = { ...base, offers: council([2, 3]), pendingOffers: [council([1]), council([12])] } as unknown as RunState;
    const migrated = migrateRunState(asV4(s)) as Loose;
    const sel = (o: unknown) => (o as { selection: { plots: number[] } }).selection.plots;
    expect(sel(migrated.offers)).toEqual([]);
    expect((migrated.offers as { selected: string }).selected).toBe('decree_expand_borders');
    expect((migrated.pendingOffers as unknown[]).map(sel)).toEqual([[1], []]);
  });

  it('refuses a version 4 save whose centre held no Ngai (it cannot be moved to the back row)', () => {
    const v4 = asV4(newRun(5, 'wheat', CONTENT, RULES_G2));
    (v4.plots as LoosePlot[])[12]!.building = null;
    expect(decodeRun({ formatVersion: 1, version: 4, contentHash: 1, state: v4 }, CONTENT).kind).toBe('incompatible');
  });
});

/** Một state v6 thật: bỏ đúng các trường v7 (spec 2026-11-09 §8). */
const asV6 = (s: RunState): Loose => {
  const v6 = structuredClone(s) as unknown as Loose;
  v6.version = 6;
  delete v6.mode;
  delete v6.endless;
  delete (v6.rng as Loose).blessing;
  return v6;
};

describe('migrate_v6_to7 (Endless)', () => {
  const base = (): RunState => {
    const s = newRun(9, 'arcane', CONTENT, RULES_FULL);
    return { ...s, gold: 23, stats: { ...s.stats, battlesWon: 4, kills: 12 } };
  };

  it('marks the run normal, adds a null endless state and a neutral blessing stream, keeping everything else', () => {
    const original = base();
    const v6 = asV6(original);
    const copy = structuredClone(v6);
    const migrated = migrateRunState(v6) as RunState;
    expect(v6).toEqual(copy);
    expect(migrated.version).toBe(8);
    expect(migrated.mode).toBe('normal');
    expect(migrated.endless).toBeNull();
    expect(migrated.rng.blessing).toBe(hashSeed('9:blessing'));
    expect(migrated).toEqual(original);
  });

  it('decodeRun accepts a version 6 envelope; a version 7 state is not migrated again', () => {
    const original = base();
    const r = decodeRun({ formatVersion: 1, version: 6, contentHash: 1, state: asV6(original) }, CONTENT);
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') expect(r.state).toEqual(original);
    const v7 = structuredClone(original);
    expect(migrateRunState(v7)).toBe(v7);
  });

  it('decodeRun rejects a mode that disagrees with the rules and a board of the wrong size', () => {
    const normal = base();
    expect(decodeRun({ formatVersion: 1, version: 8, contentHash: 1, state: { ...normal, mode: 'endless' } }, CONTENT).kind).toBe('incompatible');
    const endless = newRun(9, 'arcane', CONTENT, RULES_ENDLESS);
    expect(decodeRun({ formatVersion: 1, version: 8, contentHash: 1, state: endless }, CONTENT).kind).toBe('ok');
    expect(decodeRun({ formatVersion: 1, version: 8, contentHash: 1, state: { ...endless, plots: normal.plots } }, CONTENT).kind).toBe('incompatible');
    expect(decodeRun({ formatVersion: 1, version: 8, contentHash: 1, state: { ...endless, endless: null } }, CONTENT).kind).toBe('incompatible');
    expect(decodeRun({ formatVersion: 1, version: 8, contentHash: 1, state: { ...normal, plots: endless.plots } }, CONTENT).kind).toBe('incompatible');
  });
});

describe('endless blessing offers survive a save', () => {
  it('roundtrips an endless run waiting on a blessing, and rejects a broken offer', () => {
    const s = newRun(9, 'arcane', CONTENT, RULES_ENDLESS);
    const waiting: RunState = {
      ...s,
      year: 35,
      phase: 'blessing',
      endless: { ...s.endless!, lastBlessingYear: 35, blessingStacks: { harvest: 2 }, modifierId: modifierAt(9, 35)!.id, modifierStartYear: 31 },
      offers: { kind: 'blessing', blessingIds: ['harvest', 'might', 'survey'], year: 35 },
    };
    const env = (state: unknown) => ({ formatVersion: 1, version: 8, contentHash: 1, state });
    const r = decodeRun(env(waiting), CONTENT);
    expect(r.kind).toBe('ok');
    if (r.kind === 'ok') expect(r.state).toEqual(waiting);
    const dup = { ...waiting, offers: { kind: 'blessing', blessingIds: ['harvest', 'harvest', 'survey'], year: 35 } };
    expect(decodeRun(env(dup), CONTENT).kind).toBe('incompatible');
    const badYear = { ...waiting, offers: { kind: 'blessing', blessingIds: ['harvest', 'might', 'survey'], year: 33 } };
    expect(decodeRun(env(badYear), CONTENT).kind).toBe('incompatible');
    const unknown = { ...waiting, endless: { ...waiting.endless!, blessingStacks: { gold_rain: 1 } } };
    expect(decodeRun(env(unknown), CONTENT).kind).toBe('incompatible');
  });
});

describe('migrate_v7_to8 (Mua thẻ, spec 2026-11-10 §4)', () => {
  it('migrate_v7_midyear_keeps_hand_played_offers_and_old_rng: adds a zero shop counter and a shop stream only', () => {
    const now = newRun(7, 'wheat', CONTENT, RULES_FULL);
    const oldRng: Partial<RunState['rng']> = { ...now.rng };
    delete oldRng.shop;
    const raw: Partial<RunState> = { ...now, version: 7, played: true, rng: oldRng as RunState['rng'] };
    delete raw.shopPurchasesThisYear;
    const copy = structuredClone(raw);
    const migrated = migrateRunState(raw) as RunState;
    expect(raw).toEqual(copy);
    expect(migrated.version).toBe(8);
    expect(migrated.shopPurchasesThisYear).toBe(0);
    expect(migrated.rng.shop).toBe(now.rng.shop);
    expect({ ...migrated.rng, shop: undefined }).toEqual({ ...oldRng, shop: undefined });
    expect(migrated.hand).toEqual(raw.hand);
    expect(migrated.played).toBe(true);
    expect(migrateRunState(migrated)).toBe(migrated);
    expect(decodeRun({ formatVersion: 1, version: 7, contentHash: 1, state: raw }, CONTENT).kind).toBe('ok');
  });
});
