"""Slice docs/art-review/g3e/ai-v1/source-sheet.webp into the runtime PNGs in public/assets/art/ai-v1/.

Steps: block-downsample (7 px blocks -> 1 px), threshold alpha to 0/255, pad the spearman poses onto one
feet-aligned canvas, make the red 'foe' recolour, and shrink the cottage to ~64 px wide (nearest-safe resize).
Run from the repo root: python docs/art-review/g3e/ai-v1/make_assets.py
"""
from PIL import Image
import numpy as np, os

SRC = 'docs/art-review/g3e/ai-v1/source-sheet.webp'
OUT = 'public/assets/art/ai-v1'
B = 7
os.makedirs(OUT, exist_ok=True)
a = np.array(Image.open(SRC).convert('RGBA'))


def clean(arr):
    arr = arr.copy()
    arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
    arr[arr[..., 3] == 0] = 0
    return arr


def block_down(x0, y0, x1, y1, opaque=False):
    sub = a[y0:y1, x0:x1].copy()
    if not opaque:
        ys, xs = np.where(sub[..., 3] > 200)
        sub = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = sub.shape[:2]
    im = Image.fromarray(sub).resize((max(1, round(w / B)), max(1, round(h / B))), Image.BOX)
    return clean(np.array(im))


# --- spearman poses -------------------------------------------------------------------------------
segs = [(87, 244), (305, 476), (552, 713), (756, 915), (975, 1158), (1212, 1508)]
poses = [block_down(x0 - 2, 90, x1 + 2, 345) for x0, x1 in segs]
CW, CH, PIVOT = 48, 34, 20


def head_center(p):
    # helmet = brown, non-grey pixels in the rows around the head
    rows = p[8:16]
    m = (rows[..., 3] > 0) & (np.abs(rows[..., 0].astype(int) - rows[..., 2].astype(int)) > 30)
    xs = np.where(m.any(axis=0))[0]
    return int(round((xs.min() + xs.max()) / 2))


canvas_poses = []
for p in poses:
    h, w = p.shape[:2]
    c = np.zeros((CH, CW, 4), dtype=np.uint8)
    ox = PIVOT - head_center(p)
    oy = CH - h
    for y in range(h):
        for x in range(w):
            if p[y, x, 3] and 0 <= x + ox < CW:
                c[y + oy, x + ox] = p[y, x]
    canvas_poses.append(c)


def foe(c):
    c = c.copy()
    blue = (c[..., 3] > 0) & (c[..., 2].astype(int) > c[..., 0].astype(int) + 30) & (c[..., 2].astype(int) > c[..., 1].astype(int) + 10)
    r, g, b = (c[..., k].astype(int) for k in range(3))
    c[..., 0] = np.where(blue, np.clip(b + 25, 0, 255), c[..., 0])
    c[..., 1] = np.where(blue, (g * 0.35).astype(int), c[..., 1])
    c[..., 2] = np.where(blue, (r * 0.45).astype(int), c[..., 2])
    return c


for i, c in enumerate(canvas_poses):
    Image.fromarray(c).save(f'{OUT}/spearman_{i}.png')
    Image.fromarray(foe(c)).save(f'{OUT}/spearman_foe_{i}.png')

# --- cottage, shrunk to 64 px wide ----------------------------------------------------------------------
cot = block_down(20, 390, 720, 960)
im = Image.fromarray(cot)
tw = 64
th = round(cot.shape[0] * tw / cot.shape[1])
small = im.resize((tw, th), Image.LANCZOS)
s = clean(np.array(small))
Image.fromarray(s).save(f'{OUT}/cottage.png')

# --- grass tiles, padded to exactly 32x32 ----------------------------------------------------------------------
for i, (x0, x1) in enumerate([(730, 957), (994, 1219), (1261, 1481)]):
    t = block_down(x0, 650, x1, 865, opaque=True)
    t = t[:32, :32]
    pad = np.zeros((32, 32, 4), dtype=np.uint8)
    pad[:t.shape[0], :t.shape[1]] = t
    pad[t.shape[0]:, :] = pad[t.shape[0] - 1:t.shape[0], :]
    pad[:, t.shape[1]:] = pad[:, t.shape[1] - 1:t.shape[1]]
    Image.fromarray(pad).save(f'{OUT}/grass_{i}.png')
print('done', th)
