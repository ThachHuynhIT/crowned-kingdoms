"""Cut the approved dusk sky (1536x1024) to the 384x256 menu sky strip that repeats left to right.

    python docs/art-review/g5/menu/make_sky.py

Box-reduced 4x (opaque). Reports the seam (mean colour step across the wrap edge against the inside); writes
public/assets/art/ai-v1/menu/sky.png and docs/art-review/g5/menu/sky/preview.png (two copies side by side).

    python docs/art-review/g5/menu/make_sky.py --density 2

HiDPI twin (2026-11-11): the same sky box-reduced 2x instead of 4x (768x512) to public/assets/art/ai-v1-hd/menu/sky.png
(no preview); the menu draws it at half the scale at display density >= 2 (src/render/hudArtHd.ts). Without --density
the output is unchanged.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
D = ROOT / 'docs/art-review/g5/menu/sky'
OUT = ROOT / 'public/assets/art/ai-v1/menu'
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/menu'


def main(args=()):
    args = list(args)
    density = int(args[args.index('--density') + 1]) if '--density' in args else 1
    if density not in (1, 2):
        raise SystemExit('--density must be 1 or 2')
    src = Image.open(D / 'source.png').convert('RGB').resize((1536, 1024), Image.NEAREST)
    if density != 1:
        OUT_HD.mkdir(parents=True, exist_ok=True)
        src.resize((384 * density, 256 * density), Image.BOX).save(OUT_HD / 'sky.png')
        print('sky: hd ok')
        return
    sky = src.resize((384, 256), Image.BOX)
    a = np.array(sky).astype(int)
    wrap = np.abs(a[:, 0] - a[:, -1]).sum(axis=1).mean()
    inner = np.abs(a[:, 192] - a[:, 191]).sum(axis=1).mean()
    OUT.mkdir(parents=True, exist_ok=True)
    sky.save(OUT / 'sky.png')
    prev = Image.new('RGB', (768, 256))
    prev.paste(sky, (0, 0))
    prev.paste(sky, (384, 0))
    prev.resize((1536, 512), Image.NEAREST).save(D / 'preview.png')
    print(f'sky: wrap step {wrap:.1f}, inner step {inner:.1f}')


if __name__ == '__main__':
    main(sys.argv[1:])
