"""Register approved king-card backgrounds in docs/assets.manifest.yml (idempotent).

    python docs/art-review/g5/king-cards/register.py wheat [...]
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MANIFEST = ROOT / 'docs/assets.manifest.yml'


def entry(king):
    return f'''  - id: king_card_{king}
    path: public/assets/art/ai-v1/king-cards/{king}.png
    category: ui
    origin: custom
    source: docs/art-review/g5/king-cards/{king}/source.png
    creator: Project owner (OpenAI imagegen via Codex; prompt in docs/art-review/g5/king-cards/{king}/prompt.md)
    license: project-owned
    attribution: false
    redistribute: true
    evidence: docs/art-review/g5/king-cards/{king}/preview.png
    modified: true
    nativeSize: 1024x1536
    finalSize: 66x96
    notes: King-select card background (approved 2026-11-09 by Claude under the owner's delegation); magenta keyed out and box-reduced by docs/art-review/g5/king-cards/make_assets.py; window and glyphs drawn over it by src/render/kingCardArt.ts (KING_CARDS_APPROVED)
'''


def main(kings):
    text = MANIFEST.read_text(encoding='utf-8')
    for king in kings:
        if f'id: king_card_{king}\n' in text:
            continue
        text = text.rstrip('\n') + '\n' + entry(king)
    MANIFEST.write_text(text, encoding='utf-8')
    print('registered', kings)


if __name__ == '__main__':
    main(sys.argv[1:])
