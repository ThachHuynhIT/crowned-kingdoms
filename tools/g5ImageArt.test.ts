import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/game/cards/registry';
import type { KingId } from '../src/data/types';
import {
  G5_ART_APPROVED,
  IMAGE_ART_FILES,
  IMAGE_BUILDINGS,
  IMAGE_PLOTS,
  PLOT_STATES,
} from '../src/render/imageArt';

const BUILDING_KINDS = new Set(['throne', 'troop', 'tower', 'economy', 'support']);
const manifest = readFileSync('docs/assets.manifest.yml', 'utf-8');
const png = (file: string) => `public/assets/art/ai-v1/${file}.png`;

describe('G5 isometric king sets', () => {
  it('only kings without an earlier isometric set (Wheat has its own), each with exactly its throne and building cards', () => {
    for (const [king, cards] of Object.entries(G5_ART_APPROVED)) {
      expect(['grove', 'tide', 'forge', 'clock', 'moon', 'nomad', 'stone', 'arcane']).toContain(
        king,
      );
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

describe('card illustrations', () => {
  it('every wired card picture exists in both sizes and is in the asset manifest', async () => {
    const { CARD_ART_FILES } = await import('../src/ui/cards/cardImage');
    expect(CARD_ART_FILES.length).toBe(2 * 102); // every card of the registry
    for (const f of CARD_ART_FILES) {
      const path = `public/${f.url}`;
      expect(existsSync(path), path).toBe(true);
      expect(manifest).toContain(`path: ${path}`);
    }
  });
});

describe('in-game icons', () => {
  it('every image icon replaces one generated icon id, exists on disk and is registered', async () => {
    const { IMAGE_ICONS } = await import('../src/render/imageArt');
    const { ICON_IDS } = await import('../src/render/iconArt');
    expect(Object.keys(IMAGE_ICONS).sort()).toEqual([...ICON_IDS].sort());
    for (const file of Object.values(IMAGE_ICONS)) {
      expect(existsSync(png(file)), file).toBe(true);
      expect(manifest).toContain(`path: ${png(file)}`);
    }
  });
});

describe('main-menu strips', () => {
  it('every picture strip exists on disk and is registered', async () => {
    const { MENU_IMAGE_LAYERS } = await import('../src/render/imageArt');
    for (const { file } of MENU_IMAGE_LAYERS) {
      expect(existsSync(png(file)), file).toBe(true);
      expect(manifest).toContain(`path: ${png(file)}`);
    }
  });
});

describe('king-select card backgrounds', () => {
  it('every king has an approved card picture on disk, registered', async () => {
    const { KING_CARDS_APPROVED, kingCardFile } = await import('../src/render/imageArt');
    const { ALL_KINGS } = await import('../src/data/rules');
    expect([...KING_CARDS_APPROVED].sort()).toEqual([...ALL_KINGS].sort());
    for (const king of KING_CARDS_APPROVED) {
      expect(existsSync(png(kingCardFile(king))), king).toBe(true);
      expect(manifest).toContain(`path: ${png(kingCardFile(king))}`);
    }
  });
});
