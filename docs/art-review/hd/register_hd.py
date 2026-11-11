"""Register the HiDPI art twins (public/assets/art/ai-v1-hd/) in docs/assets.manifest.yml.

    python docs/art-review/hd/register_hd.py

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
"""
import re
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


def exported_by(rel: str) -> str:
    return exporter(rel) + ('' if '/' not in rel else ', pinholes closed by docs/art-review/hd/fill_pinholes.py')


def main() -> None:
    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    entries = ['  - id: ' + e for e in body.split('  - id: ')[1:]]
    entries = [e if e.endswith('\n') else e + '\n' for e in entries]
    kept = [e for e in entries if f'    path: {HD}' not in e]
    by_path = {re.search(r'^    path: (\S+)', e, re.M).group(1): e for e in kept}
    added = []
    for f in sorted((ROOT / HD).rglob('*.png')):
        rel = f.relative_to(ROOT / HD).as_posix()
        twin = by_path.get(SD + rel)
        if twin is None:
            raise SystemExit(f'{rel}: its ai-v1 twin {SD + rel} is not registered')
        with Image.open(f) as im:
            w, h = im.size
        e = re.sub(r'^  - id: (\S+)', lambda m: f'  - id: {m.group(1)}_hd', twin, count=1, flags=re.M)
        e = e.replace(f'    path: {SD}{rel}\n', f'    path: {HD}{rel}\n', 1)
        e = re.sub(r'^    finalSize: \S+', f'    finalSize: {w}x{h}', e, count=1, flags=re.M)
        note = (f'HiDPI twin of {SD}{rel}: same approved source and pipeline at 4 art px per world unit, exactly 2x its '
                f'twin (same footprint and anchor), by {exported_by(rel)} (11/11/2026); loaded instead of the twin at '
                f'display density >= 2 and drawn at 0.25 (src/render/imageArt.ts IMAGE_ART_HD_FILES)')
        if re.search(r'^    notes: ', e, re.M):
            e = re.sub(r'^    notes: (.*)$', lambda m: f'    notes: {note}. Twin: {m.group(1)}', e, count=1, flags=re.M)
        else:
            e += f'    notes: {note}\n'
        added.append(e)
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(added), encoding='utf-8')
    print(f'manifest: {len(added)} HD entries')


if __name__ == '__main__':
    main()
