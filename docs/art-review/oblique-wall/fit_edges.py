"""Make a supporting wall variant join the main segment of the same king.

The AI variant is drawn with the same edge profile as the main image, but not pixel-exact. This pastes the main
image's outer bands over the variant's left and right edges, with an ordered-dither transition (hard pixels,
no blur) so the seams to the main piece, and to other variants, disappear.

    python docs/art-review/oblique-wall/fit_edges.py wheat a   # -> source_wheat_a_fit.png + preview_wheat_a_fit.png
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

D = Path(__file__).resolve().parent / 'terrain_mountain_wall_mid_0'
BAND = 112  # source px taken whole from the main image on each side
FEATHER = 64  # source px of dithered transition beyond the band
BLOCK = 4  # one art pixel
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def fit(king, variant):
    main_name = 'source_wheat_v2.png' if king == 'wheat' else f'source_{king}.png'
    main = np.array(Image.open(D / main_name).convert('RGB'))
    var = np.array(Image.open(D / f'source_{king}_{variant}.png').convert('RGB'))
    if main.shape != var.shape:
        raise SystemExit(f'size mismatch {main.shape} vs {var.shape}')
    h, w, _ = var.shape
    out = var.copy()
    ys = np.arange(h) // BLOCK
    for x in range(w):
        d = min(x, w - 1 - x)  # distance to the nearest outer edge
        if d < BAND:
            take = np.ones(h, bool)
        elif d < BAND + FEATHER:
            t = (d - BAND) / FEATHER  # 0 at the band, 1 at the end of the transition
            thr = BAYER[ys % 4, (x // BLOCK) % 4]
            take = t < thr
        else:
            continue
        out[take, x] = main[take, x]
    path = D / f'source_{king}_{variant}_fit.png'
    Image.fromarray(out).save(path)
    # preview: main - variant - main - variant at half size
    a, b = Image.open(D / main_name).convert('RGB'), Image.fromarray(out)
    sheet = Image.new('RGB', (w * 2, h // 2))
    for i, im in enumerate((a, b, a, b)):
        sheet.paste(im.resize((w // 2, h // 2)), (i * w // 2, 0))
    sheet.save(D / f'preview_{king}_{variant}_fit.png')
    print(path.name)


if __name__ == '__main__':
    fit(sys.argv[1], sys.argv[2])
