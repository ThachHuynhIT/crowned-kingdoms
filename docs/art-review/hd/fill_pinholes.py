"""Close the keying pinholes of the HiDPI building and plot twins (run after every HD building/level/plot export).

    python docs/art-review/hd/fill_pinholes.py                # ai-v1-hd (density 4)
    python docs/art-review/hd/fill_pinholes.py --density 8    # ai-v1-uhd (close-up, density 8)

The black-key cutters drop near-black pixels; at 4 art px per world unit dark mortar and outlines inside a building
survive the box reduction less often than at density 2, so the HD twins showed extra see-through dots (the green dotted
lines the owner rejected on the forge set, 10/11/2026). This fills every transparent HD pixel that is NOT connected to
the image border and whose density-2 twin pixel is opaque, with the mean colour of its opaque 4-neighbours (repeated
inwards). Holes the approved density-2 image also has (gaps between parts) stay open. Size and silhouette do not change;
alpha stays 0/255. Idempotent. The twin pixel of an HD/UHD pixel is found by the size ratio (2 for HD, 4 for UHD).
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SD = ROOT / 'public/assets/art/ai-v1'
HD = ROOT / 'public/assets/art/ai-v1-hd'
# the cliff wall is exported as cut (the shipped HD wall was never filled); only buildings, levels and plots are
SKIP = {'iso/wall_cliff.png'}
SETS = {4: HD, 8: ROOT / 'public/assets/art/ai-v1-uhd'}


def border_connected(t: np.ndarray) -> np.ndarray:
    bg = np.zeros_like(t)
    bg[0], bg[-1], bg[:, 0], bg[:, -1] = t[0], t[-1], t[:, 0], t[:, -1]
    while True:
        g = bg.copy()
        g[1:] |= bg[:-1]
        g[:-1] |= bg[1:]
        g[:, 1:] |= bg[:, :-1]
        g[:, :-1] |= bg[:, 1:]
        g &= t
        if (g == bg).all():
            return bg
        bg = g


def fill(hd: np.ndarray, sd: np.ndarray) -> tuple[np.ndarray, int]:
    out = hd.copy()
    clear = out[..., 3] == 0
    m = hd.shape[0] // sd.shape[0]
    assert hd.shape[:2] == (sd.shape[0] * m, sd.shape[1] * m), 'not an exact multiple of its density-2 twin'
    twin_opaque = np.repeat(np.repeat(sd[..., 3] > 0, m, 0), m, 1)
    todo = clear & ~border_connected(clear) & twin_opaque
    n = int(todo.sum())
    while todo.any():
        solid = out[..., 3] > 0
        acc = np.zeros(out.shape[:2] + (3,), float)
        cnt = np.zeros(out.shape[:2], float)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            s = np.roll(solid, (dy, dx), (0, 1))
            c = np.roll(out[..., :3].astype(float), (dy, dx), (0, 1))
            acc += c * s[..., None]
            cnt += s
        ready = todo & (cnt > 0)
        if not ready.any():
            break
        out[ready, :3] = np.round(acc[ready] / cnt[ready, None]).astype(np.uint8)
        out[ready, 3] = 255
        todo &= ~ready
    return out, n


def main(density: int = 4) -> None:
    hd_root = SETS[density]
    total = 0
    for f in sorted([*hd_root.glob('iso/*.png'), *hd_root.glob('iso-neutral/*.png'), *hd_root.glob('iso/plots/*.png')]):
        rel = f.relative_to(hd_root)
        if rel.as_posix() in SKIP:
            continue
        hd = np.array(Image.open(f).convert('RGBA'))
        sd = np.array(Image.open(SD / rel).convert('RGBA'))
        out, n = fill(hd, sd)
        if n:
            Image.fromarray(out, 'RGBA').save(f)
            print(f'{rel.as_posix()}: {n} px filled')
            total += n
    print(f'{total} px filled')


if __name__ == '__main__':
    import sys
    args = sys.argv[1:]
    density = int(args[args.index('--density') + 1]) if '--density' in args else 4
    if density not in SETS:
        raise SystemExit('--density must be 4 or 8')
    main(density)
