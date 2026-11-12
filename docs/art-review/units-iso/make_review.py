"""Cut the diagonal-direction sheets of a unit into game-size frames and a review board (no game files written).

    python docs/art-review/units-iso/make_review.py militia
    python docs/art-review/units-iso/make_review.py --frames 12 militia

Uses the cutting code of docs/art-review/g3e/units/make_poses.py (same cells, magenta key, reduction factor and redrawn
outline as the shipped frames), so the new frames come out at exactly the size of today's unit. Writes
<unit>/frames/<unit>_<se|nw>_<i>.png (density 2), <unit>/review.png (old row, SE row, NW row and NW mirrored, on grass at
4x) and <unit>/walk-<se|nw>.gif.
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
P = ROOT / 'docs/art-review/units-iso'
spec = importlib.util.spec_from_file_location('make_poses', ROOT / 'docs/art-review/g3e/units/make_poses.py')
mp = importlib.util.module_from_spec(spec)
sys.path.insert(0, str(ROOT / 'docs/art-review/g3e/units'))
spec.loader.exec_module(mp)
GRASS = (88, 140, 72, 255)
Z = 4


def frames_of(sheet_path, unit):
    sheet = np.array(Image.open(sheet_path).convert('RGBA'))
    figures = [mp.crop_figure(c) for c in mp.cells(sheet)]
    # same on-screen height as today's idle frame: reduce the new idle figure to the shipped idle height
    with Image.open(ROOT / f'public/assets/art/ai-v1/{unit}_0.png') as im:
        shipped = np.array(im.convert('RGBA'))
    rows_ = np.where(shipped[..., 3] > 0)[0]
    target = int(rows_.max() - rows_.min()) + 1
    factor = figures[0][1].shape[0] / target
    return mp.place([mp.outline(mp.reduce(rgb, solid, factor)) for rgb, solid in figures])


def on_grass(frames, w, h):
    row = Image.new('RGBA', (len(frames) * (w + 4) + 4, h + 8), GRASS)
    for i, f in enumerate(frames):
        im = Image.fromarray(f)
        row.alpha_composite(im, (4 + i * (w + 4) + (w - im.width) // 2, 4 + h - im.height))
    return row.resize((row.width * Z, row.height * Z), Image.NEAREST)


def main(unit):
    out = P / unit / 'frames'
    out.mkdir(parents=True, exist_ok=True)
    rows = {}
    old = [np.array(Image.open(ROOT / f'public/assets/art/ai-v1/{unit}_{i}.png').convert('RGBA')) for i in range(6)]
    rows['old'] = old
    for d in ('se', 'nw'):
        fr = frames_of(P / unit / f'poses-{d}-source.png', unit)
        rows[d] = fr
        for i, f in enumerate(fr):
            Image.fromarray(f).save(out / f'{unit}_{d}_{i}.png')
        imgs = [on_grass([fr[a]], fr[0].shape[1], fr[0].shape[0]).convert('RGB') for a in (2, 3)]
        imgs[0].save(P / unit / f'walk-{d}.gif', save_all=True, append_images=imgs[1:], duration=125, loop=0)
    rows['nw mirrored (= NE)'] = [f[:, ::-1] for f in rows['nw']]
    rows['se mirrored (= SW)'] = [f[:, ::-1] for f in rows['se']]
    w = max(f.shape[1] for r in rows.values() for f in r)
    h = max(f.shape[0] for r in rows.values() for f in r)
    strips = [on_grass(r, w, h) for r in rows.values()]
    board = Image.new('RGBA', (max(s.width for s in strips), sum(s.height + 8 for s in strips)), (40, 40, 48, 255))
    y = 0
    for s in strips:
        board.paste(s, (0, y))
        y += s.height + 8
    board.save(P / unit / 'review.png')
    print(unit, 'frames', rows['se'][0].shape[1], 'x', rows['se'][0].shape[0], 'old', old[0].shape[1], 'x', old[0].shape[0])


def frames12_of(unit, d):
    """The 12 frames of direction `d` (sheets A and B), reduced by ONE factor taken from idle 1 so every frame keeps
    the shipped unit's height and the same pixel size."""
    sheets = [np.array(Image.open(P / unit / f'frames12-{d}-{part}-source.png').convert('RGBA')) for part in 'ab']
    figures = [mp.crop_figure(c) for sheet in sheets for c in mp.cells(sheet)]
    with Image.open(ROOT / f'public/assets/art/ai-v1/{unit}_0.png') as im:
        shipped = np.array(im.convert('RGBA'))
    rows_ = np.where(shipped[..., 3] > 0)[0]
    factor = figures[0][1].shape[0] / (int(rows_.max() - rows_.min()) + 1)
    return mp.place([mp.outline(mp.reduce(rgb, solid, factor)) for rgb, solid in figures])


# 4 frames per animation, played twice as fast as the 2-frame set so each loop keeps its length (UnitRenderer 6/8/11)
ANIMS12 = [('idle', range(0, 4), 12), ('walk', range(4, 8), 16), ('attack', range(8, 12), 22)]


def main12(unit):
    out = P / unit / 'frames12'
    out.mkdir(parents=True, exist_ok=True)
    rows = {}
    for d in ('se', 'nw'):
        fr = frames12_of(unit, d)
        rows[d] = fr
        for i, f in enumerate(fr):
            Image.fromarray(f).save(out / f'{unit}_{d}_{i}.png')
        w, h = fr[0].shape[1], fr[0].shape[0]
        for name, idx, fps in ANIMS12:
            imgs = [on_grass([fr[i]], w, h).convert('RGB') for i in idx]
            imgs[0].save(P / unit / f'anim12-{d}-{name}.gif', save_all=True, append_images=imgs[1:],
                         duration=round(1000 / fps), loop=0)
    w = max(f.shape[1] for r in rows.values() for f in r)
    h = max(f.shape[0] for r in rows.values() for f in r)
    strips = [on_grass(r, w, h) for r in rows.values()]
    board = Image.new('RGBA', (max(s.width for s in strips), sum(s.height + 8 for s in strips)), (40, 40, 48, 255))
    y = 0
    for s in strips:
        board.paste(s, (0, y))
        y += s.height + 8
    board.save(P / unit / 'review12.png')
    print(unit, '12 frames per direction', rows['se'][0].shape[1], 'x', rows['se'][0].shape[0])


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--frames' in args:
        i = args.index('--frames')
        for u in [a for j, a in enumerate(args) if j not in (i, i + 1)] or ['militia']:
            main12(u)
    else:
        for u in args or ['militia']:
            main(u)
