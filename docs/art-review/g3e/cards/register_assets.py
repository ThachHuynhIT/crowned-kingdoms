"""Add docs/assets.manifest.yml entries for published card illustrations (both sizes); existing ids are left alone.

    python docs/art-review/g3e/cards/register_assets.py <card_id|prefix> ...

Run after make_assets.py has written public/assets/art/ai-v1/cards/<id>.png and <id>-48.png for cards Claude approved
(owner delegation 2026-11-09); the approval is recorded in docs/art-review/g3e/cards/review-g5.md.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
CARDS = ROOT / 'docs/art-review/g3e/cards'
OUT = 'public/assets/art/ai-v1/cards'
MANIFEST = ROOT / 'docs/assets.manifest.yml'


def entries(card):
    cid, name = card['id'], card['nameVi']
    owner = cid.split('_', 1)[0]
    src = f'docs/art-review/g3e/cards/{cid}/source.png'
    native = 'x'.join(str(v) for v in Image.open(ROOT / src).size)
    out = []
    for suffix, size, use in (('', '96x72', 'full size'), ('-48', '48x36', 'copy for picture windows under 96 px')):
        out.append(
            f'  - id: card_art_{cid}{suffix.replace("-", "_")}\n'
            f'    path: {OUT}/{cid}{suffix}.png\n'
            f'    category: ui\n'
            f'    origin: custom\n'
            f'    source: {src}\n'
            f'    creator: Project owner (OpenAI imagegen via Codex; prompt in docs/art-review/g3e/cards/{cid}/prompt.md)\n'
            f'    license: project-owned\n'
            f'    attribution: false\n'
            f'    redistribute: true\n'
            f'    evidence: docs/art-review/g3e/cards/sheet-{owner}.png\n'
            f'    modified: true\n'
            f'    nativeSize: {native}\n'
            f'    finalSize: {size}\n'
            f'    notes: Card illustration of {name} ({cid}) (approved 2026-11-09 by Claude under the owner\'s delegation); '
            f'box-reduced by docs/art-review/g3e/cards/make_assets.py; {use} (src/ui/cards/cardImage.ts)\n'
        )
    return out


def main(args):
    cards = {c['id']: c for c in json.loads((CARDS / 'cards.json').read_text(encoding='utf-8'))}
    ids = sorted(i for i in cards for a in args if i == a or i.startswith(a + '_'))
    text = MANIFEST.read_text(encoding='utf-8')
    add = []
    for cid in ids:
        if not (ROOT / OUT / f'{cid}.png').exists():
            if cid in args:
                raise SystemExit(f'{cid}: not published')
            continue  # matched by a prefix but not drawn yet
        for e in entries(cards[cid]):
            ident = e.split('\n', 1)[0].split('id: ', 1)[1]
            if f'  - id: {ident}\n' not in text:
                add.append(e)
    if add:
        MANIFEST.write_text(text.rstrip('\n') + '\n' + ''.join(add), encoding='utf-8')
    print(f'{len(add)} entries added for {len(ids)} cards')


if __name__ == '__main__':
    main(sys.argv[1:])
