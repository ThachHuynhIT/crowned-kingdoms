import { describe, expect, it } from 'vitest';
import { formatDamage, plotDamageLabels } from './damageLabels';
import { newRun } from '../../game/run/yearFlow';
import { CONTENT } from '../../game/cards/registry';

describe('formatDamage', () => {
  it('shows whole points below 1000, then k with a Vietnamese decimal comma, no decimal from 10k', () => {
    expect([0, 7, 999, 1000, 1234, 9999, 10_000, 15_499, 250_000].map(formatDamage)).toEqual([
      '0', '7', '999', '1k', '1,2k', '9,9k', '10k', '15k', '250k',
    ]);
  });
});

describe('plotDamageLabels', () => {
  it('labels every built plot whose building dealt damage, by uid; nothing before the first battle', () => {
    const s = newRun(1, 'wheat', CONTENT);
    const built = s.plots.map((p, i) => (p.building ? i : -1)).filter((i) => i >= 0);
    expect(built.length).toBeGreaterThan(0);
    const plot = built[0]!;
    const uid = s.plots[plot]!.building!.uid;
    expect(plotDamageLabels(s, null)).toEqual([]);
    expect(plotDamageLabels(s, { [uid]: 1234, 999_999: 50 })).toEqual([{ plot, text: '1,2k', damage: 1234 }]);
    expect(plotDamageLabels(s, { [uid]: 0 })).toEqual([]);
  });
});

describe('info box line', () => {
  it('adds "Sát thương trận trước" with thousands dots once a battle was fought', async () => {
    const { buildingInfoModel } = await import('./inspectionModel');
    const { buildingModelLines, groupThousands } = await import('./infoLines');
    expect([0, 999, 1000, 12_345, 1_234_567].map(groupThousands)).toEqual(['0', '999', '1.000', '12.345', '1.234.567']);
    const s = newRun(1, 'wheat', CONTENT);
    const plot = s.plots.findIndex((p) => p.building);
    const uid = s.plots[plot]!.building!.uid;
    expect(buildingModelLines(buildingInfoModel(s, plot, CONTENT)!).some((l) => l.startsWith('Sát thương trận trước'))).toBe(false);
    const lines = buildingModelLines(buildingInfoModel(s, plot, CONTENT, undefined, { [uid]: 12_345 })!);
    expect(lines).toContain('Sát thương trận trước: 12.345');
    expect(buildingModelLines(buildingInfoModel(s, plot, CONTENT, undefined, {})!)).toContain('Sát thương trận trước: 0');
  });
});
