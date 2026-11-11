import { describe, expect, it } from 'vitest';
import { CARD_ART_FILES } from '../ui/cards/cardImage';
import { KING_BADGE_FILES } from '../ui/realm/kingBadge';
import { HUD_ART_HD_DIR, HUD_ART_HD_FILES, hudArtHdKey, hudTexture, queueHudArtHd } from './hudArtHd';
import { STAT_ICONS, imageArtKey } from './imageArt';

describe('HUD HD twins', () => {
  it('lists one twin per HUD picture, under the same relative path in ai-v1-hd', () => {
    const keys = HUD_ART_HD_FILES.map((f) => f.base);
    expect(new Set(keys).size).toBe(keys.length);
    for (const f of [...CARD_ART_FILES, ...KING_BADGE_FILES]) expect(keys).toContain(f.key);
    for (const file of Object.values(STAT_ICONS)) expect(keys).toContain(imageArtKey(file));
    for (const f of HUD_ART_HD_FILES) {
      expect(f.key).toBe(hudArtHdKey(f.base));
      expect(f.url.startsWith(HUD_ART_HD_DIR)).toBe(true);
    }
  });

  it('queues the twins only at density >= 2', () => {
    const queued: string[] = [];
    const load = { image: (key: string) => queued.push(key) };
    queueHudArtHd(load, 1);
    queueHudArtHd(load, 1.5);
    expect(queued).toEqual([]);
    queueHudArtHd(load, 2);
    expect(queued).toEqual(HUD_ART_HD_FILES.map((f) => f.key));
  });

  it('picks the twin at density >= 2 when it loaded, else the usual texture', () => {
    const loaded = new Set(['cardart-wheat_field', hudArtHdKey('cardart-wheat_field'), 'cardart-wheat_throne']);
    const textures = { exists: (key: string) => loaded.has(key) };
    expect(hudTexture(textures, 'cardart-wheat_field', 2)).toEqual({ key: hudArtHdKey('cardart-wheat_field'), factor: 2 });
    expect(hudTexture(textures, 'cardart-wheat_field', 3)).toEqual({ key: hudArtHdKey('cardart-wheat_field'), factor: 2 });
    expect(hudTexture(textures, 'cardart-wheat_field', 1)).toEqual({ key: 'cardart-wheat_field', factor: 1 });
    // Not loaded (PreloadScene did not queue it): harmless fallback.
    expect(hudTexture(textures, 'cardart-wheat_throne', 2)).toEqual({ key: 'cardart-wheat_throne', factor: 1 });
  });
});
