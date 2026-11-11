"""Register the close-up art twins (public/assets/art/ai-v1-uhd/, 12/11/2026) in docs/assets.manifest.yml.

    python docs/art-review/hd/register_uhd.py

Every UHD file is a derived re-export of an already-registered ai-v1 file: same approved source, same pipeline, 8 art
px per world unit instead of 2, exactly 4x its ai-v1 twin (2x its ai-v1-hd twin). Each gets its own entry cloned from
its ai-v1 twin's entry: id `<twin id>_uhd`, the UHD path, `finalSize` of the file, the export command in the notes.
Idempotent: every `_uhd` entry is rewritten from scratch; entries of UHD files that no longer exist are dropped.

Export commands (density 8; spec docs/superpowers/specs/2026-11-12-close-up-art-design.md):
  units      docs/art-review/g3e/units/make_poses.py --export --density 8 <unit> ...
  Wheat      docs/art-review/iso-board/make_assets.py --density 8 --parts buildings,plots,wall
  G5 kings   docs/art-review/g5/make_assets.py --density 8 <king> ...   (+ recut_border_key.py --density 8 <card> ...)
  neutral    docs/art-review/neutral-iso/make_assets.py --density 8 <card> ...
  levels     docs/art-review/levels/make_levels.py cut --density 8 <king> ...
  pinholes   docs/art-review/hd/fill_pinholes.py --density 8
  wilds      docs/art-review/iso-board/wilds/make_wilds.py --density 8
  farm decor docs/art-review/iso-board/decor/make_decor.py cut --density 8 <id> ...
  forest, portal  docs/art-review/iso-board/polish/make_polish_assets.py --density 8 <id> ...
The ground (terrain textures, grass) has no UHD twin: the painted field would pass the 4096 px texture limit.
"""
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = ROOT / 'docs/assets.manifest.yml'
SD = 'public/assets/art/ai-v1/'
UHD = 'public/assets/art/ai-v1-uhd/'


def exporter(rel: str) -> str:
    name = rel.rsplit('/', 1)[-1].removesuffix('.png')
    if '/' not in rel:
        return 'docs/art-review/g3e/units/make_poses.py --export --density 8'
    if rel.startswith('iso/wilds/'):
        if name in {'barrel', 'haystack', 'sign', 'wheat_cart'}:
            return f'docs/art-review/iso-board/decor/make_decor.py cut --density 8 wild_{name}'
        return 'docs/art-review/iso-board/wilds/make_wilds.py --density 8'
    if rel.startswith('iso/polish/'):
        return f'docs/art-review/iso-board/polish/make_polish_assets.py --density 8 {name}'
    if rel == 'iso/wall_cliff.png':
        return 'docs/art-review/iso-board/make_assets.py --density 8 --parts wall'
    if rel.startswith('iso-neutral/'):
        return 'docs/art-review/neutral-iso/make_assets.py --density 8, pinholes by fill_pinholes.py --density 8'
    if re.search(r'_l[23]$', name):
        return 'docs/art-review/levels/make_levels.py cut --density 8, pinholes by fill_pinholes.py --density 8'
    if name.startswith('wheat_') or rel.startswith('iso/plots/'):
        return 'docs/art-review/iso-board/make_assets.py --density 8 --parts buildings,plots, pinholes by fill_pinholes.py --density 8'
    return 'docs/art-review/g5/make_assets.py --density 8, pinholes by fill_pinholes.py --density 8'


def main() -> None:
    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    entries = ['  - id: ' + e for e in body.split('  - id: ')[1:]]
    entries = [e if e.endswith('\n') else e + '\n' for e in entries]
    path_of = lambda e: re.search(r'^    path: (\S+)', e, re.M).group(1)  # noqa: E731
    kept = [e for e in entries if not path_of(e).startswith(UHD)]
    by_path = {path_of(e): e for e in kept}
    added = []
    for f in sorted((ROOT / UHD).rglob('*.png')):
        rel = f.relative_to(ROOT / UHD).as_posix()
        twin = by_path.get(SD + rel)
        if twin is None:
            raise SystemExit(f'{rel}: its ai-v1 twin {SD + rel} is not registered')
        with Image.open(f) as im:
            w, h = im.size
        e = re.sub(r'^  - id: (\S+)', lambda m: f'  - id: {m.group(1)}_uhd', twin, count=1, flags=re.M)
        e = e.replace(f'    path: {SD}{rel}\n', f'    path: {UHD}{rel}\n', 1)
        e = re.sub(r'^    finalSize: \S+', f'    finalSize: {w}x{h}', e, count=1, flags=re.M)
        note = (f'Close-up twin of {SD}{rel}: same approved source and pipeline at 8 art px per world unit, exactly 4x '
                f'its twin (same footprint and anchor), by {exporter(rel)} (12/11/2026); loaded instead of the twin for '
                f'the close-up art tier (graphics "high" on a desktop) and drawn at 0.125 (src/render/imageArt.ts '
                f'IMAGE_ART_UHD_FILES, src/render/artQuality.ts)')
        if re.search(r'^    notes: ', e, re.M):
            e = re.sub(r'^    notes: (.*)$', lambda m: f'    notes: {note}. Twin: {m.group(1)}', e, count=1, flags=re.M)
        else:
            e += f'    notes: {note}\n'
        added.append(e)
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(added), encoding='utf-8', newline='\n')
    print(f'manifest: {len(added)} UHD entries')


if __name__ == '__main__':
    main()
