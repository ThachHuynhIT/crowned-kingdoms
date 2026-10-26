"""Turn the approved/pending AI building sources of a group into 64-px-wide RGBA assets and a review sheet.

    python docs/art-review/g3e/buildings/make_assets.py wheat

For each <group>/<id>/source.png: remove the flat black background (only black connected to the border), crop to the
building, scale to 64 art px wide (alpha-aware box average, alpha stays 0/255), write <id>/asset.png, and write
<group>/sheet.png (every asset at 4x on a grass-green background, labelled by order) for review.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

B = Path(__file__).resolve().parent
THRESH = 28
WIDTH = 64


def remove_black(rgb):
    dark = rgb.max(axis=2) <= THRESH
    h, w = dark.shape
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if dark[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if dark[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    ring = np.array(Image.fromarray((seen * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    return np.where(ring & (rgb.max(axis=2) <= THRESH + 24), 0, 255).astype(np.uint8)


def to_asset(src):
    rgb = np.array(Image.open(src).convert('RGB')).astype(int)
    alpha = remove_black(rgb)
    # Drop specks: keep only the largest connected opaque component.
    ys, xs = np.where(alpha > 0)
    if len(xs) == 0:
        raise SystemExit(f'{src}: nothing left after background removal')
    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    rgba[alpha == 0] = 0
    img = Image.fromarray(rgba, 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    w, h = img.size
    nh = max(1, round(h * WIDTH / w))
    a = np.array(img).astype(np.float64)
    pre = a.copy()
    pre[..., :3] *= (a[..., 3:4] / 255.0)
    small = Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((WIDTH, nh), Image.BOX)
    s = np.array(small).astype(np.float64)
    cov = s[..., 3] / 255.0
    rgb_out = np.where(cov[..., None] > 0, s[..., :3] / np.maximum(cov[..., None], 1e-9), 0)
    out_a = np.where(cov >= 0.5, 255, 0)
    out = np.dstack([np.clip(np.rint(rgb_out), 0, 255), out_a]).astype(np.uint8)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def main(group):
    items = sorted(p for p in (B / group).iterdir() if (p / 'source.png').exists())
    assets = []
    for d in items:
        asset = to_asset(d / 'source.png')
        asset.save(d / 'asset.png')
        assets.append((d.name, asset))
        print(d.name, asset.size)
    cell_w, cell_h = (WIDTH + 8) * 4, 96 * 4
    cols = min(4, len(assets))
    rows = -(-len(assets) // cols)
    sheet = Image.new('RGBA', (cols * cell_w, rows * cell_h), (88, 130, 52, 255))
    for i, (_, a) in enumerate(assets):
        big = a.resize((a.width * 4, a.height * 4), Image.NEAREST)
        x = (i % cols) * cell_w + (cell_w - big.width) // 2
        y = (i // cols) * cell_h + cell_h - 16 - big.height
        sheet.alpha_composite(big, (x, y))
    sheet.convert('RGB').save(B / group / 'sheet.png')


if __name__ == '__main__':
    main(sys.argv[1])
