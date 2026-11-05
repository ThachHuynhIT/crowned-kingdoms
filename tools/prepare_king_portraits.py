"""Prepare the approved king portraits as 96x144 native pixel art.

    python tools/prepare_king_portraits.py [--out DIR] [king ...]

Reads docs/art-review/g3e/portraits/<king>/source.png (1024x1536 concept art, never modified),
shrinks the whole picture (no crop) to 96x144 by averaging, snaps every pixel to that king's own
explicit palette (no dithering, open colours: not forced into the Hearth 32), removes single stray
pixels, and writes <out>/<king>.png plus <out>/native-sheet.png (1x, 2x and 24x36 thumbnails).
Default out: docs/art-review/g3e/portraits/native. Nothing is copied into public/ or src/.
"""
import argparse
import sys
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PORTRAITS = ROOT / 'docs/art-review/g3e/portraits'
SIZE = (96, 144)
KINGS = ['wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad']

# Explicit palette of each king (24 colours each, from a median-cut of the approved picture). Edit here to retune.
PALETTES = {
    'wheat': ['#3a1a0f', '#5d210b', '#582f1a', '#6e3312', '#6f3d1e', '#8c3c13', '#734c2e', '#aa3610', '#b44714', '#955925', '#b15919', '#c65d19', '#ba6e26', '#d16c1b', '#9c7954', '#d9781f', '#b88248', '#d7842c', '#ea8420', '#d4954b', '#f19a36', '#f2ae46', '#f8bf53', '#fbde79'],
    'stone': ['#141721', '#1e222f', '#272c3d', '#2c354c', '#3a3b49', '#303f60', '#3d455d', '#3d4d6d', '#4b4e5f', '#535260', '#5e575f', '#5c6277', '#5c6b8c', '#6e6d7d', '#79737d', '#61759c', '#86787b', '#868696', '#7389b1', '#998b8a', '#8298c0', '#a19ba1', '#94a9cd', '#bdb5b6'],
    'arcane': ['#210b28', '#31123c', '#3d1846', '#3f1e3e', '#462849', '#552064', '#54305f', '#662867', '#663e5d', '#5a3a7c', '#5d3c85', '#7a2b7a', '#84415c', '#5c3c8b', '#5d3b8b', '#5d3c8b', '#5d3d8c', '#895558', '#ab6140', '#892ca9', '#af6174', '#c07c70', '#da977e', '#ebb4a1'],
    'grove': ['#1a2014', '#1e2a18', '#23341b', '#283c1f', '#38341d', '#2b4522', '#384725', '#474021', '#564221', '#3e5428', '#3a6135', '#47622b', '#585727', '#694924', '#586526', '#745a2a', '#537335', '#6c7527', '#8d602e', '#668845', '#9b7436', '#928a34', '#909c4c', '#b7ba63'],
    'tide': ['#151919', '#162222', '#112b2e', '#37261a', '#143a3d', '#3f3021', '#55321b', '#3d4034', '#194b52', '#58442c', '#723e1e', '#1d595f', '#7e4d26', '#206970', '#616149', '#8c6337', '#328185', '#ac6530', '#8b805d', '#c18548', '#56a09c', '#77b9af', '#cda66e', '#c8d3b4'],
    'forge': ['#1e0a06', '#320a05', '#32130b', '#361810', '#4a150b', '#391d16', '#3c231b', '#4b1e12', '#4b2418', '#5a1f0f', '#681f0d', '#4d2d23', '#841e09', '#642d1e', '#742b14', '#753320', '#843218', '#7b3f2a', '#a23210', '#a24122', '#c84315', '#b65429', '#cd682c', '#ea912b'],
    'clock': ['#291314', '#441613', '#44241b', '#4e2d1f', '#672b18', '#513830', '#6f3a1d', '#832d18', '#714225', '#86431d', '#a13e1d', '#8b5026', '#975a29', '#98673a', '#b26328', '#b67335', '#c8772d', '#db8a36', '#c48b50', '#e49c48', '#f0b460', '#ddb07a', '#f6cf8a', '#fde29b'],
    'moon': ['#120c1c', '#16112a', '#161435', '#24182b', '#1d1838', '#19173e', '#211e48', '#222052', '#3c2839', '#2c254f', '#322649', '#272558', '#3b2f58', '#553b4f', '#433969', '#694b5d', '#574873', '#6f5c83', '#87636f', '#8b708e', '#957da0', '#af8c95', '#d1aea9', '#f4d5c2'],
    'nomad': ['#331812', '#531f14', '#512d19', '#64321a', '#6c3b1e', '#754624', '#884923', '#a74025', '#a95227', '#9c6130', '#ad662b', '#be672d', '#ba7537', '#c2824a', '#d97f3d', '#d8883d', '#e78a3c', '#dc9a4e', '#f09740', '#f5a347', '#f2ae56', '#f4bd6b', '#fbcc74', '#feda6d'],
}


def hex_rgb(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))


def nearest(rgb, palette):
    return min(palette, key=lambda p: (p[0] - rgb[0]) ** 2 + (p[1] - rgb[1]) ** 2 + (p[2] - rgb[2]) ** 2)


def despeckle(grid, w, h):
    """Replace a pixel whose four neighbours all differ from it by the commonest neighbour colour."""
    out = [row[:] for row in grid]
    for y in range(h):
        for x in range(w):
            c = grid[y][x]
            around = [grid[ny][nx] for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)) if 0 <= nx < w and 0 <= ny < h]
            if around and all(a != c for a in around):
                out[y][x] = Counter(around).most_common(1)[0][0]
    return out


def prepare(src, palette_hex, smooth=0):
    """96x144 RGBA picture (alpha 255 everywhere) of `src`, using only the colours of `palette_hex`.

    smooth=0 keeps the details (face, crown) sharp but leaves noisy textures; smooth=3 runs a 3x3
    median filter first and removes strays in three passes: calmer pixels, softer faces.
    """
    palette = [hex_rgb(h) for h in palette_hex]
    small = Image.open(src).convert('RGB').resize(SIZE, Image.BOX)
    if smooth:
        small = small.filter(ImageFilter.MedianFilter(smooth))
    w, h = SIZE
    cache = {}
    grid = []
    for y in range(h):
        row = []
        for x in range(w):
            px = small.getpixel((x, y))
            if px not in cache:
                cache[px] = nearest(px, palette)
            row.append(cache[px])
        grid.append(row)
    for _ in range(3 if smooth else 1):
        grid = despeckle(grid, w, h)
    out = Image.new('RGBA', SIZE)
    out.putdata([(*c, 255) for row in grid for c in row])
    return out


def sheet(images, kings):
    """1x, 2x and 24x36 thumbnails of every portrait on one dark sheet."""
    cell_w, cell_h = 96 * 2 + 12, 144 * 2 + 28
    cols = 3
    rows = (len(kings) + cols - 1) // cols
    img = Image.new('RGB', (cols * (cell_w + 130) + 10, rows * cell_h + 10), (24, 24, 28))
    d = ImageDraw.Draw(img)
    for i, k in enumerate(kings):
        x = 10 + (i % cols) * (cell_w + 130)
        y = 10 + (i // cols) * cell_h
        art = images[k]
        img.paste(art.resize((192, 288), Image.NEAREST), (x, y + 14), art.resize((192, 288), Image.NEAREST))
        img.paste(art, (x + 200, y + 14), art)
        thumb = art.resize((24, 36), Image.BOX)
        img.paste(thumb, (x + 200, y + 14 + 150), thumb)
        d.text((x, y), k, fill=(220, 220, 220))
        d.text((x + 200, y + 168 + 14), '1x / 24x36', fill=(150, 150, 150))
    return img


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(PORTRAITS / 'native'))
    ap.add_argument('--smooth', type=int, default=0, choices=[0, 3, 5], help='median filter size before snapping (0 = off)')
    ap.add_argument('kings', nargs='*')
    args = ap.parse_args(argv)
    kings = args.kings or KINGS
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    images = {}
    for k in kings:
        src = PORTRAITS / k / 'source.png'
        if not src.exists():
            raise SystemExit(f'missing {src}')
        images[k] = prepare(src, PALETTES[k], args.smooth)
        images[k].save(out / f'{k}.png')
        print(out / f'{k}.png')
    sheet(images, kings).save(out / 'native-sheet.png')
    return 0


if __name__ == '__main__':
    sys.exit(main())
