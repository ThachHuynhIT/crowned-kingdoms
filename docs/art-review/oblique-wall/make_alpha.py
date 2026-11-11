"""Turn the flat black background of a wall piece into transparency (alpha 0/255).

Only black connected to the image border is removed, so dark outlines inside the piece stay. Run from the repo
root: python docs/art-review/oblique-wall/make_alpha.py <id> [<id> ...]. Writes <id>/source_alpha.png and a
preview over green grass (<id>/preview_alpha.png); the AI source is never modified.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

B = Path(__file__).resolve().parent
THRESH = 28


def make(ident):
    src = B / ident / 'source.png'
    rgb = np.array(Image.open(src).convert('RGB')).astype(int)
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
    # Fringe: one pixel ring next to the removed area is also background-tinted dark; drop it.
    bg = np.array(Image.fromarray((seen * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    alpha = np.where(bg & (rgb.max(axis=2) <= THRESH + 24), 0, 255).astype(np.uint8)
    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    rgba[alpha == 0] = 0
    out = Image.fromarray(rgba, 'RGBA')
    out.save(B / ident / 'source_alpha.png')
    grass = Image.new('RGBA', out.size, (88, 130, 52, 255))
    grass.alpha_composite(out)
    grass.convert('RGB').save(B / ident / 'preview_alpha.png')
    print(ident, 'transparent', round(float((alpha == 0).mean()), 3))


if __name__ == '__main__':
    for i in sys.argv[1:]:
        make(i)
