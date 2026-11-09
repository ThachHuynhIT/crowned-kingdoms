"""Publish the approved isometric neutral buildings.

    python docs/art-review/neutral-iso/make_assets.py <cardId> [<cardId> ...]
    python docs/art-review/neutral-iso/make_assets.py --preview      # sheet.png of every source, not published

Refuses a building that `review.md` does not list as `<cardId>: ĐÃ DUYỆT`. Same cutter and scale as the Wheat and G5
sets (`docs/art-review/iso-board/make_assets.py`: black keyed to alpha 0/255, box-reduced so the approved Reapers
source is 64 px wide). Writes `public/assets/art/ai-v1/iso-neutral/<cardId>.png` and one manifest entry per file.
"""
import importlib.util
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
HERE = ROOT / 'docs/art-review/neutral-iso'
OUT = ROOT / 'public/assets/art/ai-v1/iso-neutral'
MANIFEST = ROOT / 'docs/assets.manifest.yml'
IDS = ['neutral_barracks', 'neutral_archer_tower', 'neutral_well', 'neutral_mercenary_camp']

_spec = importlib.util.spec_from_file_location('iso_assets', ROOT / 'docs/art-review/iso-board/make_assets.py')
iso = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(iso)


def scale() -> float:
    return iso.REAPERS_WIDTH / iso.keyed(iso.BUILDINGS['wheat_reapers']).width


def approved(card: str) -> bool:
    review = HERE / 'review.md'
    return review.exists() and re.search(rf'`{card}`[^\n]*ĐÃ DUYỆT', review.read_text(encoding='utf-8')) is not None


def entry(card: str, rel: str, src: Path, final: tuple[int, int]) -> str:
    s = src.relative_to(ROOT).as_posix()
    return (
        f'  - id: building_{card}_iso\n'
        f'    path: {rel}\n'
        f'    category: building\n'
        f'    origin: custom\n'
        f'    source: {s}\n'
        f'    creator: Project owner (OpenAI imagegen via Codex; prompt in {s.replace("source.png", "prompt.md")})\n'
        f'    license: project-owned\n'
        f'    attribution: false\n'
        f'    redistribute: true\n'
        f'    evidence: docs/art-review/neutral-iso/\n'
        f'    modified: true\n'
        f'    nativeSize: 1024x1024\n'
        f'    finalSize: {final[0]}x{final[1]}\n'
        f'    anchor: feet\n'
        f'    notes: {card}, isometric 2:1 neutral building (approved 2026-11-09 by Claude under the owner\'s delegation); '
        f'black keyed and box-reduced at the Wheat set scale (Reapers = 64 px wide) by docs/art-review/neutral-iso/make_assets.py; '
        f'drawn at 0.5 x 2 once listed in src/render/imageArt.ts IMAGE_BUILDINGS\n'
    )


def preview() -> None:
    k = scale()
    tiles = []
    for card in IDS:
        src = HERE / card / 'source.png'
        if src.exists():
            img = iso.reduce(iso.keyed(src), k)
            tiles.append(img.resize((img.width * 4, img.height * 4), Image.NEAREST))
    if not tiles:
        raise SystemExit('no sources')
    w = sum(t.width for t in tiles) + 16 * (len(tiles) + 1)
    h = max(t.height for t in tiles) + 32
    sheet = Image.new('RGBA', (w, h), (110, 160, 80, 255))
    x = 16
    for t in tiles:
        sheet.alpha_composite(t, (x, h - 16 - t.height))
        x += t.width + 16
    sheet.save(HERE / 'sheet.png')
    print(HERE / 'sheet.png')


def main(cards: list[str]) -> None:
    k = scale()
    OUT.mkdir(parents=True, exist_ok=True)
    text = MANIFEST.read_text(encoding='utf-8')
    added = []
    for card in cards:
        if card not in IDS:
            raise SystemExit(f'unknown id {card}; one of {IDS}')
        if not approved(card):
            raise SystemExit(f'{card}: not approved in docs/art-review/neutral-iso/review.md')
        src = HERE / card / 'source.png'
        img = iso.reduce(iso.keyed(src), k)
        rel = f'public/assets/art/ai-v1/iso-neutral/{card}.png'
        img.save(ROOT / rel)
        print(f'{card}: {img.width}x{img.height}')
        if f'  - id: building_{card}_iso\n' not in text:
            added.append(entry(card, rel, src, img.size))
    if added:
        MANIFEST.write_text(text.rstrip('\n') + '\n' + ''.join(added), encoding='utf-8')
    print(f'manifest: {len(added)} entries added')


if __name__ == '__main__':
    if sys.argv[1:] == ['--preview']:
        preview()
    else:
        main(sys.argv[1:])
