import { describe, expect, it } from 'vitest';
import rawCatalog from '../../docs/art-review/oblique-wall/catalog.json?raw';
import { ALL_KINGS } from '../data/rules';
import { WALL_IMAGES } from './mountainWallAssets';

interface CatalogEntry {
  id: string;
  role: string;
  adopted: boolean;
  approval: string;
  parts: { id: string; w: number; h: number }[];
  baseLine?: number;
}
const catalog = JSON.parse(rawCatalog) as { items: CatalogEntry[] };

describe('wall images match the art catalog', () => {
  it('every adopted catalog entry is listed with its real size, and the list holds nothing else', () => {
    const adopted = catalog.items.filter((e) => e.adopted && e.approval === 'approved');
    expect(WALL_IMAGES.map((s) => s.id).sort()).toEqual(adopted.map((e) => e.id).sort());
    for (const e of adopted) {
      const spec = WALL_IMAGES.find((s) => s.id === e.id)!;
      expect(e.parts).toHaveLength(1);
      expect([spec.w, spec.h]).toEqual([e.parts[0]!.w, e.parts[0]!.h]);
      expect(spec.baseline).toBe(e.baseLine);
    }
  });

  it('there is exactly one middle image per king', () => {
    const kings = WALL_IMAGES.filter((s) => s.role === 'middle').map((s) => s.king);
    expect(new Set(kings).size).toBe(kings.length);
    expect([...kings].sort()).toEqual([...ALL_KINGS].sort());
  });
});
