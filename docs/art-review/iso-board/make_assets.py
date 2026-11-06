"""Cut the approved isometric Wheat sources (2026-11-06) into native sprites under public/assets/art/ai-v1/iso/.

    python docs/art-review/iso-board/make_assets.py

- Buildings: black keyed to alpha 0/255, then ONE scale for all eight so their sizes stay relative: the approved
  Reapers barn becomes 64 px wide (a 32-world-px footprint is a 64 px diamond at zoom 1; the game draws these
  frames at 0.5 x 2 = 1:1).
- Plots: each diamond reduced to 128 px wide and padded so the diamond's centre row (its widest row, where the left
  and right corners are) is the image's middle row; the game anchors plots at their centre.
- Wall: the cliff foot is measured column by column and every column shifted down so the foot runs at exactly 2:1
  (owner: "sửa dốc tường sau"; vertical edges stay vertical, nothing is rotated), then reduced to 480 px wide; the
  foot at the right edge is the bottom row.
Reduction is a premultiplied box filter; alpha is snapped back to 0/255.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
D = ROOT / 'docs/art-review/iso-board'
OUT = ROOT / 'public/assets/art/ai-v1/iso'

BUILDINGS = {
    'wheat_reapers': D / 'sample-building/source.png',
    'wheat_militia': D / 'wheat/building_wheat_militia/source.png',
    'wheat_peasant_horde': D / 'wheat/building_wheat_peasant_horde/source.png',
    'wheat_granary': D / 'wheat/building_wheat_granary/source.png',
    'wheat_windmill': D / 'wheat/building_wheat_windmill/source.png',
    'wheat_scarecrow': D / 'wheat/building_wheat_scarecrow/source.png',
    'wheat_field': D / 'wheat/building_wheat_field/source.png',
    'wheat_throne': D / 'wheat/building_wheat_throne/source.png',
}
PLOTS = {
    'wheat_open': D / 'sample-plot/source.png',
    'wheat_built': D / 'sample-plot-built/source.png',
    'wheat_locked': D / 'wheat/plot_wheat_locked/source.png',
    'wheat_throne': D / 'wheat/plot_wheat_throne/source.png',
}
WALL = D / 'wheat/terrain_wall_iso_sample/source.png'

REAPERS_WIDTH = 64
PLOT_WIDTH = 128
WALL_WIDTH = 480
KEY = 24


def keyed(path: Path) -> Image.Image:
    img = Image.open(path).convert('RGBA')
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0) if max(r, g, b) < KEY else (r, g, b, 255)
    return img.crop(img.getbbox())


def reduce(img: Image.Image, k: float) -> Image.Image:
    size = (max(1, round(img.width * k)), max(1, round(img.height * k)))
    out = img.convert('RGBa').resize(size, Image.BOX).convert('RGBA')
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= 128 else 0)
    return out.crop(out.getbbox())


def opaque_span(img: Image.Image, y: int) -> int:
    px = img.load()
    xs = [x for x in range(img.width) if px[x, y][3] > 0]
    return (xs[-1] - xs[0] + 1) if xs else 0


def centre_plot(img: Image.Image) -> Image.Image:
    """Pad so the widest row (the diamond's left/right corners) is the middle row."""
    widths = [opaque_span(img, y) for y in range(img.height)]
    best = max(widths)
    rows = [y for y, w in enumerate(widths) if w >= best - 1]
    c = (rows[0] + rows[-1]) // 2
    half = max(c, img.height - 1 - c)
    out = Image.new('RGBA', (img.width, 2 * half + 1), (0, 0, 0, 0))
    out.paste(img, (0, half - c))
    return out


def shear_wall(img: Image.Image) -> tuple[Image.Image, float]:
    """Shift each column down so the foot (lowest opaque pixel per column) runs at exactly 1 down per 2 across."""
    px = img.load()
    foot = []
    for x in range(img.width):
        ys = [y for y in range(img.height) if px[x, y][3] > 0]
        foot.append(ys[-1] if ys else None)
    pts = [(x, y) for x, y in enumerate(foot) if y is not None][img.width // 10 : -img.width // 10]
    n = len(pts)
    mx = sum(x for x, _ in pts) / n
    my = sum(y for _, y in pts) / n
    slope = sum((x - mx) * (y - my) for x, y in pts) / sum((x - mx) ** 2 for x, _ in pts)
    extra = 0.5 - slope
    grow = int(abs(extra) * img.width) + 2
    out = Image.new('RGBA', (img.width, img.height + grow), (0, 0, 0, 0))
    for x in range(img.width):
        col = img.crop((x, 0, x + 1, img.height))
        out.paste(col, (x, round(extra * x)), col)
    return out.crop(out.getbbox()), slope


def main() -> None:
    (OUT / 'plots').mkdir(parents=True, exist_ok=True)
    sources = {k: keyed(p) for k, p in BUILDINGS.items()}
    k = REAPERS_WIDTH / sources['wheat_reapers'].width
    for name, img in sources.items():
        out = reduce(img, k)
        out.save(OUT / f'{name}.png')
        print(f'{name}: {out.width}x{out.height}')
    for name, path in PLOTS.items():
        img = keyed(path)
        out = centre_plot(reduce(img, PLOT_WIDTH / img.width))
        out.save(OUT / 'plots' / f'{name}.png')
        print(f'plots/{name}: {out.width}x{out.height}')
    wall, slope = shear_wall(keyed(WALL))
    out = reduce(wall, WALL_WIDTH / wall.width)
    out.save(OUT / 'wall_cliff.png')
    print(f'wall_cliff: {out.width}x{out.height} (source foot slope {slope:.3f} -> 0.5)')


if __name__ == '__main__':
    main()
