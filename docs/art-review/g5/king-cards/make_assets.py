"""Cut an approved king-card background (flat magenta outside the card) to its native 66x96.

    python docs/art-review/g5/king-cards/make_assets.py wheat [...]

Keys out the magenta, crops to the card, box-reduces it (mask-weighted, alpha 0/255) to 66x96 and writes
public/assets/art/ai-v1/king-cards/<king>.png. Preview: docs/art-review/g5/king-cards/<king>/preview.png at 4x on the
king-select background colour.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g5/king-cards'
OUT = ROOT / 'public/assets/art/ai-v1/king-cards'
W, H = 66, 96


def cut(src):
    a = np.array(Image.open(src).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    solid = ~((r > 150) & (b > 150) & (g < 110))
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a, solid = a[y0:y1, x0:x1], solid[y0:y1, x0:x1]
    mm = np.array(Image.fromarray(solid.astype(np.float32), mode='F').resize((W, H), Image.BOX))
    out = np.zeros((H, W, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((a[..., k] * solid).astype(np.float32), mode='F').resize((W, H), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def main(ids):
    OUT.mkdir(parents=True, exist_ok=True)
    for king in ids:
        img = cut(P / king / 'source.png')
        img.save(OUT / f'{king}.png')
        prev = Image.new('RGBA', (W * 4 + 16, H * 4 + 16), (38, 26, 12, 255))
        prev.alpha_composite(img.resize((W * 4, H * 4), Image.NEAREST), (8, 8))
        prev.save(P / king / 'preview.png')
        print(king, 'ok')


if __name__ == '__main__':
    main(sys.argv[1:])
