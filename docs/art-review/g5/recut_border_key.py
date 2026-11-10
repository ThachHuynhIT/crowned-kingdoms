"""Re-cut approved black-background building sources keying only BORDER-CONNECTED black (10/11/2026).

    python docs/art-review/g5/recut_border_key.py forge_flame_tower forge_iron_drake forge_bombardiers

The G5 cutter keyed every near-black pixel, so dark mortar lines and outlines inside a building became holes (the
owner saw them as green dotted lines over the grass). This keeps the published image's exact size and footprint: it
crops the source to the object, box-reduces (mask-weighted, alpha 0/255) to the current PNG's width × height and
overwrites it. The old file is kept as `<id>.pre-recut.png` next to the source for rollback.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / 'public/assets/art/ai-v1/iso'


def background(a: np.ndarray) -> np.ndarray:
    cand = a.max(axis=2) < 6  # the sources sit on pure black (0–1); dark mortar is darker than 28 but not this dark
    bg = np.zeros_like(cand)
    bg[0, :], bg[-1, :], bg[:, 0], bg[:, -1] = cand[0, :], cand[-1, :], cand[:, 0], cand[:, -1]
    while True:
        g = bg.copy()
        g[1:, :] |= bg[:-1, :]
        g[:-1, :] |= bg[1:, :]
        g[:, 1:] |= bg[:, :-1]
        g[:, :-1] |= bg[:, 1:]
        g &= cand
        if (g == bg).all():
            return bg
        bg = g


def recut(card: str) -> None:
    king = card.split('_', 1)[0]
    src = ROOT / f'docs/art-review/g5/{king}/{card}/source.png'
    dst = ART / f'{card}.png'
    old = Image.open(dst).convert('RGBA')
    (src.parent / f'{card}.pre-recut.png').write_bytes(dst.read_bytes())
    a = np.array(Image.open(src).convert('RGB')).astype(float)
    solid = ~background(a)
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop, m = a[y0:y1, x0:x1], solid[y0:y1, x0:x1].astype(np.float32)
    tw, th = old.size
    mm = np.array(Image.fromarray(m, mode='F').resize((tw, th), Image.BOX))
    out = np.zeros((th, tw, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((crop[..., k] * m).astype(np.float32), mode='F').resize((tw, th), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    Image.fromarray(out, 'RGBA').save(dst)
    print(card, (tw, th), 'opaque px', int((np.array(old)[..., 3] > 0).sum()), '->', int((out[..., 3] > 0).sum()))


if __name__ == '__main__':
    for c in sys.argv[1:]:
        recut(c)
