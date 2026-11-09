"""Cut an approved FX source (flat magenta background) to its native size.

    python docs/art-review/g5/fx/make_assets.py boulder [...]

Same key/crop/box-reduce as the icons (alpha 0/255): public/assets/art/ai-v1/fx/fx_<id>.png at the native size of
the code painter it replaces (src/render/fxArt.ts). Preview: docs/art-review/g5/fx/<id>/preview.png, the new sprite
next to the code one, both at 8x on the battlefield grass colour.
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g5/fx'
OUT = ROOT / 'public/assets/art/ai-v1/fx'
SIZES = {'boulder': 16, 'pulse': 16, 'shield': 16}

spec = importlib.util.spec_from_file_location('icon_assets', ROOT / 'docs/art-review/g3e/icons/make_assets.py')
icons = importlib.util.module_from_spec(spec)
spec.loader.exec_module(icons)


def main(ids):
    OUT.mkdir(parents=True, exist_ok=True)
    for fx in ids:
        n = SIZES[fx]
        sq, m = icons.cut(P / fx / 'source.png')
        img = icons.reduce(sq, m, n)
        img.save(OUT / f'fx_{fx}.png')
        prev = Image.new('RGBA', (n * 8 + 16, n * 8 + 16), (110, 150, 70, 255))
        prev.alpha_composite(img.resize((n * 8, n * 8), Image.NEAREST), (8, 8))
        prev.save(P / fx / 'preview.png')
        print(fx, 'ok')


if __name__ == '__main__':
    main(sys.argv[1:])
