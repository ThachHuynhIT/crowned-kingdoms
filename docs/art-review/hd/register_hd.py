"""Register the HiDPI art twins (public/assets/art/ai-v1-hd/) in docs/assets.manifest.yml.

    python docs/art-review/hd/register_hd.py [folder ...]

With folders (e.g. `cards icons king-cards menu portraits`) only the HD files under those top folders of ai-v1-hd are
(re)registered; every other HD entry is kept as it is.

Every HD file is a derived re-export of an already-registered ai-v1 file (same approved source, same pipeline, 4 art
px per world unit instead of 2, exactly twice the size). Each gets its own entry cloned from its twin's entry: id
`<twin id>_hd`, the HD path, `finalSize` doubled, the export command appended to the notes. Entries already present
are rewritten in place (idempotent); entries of HD files that no longer exist are dropped.

Export commands (density 4; see `.superpowers/art-hd-map.md`):
  units      docs/art-review/g3e/units/make_poses.py --export --density 4 <unit> ...
  Wheat      docs/art-review/iso-board/make_assets.py --density 4 --parts buildings,plots
  G5 kings   docs/art-review/g5/make_assets.py --density 4 <king> ...   (+ recut_border_key.py --density 4 <card> ...)
  neutral    docs/art-review/neutral-iso/make_assets.py --density 4 <card> ...
  levels     docs/art-review/levels/make_levels.py cut --density 4 <king> ...
  then       docs/art-review/hd/fill_pinholes.py (buildings, levels, plots)

HUD pictures (twice the pixels of their ai-v1 twin, drawn at half the scale; src/render/hudArtHd.ts):
  cards      docs/art-review/g3e/cards/make_assets.py --density 2 <prefix> ...
  icons      docs/art-review/g3e/icons/make_assets.py --density 2 <icon> ...
  king cards docs/art-review/g5/king-cards/make_assets.py --density 2 <king> ...
  menu       docs/art-review/g5/menu/make_assets.py --density 2 hills_far hills_mid; make_sky.py --density 2
  portraits  tools/prepare_king_portraits.py --density 2 --out public/assets/art/ai-v1-hd/portraits
             (and again with --size 144x216 --suffix -144)

World pictures drawn outside the atlas (4 art px per world unit, drawn at half the twin's scale; src/render/imageArt.ts
IMAGE_ART_HD_WORLD):
  wall       docs/art-review/iso-board/make_assets.py --density 4 --parts wall
  wilds      docs/art-review/iso-board/wilds/make_wilds.py --density 4   (outline peeled by tools/strip_decor_outline.py)
  farm decor docs/art-review/iso-board/decor/make_decor.py cut --density 4 <id> ...
  forest, portal  docs/art-review/iso-board/polish/make_polish_assets.py --density 4 <id> ...
  terrain    docs/art-review/iso-board/terrain/make_textures.py --density 4
  grass      docs/art-review/g3e/ai-v1/make_assets.py --density 4

Atlas icons and battle effects (twice the pixels, packed into the `sprites` atlas and drawn at half the scale through
imageFrameScale / frameDensityFactor; src/render/imageArt.ts IMAGE_ART_HD_ICONS, IMAGE_ART_HD_FX):
  icons      docs/art-review/g3e/icons/make_assets.py --density 2 icon_troop icon_tower ... (the IMAGE_ICONS sources;
             only the -16 twins are kept: the atlas uses no other size)
  fx         docs/art-review/g5/fx/make_assets.py --density 2 boulder pulse shield stun spark
  arrows     docs/art-review/g5/fx/make_arrows.py --density 2
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = ROOT / 'docs/assets.manifest.yml'
SD = 'public/assets/art/ai-v1/'
HD = 'public/assets/art/ai-v1-hd/'


def exporter(rel: str) -> str:
    if '/' not in rel:
        return 'docs/art-review/g3e/units/make_poses.py --export --density 4'
    if rel.startswith('iso-neutral/'):
        return 'docs/art-review/neutral-iso/make_assets.py --density 4'
    name = rel.rsplit('/', 1)[1]
    if re.search(r'_l[23]\.png$', name):
        return 'docs/art-review/levels/make_levels.py cut --density 4'
    if name.startswith('wheat_'):
        return 'docs/art-review/iso-board/make_assets.py --density 4 --parts buildings,plots'
    if name in {'forge_flame_tower.png', 'forge_iron_drake.png', 'forge_bombardiers.png'}:
        return 'docs/art-review/g5/make_assets.py --density 4 then recut_border_key.py --density 4'
    return 'docs/art-review/g5/make_assets.py --density 4'


HUD_EXPORTERS = {
    'cards': 'docs/art-review/g3e/cards/make_assets.py --density 2',
    'icons': 'docs/art-review/g3e/icons/make_assets.py --density 2',
    'king-cards': 'docs/art-review/g5/king-cards/make_assets.py --density 2',
    'portraits': 'tools/prepare_king_portraits.py --density 2 --out public/assets/art/ai-v1-hd/portraits',
}


def hud_exporter(rel: str) -> str | None:
    """Export command of a HUD twin (twice the pixels, drawn at half the scale), or None for world art."""
    folder, _, name = rel.partition('/')
    if folder == 'menu':
        return f'docs/art-review/g5/menu/{"make_sky.py" if name == "sky.png" else "make_assets.py"} --density 2'
    if folder == 'portraits' and name.endswith('-144.png'):
        return HUD_EXPORTERS['portraits'] + ' --size 144x216 --suffix -144'
    return HUD_EXPORTERS.get(folder)


FARM_DECOR = {'barrel', 'haystack', 'sign', 'wheat_cart', 'fence_ne', 'fence_nw', 'fence_se', 'fence_sw',
              'fence_horizontal', 'fence_vertical', 'gate'}


def world_exporter(rel: str) -> str | None:
    """Export command of a world picture drawn outside the atlas (wall, wilds, forest, portal, terrain, grass), or None."""
    name = rel.rsplit('/', 1)[-1].removesuffix('.png')
    if rel == 'iso/wall_cliff.png':
        return 'docs/art-review/iso-board/make_assets.py --density 4 --parts wall'
    if rel.startswith('iso/wilds/'):
        if name in FARM_DECOR:
            return f'docs/art-review/iso-board/decor/make_decor.py cut --density 4 wild_{name}'
        return 'docs/art-review/iso-board/wilds/make_wilds.py --density 4 (outline peeled by tools/strip_decor_outline.py)'
    if rel.startswith('iso/polish/'):
        return f'docs/art-review/iso-board/polish/make_polish_assets.py --density 4 {name}'
    if rel.startswith('iso/terrain/'):
        return 'docs/art-review/iso-board/terrain/make_textures.py --density 4'
    if re.fullmatch(r'grass_\d', rel.removesuffix('.png')):
        return 'docs/art-review/g3e/ai-v1/make_assets.py --density 4'
    return None


ATLAS_ICONS = {'troop', 'tower', 'tome', 'throne', 'gold', 'level', 'enchant_stack', 'crown', 'boulder', 'skull',
               'reroll', 'sell', 'lock', 'conquer'}


def atlas_exporter(rel: str) -> str | None:
    """Export command of an atlas icon or battle effect twin (twice the pixels, in the `sprites` atlas), or None."""
    folder, _, name = rel.partition('/')
    name = name.removesuffix('.png')
    if folder == 'fx':
        if name.startswith('fx_arrow_'):
            return 'docs/art-review/g5/fx/make_arrows.py --density 2'
        return f'docs/art-review/g5/fx/make_assets.py --density 2 {name.removeprefix("fx_")}'
    if folder == 'icons' and name.removeprefix('icon_').removesuffix('-16') in ATLAS_ICONS:
        return f'docs/art-review/g3e/icons/make_assets.py --density 2 {name.removesuffix("-16")}'
    return None


def exported_by(rel: str) -> str:
    return exporter(rel) + ('' if '/' not in rel else ', pinholes closed by docs/art-review/hd/fill_pinholes.py')


def hd_note(rel: str) -> str:
    world = world_exporter(rel)
    if world is not None:
        ground = rel.startswith('iso/terrain/') or rel.startswith('grass_')
        how = ('painted into the field, the road tail and the ground around them at 4 art px per world unit '
               '(src/render/atlas.ts ensureFieldTexture, ensureGroundTexture)') if ground else (
               'drawn at half the scale of the twin (src/render/imageArt.ts IMAGE_ART_HD_WORLD, imageArtTexture)')
        return (f'HiDPI twin of {SD}{rel}: same approved source and pipeline at 4 art px per world unit, exactly 2x its '
                f'twin (same footprint and anchor), by {world} (11/11/2026); loaded instead of the twin at display '
                f'density >= 2 and {how}')
    atlas = atlas_exporter(rel)
    if atlas is not None:
        return (f'HiDPI twin of {SD}{rel}: same approved source and pipeline at twice the pixels, exactly 2x its twin, '
                f'by {atlas} (11/11/2026); loaded instead of the twin at display density >= 2, packed into the sprites '
                f'atlas and drawn at half its scale (src/render/imageArt.ts IMAGE_ART_HD_ICONS / IMAGE_ART_HD_FX, '
                f'src/render/atlas.ts frameDensityFactor), so its size on screen is unchanged')
    hud = hud_exporter(rel)
    if hud is not None:
        return (f'HiDPI twin of {SD}{rel}: same approved source and pipeline at twice the pixels, exactly 2x its twin, '
                f'by {hud} (11/11/2026); loaded beside the twin at display density >= 2 and drawn at half its scale, so '
                f'its logical size is unchanged (src/render/hudArtHd.ts)')
    return (f'HiDPI twin of {SD}{rel}: same approved source and pipeline at 4 art px per world unit, exactly 2x its '
            f'twin (same footprint and anchor), by {exported_by(rel)} (11/11/2026); loaded instead of the twin at '
            f'display density >= 2 and drawn at 0.25 (src/render/imageArt.ts IMAGE_ART_HD_FILES)')


def main(folders: tuple[str, ...] = ()) -> None:
    def selected(rel: str) -> bool:
        return not folders or (rel.split('/', 1)[0] in folders and '/' in rel)

    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    entries = ['  - id: ' + e for e in body.split('  - id: ')[1:]]
    entries = [e if e.endswith('\n') else e + '\n' for e in entries]
    path_of = lambda e: re.search(r'^    path: (\S+)', e, re.M).group(1)  # noqa: E731
    kept = [e for e in entries if not (path_of(e).startswith(HD) and selected(path_of(e)[len(HD):]))]
    by_path = {path_of(e): e for e in kept if not path_of(e).startswith(HD)}
    added = []
    for f in sorted((ROOT / HD).rglob('*.png')):
        rel = f.relative_to(ROOT / HD).as_posix()
        if not selected(rel):
            continue
        twin = by_path.get(SD + rel)
        if twin is None:
            raise SystemExit(f'{rel}: its ai-v1 twin {SD + rel} is not registered')
        with Image.open(f) as im:
            w, h = im.size
        e = re.sub(r'^  - id: (\S+)', lambda m: f'  - id: {m.group(1)}_hd', twin, count=1, flags=re.M)
        e = e.replace(f'    path: {SD}{rel}\n', f'    path: {HD}{rel}\n', 1)
        e = re.sub(r'^    finalSize: \S+', f'    finalSize: {w}x{h}', e, count=1, flags=re.M)
        note = hd_note(rel)
        if re.search(r'^    notes: ', e, re.M):
            e = re.sub(r'^    notes: (.*)$', lambda m: f'    notes: {note}. Twin: {m.group(1)}', e, count=1, flags=re.M)
        else:
            e += f'    notes: {note}\n'
        added.append(e)
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(added), encoding='utf-8')
    print(f'manifest: {len(added)} HD entries')


if __name__ == '__main__':
    main(tuple(sys.argv[1:]))
