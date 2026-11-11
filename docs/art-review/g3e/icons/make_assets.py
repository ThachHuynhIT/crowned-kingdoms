"""Cut an approved icon source (flat magenta background) into in-game square icons.

    python docs/art-review/g3e/icons/make_assets.py icon_king_wheat [...]

Keys out the magenta, crops to the object, and box-reduces it (mask-weighted, alpha 0/255) into a centred 32x32 and
16x16 square: public/assets/art/ai-v1/icons/<id>.png and <id>-16.png. The 16 px copy is for small calendar cells
(the game never scales by a fraction). Preview: docs/art-review/g3e/icons/<id>/preview.png (both at 4x on cream).

    python docs/art-review/g3e/icons/make_assets.py --density 2 icon_life [...]

HiDPI twins (2026-11-11): the same cut at twice the pixels (64x64 and 32x32) under the same names in
public/assets/art/ai-v1-hd/icons/ (no preview). The game draws them at half the scale at display density >= 2
(src/render/hudArtHd.ts). Without --density the output is unchanged.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g3e/icons'
OUT = ROOT / 'public/assets/art/ai-v1/icons'
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/icons'


def cut(src):
    a = np.array(Image.open(src).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    solid = ~((r > 150) & (b > 150) & (g < 110))
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    side = max(y1 - y0, x1 - x0)
    # pad the crop to a centred square so the icon keeps its proportions
    sq = np.zeros((side, side, 3))
    m = np.zeros((side, side))
    oy, ox = (side - (y1 - y0)) // 2, (side - (x1 - x0)) // 2
    sq[oy:oy + y1 - y0, ox:ox + x1 - x0] = a[y0:y1, x0:x1]
    m[oy:oy + y1 - y0, ox:ox + x1 - x0] = solid[y0:y1, x0:x1]
    return sq, m


def reduce(sq, m, n):
    mm = np.array(Image.fromarray(m.astype(np.float32), mode='F').resize((n, n), Image.BOX))
    out = np.zeros((n, n, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((sq[..., k] * m).astype(np.float32), mode='F').resize((n, n), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


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
        for icon in ids:
            sq, m = cut(P / icon / 'source.png')
            reduce(sq, m, 32 * density).save(OUT_HD / f'{icon}.png')
            reduce(sq, m, 16 * density).save(OUT_HD / f'{icon}-16.png')
            print(icon, 'hd ok')
        return
    OUT.mkdir(parents=True, exist_ok=True)
    for icon in ids:
        sq, m = cut(P / icon / 'source.png')
        big, small = reduce(sq, m, 32), reduce(sq, m, 16)
        big.save(OUT / f'{icon}.png')
        small.save(OUT / f'{icon}-16.png')
        prev = Image.new('RGBA', (32 * 4 + 16 * 4 + 24, 32 * 4 + 16), (232, 214, 170, 255))
        prev.alpha_composite(big.resize((128, 128), Image.NEAREST), (8, 8))
        prev.alpha_composite(small.resize((64, 64), Image.NEAREST), (8 + 128 + 8, 8 + 64))
        prev.save(P / icon / 'preview.png')
        print(icon, 'ok')


if __name__ == '__main__':
    main(sys.argv[1:])
