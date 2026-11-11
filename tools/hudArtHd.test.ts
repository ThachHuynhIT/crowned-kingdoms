import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HUD_ART_HD_DIR, HUD_ART_HD_FILES } from '../src/render/hudArtHd';
import { IMAGE_ART_DIR } from '../src/render/imageArt';

describe('HUD HD twins on disk', () => {
  it('every twin and its ai-v1 file exist on disk, both registered in the asset manifest', () => {
    const manifest = readFileSync('docs/assets.manifest.yml', 'utf-8');
    for (const f of HUD_ART_HD_FILES) {
      const rel = f.url.slice(HUD_ART_HD_DIR.length);
      expect(existsSync(`public/${f.url}`), f.url).toBe(true);
      expect(existsSync(`public/${IMAGE_ART_DIR}${rel}`), rel).toBe(true);
      expect(manifest).toContain(`path: public/${f.url}
`);
      expect(manifest).toContain(`path: public/${IMAGE_ART_DIR}${rel}
`);
    }
  });

});
