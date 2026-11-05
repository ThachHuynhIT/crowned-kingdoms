"""Slice a unit's 3x2 animation sheet into the six native pose frames, the red foe recolour and review previews.

    python docs/art-review/g3e/units/make_poses.py militia [reaper ...]

Input: docs/art-review/g3e/units/<unit>/poses-source.png (made by `make_prompts.py --poses`, cells in reading order
idle0 idle1 walk0 walk1 attack0 attack1 on flat magenta). Every cell is reduced by the SAME factor, chosen so that the
idle height equals the height of the unit's reviewed standing preview (preview64/preview96), so all poses keep one
scale. Frames share one canvas: feet on the bottom row, the head centre of every pose on the same column (the anchor
the game flips around). Output stays in docs/art-review/ until the owner approves; nothing is written to public/.

  <unit>/poses/<unit>_<i>.png, <unit>_foe_<i>.png   native frames (alpha 0/255)
  <unit>/poses/sheet.png                             ally and foe rows at 4x on grass, for review
  <unit>/poses/{idle,walk,attack}.gif                looping previews at 4x and the game's fps (6/8/11)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g3e/units'
COLS, ROWS = 3, 2
ANIMS = [('idle', (0, 1), 6), ('walk', (2, 3), 8), ('attack', (4, 5), 11)]  # fps as in src/render/UnitRenderer.ts
GRASS = (88, 140, 72, 255)
# Source pixels per art pixel, overriding the size taken from the standing preview. The reaper's preview was reduced
# less than the others (1/5.3), so it came out 1.6x the militia with finer pixels; the project owner chose on
# 2026-11-06 to reduce it at the same density as the militia (~1/8).
FACTOR_OVERRIDE = {'reaper': 8.0}
ZOOM = 4


def magenta_mask(rgb):
    """True where the pixel is the magenta key (including its anti-aliased fringe)."""
    r, g, b = (rgb[..., k].astype(int) for k in range(3))
    return (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)


def reference_height(unit):
    for name in ('preview64.png', 'preview96.png'):
        f = P / unit / name
        if f.exists():
            a = np.array(Image.open(f).convert('RGBA'))
            ys = np.where(a[..., 3].any(axis=1))[0]
            return int(ys.max() - ys.min() + 1)
    raise SystemExit(f'{unit}: no preview64/preview96 of the standing sample to take the size from')


def cells(sheet):
    h, w = sheet.shape[:2]
    cw, ch = w // COLS, h // ROWS
    for i in range(COLS * ROWS):
        r, c = divmod(i, COLS)
        yield sheet[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]


def crop_figure(cell):
    rgb = cell[..., :3]
    solid = ~magenta_mask(rgb)
    # drop specks: rows/columns with a handful of stray pixels do not count towards the box
    ys = np.where(solid.sum(axis=1) > 2)[0]
    xs = np.where(solid.sum(axis=0) > 2)[0]
    if len(ys) == 0:
        raise SystemExit('a cell of the sheet is empty')
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return rgb[y0:y1, x0:x1].astype(float), solid[y0:y1, x0:x1].astype(float)


def reduce(rgb, solid, factor):
    """Mask-weighted box reduction: magenta never bleeds into the colours; alpha is 0/255 by majority."""
    h, w = solid.shape
    nw, nh = max(1, round(w / factor)), max(1, round(h / factor))
    m = np.array(Image.fromarray(solid.astype(np.float32), mode='F').resize((nw, nh), Image.BOX))
    out = np.zeros((nh, nw, 4), dtype=np.uint8)
    for k in range(3):
        weighted = np.array(Image.fromarray((rgb[..., k] * solid).astype(np.float32), mode='F').resize((nw, nh), Image.BOX))
        out[..., k] = np.clip(np.round(weighted / np.maximum(m, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(m >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return out


def outline(frame, shade=0.42):
    """Redraw the silhouette's 1-px outline: every opaque pixel touching transparency (4-neighbour) becomes a darker
    shade of its own colour (ART_STYLE: outline = darker shade of the material, never pure black). Reduction averages
    the source outline away at small sizes, so the runtime frames need it back to stay readable."""
    a = frame[..., 3] > 0
    pad = np.pad(a, 1)
    edge = a & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    out = frame.copy()
    out[edge, :3] = (frame[edge, :3].astype(float) * shade).astype(np.uint8)
    return out


def head_centre(frame):
    """Centre column of the top quarter of the figure (head/hat): stable across poses, unlike weapons and feet."""
    ys = np.where(frame[..., 3].any(axis=1))[0]
    top = frame[ys.min():ys.min() + max(1, (ys.max() - ys.min()) // 4), :, 3] > 0
    xs = np.where(top.any(axis=0))[0]
    return (xs.min() + xs.max()) / 2


def place(frames):
    pivots = [head_centre(f) for f in frames]
    left = max(p for p in pivots)
    right = max(f.shape[1] - p for f, p in zip(frames, pivots))
    half = int(np.ceil(max(left, right))) + 1
    width, height = 2 * half, max(f.shape[0] for f in frames) + 1
    placed = []
    for f, p in zip(frames, pivots):
        c = np.zeros((height, width, 4), dtype=np.uint8)
        ox, oy = int(round(half - p)), height - f.shape[0]
        c[oy:oy + f.shape[0], ox:ox + f.shape[1]] = f
        placed.append(c)
    return placed


def foe(c):
    """Same blue -> red recolour as docs/art-review/g3e/ai-v1/make_assets.py (team colour areas only)."""
    c = c.copy()
    r, g, b = (c[..., k].astype(int) for k in range(3))
    blue = (c[..., 3] > 0) & (b > r + 30) & (b > g + 10)
    c[..., 0] = np.where(blue, np.clip(b + 25, 0, 255), c[..., 0])
    c[..., 1] = np.where(blue, (g * 0.35).astype(int), c[..., 1])
    c[..., 2] = np.where(blue, (r * 0.45).astype(int), c[..., 2])
    return c


def on_grass(frame):
    bg = Image.new('RGBA', (frame.shape[1], frame.shape[0]), GRASS)
    bg.alpha_composite(Image.fromarray(frame))
    return bg.resize((frame.shape[1] * ZOOM, frame.shape[0] * ZOOM), Image.NEAREST)


def make(unit, export=False):
    src = P / unit / 'poses-source.png'
    if not src.exists():
        raise SystemExit(f'{unit}: {src} is missing (run make_prompts.py --poses {unit} and the Codex runner first)')
    sheet = np.array(Image.open(src).convert('RGBA'))
    figures = [crop_figure(c) for c in cells(sheet)]
    # idle frame 1 matches the reviewed standing size, unless the owner fixed the density
    factor = FACTOR_OVERRIDE.get(unit) or figures[0][1].shape[0] / reference_height(unit)
    ally = place([reduce(rgb, solid, factor) for rgb, solid in figures])
    out = P / unit / 'poses'
    out.mkdir(exist_ok=True)
    for i, c in enumerate(ally):
        Image.fromarray(c).save(out / f'{unit}_{i}.png')
        Image.fromarray(foe(c)).save(out / f'{unit}_foe_{i}.png')
    h, w = ally[0].shape[:2]
    gap = 2 * ZOOM
    board = Image.new('RGBA', (6 * (w * ZOOM + gap) + gap, 2 * (h * ZOOM + gap) + gap), (40, 40, 48, 255))
    for row, frames in enumerate([ally, [foe(c) for c in ally]]):
        for i, c in enumerate(frames):
            board.paste(on_grass(c), (gap + i * (w * ZOOM + gap), gap + row * (h * ZOOM + gap)))
    board.save(out / 'sheet.png')
    for name, (a, b), fps in ANIMS:
        imgs = [on_grass(ally[a]).convert('RGB'), on_grass(ally[b]).convert('RGB')]
        imgs[0].save(out / f'{name}.gif', save_all=True, append_images=imgs[1:], duration=round(1000 / fps), loop=0)
    print(f'{unit}: {len(ally)} frames {w}x{h}, scale 1/{factor:.2f} -> {out.as_posix()}')
    if export:
        # The game shows image art at 2 art px per world unit (IMAGE_ART_SCALE 0.5, 1:1 screen pixels at camera zoom 2),
        # so the runtime frames are reduced straight from the source at twice the factor (not by halving the 4-px
        # frames above, which would average already-averaged pixels). The 4-px frames stay here as the masters.
        game = place([outline(reduce(rgb, solid, factor * 2)) for rgb, solid in figures])
        RUNTIME.mkdir(parents=True, exist_ok=True)
        for i, c in enumerate(game):
            Image.fromarray(c).save(RUNTIME / f'{unit}_{i}.png')
            Image.fromarray(foe(c)).save(RUNTIME / f'{unit}_foe_{i}.png')
        gh, gw = game[0].shape[:2]
        print(f'{unit}: runtime frames {gw}x{gh} -> {RUNTIME.as_posix()}')


RUNTIME = ROOT / 'public/assets/art/ai-v1'

if __name__ == '__main__':
    args = sys.argv[1:]
    export = '--export' in args
    for u in [a for a in args if a != '--export'] or ['militia']:
        make(u, export)
