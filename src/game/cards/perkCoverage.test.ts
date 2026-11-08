import { describe, expect, it } from 'vitest';
import { CONTENT } from './registry';

/** The text of the perk effect tests, read like `cardCoverage.test.ts` reads the card tests. */
const sources = import.meta.glob<string>('../run/perks.test.ts', { query: '?raw', import: 'default', eager: true });
const perkTests = (): string => Object.values(sources).join('\n');

describe('perk coverage (spec §6.3–6.11, 27 perks)', () => {
  it('gives every king exactly three perks <king>_p1..p3 with Vietnamese name and text', () => {
    expect(CONTENT.kings()).toHaveLength(9);
    for (const king of CONTENT.kings()) {
      expect(king.perks.map((p) => p.id), king.id).toEqual([`${king.id}_p1`, `${king.id}_p2`, `${king.id}_p3`]);
      for (const p of king.perks) {
        expect(p.nameVi.length, p.id).toBeGreaterThan(0);
        expect(p.textVi.length, p.id).toBeGreaterThan(0);
        expect(p.effects.length, p.id).toBeGreaterThan(0);
      }
    }
  });

  it('has an effect test mentioning every perk id', () => {
    const text = perkTests();
    expect(text.length).toBeGreaterThan(0);
    const missing = CONTENT.kings()
      .flatMap((k) => k.perks.map((p) => p.id))
      .filter((id) => !text.includes(`'${id}'`));
    expect(missing).toEqual([]);
  });
});
