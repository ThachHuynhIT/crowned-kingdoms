"""Cut the isometric board polish art (2026-11-08): the enemy portal and the forest behind the cliff.

    python docs/art-review/iso-board/polish/make_polish_assets.py <id> [<id> ...] [--publish]
    python docs/art-review/iso-board/polish/make_polish_assets.py --density 4 <id> [<id> ...]   # HiDPI twins

Each `<id>/source.png` (a Codex sample or set item, black background) is keyed to alpha 0/255 and box-reduced to its
target size (`TARGETS`: the portal 112 px wide, a pine 64 px tall). Every world sprite is drawn at one screen pixel
per native pixel at zoom 1, like the approved isometric Wheat buildings (`make_assets.py`), so they share one pixel
size on screen. Writes `<id>/native.png` and `review.png` (each native ×3 next to the approved
Reapers barn, on grass green). Prints size and foot row. `--publish` (only after the owner approved that id) copies
the natives to public/assets/art/ai-v1/iso/polish/<id>.png; it never registers anything by itself.
`--density 4` (11/11/2026, `.superpowers/art-hd-map.md`) writes only the HiDPI twin of each already published id to
public/assets/art/ai-v1-hd/iso/polish/<id>.png: the same source cut by `reduce_hd` to EXACTLY twice its native (same
foot and anchor); no native, no review sheet.
"""
import shutil
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(HERE.parent))
from make_assets import BUILDINGS, REAPERS_WIDTH, keyed, reduce, reduce_hd  # noqa: E402

OUT = ROOT / 'public/assets/art/ai-v1/iso/polish'
OUT_HD = ROOT / 'public/assets/art/ai-v1-hd/iso/polish'
GRASS = (93, 155, 58, 255)


# Native target per id: ('w' | 'h', px). Review 2026-11-08: the building scale made the portal smaller than the code
# gate and the pines too small for a dense forest.
TARGETS = {'enemy_portal': ('w', 112), 'forest_pine_a': ('h', 64), 'forest_pine_b': ('h', 60), 'forest_rock': ('w', 40)}


def building_scale() -> float:
    return REAPERS_WIDTH / keyed(BUILDINGS['wheat_reapers']).width


def scale_of(ident: str, src: Image.Image, k: float) -> float:
    if ident in TARGETS:
        axis, px = TARGETS[ident]
        return px / (src.width if axis == 'w' else src.height)
    return k


def cut(ident: str, k: float) -> Image.Image:
    src = keyed(HERE / ident / 'source.png')
    native = reduce(src, scale_of(ident, src, k))
    native.save(HERE / ident / 'native.png')
    return native


def review(natives: dict[str, Image.Image]) -> None:
    reapers = Image.open(ROOT / 'public/assets/art/ai-v1/iso/wheat_reapers.png').convert('RGBA')
    items = [('wheat_reapers (approved)', reapers), *natives.items()]
    z = 3
    w = sum(i.width * z + 24 for _, i in items) + 24
    h = max(i.height for _, i in items) * z + 48
    sheet = Image.new('RGBA', (w, h), GRASS)
    x = 24
    for _, img in items:
        big = img.resize((img.width * z, img.height * z), Image.NEAREST)
        sheet.alpha_composite(big, (x, h - 24 - big.height))
        x += big.width + 24
    sheet.save(HERE / 'review.png')


def main(args: list[str]) -> None:
    publish = '--publish' in args
    density = int(args[args.index('--density') + 1]) if '--density' in args else 2
    if density not in (2, 4):
        raise SystemExit('--density is 2 or 4')
    ids = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] != '--density')]
    if not ids:
        raise SystemExit('give at least one id')
    k = building_scale()
    if density == 4:
        OUT_HD.mkdir(parents=True, exist_ok=True)
        for ident in ids:
            src = keyed(HERE / ident / 'source.png')
            hd = reduce_hd(src, scale_of(ident, src, k), 2)
            hd.save(OUT_HD / f'{ident}.png')
            print(f'{ident}: {hd.width}x{hd.height} (HiDPI)')
        return
    natives = {}
    for ident in ids:
        n = cut(ident, k)
        natives[ident] = n
        print(f'{ident}: {n.width}x{n.height}')
    review(natives)
    if publish:
        OUT.mkdir(parents=True, exist_ok=True)
        for ident in ids:
            shutil.copy(HERE / ident / 'native.png', OUT / f'{ident}.png')
        print('published', ', '.join(ids))


if __name__ == '__main__':
    main(sys.argv[1:])
