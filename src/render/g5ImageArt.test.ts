import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../game/cards/registry';
import type { KingId } from '../data/types';
import { G5_ART_APPROVED, IMAGE_ART_FILES, IMAGE_BUILDINGS, IMAGE_PLOTS, PLOT_STATES } from './imageArt';

const BUILDING_KINDS = new Set(['throne', 'troop', 'tower', 'economy', 'support']);
const manifest = readFileSync('docs/assets.manifest.yml', 'utf-8');
const png = (file: string) => `public/assets/art/ai-v1/${file}.png`;

describe('G5 isometric king sets', () => {
  it('only the six new kings, each with exactly its throne and building cards', () => {
    for (const [king, cards] of Object.entries(G5_ART_APPROVED)) {
      expect(['grove', 'tide', 'forge', 'clock', 'moon', 'nomad']).toContain(king);
      const expected = [CONTENT.king(king as KingId).throne, ...CONTENT.king(king as KingId).cards]
        .filter((c) => BUILDING_KINDS.has(c.kind))
        .map((c) => c.id)
        .sort();
      expect([...cards].sort()).toEqual(expected);
    }
  });

  it('every approved file is loaded, exists on disk and is registered in the asset manifest', () => {
    for (const [king, cards] of Object.entries(G5_ART_APPROVED)) {
      for (const card of cards) {
        expect(IMAGE_BUILDINGS[card]).toBe(`iso/${card}`);
        expect(IMAGE_ART_FILES).toContain(`iso/${card}`);
        expect(existsSync(png(`iso/${card}`)), card).toBe(true);
        expect(manifest).toContain(`path: ${png(`iso/${card}`)}`);
      }
      expect(IMAGE_PLOTS[king]).toBe(`iso/plots/${king}`);
      for (const state of PLOT_STATES) {
        const file = `iso/plots/${king}_${state}`;
        expect(IMAGE_ART_FILES).toContain(file);
        expect(existsSync(png(file)), file).toBe(true);
        expect(manifest).toContain(`path: ${png(file)}`);
      }
    }
  });
});
