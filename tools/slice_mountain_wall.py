"""Slice an approved mountain-wall source image into GPU-sized parts and describe it for the asset admin.

The wall has no size limit (spec 26/10/2026): a source may be 9000 px wide. Only the *output* parts are
capped (`--max-texture-side`, at most 4096) so the game can upload them as separate textures.

    python tools/slice_mountain_wall.py --id terrain_mountain_wall_mid_0 \
        --catalog docs/art-review/oblique-wall/catalog.json --max-texture-side 2048 --preview

The tool only crops: it never recolours, fills the background or edits content. Wall pixels must be fully
opaque or fully transparent (alpha 0/255). It never overwrites the source and never writes outside the
output directory.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CATALOG = 'docs/art-review/oblique-wall/catalog.json'
OUT_DIR = 'public/assets/art/ai-v1/mountain-wall'
URL = '/public/assets/art/ai-v1/mountain-wall'
MAX_SIDE = 4096


class WallError(Exception):
    pass


def validate_wall_recipe(recipe, source_size):
    """Raise WallError unless the recipe describes valid integer crops inside a source of `source_size` (w, h)."""
    sw, sh = source_size
    for key in ('id', 'baseLine'):
        if key not in recipe:
            raise WallError(f'recipe missing {key}')
    base = recipe['baseLine']
    if type(base) is not int or not 0 <= base <= sh:
        raise WallError(f'baseLine {base!r} outside the source height {sh}')
    factor = recipe.get('downscale', 1)
    if type(factor) is not int or factor < 1:
        raise WallError(f'downscale must be an integer >= 1, got {factor!r}')
    crop = recipe.get('crop')
    if crop is not None:
        x, y, w, h = (crop.get(k) for k in ('x', 'y', 'w', 'h'))
        if any(type(v) is not int for v in (x, y, w, h)):
            raise WallError('crop must use integers')
        if w < 1 or h < 1 or x < 0 or y < 0 or x + w > sw or y + h > sh:
            raise WallError(f'crop {crop} is outside the {sw}x{sh} source')


def _check_alpha(arr):
    alpha = arr[..., 3]
    if not np.isin(alpha, (0, 255)).all():
        raise WallError('wall pixels must be fully opaque or fully transparent (alpha 0/255)')


def _inside(path, directory):
    try:
        Path(path).resolve().relative_to(Path(directory).resolve())
        return True
    except ValueError:
        return False


def slice_wall(source, recipe, output, max_texture_side=2048):
    """Cut `source` into parts of at most `max_texture_side` per side and write them under `output`.

    Returns [{id, file, sourceX, sourceY, w, h}] in reading order. A source that fits in one part is written
    as `<id>.png`; otherwise parts are `<id>_part_000.png` ... The parts tile the (cropped) source exactly, so
    pasting them back at their offsets reproduces it byte for byte.
    """
    source, output = Path(source), Path(output)
    if not 1 <= max_texture_side <= MAX_SIDE:
        raise WallError(f'max_texture_side must be in 1..{MAX_SIDE}')
    img = Image.open(source).convert('RGBA')
    validate_wall_recipe(recipe, img.size)
    arr = np.array(img)
    crop = recipe.get('crop')
    x0, y0 = (crop['x'], crop['y']) if crop else (0, 0)
    w, h = (crop['w'], crop['h']) if crop else img.size
    arr = arr[y0:y0 + h, x0:x0 + w]
    _check_alpha(arr)
    factor = recipe.get('downscale', 1)
    if factor > 1:
        # Box-average each factor x factor block (the AI sheets draw one art pixel as a block of source pixels).
        if w % factor or h % factor:
            raise WallError(f'{w}x{h} is not divisible by downscale {factor}')
        small = Image.fromarray(arr, 'RGBA').resize((w // factor, h // factor), Image.BOX)
        arr = np.array(small)
        w, h = small.size
        _check_alpha(arr)
    ident = recipe['id']
    cols = -(-w // max_texture_side)
    rows = -(-h // max_texture_side)
    single = cols == 1 and rows == 1
    out = []
    n = 0
    for r in range(rows):
        for c in range(cols):
            px, py = c * max_texture_side, r * max_texture_side
            pw, ph = min(max_texture_side, w - px), min(max_texture_side, h - py)
            name = ident if single else f'{ident}_part_{n:03d}'
            target = output / f'{name}.png'
            if not _inside(target, output) or target.resolve() == source.resolve():
                raise WallError(f'refusing to write {target}')
            output.mkdir(parents=True, exist_ok=True)
            Image.fromarray(arr[py:py + ph, px:px + pw], 'RGBA').save(target)
            out.append({'id': name, 'file': target.name, 'sourceX': px, 'sourceY': py, 'w': pw, 'h': ph})
            n += 1
    return out


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def adopted_wall_items(catalog, root=ROOT):
    """Manifest items for catalog entries that are approved, adopted and whose every part file exists with the right hash."""
    items = []
    for entry in catalog['items']:
        if entry.get('approval') != 'approved' or not entry.get('adopted') or not entry.get('parts'):
            continue
        ok = True
        for part in entry['parts']:
            file = Path(root) / OUT_DIR / part['file']
            if not file.exists() or sha256(file) != part.get('sha256'):
                ok = False
        if not ok:
            continue
        for part in entry['parts']:
            items.append({'id': part['id'], 'label': entry['label'] + ('' if len(entry['parts']) == 1 else f' — phần {part["id"][-3:]}'),
                          'src': f'{URL}/{part["file"]}', 'w': part['w'], 'h': part['h'], 'kind': 'object',
                          'group': 'mountain_wall', 'tags': [entry['role'], 'mountain_wall']})
    return items


def wall_covered(catalog, manifest_ids):
    """Logical ids fully present in the manifest: every physical part id of an adopted entry is listed there."""
    done = set()
    for entry in catalog['items']:
        if entry.get('approval') == 'approved' and entry.get('adopted') and entry.get('parts') \
                and all(p['id'] in manifest_ids for p in entry['parts']):
            done.add(entry['id'])
    return done


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--id', required=True)
    ap.add_argument('--catalog', default=CATALOG)
    ap.add_argument('--max-texture-side', type=int, default=2048)
    ap.add_argument('--preview', action='store_true')
    args = ap.parse_args(argv)
    catalog = json.loads((ROOT / args.catalog).read_text(encoding='utf-8'))
    entry = next((e for e in catalog['items'] if e['id'] == args.id), None)
    if entry is None:
        print(f'FAIL: {args.id} is not in the catalog')
        return 1
    source = ROOT / 'docs/art-review/oblique-wall' / entry.get('sourceFile', f'{args.id}/source.png')
    if not source.exists():
        print(f'FAIL: {source} does not exist (art not generated or approved yet)')
        return 1
    recipe = {'id': args.id, 'baseLine': entry.get('baseLine', 0) * entry.get('downscale', 1), 'downscale': entry.get('downscale', 1),
              **({'crop': entry['crop']} if 'crop' in entry else {})}
    try:
        parts = slice_wall(source, recipe, ROOT / OUT_DIR, args.max_texture_side)
    except WallError as e:
        print(f'FAIL: {e}')
        return 1
    for p in parts:
        p['sha256'] = sha256(ROOT / OUT_DIR / p['file'])
    entry['parts'] = parts
    entry['sourceHash'] = sha256(source)
    entry['density'] = catalog['density']
    entry['sourceSize'] = list(Image.open(source).size)
    (ROOT / args.catalog).write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{args.id}: {len(parts)} part(s), approval "{entry.get("approval")}", adopted {entry.get("adopted")}')
    if args.preview:
        im = Image.open(source).convert('RGBA')
        w, h = im.size
        prev = Image.new('RGBA', (w * 3, h), (0, 0, 0, 0))
        for i in range(3):
            prev.paste(im, (i * w, 0))
        prev.save(source.with_name('preview.png'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
