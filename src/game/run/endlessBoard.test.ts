import { describe, expect, it } from 'vitest';
import { ENDLESS_GEOMETRY, NORMAL_GEOMETRY } from '../../data/boardGeometry';
import { RULES_ENDLESS, RULES_FULL } from '../../data/rules';
import { CONTENT } from '../cards/registry';
import { freeMoveIllegal } from '../cards/custom/nomad';
import { THRONE_PLOT, checkPlay, initialPlots, neighbours, plotCol, plotRow } from './board';
import { plotAtCell, plotCoords } from './boardGeometry';
import { applyCommand } from './commands';
import { newRun } from './yearFlow';

describe('board descriptors (spec 2026-11-09 §4)', () => {
  it('normal: 25 plots, 10 open, throne on 2', () => {
    const plots = initialPlots();
    expect(plots).toHaveLength(25);
    expect(plots.filter((p) => p.unlocked)).toHaveLength(10);
    expect(plots[THRONE_PLOT]!.unlocked).toBe(true);
    expect(THRONE_PLOT).toBe(2);
  });

  it('endless: 49 plots, the same 10 open, all 24 outer plots locked', () => {
    const plots = initialPlots('endless');
    expect(plots).toHaveLength(49);
    expect(plots.filter((p) => p.unlocked)).toHaveLength(10);
    expect(plots.slice(25).every((p) => !p.unlocked)).toBe(true);
    expect(plots.slice(0, 25).map((p) => p.unlocked)).toEqual(initialPlots().map((p) => p.unlocked));
  });

  it('keeps ids 0..24 on the inner grid and numbers the outer ring row-major', () => {
    expect(plotCoords(25, 'endless')).toEqual({ row: -1, col: -1 });
    expect(plotCoords(31, 'endless')).toEqual({ row: -1, col: 5 });
    expect(plotCoords(32, 'endless')).toEqual({ row: 0, col: -1 });
    expect(plotCoords(33, 'endless')).toEqual({ row: 0, col: 5 });
    expect(plotCoords(48, 'endless')).toEqual({ row: 5, col: 5 });
    for (let id = 0; id < 25; id++) {
      expect(plotCoords(id, 'endless')).toEqual({ row: Math.floor(id / 5), col: id % 5 });
      expect(plotCoords(id)).toEqual(plotCoords(id, 'endless'));
    }
    expect(plotRow(2, 'endless')).toBe(0);
    expect(plotCol(2, 'endless')).toBe(2);
  });

  it('maps cells and ids one to one', () => {
    const seen = new Set<string>();
    for (let id = 0; id < 49; id++) {
      const { row, col } = plotCoords(id, 'endless');
      expect(plotAtCell(row, col, 'endless')).toBe(id);
      seen.add(`${row},${col}`);
    }
    expect(seen.size).toBe(49);
    expect(plotAtCell(-1, -1)).toBeNull();
    expect(plotAtCell(-2, 0, 'endless')).toBeNull();
    expect(plotAtCell(0, 6, 'endless')).toBeNull();
  });

  it('neighbours: N, E, S, W across the inner/outer seam, never wrapping rows', () => {
    expect(neighbours(0)).toEqual([1, 5]);
    expect(neighbours(0, 'endless')).toEqual([26, 1, 5, 32]);
    expect(neighbours(4)).toEqual([9, 3]);
    expect(neighbours(4, 'endless')).toEqual([30, 33, 9, 3]);
    expect(neighbours(25, 'endless')).toEqual([26, 32]);
    expect(neighbours(48, 'endless')).toEqual([41, 47]);
    expect(neighbours(33, 'endless')).toEqual([31, 35, 4]);
    expect(neighbours(5, 'endless')).not.toContain(4);
  });

  it('geometry: same plot size, field, origin and throne; wider board and a wall one plot further north', () => {
    expect(NORMAL_GEOMETRY).toMatchObject({ plotCount: 25, boardMin: 224, boardMax: 544, wallY: 176, roadStartY: 544 });
    expect(ENDLESS_GEOMETRY).toMatchObject({ plotCount: 49, boardMin: 160, boardMax: 608, wallY: 112, roadStartY: 608 });
    for (const g of [NORMAL_GEOMETRY, ENDLESS_GEOMETRY]) {
      expect(g).toMatchObject({ plotSize: 64, innerOrigin: 224, field: 768, thronePlot: 2, portal: { x: 384, y: 916 } });
      expect(g.plotCells).toHaveLength(g.plotCount);
      expect(g.boardMin - g.wallY).toBe(48);
    }
  });
});

describe('run mode (spec 2026-11-09 §3)', () => {
  it('newRun derives the mode from the rules', () => {
    const normal = newRun(1, 'wheat', CONTENT, RULES_FULL);
    expect(normal.mode).toBe('normal');
    expect(normal.endless).toBeNull();
    expect(normal.plots).toHaveLength(25);
    const endless = newRun(1, 'wheat', CONTENT, RULES_ENDLESS);
    expect(endless.mode).toBe('endless');
    expect(endless.endless).toEqual({ blessingStacks: {}, lastBlessingYear: 0, modifierId: null, modifierStartYear: 0 });
    expect(endless.plots).toHaveLength(49);
    expect(endless.version).toBe(8);
  });

  it('both modes carry the blessing RNG stream; other streams are identical', () => {
    const normal = newRun(5, 'stone', CONTENT, RULES_FULL);
    const endless = newRun(5, 'stone', CONTENT, RULES_ENDLESS);
    expect(normal.rng).toEqual(endless.rng);
    expect(typeof normal.rng.blessing).toBe('number');
  });
});

describe('outer plots are playable in Endless', () => {
  const troop = CONTENT.allCards().find((c) => c.kind === 'troop')!;
  const openOuter = () => {
    const s = newRun(1, 'wheat', CONTENT, RULES_ENDLESS);
    s.plots[48]!.unlocked = true;
    return s;
  };

  it('checkPlay accepts plot 48 and rejects -1, 49, fractional and NaN', () => {
    const s = openOuter();
    expect(checkPlay(s.plots, troop, { kind: 'plot', plot: 48 })).toBeNull();
    for (const plot of [-1, 49, 1.5, Number.NaN]) {
      expect(checkPlay(s.plots, troop, { kind: 'plot', plot })).toBe('badTarget');
    }
    const normal = newRun(1, 'wheat', CONTENT, RULES_FULL);
    expect(checkPlay(normal.plots, troop, { kind: 'plot', plot: 25 })).toBe('badTarget');
  });

  it('unlockPlot buys an outer plot next to an open plot, not one across the board', () => {
    const s = newRun(1, 'wheat', CONTENT, RULES_ENDLESS);
    s.year = 1;
    s.gold = 999;
    // 32 = (0,-1) is next to plot 0, which is still locked: not adjacent to anything open.
    expect(applyCommand(s, { type: 'unlockPlot', plot: 32 }, CONTENT)).toEqual({ error: 'notAdjacent' });
    const next = applyCommand(s, { type: 'unlockPlot', plot: 5 }, CONTENT);
    if (!('state' in next)) throw new Error('unlock 5');
    // 34 = (1,-1), west of plot 5.
    const outer = applyCommand(next.state, { type: 'unlockPlot', plot: 34 }, CONTENT);
    expect('state' in outer && outer.state.plots[34]!.unlocked).toBe(true);
    expect(applyCommand(next.state, { type: 'unlockPlot', plot: 49 }, CONTENT)).toEqual({ error: 'badTarget' });
  });

  it('freeMove reaches an outer neighbour in Endless', () => {
    const s = openOuter();
    const run = newRun(1, 'nomad', CONTENT, RULES_ENDLESS);
    run.phase = 'planning';
    run.plots = s.plots;
    run.plots[41]!.unlocked = true;
    run.plots[41]!.building = { ...run.plots[THRONE_PLOT]!.building!, uid: 99, cardId: troop.id };
    expect(freeMoveIllegal(run, CONTENT, 41, 48)).toBeNull();
    expect(freeMoveIllegal(run, CONTENT, 41, 49)).toBe('badTarget');
  });
});
