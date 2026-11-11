"""Cut the existing wilds sheet (docs/art-review/g3e/batch-06-wilds/source.png, generated earlier, NOT yet approved)
into one PNG per object for the per-object review of P4 (spec 2026-11-06 §5), and draw the review sheet.

    python docs/art-review/iso-board/wilds/make_wilds.py

Only writes under docs/art-review/iso-board/wilds/ (no runtime asset, no other batch is touched; the old
tools/slice_art_batches.py rewrites every batch at once). Objects are found as connected pieces on the flat black
background (same rule as that tool), keyed to alpha 0/255 and box-reduced 4x (the trees come out about 95 px tall,
next to 54-71 px isometric Wheat buildings).

    python docs/art-review/iso-board/wilds/make_wilds.py --density 4   # HiDPI twins -> public/assets/art/ai-v1-hd/iso/wilds/

`--density 4` (11/11/2026, `.superpowers/art-hd-map.md`) writes the runtime HiDPI twins of the shipped wilds instead:
the same pieces box-reduced 2x (not 4x) to EXACTLY twice the density-2 cut (`cut_hd`: twice its uncropped size, cut to
twice its crop box, so the foot and the footprint do not move), then the dark rim peeled by
`tools/strip_decor_outline.py` with twice its passes (the rim is twice as wide), as the shipped wilds were.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[4]
SRC = ROOT / 'docs/art-review/g3e/batch-06-wilds/source.png'
OUT = Path(__file__).resolve().parent / 'cut'
SHEET = Path(__file__).resolve().parent / 'sheet.png'
NAMES = ['tree_pine_dark', 'tree_pine_light', 'tree_oak', 'tree_autumn', 'mountain_snow', 'cliff_mossy', 'boulders_big',
         'bush_green', 'bush_berry', 'bush_dry', 'rock_large', 'rock_medium', 'rock_small', 'stump', 'log']
# Tall pieces may hide units: the decor layout keeps them outside the battlefield.
TALL = {'tree_pine_dark', 'tree_pine_light', 'tree_oak', 'tree_autumn', 'mountain_snow', 'cliff_mossy', 'boulders_big'}
REDUCE = 4
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/iso/wilds'


def components(img: np.ndarray) -> list[tuple[int, int, int, int]]:
    solid = img.max(axis=2) > 28
    mask = np.array(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    out = []
    for sy, sx in zip(*np.where(mask)):
        if seen[sy, sx]:
            continue
        q, ys, xs = deque([(sy, sx)]), [], []
        seen[sy, sx] = True
        while q:
            y, x = q.popleft()
            ys.append(y)
            xs.append(x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        if len(ys) > 2000:
            out.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
    assert len(out) == len(NAMES), len(out)
    out.sort(key=lambda b: (0 if b[3] < 460 else 1 if b[3] < 800 else 2, b[0]))
    return out


def reduced(img: np.ndarray, box: tuple[int, int, int, int], m: int = 1) -> Image.Image:
    """The piece in `box` keyed and box-reduced to m x its density-2 size (uncropped), alpha 0/255."""
    x0, y0, x1, y1 = box
    sub = img[y0:y1, x0:x1].astype(np.uint8)
    alpha = np.where(img[y0:y1, x0:x1].max(axis=2) > 28, 255, 0).astype(np.uint8)
    rgba = Image.fromarray(np.dstack([sub, alpha]), 'RGBA')
    size = (max(1, round((x1 - x0) / REDUCE)) * m, max(1, round((y1 - y0) / REDUCE)) * m)
    small = rgba.convert('RGBa').resize(size, Image.BOX).convert('RGBA')
    arr = np.array(small)
    arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
    arr[arr[..., 3] == 0] = 0
    return Image.fromarray(arr, 'RGBA')


def cut(img: np.ndarray, box: tuple[int, int, int, int]) -> Image.Image:
    out = reduced(img, box)
    return out.crop(out.getbbox())


def cut_hd(img: np.ndarray, box: tuple[int, int, int, int], m: int = 2) -> Image.Image:
    """`cut` at m times the pixels and EXACTLY m times its size (m x the density-2 crop box)."""
    bbox = reduced(img, box).getbbox()
    return reduced(img, box, m).crop(tuple(v * m for v in bbox))


def export_hd() -> None:
    """The HiDPI twins of the shipped wilds: `cut_hd`, then the dark rim peeled like the shipped files."""
    sys.path.insert(0, str(ROOT / 'tools'))
    from strip_decor_outline import DEFAULT_PASSES, strip_outline

    img = np.array(Image.open(SRC).convert('RGB')).astype(int)
    OUT_HD.mkdir(parents=True, exist_ok=True)
    for name, box in zip(NAMES, components(img)):
        out, removed = strip_outline(cut_hd(img, box), 2 * DEFAULT_PASSES)
        out.save(OUT_HD / f'{name}.png')
        print(f'{name}: {out.width}x{out.height}, {removed} outline px removed')


def main() -> None:
    img = np.array(Image.open(SRC).convert('RGB')).astype(int)
    OUT.mkdir(parents=True, exist_ok=True)
    cuts = {}
    for name, box in zip(NAMES, components(img)):
        c = cut(img, box)
        c.save(OUT / f'{name}.png')
        cuts[name] = c
        print(f'{name}: {c.width}x{c.height}{" (tall)" if name in TALL else ""}')

    # Review sheet: every object at 2x on the approved isometric empty plot, a Wheat house for scale.
    iso = ROOT / 'public/assets/art/ai-v1/iso'
    plot = Image.open(iso / 'plots/wheat_open.png').convert('RGBA')
    house = Image.open(iso / 'wheat_reapers.png').convert('RGBA')
    k = 2
    cell_w, cell_h = 300, 330
    sheet = Image.new('RGBA', (cell_w * 5 + 20, cell_h * 3 + 70), (46, 34, 26, 255))
    d = ImageDraw.Draw(sheet)
    try:
        from PIL import ImageFont
        f = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 16)
        t = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 24)
    except OSError:
        f = t = None
    d.text((10, 10), 'Lô wilds (batch-06) — duyệt từng vật trên nền isometric (zoom 2)', fill=(245, 232, 205), font=t)
    for i, name in enumerate(NAMES):
        x = 10 + (i % 5) * cell_w
        y = 50 + (i // 5) * cell_h
        p = plot.resize((plot.width * k, plot.height * k), Image.NEAREST)
        px, py = x + (cell_w - p.width) // 2, y + cell_h - 40 - p.height
        sheet.alpha_composite(p, (px, py))
        cx, cy = px + p.width // 2, py + p.height // 2
        o = cuts[name].resize((cuts[name].width * k, cuts[name].height * k), Image.NEAREST)
        if i == 0:
            h = house.resize((house.width * k, house.height * k), Image.NEAREST)
            sheet.alpha_composite(h, (cx + 30, cy + 20 - h.height))
            sheet.alpha_composite(o, (cx - 30 - o.width // 2, max(y, cy + 20 - o.height)))
        else:
            sheet.alpha_composite(o, (cx - o.width // 2, max(y, cy + 20 - o.height)))
        tag = ' (cao: chỉ ngoài sân)' if name in TALL else ''
        d.text((x + 4, y + cell_h - 32), f'{i + 1}. {name}{tag}', fill=(245, 232, 205), font=f)
    sheet.convert('RGB').save(SHEET)
    print(SHEET)


if __name__ == '__main__':
    if '--density' in sys.argv:
        if sys.argv[sys.argv.index('--density') + 1] != '4':
            raise SystemExit('usage: make_wilds.py [--density 4]')
        export_hd()
    else:
        main()
