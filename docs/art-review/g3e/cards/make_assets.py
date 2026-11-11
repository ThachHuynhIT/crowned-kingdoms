"""Reduce approved 4:3 card illustrations to the two in-game sizes and build a review sheet.

    python docs/art-review/g3e/cards/make_assets.py wheat_field wheat_granary ...   (or a prefix: wheat)

For each docs/art-review/g3e/cards/<id>/source.png (4:3, about 10 source px per art px) writes
public/assets/art/ai-v1/cards/<id>.png (96x72, the size chosen by the owner on 2026-10-29) and <id>-48.png (48x36,
for small cards whose picture window is narrower than 96 px, and <id>-128.png (128x96, added 2026-11-10 for the
bigger desktop hand cards): the game never scales by a fraction, see
src/ui/cards/cardImage.ts pickCardImage). Both are box-reduced straight from the source. Review sheet:
docs/art-review/g3e/cards/sheet-<prefix>-native.png (both sizes at 2x and 4x).

    python docs/art-review/g3e/cards/make_assets.py --density 2 wheat ...

HiDPI twins (2026-11-11): the same three sizes at twice the pixels (192x144, 96x72, 256x192), box-reduced straight from
the same source, under the same names in public/assets/art/ai-v1-hd/cards/ (no review sheet). The game draws them at
half the scale at display density >= 2 (src/render/hudArtHd.ts). Without --density the output is unchanged.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
CARDS = ROOT / 'docs/art-review/g3e/cards'
OUT = ROOT / 'public/assets/art/ai-v1/cards'
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/cards'
SIZES = [(96, 72, ''), (48, 36, '-48'), (128, 96, '-128')]


def reduce(src, w, h):
    img = Image.open(src).convert('RGB')
    sw, sh = img.size
    # crop to exact 4:3 before reducing (sources are 1024x768 or 1448x1086)
    th = round(sw * 3 / 4)
    if th != sh:
        top = (sh - th) // 2
        img = img.crop((0, max(0, top), sw, max(0, top) + min(th, sh)))
    return img.resize((w, h), Image.BOX)


def density_arg(args):
    """(density, the other args): `--density N` anywhere in args, 1 when absent; only 1 and 2 are allowed."""
    if '--density' not in args:
        return 1, list(args)
    i = args.index('--density')
    density = int(args[i + 1])
    if density not in (1, 2):
        raise SystemExit('--density must be 1 or 2')
    return density, list(args[:i]) + list(args[i + 2:])


def main(args):
    density, args = density_arg(args)
    ids = []
    for a in args:
        ids += sorted(p.name for p in CARDS.iterdir() if p.is_dir() and (p.name == a or p.name.startswith(a + '_'))
                      and (p / 'source.png').exists())
    if not ids:
        raise SystemExit('no card sources matched')
    out_dir = OUT if density == 1 else OUT_HD
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    for cid in ids:
        out = []
        for w, h, suffix in SIZES:
            im = reduce(CARDS / cid / 'source.png', w * density, h * density)
            im.save(out_dir / f'{cid}{suffix}.png')
            out.append(im)
        rows.append(out)
        print(cid, 'ok')
    if density != 1:
        return
    gap = 8
    cell_w = 96 * 4 + 48 * 4 + 3 * gap
    sheet = Image.new('RGB', (cell_w * 2, (72 * 4 + gap) * ((len(rows) + 1) // 2) + gap), (40, 40, 48))
    for i, (big, small, *_rest) in enumerate(rows):
        x = (i % 2) * cell_w + gap
        y = (i // 2) * (72 * 4 + gap) + gap
        sheet.paste(big.resize((96 * 4, 72 * 4), Image.NEAREST), (x, y))
        sheet.paste(small.resize((48 * 4, 36 * 4), Image.NEAREST), (x + 96 * 4 + gap, y))
    name = args[0] if len(args) == 1 else 'cards'
    sheet.save(CARDS / f'sheet-{name}-native.png')
    print(CARDS / f'sheet-{name}-native.png')


if __name__ == '__main__':
    main(sys.argv[1:])
