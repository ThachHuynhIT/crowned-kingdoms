import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_ICON_DIR, GAME_ICON_IDS, GAME_ICON_SOURCE } from '../src/ui/gameIcons';

describe('game-icons.net menu icons (CC BY 3.0, 12/11/2026)', () => {
  const manifest = readFileSync('docs/assets.manifest.yml', 'utf-8');
  it('every icon the game loads exists, has no background square and is registered with its author and licence', () => {
    for (const id of GAME_ICON_IDS) {
      const path = `public/${GAME_ICON_DIR}${id}.svg`;
      expect(existsSync(path), id).toBe(true);
      const svg = readFileSync(path, 'utf-8');
      expect(svg, id).not.toContain('M0 0h512v512H0z');
      expect(manifest, id).toContain(`  - id: gi_${id}\n    path: ${path}\n`);
    }
    expect(manifest).toContain('license: CC-BY-3.0');
    expect(existsSync('docs/licenses/game-icons/license.txt')).toBe(true);
    expect(readFileSync('CREDITS.md', 'utf-8')).toContain('game-icons.net');
  });
  it('rasterises at a power of two so WebGL1 can mipmap it', () => {
    expect(GAME_ICON_SOURCE & (GAME_ICON_SOURCE - 1)).toBe(0);
  });
});
