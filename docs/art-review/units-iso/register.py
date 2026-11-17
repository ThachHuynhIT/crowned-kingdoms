"""Register the iso unit strips (public/assets/art/ai-v1/iso-units/, 17/11/2026) in docs/assets.manifest.yml.

    python docs/art-review/units-iso/register.py
    python docs/art-review/hd/register_hd.py iso-units
    python docs/art-review/hd/register_uhd.py

One entry per density-2 strip (ally and foe recolour, SE and NW), id `world_iso_unit_<file>`; the HD and close-up
twins are then cloned from these by the two hd/ scripts. Idempotent: every `world_iso_unit_` entry is rewritten.
"""
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = ROOT / 'docs/assets.manifest.yml'
SD = 'public/assets/art/ai-v1/iso-units/'
PREFIX = 'world_iso_unit_'


def entry(f: Path) -> str:
    name = f.stem
    m = re.fullmatch(r'(.+?)_(foe_)?(se|nw)', name)
    unit, foe, d = m.group(1), m.group(2), m.group(3)
    src = f'docs/art-review/units-iso/{unit}/rows-{d}-source.png'
    with Image.open(ROOT / src) as im:
        nw, nh = im.size
    with Image.open(f) as im:
        w, h = im.size
    team = 'red foe recolour (make_poses.foe)' if foe else 'ally colours'
    return (
        f'  - id: {PREFIX}{name}\n'
        f'    path: {SD}{f.name}\n'
        '    category: unit\n'
        '    origin: custom\n'
        f'    source: {src}\n'
        f'    creator: Project owner (OpenAI imagegen via Codex; prompt in docs/art-review/units-iso/{unit}/prompt-rows-{d}.md)\n'
        '    license: project-owned\n'
        '    attribution: false\n'
        '    redistribute: true\n'
        f'    evidence: docs/art-review/units-iso/{unit}/review.md\n'
        '    modified: true\n'
        f'    nativeSize: {nw}x{nh}\n'
        f'    finalSize: {w}x{h}\n'
        f'    notes: {unit} {d.upper()} strip, {team}: 11 equal cells (idle 0-2, walk 3-6, attack 7-10), mask-weighted box '
        'reduction to 2 art px per world unit plus a redrawn 1-px outline by docs/art-review/units-iso/make_review.py '
        '--export (approved by Claude under the owner\'s delegation 09/11/2026); drawn at scale 0.5 in battle '
        '(src/render/imageArt.ts ISO_UNITS)\n'
    )


def main() -> None:
    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    entries = ['  - id: ' + e for e in body.split('  - id: ')[1:]]
    entries = [e if e.endswith('\n') else e + '\n' for e in entries]
    kept = [e for e in entries if not e.startswith(f'  - id: {PREFIX}')]
    added = [entry(f) for f in sorted((ROOT / SD).glob('*.png'))]
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(added), encoding='utf-8', newline='\n')
    print(f'manifest: {len(added)} iso unit entries')


if __name__ == '__main__':
    main()
