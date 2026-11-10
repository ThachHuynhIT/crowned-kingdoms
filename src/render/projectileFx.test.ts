import { describe, expect, it } from 'vitest';
import { CONTENT } from '../game/cards/registry';
import { BOSSES } from '../data/bosses';
import { CODE_FX } from './codeFx';
import { CODE_FX_DIRS, PROJECTILE_FX, codeFxFrame, codeFxFrameAt } from './projectileFx';
import { ARROW_DIRS } from './fxArt';

describe('projectile fx table', () => {
  it('every target is a code projectile', () => {
    const projectiles = new Set(CODE_FX.filter((d) => d.kind === 'projectile').map((d) => d.id));
    for (const [label, fx] of Object.entries(PROJECTILE_FX)) expect(projectiles.has(fx), `${label} → ${fx}`).toBe(true);
  });

  it('every shooter is a real card, unit or boss id that fires projectiles', () => {
    const cards = CONTENT.kings().flatMap((k) => k.cards);
    const units = CONTENT.kings().flatMap((k) => k.units);
    const known = new Set<string>([
      ...cards.map((c) => c.id),
      ...CONTENT.kings().map((k) => k.throne.id),
      ...units.map((u) => u.id),
      ...BOSSES.map((b) => b.unit.id),
    ]);
    for (const label of Object.keys(PROJECTILE_FX)) expect(known.has(label), label).toBe(true);
  });

  it('directions follow the arrow order', () => {
    expect([...CODE_FX_DIRS]).toEqual([...ARROW_DIRS]);
  });
});

describe('codeFxFrameAt', () => {
  const ms = [50, 40, 60];
  it('steps through the frames and ends a one-shot', () => {
    expect([0, 49, 50, 89, 90, 149].map((t) => codeFxFrameAt(ms, t, false))).toEqual([0, 0, 1, 1, 2, 2]);
    expect(codeFxFrameAt(ms, 150, false)).toBeNull();
  });
  it('wraps a loop', () => {
    expect(codeFxFrameAt(ms, 150, true)).toBe(0);
    expect(codeFxFrameAt(ms, 200, true)).toBe(1);
  });
  it('names frames', () => {
    expect(codeFxFrame('fx_burn', 2)).toBe('fx_code_fx_burn_2');
    expect(codeFxFrame('impact', 0, true)).toBe('fx_code_impact_glow_0');
  });
});
