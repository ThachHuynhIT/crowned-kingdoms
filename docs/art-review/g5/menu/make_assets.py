"""Cut an approved menu layer source (flat magenta sky) into its native strip.

    python docs/art-review/g5/menu/make_assets.py hills_mid [...]

Keys out the magenta, takes the bottom `height * 6` source rows (the band is reduced 1536 → 256, 6 source px per art
px), box-reduces it (mask-weighted, alpha 0/255) to 256 × height and reports the seam: how far the ridge at the left
edge is from the ridge at the right edge. Output: public/assets/art/ai-v1/menu/<id>.png. Preview:
docs/art-review/g5/menu/<id>/preview.png (two copies side by side over the code sky, 3x, so the seam shows).

    python docs/art-review/g5/menu/make_assets.py --density 2 hills_far hills_mid

HiDPI twins (2026-11-11): the same source band (bottom `height * 6` rows) reduced to twice the pixels (512 x 2*height,
3 source px per art px) under the same names in public/assets/art/ai-v1-hd/menu/ (no preview). The menu draws them at
half the scale at display density >= 2 (src/render/hudArtHd.ts). Without --density the output is unchanged.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g5/menu'
OUT = ROOT / 'public/assets/art/ai-v1/menu'
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/menu'
WIDTH = 256
HEIGHTS = {'hills_far': 120, 'hills_mid': 90, 'hills_near': 60}
SKY = [(0xF6, 0xB2, 0x6B), (0xF0, 0x8A, 0x5D), (0xB8, 0x5C, 0x7A), (0x6B, 0x4A, 0x8A)]


def strip(src, height, density=1):
    img = Image.open(src).convert('RGB')
    if img.width != 1536:
        img = img.resize((1536, round(img.height * 1536 / img.width)), Image.NEAREST)
    a = np.array(img).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    solid = ~((r > 150) & (b > 150) & (g < 110))
    rows = height * 6
    a, solid = a[-rows:], solid[-rows:]
    width, height = WIDTH * density, height * density
    mm = np.array(Image.fromarray(solid.astype(np.float32), mode='F').resize((width, height), Image.BOX))
    out = np.zeros((height, width, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((a[..., k] * solid).astype(np.float32), mode='F').resize((width, height), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return out


def ridge(out):
    """First opaque row of every column (height when the column is empty)."""
    solid = out[..., 3] > 0
    return np.where(solid.any(axis=0), solid.argmax(axis=0), out.shape[0])


def preview(out, path):
    h = out.shape[0]
    sky_h = max(h + 40, 160)
    prev = Image.new('RGBA', (WIDTH * 2, sky_h), SKY[-1] + (255,))
    for i, c in enumerate(SKY):
        prev.paste(Image.new('RGBA', (WIDTH * 2, sky_h // 4 + 1), c + (255,)), (0, i * sky_h // 4))
    layer = Image.fromarray(out, 'RGBA')
    prev.alpha_composite(layer, (0, sky_h - h))
    prev.alpha_composite(layer, (WIDTH, sky_h - h))
    prev.resize((WIDTH * 2 * 3, sky_h * 3), Image.NEAREST).save(path)


def density_arg(args):
    """(density, the other args): `--density N` anywhere in args, 1 when absent; only 1 and 2 are allowed."""
    if '--density' not in args:
        return 1, list(args)
    i = args.index('--density')
    density = int(args[i + 1])
    if density not in (1, 2):
        raise SystemExit('--density must be 1 or 2')
    return density, list(args[:i]) + list(args[i + 2:])


def main(args):
    density, ids = density_arg(args)
    if density != 1:
        OUT_HD.mkdir(parents=True, exist_ok=True)
        for layer in ids:
            out = strip(P / layer / 'source.png', HEIGHTS[layer], density)
            top = ridge(out)
            Image.fromarray(out, 'RGBA').save(OUT_HD / f'{layer}.png')
            print(layer, 'hd seam', abs(int(top[0]) - int(top[-1])), 'px')
        return
    OUT.mkdir(parents=True, exist_ok=True)
    for layer in ids:
        out = strip(P / layer / 'source.png', HEIGHTS[layer])
        top = ridge(out)
        Image.fromarray(out, 'RGBA').save(OUT / f'{layer}.png')
        preview(out, P / layer / 'preview.png')
        print(layer, 'seam', abs(int(top[0]) - int(top[-1])), 'px; ridge', int(top.min()), '..', int(top.max()))


if __name__ == '__main__':
    main(sys.argv[1:])
