"""Cut the approved arrow sheet (3x3 cells on flat magenta, centre empty) into the eight 16x16 arrow frames.

    python docs/art-review/g5/fx/make_arrows.py

Each cell is keyed, cropped to its arrow, padded to a centred square and box-reduced (alpha 0/255) exactly like the
icons: public/assets/art/ai-v1/fx/fx_arrow_<dir>.png. Preview: docs/art-review/g5/fx/arrows/preview.png.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
D = ROOT / 'docs/art-review/g5/fx/arrows'
OUT = ROOT / 'public/assets/art/ai-v1/fx'
N = 16
CELLS = {'nw': (0, 0), 'n': (1, 0), 'ne': (2, 0), 'w': (0, 1), 'e': (2, 1), 'sw': (0, 2), 's': (1, 2), 'se': (2, 2)}


def reduce(rgb, solid):
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    side = max(y1 - y0, x1 - x0)
    sq = np.zeros((side, side, 3))
    m = np.zeros((side, side))
    oy, ox = (side - (y1 - y0)) // 2, (side - (x1 - x0)) // 2
    sq[oy:oy + y1 - y0, ox:ox + x1 - x0] = rgb[y0:y1, x0:x1]
    m[oy:oy + y1 - y0, ox:ox + x1 - x0] = solid[y0:y1, x0:x1]
    mm = np.array(Image.fromarray(m.astype(np.float32), mode='F').resize((N, N), Image.BOX))
    out = np.zeros((N, N, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((sq[..., k] * m).astype(np.float32), mode='F').resize((N, N), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def main():
    a = np.array(Image.open(D / 'source.png').convert('RGB')).astype(float)
    h, w = a.shape[:2]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    solid = ~((r > 150) & (b > 150) & (g < 110))
    OUT.mkdir(parents=True, exist_ok=True)
    prev = Image.new('RGBA', (3 * (N * 6 + 8) + 8, 3 * (N * 6 + 8) + 8), (110, 150, 70, 255))
    for d, (cx, cy) in CELLS.items():
        ys, ye = cy * h // 3, (cy + 1) * h // 3
        xs, xe = cx * w // 3, (cx + 1) * w // 3
        img = reduce(a[ys:ye, xs:xe], solid[ys:ye, xs:xe])
        img.save(OUT / f'fx_arrow_{d}.png')
        prev.alpha_composite(img.resize((N * 6, N * 6), Image.NEAREST), (8 + cx * (N * 6 + 8), 8 + cy * (N * 6 + 8)))
    prev.save(D / 'preview.png')
    print('arrows ok')


if __name__ == '__main__':
    main()
