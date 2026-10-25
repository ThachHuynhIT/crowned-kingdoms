"""Slice the approved art-review sheets (batches 02-07) into small PNGs and write the asset-admin manifest.

Terrain/plots: tiles sit on a flat black background; each tile is cropped from its bounding box and block-downsampled
(7 px source block = 1 art px). Wilds: objects on flat black, found as connected pieces, alpha = brighter than black.
Run from the repo root: python tools/slice_art_batches.py
"""
from pathlib import Path
from collections import deque
import json
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/art-review/g3e'
OUT = ROOT / 'public/assets/art/ai-v1'
B = 7
URL = '/public/assets/art/ai-v1'


def load(p):
    return np.array(Image.open(p).convert('RGB')).astype(int)


def runs(profile, min_len, gap=6):
    """Index ranges where profile is True, merging pieces closer than `gap`."""
    out, s, last = [], None, None
    for i, v in enumerate(profile):
        if v:
            if s is None:
                s = i
            last = i
        elif s is not None and i - last > gap:
            if last - s + 1 >= min_len:
                out.append((s, last + 1))
            s = None
    if s is not None and last - s + 1 >= min_len:
        out.append((s, last + 1))
    return out


def tiles(img, cols, rows):
    """Square tiles of a black-background sheet as (x0, y0, x1, y1) in reading order."""
    ink = img.max(axis=2) > 14
    ry = runs(ink.any(axis=1), 150)
    assert len(ry) == rows, ('rows', ry)
    boxes = []
    for y0, y1 in ry:
        cx = runs(ink[y0:y1].any(axis=0), 150)
        assert len(cx) == cols, ('cols', cx)
        boxes += [(x0, y0, x1, y1) for x0, x1 in cx]
    return boxes


def down(img, box, size=None):
    x0, y0, x1, y1 = box
    sub = Image.fromarray(img[y0:y1, x0:x1].astype(np.uint8))
    n = size or (max(1, round((x1 - x0) / B)), max(1, round((y1 - y0) / B)))
    return sub.resize(n, Image.BOX)


def save(im, rel):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    im.save(p)
    return f'{URL}/{rel}', im.size


categories = {}


def add(cat, label, item):
    categories.setdefault(cat, {'id': cat, 'label': label, 'items': []})['items'].append(item)


def tile_item(id_, label, src, size, group, tags=()):
    return {'id': id_, 'label': label, 'src': src, 'w': size[0], 'h': size[1], 'kind': 'tile', 'group': group, 'tags': list(tags)}


# ---- terrain (batch 02): 6 cols x 4 rows of 32x32 tiles ----
img = load(ART / 'batch-02-terrain/source.png')
names = ([f'path_{i}' for i in range(6)] + [f'sand_{i}' for i in range(6)] + [f'meadow_flowers_{i}' for i in range(3)]
         + [f'meadow_tall_{i}' for i in range(3)] + [f'water_a_{i}' for i in range(3)] + [f'water_b_{i}' for i in range(3)])
for n, box in zip(names, tiles(img, 6, 4)):
    src, size = save(down(img, box, (32, 32)), f'terrain/{n}.png')
    add('terrain', 'Nền đất', tile_item(f'terrain_{n}', n.replace('_', ' '), src, size, n.rsplit('_', 1)[0], [n.split('_')[0]]))

# ---- plots (batches 03-07): per king locked/open/throne at 64x64 ----
KINGS = {
    'batch-03-plots-wheat-stone': ['wheat', 'stone'],
    'batch-04-plots-arcane-grove': ['arcane', 'grove'],
    'batch-05-plots-tide-forge': ['tide', 'forge'],
    'batch-07-plots-clock-moon': ['clock', 'moon'],
}
for folder, kings in KINGS.items():
    p = ART / folder / 'source.png'
    if not p.exists():
        continue
    img = load(p)
    boxes = tiles(img, 3, 2)
    for ki, king in enumerate(kings):
        for si, state in enumerate(['locked', 'open', 'throne']):
            src, size = save(down(img, boxes[ki * 3 + si], (64, 64)), f'plots/{king}_{state}.png')
            add('plots', 'Ô bàn cờ', tile_item(f'plot_{king}_{state}', f'{king} — {state}', src, size, king, [state]))

# ---- wilds (batch 06): objects on black ----
WILD_NAMES = ['tree_pine_dark', 'tree_pine_light', 'tree_oak', 'tree_autumn', 'mountain_snow', 'cliff_mossy', 'boulders_big',
              'bush_green', 'bush_berry', 'bush_dry', 'rock_large', 'rock_medium', 'rock_small', 'stump', 'log']
img = load(ART / 'batch-06-wilds/source.png')
solid = img.max(axis=2) > 28
mask = np.array(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
H, W = mask.shape
seen = np.zeros((H, W), bool)
comps = []
for sy, sx in zip(*np.where(mask)):
    if seen[sy, sx]:
        continue
    q, ys, xs = deque([(sy, sx)]), [], []
    seen[sy, sx] = True
    while q:
        y, x = q.popleft()
        ys.append(y)
        xs.append(x)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    if len(ys) > 2000:
        comps.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
assert len(comps) == len(WILD_NAMES), len(comps)
# rows: top band (trees), middle (mountains), bottom (small), each sorted left to right
comps.sort(key=lambda b: (0 if b[3] < 460 else 1 if b[3] < 800 else 2, b[0]))
for n, (x0, y0, x1, y1) in zip(WILD_NAMES, comps):
    sub = img[y0:y1, x0:x1]
    a = np.where(solid[y0:y1, x0:x1], 255, 0).astype(np.uint8)
    rgba = Image.fromarray(np.dstack([sub.astype(np.uint8), a]), 'RGBA')
    w, h = max(1, round((x1 - x0) / B)), max(1, round((y1 - y0) / B))
    col = rgba.convert('RGB').resize((w, h), Image.BOX)
    al = rgba.getchannel('A').resize((w, h), Image.BOX).point(lambda v: 255 if v >= 128 else 0)
    out = col.convert('RGBA')
    out.putalpha(al)
    arr = np.array(out)
    arr[arr[..., 3] == 0] = 0
    src, size = save(Image.fromarray(arr), f'wilds/{n}.png')
    add('wilds', 'Hoang dã', {'id': f'wild_{n}', 'label': n.replace('_', ' '), 'src': src, 'w': size[0], 'h': size[1],
                              'kind': 'object', 'group': n.split('_')[0], 'tags': [n.split('_')[0]]})

# ---- existing runtime art (ai-v1) ----
POSES = {'idle': (0, 1), 'walk': (2, 3), 'attack': (4, 5)}
for unit, prefix, label in (('militia', 'spearman', 'Dân Quân (lính giáo)'), ('footman', 'footman', 'Lính Bộ')):
    units = {
        team: {anim: [f'{URL}/{prefix}_{"foe_" if team == "foe" else ""}{i}.png' for i in idx] for anim, idx in POSES.items()}
        for team in ('ally', 'foe')
    }
    first = Image.open(OUT / f'{prefix}_0.png')
    add('units', 'Lính', {'id': f'unit_{unit}', 'label': label, 'src': units['ally']['idle'][0], 'w': first.width,
                          'h': first.height, 'kind': 'unit', 'group': 'unit', 'tags': [unit], 'units': units})
for card, f, label in (('wheat_militia', 'cottage', 'Nhà Dân Quân (nhà tranh)'), ('neutral_barracks', 'barracks', 'Trại Lính')):
    im = Image.open(OUT / f'{f}.png')
    add('buildings', 'Công trình', {'id': f'building_{card}', 'label': label, 'src': f'{URL}/{f}.png', 'w': im.width,
                                    'h': im.height, 'kind': 'object', 'group': 'building', 'tags': [card]})
for i in range(3):
    im = Image.open(OUT / f'grass_{i}.png')
    add('terrain', 'Nền đất', tile_item(f'terrain_grass_{i}', f'grass {i}', f'{URL}/grass_{i}.png', im.size, 'grass', ['grass']))

order = ['units', 'buildings', 'terrain', 'plots', 'wilds']
manifest = {'version': 1, 'pixelScale': 2, 'categories': [categories[c] for c in order if c in categories]}
(ROOT / 'tools/asset-admin').mkdir(parents=True, exist_ok=True)
(ROOT / 'tools/asset-admin/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
print({c['id']: len(c['items']) for c in manifest['categories']})
