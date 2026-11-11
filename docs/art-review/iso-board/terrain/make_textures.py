"""Cut the seamless ground textures (2026-11-06) and draw their review sheet.

    python docs/art-review/iso-board/terrain/make_textures.py [--publish]

Each 1024 px Codex source (`<id>/source.png`) is box-reduced 8x to a 128 px tile. 1024 / 8 is whole, so a seamless
source stays seamless. The tile is written next to the source as `<id>/texture.png`. The sheet `sheet.png` shows
each tile repeated 3x3 (any seam would show as a straight line) and a strip of river: water between two sand banks.
`--publish` (only after the owner's approval) copies the tiles to public/assets/art/ai-v1/iso/terrain/.
"""
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
D = Path(__file__).resolve().parent
OUT = ROOT / 'public/assets/art/ai-v1/iso/terrain'
IDS = {'terrain_water': 'water', 'terrain_sand': 'sand', 'terrain_path': 'path', 'terrain_flowers': 'flowers'}
FACTOR = 8


def cut(ident: str) -> Image.Image:
    src = Image.open(D / ident / 'source.png').convert('RGB')
    w, h = src.size
    tile = src.resize((w // FACTOR, h // FACTOR), Image.Resampling.BOX)
    tile.save(D / ident / 'texture.png')
    return tile


def seam(tile: Image.Image) -> tuple[float, float]:
    """Mean colour step across the wrap edge vs. inside the tile (equal means no visible seam)."""
    px = tile.load()
    w, h = tile.size
    step = lambda a, b: sum(abs(x - y) for x, y in zip(a, b))
    wrap = sum(step(px[0, y], px[w - 1, y]) for y in range(h)) / h
    inner = sum(step(px[w // 2, y], px[w // 2 - 1, y]) for y in range(h)) / h
    return wrap, inner


def main() -> None:
    tiles = {}
    for ident, name in IDS.items():
        if not (D / ident / 'source.png').exists():
            print(f'{ident}: no source yet')
            continue
        tiles[name] = cut(ident)
        wrap, inner = seam(tiles[name])
        print(f'{ident}: {tiles[name].size} wrap step {wrap:.1f}, inner step {inner:.1f}')
    if not tiles:
        return
    t = next(iter(tiles.values())).size[0]
    zoom = 2
    sheet = Image.new('RGB', ((3 * t + 16) * len(tiles) + 6 * t + 16, 3 * t + 16), (40, 40, 40))
    x = 8
    for tile in tiles.values():
        for i in range(3):
            for j in range(3):
                sheet.paste(tile, (x + i * t, 8 + j * t))
        x += 3 * t + 16
    # River strip: sand | water | sand, all read from one continuous world position.
    if 'water' in tiles and 'sand' in tiles:
        strip = Image.new('RGB', (6 * t, 3 * t))
        for yy in range(3 * t):
            for xx in range(6 * t):
                src = tiles['water'] if 2 * t <= xx < 4 * t else tiles['sand']
                strip.putpixel((xx, yy), src.getpixel((xx % t, yy % t)))
        sheet.paste(strip, (x, 8))
    sheet = sheet.resize((sheet.width * zoom, sheet.height * zoom), Image.Resampling.NEAREST)
    sheet.save(D / 'sheet.png')
    print('sheet', D / 'sheet.png')
    if '--publish' in sys.argv:
        OUT.mkdir(parents=True, exist_ok=True)
        for ident, name in IDS.items():
            if name in tiles:
                shutil.copy(D / ident / 'texture.png', OUT / f'{name}.png')
        print('published to', OUT)


if __name__ == '__main__':
    main()
