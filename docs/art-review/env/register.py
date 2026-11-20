"""Register the environment objects (docs/art-review/env, 20/11/2026) in docs/assets.manifest.yml.

    python docs/art-review/env/register.py

One entry per runtime file (sd, hd, uhd) of every object in catalog.json and every flat ground patch in
ground/in-game.json that is in the game (public/assets/art/ai-v1*/iso/wilds/<id>.png). Idempotent: every `env_object_`
and `env_ground_` entry is rewritten, appended at the end.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = ROOT / 'docs/assets.manifest.yml'
ENV = ROOT / 'docs/art-review/env'
TIERS = (('', 'ai-v1', 'drawn at scale 0.5'), ('_hd', 'ai-v1-hd', 'HiDPI twin, exactly 2x, drawn at 0.25'),
         ('_uhd', 'ai-v1-uhd', 'close-up twin, exactly 4x, drawn at 0.125'))
NL = '\n'


def entry(eid: str, path: str, src: str, prompt: str, evidence: str, anchor: str, notes: str) -> str:
    with Image.open(ROOT / src) as im:
        nw, nh = im.size
    with Image.open(ROOT / path) as im:
        w, h = im.size
    fields = [
        f'  - id: {eid}', f'    path: {path}', '    category: decor', '    origin: custom', f'    source: {src}',
        f'    creator: Project owner (OpenAI imagegen via Codex; prompt in {prompt})', '    license: project-owned',
        '    attribution: false', '    redistribute: true', f'    evidence: {evidence}', '    modified: true',
        f'    nativeSize: {nw}x{nh}', f'    finalSize: {w}x{h}', f'    anchor: {anchor}', f'    notes: {notes}',
    ]
    return NL.join(fields) + NL


def main() -> None:
    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    entries = ['  - id: ' + e for e in body.split('  - id: ')[1:]]
    entries = [e if e.endswith(NL) else e + NL for e in entries]
    kept = [e for e in entries if not e.startswith(('  - id: env_object_', '  - id: env_ground_'))]
    added = []
    objects = json.loads((ENV / 'catalog.json').read_text(encoding='utf-8'))
    patches = json.loads((ENV / 'ground/in-game.json').read_text(encoding='utf-8'))
    for suffix, folder, how in TIERS:
        for item in objects:
            path = f'public/assets/art/{folder}/iso/wilds/{item["id"]}.png'
            if not (ROOT / path).exists():
                continue
            batch = item['batch']
            kind = 'tall (outside the field)' if item['tall'] else 'low'
            added.append(entry(
                f'env_object_{item["id"]}{suffix}', path, f'docs/art-review/env/batches/{batch}/source.png',
                f'docs/art-review/env/batches/{batch}/prompt.md', f'docs/art-review/env/review-{batch}.png', 'feet',
                f'Environment object {item["id"]}, {kind}, cut from its batch sheet by docs/art-review/env/make_objects.py '
                f'(magenta keyed, box-reduced, outline peeled); {how} (src/render/imageArt.ts DECOR_CATALOG); approved by '
                "Claude under the owner's delegation 20/11/2026"))
        for item in patches:
            path = f'public/assets/art/{folder}/iso/wilds/{item["id"]}.png'
            if not (ROOT / path).exists():
                continue
            sheet = item['sheet']
            added.append(entry(
                f'env_ground_{item["id"]}{suffix}', path, f'docs/art-review/env/ground/_sheets/{sheet}/source.png',
                f'docs/art-review/env/ground/_sheets/{sheet}/prompt.md', f'docs/art-review/env/ground/review-{sheet}.png',
                'centre',
                f'Flat ground patch {item["id"]} cut from its decal sheet by docs/art-review/env/make_ground.py; {how}, lies '
                "flat under everything (src/render/imageArt.ts DECOR_CATALOG flat); approved by Claude under the owner's "
                'delegation 20/11/2026'))
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(added), encoding='utf-8', newline=NL)
    print(f'manifest: {len(added)} environment entries')


if __name__ == '__main__':
    main()
