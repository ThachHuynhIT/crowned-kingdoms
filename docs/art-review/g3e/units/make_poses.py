"""Slice a unit's 3x2 animation sheet into the six native pose frames, the red foe recolour and review previews.

    python docs/art-review/g3e/units/make_poses.py militia [reaper ...]
    python docs/art-review/g3e/units/make_poses.py --export [--density 4] militia [reaper ...]

`--export` also writes the runtime frames: at the default density 2 (art px per world unit) into
public/assets/art/ai-v1/, at `--density 4` (HiDPI, drawn at scale 0.25) into public/assets/art/ai-v1-hd/ under the same
file names (see `runtime_dir` and `IMAGE_ART_HD_FILES` in src/render/imageArt.ts).

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
# Owner 2026-11-09: soldiers should be as big as the barracks footman (34 px in game, from batch-01-barracks), so every
# pose-sheet unit is cut 1.3x larger than its reviewed size (militia 26 -> 34 px); giants and bosses grow the same way.
UNIT_SCALE = 1.3
ZOOM = 4


def magenta_mask(rgb):
    """True where the pixel is the magenta key (including its anti-aliased fringe)."""
    r, g, b = (rgb[..., k].astype(int) for k in range(3))
    return (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)


def _prompts():
    import importlib.util
    spec = importlib.util.spec_from_file_location('unit_prompts', P / 'make_prompts.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


HEIGHT = _prompts().HEIGHT


def reference_height(unit):
    if unit in HEIGHT:
        return HEIGHT[unit]
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


def place(frames, at_least=(0, 0)):
    """One canvas for all poses: feet on the bottom row, every head centre on the middle column. `at_least` (height,
    width) grows the canvas to a given size (the HiDPI export uses twice the density-2 canvas, so the world-space
    footprint and the anchor match exactly)."""
    pivots = [head_centre(f) for f in frames]
    left = max(p for p in pivots)
    right = max(f.shape[1] - p for f, p in zip(frames, pivots))
    half = max(int(np.ceil(max(left, right))) + 1, (at_least[1] + 1) // 2)
    width, height = 2 * half, max(max(f.shape[0] for f in frames) + 1, at_least[0])
    placed = []
    for f, p in zip(frames, pivots):
        c = np.zeros((height, width, 4), dtype=np.uint8)
        ox, oy = int(round(half - p)), height - f.shape[0]
        c[oy:oy + f.shape[0], ox:ox + f.shape[1]] = f
        placed.append(c)
    return placed


def place_twin(frames, twins):
    """The HiDPI frames at EXACTLY twice the density-2 canvas, each pose where its density-2 twin stands: the twin's
    canvas and per-pose offset come from `place(twins)` (the shipped density-2 frames), and each HD figure is centred
    on 2 x its twin's box with feet on the bottom row. Re-deriving the head pivot at HD resolution would move some
    poses by up to a world pixel against the approved density-2 set."""
    pivots = [head_centre(f) for f in twins]
    left = max(p for p in pivots)
    right = max(f.shape[1] - p for f, p in zip(twins, pivots))
    half = int(np.ceil(max(left, right))) + 1
    height = max(f.shape[0] for f in twins) + 1
    W, H = 4 * half, 2 * height
    placed = []
    for f, t, p in zip(frames, twins, pivots):
        c = np.zeros((H, W, 4), dtype=np.uint8)
        ox = int(round(2 * round(half - p) + (2 * t.shape[1] - f.shape[1]) / 2))
        oy = H - f.shape[0]
        x0, y0 = max(0, ox), max(0, oy)
        x1, y1 = min(W, ox + f.shape[1]), min(H, oy + f.shape[0])
        c[y0:y1, x0:x1] = f[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
        placed.append(c)
    return placed


def foe(c):
    """Same blue -> red recolour as docs/art-review/g3e/ai-v1/make_assets.py (team colour areas only), plus strong cyan
    (glowing blue runes, e.g. the golem's chest in its wind-up)."""
    c = c.copy()
    r, g, b = (c[..., k].astype(int) for k in range(3))
    cyan = (b > r + 60) & (g > r + 60)
    blue = (c[..., 3] > 0) & (b > r + 30) & ((b > g + 10) | cyan)
    c[..., 0] = np.where(blue, np.clip(b + 25, 0, 255), c[..., 0])
    c[..., 1] = np.where(blue, (g * 0.35).astype(int), c[..., 1])
    c[..., 2] = np.where(blue, (r * 0.45).astype(int), c[..., 2])
    return c


def on_grass(frame):
    bg = Image.new('RGBA', (frame.shape[1], frame.shape[0]), GRASS)
    bg.alpha_composite(Image.fromarray(frame))
    return bg.resize((frame.shape[1] * ZOOM, frame.shape[0] * ZOOM), Image.NEAREST)


def make(unit, export=False, density=2):
    src = P / unit / 'poses-source.png'
    if not src.exists():
        raise SystemExit(f'{unit}: {src} is missing (run make_prompts.py --poses {unit} and the Codex runner first)')
    sheet = np.array(Image.open(src).convert('RGBA'))
    figures = [crop_figure(c) for c in cells(sheet)]
    # idle frame 1 matches the reviewed standing size, unless the owner fixed the density
    factor = (FACTOR_OVERRIDE.get(unit) or figures[0][1].shape[0] / reference_height(unit)) / UNIT_SCALE
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
        # `density` art px per world unit: 2 is the shipped set (factor x 2), 4 the HiDPI set (factor x 1, the same
        # reduction as the 4-px masters, redrawn outline included), both straight from the source.
        runtime = runtime_dir(density)
        if density == 2:
            game = place([outline(reduce(rgb, solid, factor * 2)) for rgb, solid in figures])
        else:
            # HiDPI: same source, factor x 1 (the 4-px masters' reduction, outline redrawn), each pose placed where
            # its shipped density-2 twin stands on a canvas of exactly twice its size (`place_twin`)
            twins = [outline(reduce(rgb, solid, factor * 2)) for rgb, solid in figures]
            game = place_twin([outline(reduce(rgb, solid, factor)) for rgb, solid in figures], twins)
            shipped = RUNTIME / f'{unit}_0.png'
            if shipped.exists():
                with Image.open(shipped) as im:
                    if (im.height * 2, im.width * 2) != game[0].shape[:2]:
                        raise SystemExit(f'{unit}: shipped frames {im.size} are not this source density-2 cut; '
                                         're-export density 2 first')
        runtime.mkdir(parents=True, exist_ok=True)
        for i, c in enumerate(game):
            Image.fromarray(c).save(runtime / f'{unit}_{i}.png')
            Image.fromarray(foe(c)).save(runtime / f'{unit}_foe_{i}.png')
        gh, gw = game[0].shape[:2]
        print(f'{unit}: runtime frames {gw}x{gh} (density {density}) -> {runtime.as_posix()}')


RUNTIME = ROOT / 'public/assets/art/ai-v1'
RUNTIME_HD = ROOT / 'public/assets/art/ai-v1-hd'
DENSITIES = (2, 4)


def runtime_dir(density):
    """Where runtime frames of `density` art px per world unit go: ai-v1 (2, IMAGE_ART_SCALE 0.5) or ai-v1-hd (4)."""
    if density not in DENSITIES:
        raise SystemExit(f'--density must be one of {DENSITIES}')
    return RUNTIME if density == 2 else RUNTIME_HD


def parse_density(args):
    """`--density N` (default 2) and the remaining arguments."""
    if '--density' not in args:
        return 2, args
    i = args.index('--density')
    if i + 1 >= len(args):
        raise SystemExit('--density needs a value (2 or 4)')
    return int(args[i + 1]), args[:i] + args[i + 2:]


def sample(units, sheet_name):
    """Reduce each new standing sample (<unit>/source.png) to its HEIGHT as <unit>/preview.png, then lay the approved
    Wheat militia/reaper/peasant idle frames and the new previews side by side on grass at 4x, feet on one line."""
    figs = []
    for u in ('militia', 'reaper', 'peasant'):
        f = P / u / 'poses' / f'{u}_0.png'
        if f.exists():
            figs.append(np.array(Image.open(f).convert('RGBA')))
    for unit in units:
        rgb, solid = crop_figure(np.array(Image.open(P / unit / 'source.png').convert('RGBA')))
        prev = reduce(rgb, solid, solid.shape[0] / HEIGHT[unit])
        Image.fromarray(prev).save(P / unit / 'preview.png')
        figs.append(prev)
        print(f'{unit}: preview {prev.shape[1]}x{prev.shape[0]} (scale 1/{solid.shape[0] / HEIGHT[unit]:.1f})')
    gap = 4
    w = sum(f.shape[1] for f in figs) + gap * (len(figs) + 1)
    h = max(f.shape[0] for f in figs) + 2 * gap
    board = Image.new('RGBA', (w, h), GRASS)
    x = gap
    for f in figs:
        board.alpha_composite(Image.fromarray(f), (x, h - gap - f.shape[0]))
        x += f.shape[1] + gap
    board.resize((w * ZOOM, h * ZOOM), Image.NEAREST).save(P / sheet_name)
    print(P / sheet_name)


if __name__ == '__main__':
    density, args = parse_density(sys.argv[1:])
    names = [a for a in args if not a.startswith('--')]
    if '--sample' in args:
        sample(names, f'sheet-sample-{"-".join(names)}.png' if len(names) < 3 else 'sheet-sample-new.png')
    else:
        for u in names or ['militia']:
            make(u, '--export' in args, density)
