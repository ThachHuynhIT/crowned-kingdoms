"""Slice batch-01-barracks/source.png (dark glowing background) into public/assets/art/ai-v1/ footman + barracks PNGs.

Background removal: flood fill from the image border through 'glow' pixels (reddish-brown, green >= 0.33 red, or near black);
the sprites' dark outline (green << red) stops the fill. Then 7 px blocks -> 1 art px, alpha 0/255.
Run from the repo root: python docs/art-review/g3e/batch-01-barracks/make_assets.py
"""
from PIL import Image
import numpy as np
from collections import deque

SRC = 'docs/art-review/g3e/batch-01-barracks/source.png'
OUT = 'public/assets/art/ai-v1'
B = 7
img = np.array(Image.open(SRC).convert('RGB')).astype(int)
H, W, _ = img.shape
r, g, b = img[..., 0], img[..., 1], img[..., 2]
glow = ((g * 100 >= r * 38) & (b <= r) & (r < 175)) | (r + g + b < 30)
# flood fill from the border through glow pixels
bg = np.zeros((H, W), bool)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if glow[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if glow[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and glow[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True; q.append((ny, nx))
# Second pass: sprite 'core' = pixels with real sprite colours (bright, blue, or brown-not-red); the dark halo around the
# sprites has none of these. Grow the core by one art pixel (8 px) to get the outline back, drop tiny specks.
from PIL import ImageFilter
core = (~bg) & ((img.max(axis=2) >= 100) | (b > r + 20) | ((g * 100 >= r * 50) & (img.max(axis=2) >= 55)))
grown = np.array(Image.fromarray(np.where(core, 255, 0).astype(np.uint8)).filter(ImageFilter.MaxFilter(17))) > 0
mask = grown & ~bg
seen = np.zeros((H, W), bool)
keep = np.zeros((H, W), bool)
for sy, sx in zip(*np.where(mask)):
    if seen[sy, sx]:
        continue
    comp, qq = [], deque([(sy, sx)])
    seen[sy, sx] = True
    while qq:
        y, x = qq.popleft()
        comp.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                qq.append((ny, nx))
    if len(comp) > 1500:
        for y, x in comp:
            keep[y, x] = True
alpha = np.where(keep, 255, 0).astype(np.uint8)
rgba = np.dstack([img.astype(np.uint8), alpha])


def block_down(x0, y0, x1, y1):
    sub = rgba[y0:y1, x0:x1].copy()
    ys, xs = np.where(sub[..., 3] > 0)
    sub = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = sub.shape[:2]
    # premultiply so transparent pixels do not bleed colour
    pm = sub.astype(float)
    pm[..., :3] *= pm[..., 3:4] / 255
    im = Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((max(1, round(w / B)), max(1, round(h / B))), Image.BOX)
    s = np.array(im).astype(float)
    a = s[..., 3]
    rgbo = np.where(a[..., None] > 0, s[..., :3] * 255 / np.maximum(a[..., None], 1), 0)
    out = np.dstack([np.clip(rgbo, 0, 255), np.where(a >= 128, 255, 0)]).astype(np.uint8)
    out[out[..., 3] == 0] = 0
    return out


# soldier poses: column projection of the top band
band = alpha[90:380, :] > 0
cols = band.any(axis=0)
segs, s = [], None
for x, v in enumerate(cols):
    if v and s is None: s = x
    if not v and s is not None:
        if x - s > 40: segs.append((s, x))
        s = None
segs = segs[:6]
assert len(segs) == 6, segs
poses = [block_down(x0 - 2, 90, x1 + 2, 380) for x0, x1 in segs]
CW, CH, PIVOT = 48, 34, 20


def head_center(p):
    rows = p[7:13]
    xs = np.where((rows[..., 3] > 0).any(axis=0))[0]
    return int(round((xs.min() + xs.max()) / 2))


def foe(c):
    c = c.copy()
    blue = (c[..., 3] > 0) & (c[..., 2].astype(int) > c[..., 0].astype(int) + 30) & (c[..., 2].astype(int) > c[..., 1].astype(int) + 10)
    r_, g_, b_ = (c[..., k].astype(int) for k in range(3))
    c[..., 0] = np.where(blue, np.clip(b_ + 25, 0, 255), c[..., 0])
    c[..., 1] = np.where(blue, (g_ * 0.35).astype(int), c[..., 1])
    c[..., 2] = np.where(blue, (r_ * 0.45).astype(int), c[..., 2])
    return c


for i, p in enumerate(poses):
    h, w = p.shape[:2]
    c = np.zeros((CH, CW, 4), np.uint8)
    ox, oy = PIVOT - head_center(p), CH - h
    for y in range(h):
        for x in range(w):
            if p[y, x, 3] and 0 <= x + ox < CW and 0 <= y + oy < CH:
                c[y + oy, x + ox] = p[y, x]
    Image.fromarray(c).save(f'{OUT}/footman_{i}.png')
    Image.fromarray(foe(c)).save(f'{OUT}/footman_foe_{i}.png')

# barracks, shrunk to 64 px wide
house = block_down(20, 380, 800, 980)
tw = 64
th = round(house.shape[0] * tw / house.shape[1])
small = Image.fromarray(house).resize((tw, th), Image.LANCZOS)
s = np.array(small)
s[..., 3] = np.where(s[..., 3] >= 128, 255, 0)
s[s[..., 3] == 0] = 0
Image.fromarray(s).save(f'{OUT}/barracks.png')
print('ok', segs, th)
