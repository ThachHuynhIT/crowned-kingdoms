"""Cut the approved menu / release samples (2026-11-20) into runtime-ready files, kept under docs only.

    python docs/art-review/g5/menu/make_extra_assets.py [id ...]

ids: menu_near, menu_logo, menu_win, menu_lose, release_app_icon (the icon also gives release_favicon and
release_maskable). Nothing is written to public/: each id writes <its review folder>/runtime/ (1x) and runtime/hd/
(2x twin, like the other HiDPI menu art) so Claude can move them into public/ when wiring them up.

- menu_near: make_assets.strip (magenta keyed, mask-weighted box reduction, alpha 0/255), 256 x 36 (2x: 512 x 72).
- menu_logo: magenta keyed, cropped to the emblem, reduced to 256 px wide (2x: 512), alpha 0/255.
- menu_win / menu_lose: opaque box reduction to 384 x 256 (2x: 768 x 512), the menu sky's size.
- release_app_icon: 192 and 512 box reductions; release_maskable 512: the whole icon shrunk to 420 px in the middle
  (crown tip, flag and steps inside the 80 % safe circle) and its edge pixels extended outwards to fill the square;
  release_favicon: the crown-only crop at 16, 32, 48 plus a multi-size favicon.ico.
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
MENU = ROOT / 'docs/art-review/g5/menu'
RELEASE = ROOT / 'docs/art-review/release'

_spec = importlib.util.spec_from_file_location('menu_make_assets', MENU / 'make_assets.py')
assets = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(assets)

NEAR_H = 36
FAVICON_CROP = (270, 52, 754, 356)  # the crown in release_app_icon/source.png (1024 px)
MASKABLE_INNER = 420


def keyed_reduce(path, width):
    """Magenta keyed, cropped to its opaque box, mask-weighted box reduction to `width`, alpha 0/255."""
    a = np.array(Image.open(path).convert('RGB')).astype(float)
    solid = ~((a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110))
    ys, xs = np.nonzero(solid)
    pad = 12
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + pad + 1)
    a, solid = a[y0:y1, x0:x1], solid[y0:y1, x0:x1]
    height = round(a.shape[0] * width / a.shape[1])
    mm = np.array(Image.fromarray(solid.astype(np.float32), mode='F').resize((width, height), Image.BOX))
    out = np.zeros((height, width, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((a[..., k] * solid).astype(np.float32), mode='F').resize((width, height), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def save(img, folder, name):
    folder.mkdir(parents=True, exist_ok=True)
    img.save(folder / name)
    print((folder / name).relative_to(ROOT).as_posix(), f'{img.width}x{img.height}')


def near():
    d = MENU / 'menu_near'
    for density, folder in ((1, d / 'runtime'), (2, d / 'runtime/hd')):
        out = assets.strip(d / 'source.png', NEAR_H, density)
        top = assets.ridge(out)
        save(Image.fromarray(out, 'RGBA'), folder, 'hills_near.png')
        print('  seam', abs(int(top[0]) - int(top[-1])), 'px; ridge', int(top.min()), '..', int(top.max()))


def logo():
    d = MENU / 'menu_logo'
    save(keyed_reduce(d / 'source.png', 256), d / 'runtime', 'logo.png')
    save(keyed_reduce(d / 'source.png', 512), d / 'runtime/hd', 'logo.png')


def backdrop(ident):
    d = MENU / ident
    src = Image.open(d / 'source.png').convert('RGB').resize((1536, 1024), Image.NEAREST)
    name = ident.replace('menu_', '') + '.png'
    save(src.resize((384, 256), Image.BOX), d / 'runtime', name)
    save(src.resize((768, 512), Image.BOX), d / 'runtime/hd', name)


def icon():
    d = RELEASE / 'release_app_icon'
    src = Image.open(d / 'source.png').convert('RGB').resize((1024, 1024), Image.NEAREST)
    for s in (192, 512):
        save(src.resize((s, s), Image.BOX), d / 'runtime', f'icon-{s}.png')
    inner = np.array(src.resize((MASKABLE_INNER, MASKABLE_INNER), Image.BOX))
    p0 = (512 - MASKABLE_INNER) // 2
    p1 = 512 - MASKABLE_INNER - p0
    mask = np.pad(inner, ((p0, p1), (p0, p1), (0, 0)), mode='edge')
    save(Image.fromarray(mask, 'RGB'), RELEASE / 'release_maskable/runtime', 'icon-maskable-512.png')
    crown = src.crop(FAVICON_CROP)
    side = round(crown.width * 1.12)  # a margin so the crown's side points are not cut at the tab edge
    sq = Image.new('RGB', (side, side), src.getpixel((512, 40)))
    sq.paste(crown, ((side - crown.width) // 2, (side - crown.height) // 2))
    fav = RELEASE / 'release_favicon/runtime'
    for s in (16, 32, 48):
        save(sq.resize((s, s), Image.BOX), fav, f'favicon-{s}.png')
    frames = [sq.resize((s, s), Image.BOX) for s in (16, 32, 48)]
    frames[2].save(fav / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=frames[:2])
    print((fav / 'favicon.ico').relative_to(ROOT).as_posix(), '16/32/48')


JOBS = {'menu_near': near, 'menu_logo': logo, 'menu_win': lambda: backdrop('menu_win'),
        'menu_lose': lambda: backdrop('menu_lose'), 'release_app_icon': icon}

if __name__ == '__main__':
    for ident in sys.argv[1:] or JOBS:
        JOBS[ident]()
