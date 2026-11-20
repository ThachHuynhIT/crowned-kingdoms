"""Register the per-rule icons (decrees, quests, king perks; 20/11/2026) in docs/assets.manifest.yml.

    python docs/art-review/g3e/icons/register_rule_icons.py

For every `icon_decree_*`, `icon_quest_*` and `icon_perk_*` folder: the 32 and 16 px files in ai-v1/icons and their HD
twins in ai-v1-hd/icons. Idempotent: every `rule_icon_` entry is rewritten, appended at the end.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
MANIFEST = ROOT / 'docs/assets.manifest.yml'
ICONS = ROOT / 'docs/art-review/g3e/icons'
NL = '\n'


def main() -> None:
    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    entries = ['  - id: ' + e for e in body.split('  - id: ')[1:]]
    entries = [e if e.endswith(NL) else e + NL for e in entries]
    kept = [e for e in entries if not e.startswith('  - id: rule_icon_')]
    added = []
    folders = sorted(p for p in ICONS.iterdir() if p.is_dir() and p.name.startswith(('icon_decree_', 'icon_quest_', 'icon_perk_')))
    for tier, suffix in (('ai-v1', ''), ('ai-v1-hd', '_hd')):
        for folder in folders:
            name = folder.name
            for size in ('', '-16'):
                path = f'public/assets/art/{tier}/icons/{name}{size}.png'
                if not (ROOT / path).exists():
                    continue
                src = f'docs/art-review/g3e/icons/{name}/source.png'
                with Image.open(ROOT / src) as im:
                    nw, nh = im.size
                with Image.open(ROOT / path) as im:
                    w, h = im.size
                twin = ' HiDPI twin (2x, drawn at half scale).' if suffix else ''
                added.append(NL.join([
                    f'  - id: rule_{name}{size.replace("-", "_")}{suffix}', f'    path: {path}', '    category: icon',
                    '    origin: custom', f'    source: {src}',
                    f'    creator: Project owner (OpenAI imagegen via Codex; prompt in docs/art-review/g3e/icons/{name}/prompt.md)',
                    '    license: project-owned', '    attribution: false', '    redistribute: true',
                    '    evidence: docs/art-review/g3e/icons/review-2026-11-20.md', '    modified: true',
                    f'    nativeSize: {nw}x{nh}', f'    finalSize: {w}x{h}',
                    f'    notes: Per-rule icon {name[len("icon_"):]} (approved 2026-11-20 by Claude under the owner\'s delegation); '
                    'magenta keyed and box-reduced by docs/art-review/g3e/icons/make_assets.py; council, quest offer and perk '
                    f'dialog (src/render/imageArt.ts RULE_ICONS).{twin}',
                ]) + NL)
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(added), encoding='utf-8', newline=NL)
    print(f'manifest: {len(added)} rule icon entries')


if __name__ == '__main__':
    main()
