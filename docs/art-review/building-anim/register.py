"""Register the building activity loops in the game (docs/art-review/building-anim/in-game.txt) in docs/assets.manifest.yml.

    python docs/art-review/building-anim/register.py

Three frames per card at densities 2, 4 and 8, next to the card's base picture (`<base>_anim<i>.png`). Idempotent: every
`building_anim_` entry is rewritten, appended at the end.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
MANIFEST = ROOT / 'docs/assets.manifest.yml'
HERE = ROOT / 'docs/art-review/building-anim'
NL = '\n'
TIERS = (('ai-v1', '', 'drawn at scale 0.5'), ('ai-v1-hd', '_hd', 'HiDPI twin, 2x'), ('ai-v1-uhd', '_uhd', 'close-up twin, 4x'))


def main() -> None:
    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    entries = ['  - id: ' + e for e in body.split('  - id: ')[1:]]
    entries = [e if e.endswith(NL) else e + NL for e in entries]
    kept = [e for e in entries if not e.startswith('  - id: building_anim_')]
    added = []
    cards = [c for c in (HERE / 'in-game.txt').read_text(encoding='utf-8').split() if c]
    for tier, suffix, how in TIERS:
        for card in cards:
            base = next(f'{d}/{card}' for d in ('iso', 'iso-neutral') if (ROOT / f'public/assets/art/ai-v1/{d}/{card}.png').exists())
            src = f'docs/art-review/building-anim/{card}/anim-source.png'
            with Image.open(ROOT / src) as im:
                nw, nh = im.size
            for i in range(3):
                path = f'public/assets/art/{tier}/{base}_anim{i}.png'
                with Image.open(ROOT / path) as im:
                    w, h = im.size
                added.append(NL.join([
                    f'  - id: building_anim_{card}_{i}{suffix}', f'    path: {path}', '    category: building',
                    '    origin: custom', f'    source: {src}',
                    f'    creator: Project owner (OpenAI imagegen via Codex; prompt in docs/art-review/building-anim/{card}/prompt.md)',
                    '    license: project-owned', '    attribution: false', '    redistribute: true',
                    f'    evidence: docs/art-review/building-anim/{card}/review.png', '    modified: true',
                    f'    nativeSize: {nw}x{nh}', f'    finalSize: {w}x{h}', '    anchor: feet',
                    f'    notes: Frame {i} of the activity loop of {card} (frame 0 = the approved picture, padded); static pixels '
                    f'locked to the base by docs/art-review/building-anim/make_anim.py; {how} (src/render/imageArt.ts '
                    "IMAGE_BUILDING_ANIMS); approved by Claude under the owner's delegation 20/11/2026",
                ]) + NL)
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(added), encoding='utf-8', newline=NL)
    print(f'manifest: {len(added)} building animation entries')


if __name__ == '__main__':
    main()
