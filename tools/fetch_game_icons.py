"""Fetch the game-icons.net icons the menus use (owner 12/11/2026: "bộ icon hiện đại hơn, không cần pixel").

    python tools/fetch_game_icons.py

Downloads each listed SVG from the game-icons/icons repository (CC BY 3.0, "Icons made by {author}"), removes its
black background square (the white icon shape stays, the game tints it), writes public/assets/icons/game-icons/
<id>.svg, keeps the licence text and the check date in docs/licenses/game-icons/, and (re)writes the matching
`gi_<id>` entries of docs/assets.manifest.yml. Only authors named in the repository licence are used.
"""
import datetime
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/icons/game-icons'
EVIDENCE = ROOT / 'docs/licenses/game-icons'
MANIFEST = ROOT / 'docs/assets.manifest.yml'
RAW = 'https://raw.githubusercontent.com/game-icons/icons/master/'
AUTHORS = {'lorc': 'Lorc', 'delapouite': 'Delapouite', 'guard13007': 'Guard13007'}

# id -> repository path (author/name)
ICONS = {
    'settings': 'lorc/cog',
    'help': 'delapouite/info',
    'continue': 'guard13007/play-button',
    'new_run': 'lorc/crossed-swords',
    'load': 'delapouite/save',
    'crowns': 'lorc/crown',
    'back': 'lorc/return-arrow',
    'exit': 'delapouite/exit-door',
    'sound': 'delapouite/sound-on',
    'music': 'delapouite/musical-notes',
    'mute': 'delapouite/mute',
    'graphics': 'delapouite/settings-knobs',
    'speed': 'delapouite/speedometer',
    'trophy': 'lorc/trophy',
    'lock': 'lorc/padlock',
    'unlock': 'delapouite/padlock-open',
    'book': 'delapouite/spell-book',
    'castle': 'delapouite/castle',
    'dice': 'delapouite/perspective-dice-six-faces-random',
    'coins': 'delapouite/coins',
    'trash': 'delapouite/trash-can',
    'swap': 'delapouite/card-exchange',
    'pause': 'guard13007/pause-button',
    'fast': 'delapouite/fast-forward-button',
    'scroll': 'lorc/scroll-unfurled',
    'banner': 'delapouite/knight-banner',
}


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / 'license.txt').write_bytes(fetch(RAW + 'license.txt'))
    today = datetime.date.today().isoformat()
    (EVIDENCE / 'README.md').write_text(
        f'# game-icons.net\n\nSource: https://game-icons.net (repository https://github.com/game-icons/icons), '
        f'licence CC BY 3.0 (see license.txt). Checked {today}. Credit line required: "Icons made by {{author}}".\n'
        'Modification: the black background square is removed; the white shape is tinted in game.\n',
        encoding='utf-8')
    entries = []
    for gid, path in ICONS.items():
        author = AUTHORS[path.split('/')[0]]
        svg = fetch(RAW + path + '.svg').decode('utf-8')
        svg = svg.replace('<path d="M0 0h512v512H0z"/>', '', 1)
        if 'M0 0h512v512H0z' in svg or 'fill="#fff"' not in svg:
            raise SystemExit(f'{path}: unexpected SVG layout')
        (OUT / f'{gid}.svg').write_text(svg, encoding='utf-8', newline='\n')
        entries.append(
            f'  - id: gi_{gid}\n'
            f'    path: public/assets/icons/game-icons/{gid}.svg\n'
            f'    category: icon\n'
            f'    origin: external\n'
            f'    source: https://game-icons.net (github.com/game-icons/icons/{path}.svg)\n'
            f'    creator: {author}\n'
            f'    license: CC-BY-3.0\n'
            f'    attribution: true\n'
            f'    redistribute: true\n'
            f'    evidence: docs/licenses/game-icons/\n'
            f'    modified: true\n'
            f'    nativeSize: 512x512\n'
            f'    finalSize: 512x512\n'
            f'    notes: Vector icon (SVG) for the menus, background square removed, tinted in game (src/ui/gameIcons.ts)\n')
    text = MANIFEST.read_text(encoding='utf-8')
    head, _, body = text.partition('\nassets:\n')
    kept = [e for e in ['  - id: ' + x for x in body.split('  - id: ')[1:]] if not e.startswith('  - id: gi_')]
    kept = [e if e.endswith('\n') else e + '\n' for e in kept]
    MANIFEST.write_text(head + '\nassets:\n' + ''.join(kept) + ''.join(entries), encoding='utf-8', newline='\n')
    print(f'{len(entries)} icons -> {OUT.relative_to(ROOT).as_posix()}')


if __name__ == '__main__':
    main()
