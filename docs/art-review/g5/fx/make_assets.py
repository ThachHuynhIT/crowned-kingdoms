"""Cut an approved FX source (flat magenta background) to its native size.

    python docs/art-review/g5/fx/make_assets.py boulder [...]

Same key/crop/box-reduce as the icons (alpha 0/255): public/assets/art/ai-v1/fx/fx_<id>.png at the native size of
the code painter it replaces (src/render/fxArt.ts). Preview: docs/art-review/g5/fx/<id>/preview.png, the new sprite
next to the code one, both at 8x on the battlefield grass colour.

    python docs/art-review/g5/fx/make_assets.py --density 2 boulder [...]

HiDPI twins (2026-11-11): the same cut at twice the pixels under the same names in public/assets/art/ai-v1-hd/fx/
(no preview); the shield's rim stays the same share of the bubble. The game draws them at half the scale at display
density >= 2 (src/render/imageArt.ts IMAGE_ART_HD_FX). Without --density the output is unchanged.
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g5/fx'
OUT = ROOT / 'public/assets/art/ai-v1/fx'
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/fx'
SIZES = {'boulder': 32, 'pulse': 32, 'shield': 32, 'stun': 16, 'spark': 8}

spec = importlib.util.spec_from_file_location('icon_assets', ROOT / 'docs/art-review/g3e/icons/make_assets.py')
icons = importlib.util.module_from_spec(spec)
spec.loader.exec_module(icons)


def hollow(img, density=1):
    """The ward bubble must not hide the soldier inside it: clear the pale fill, keep the rim (outer 3 px, times
    `density`) and the white shine (top-left), so only the ring and the glint are drawn."""
    import numpy as np
    a = np.array(img)
    n = a.shape[0]
    c = (n - 1) / 2
    ys, xs = np.mgrid[0:n, 0:n]
    d = np.sqrt((xs - c) ** 2 + (ys - c) ** 2)
    white = (a[..., 0] > 235) & (a[..., 1] > 235) & (a[..., 2] > 235)
    inner = (d < n / 2 - 3.5 * density) & ~white
    a[inner] = 0
    return Image.fromarray(a, 'RGBA')


def main(args):
    density, ids = icons.density_arg(args)
    if density != 1:
        OUT_HD.mkdir(parents=True, exist_ok=True)
        for fx in ids:
            sq, m = icons.cut(P / fx / 'source.png')
            img = icons.reduce(sq, m, SIZES[fx] * density)
            if fx == 'shield':
                img = hollow(img, density)
            img.save(OUT_HD / f'fx_{fx}.png')
            print(fx, 'hd ok')
        return
    OUT.mkdir(parents=True, exist_ok=True)
    for fx in ids:
        n = SIZES[fx]
        sq, m = icons.cut(P / fx / 'source.png')
        img = icons.reduce(sq, m, n)
        if fx == 'shield':
            img = hollow(img)
        img.save(OUT / f'fx_{fx}.png')
        prev = Image.new('RGBA', (n * 8 + 16, n * 8 + 16), (110, 150, 70, 255))
        prev.alpha_composite(img.resize((n * 8, n * 8), Image.NEAREST), (8, 8))
        prev.save(P / fx / 'preview.png')
        print(fx, 'ok')


if __name__ == '__main__':
    main(sys.argv[1:])
