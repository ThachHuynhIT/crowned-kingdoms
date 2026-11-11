"""List every PNG the game ships under `public/assets` for the asset admin (10/11/2026).

`manifest.json` (from `slice_art_batches.py`) only knows the October art-review sheets; this script scans the
real folders and writes `tools/asset-admin/game-assets.json` in the same schema. The admin merges both files:
an item here replaces a manifest item with the same id. Item ids follow `planned.json` (`unit_<x>`,
`building_<king>_<card>`, `card_art_<card>`, `portrait_<king>`, `fx_<x>`, `icon_<x>`, `menu_<x>`) so adopted art
no longer shows as missing. Python 3 standard library only; run from the repo root:

    python tools/build_game_assets.py
"""
from __future__ import annotations

import json
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'public/assets/art/ai-v1'
UI = ROOT / 'public/assets/ui'
OUT = ROOT / 'tools/asset-admin/game-assets.json'


def png_size(path: Path) -> tuple[int, int]:
    head = path.read_bytes()[:24]
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f'not a PNG: {path}')
    w, h = struct.unpack('>II', head[16:24])
    return int(w), int(h)


def url(path: Path) -> str:
    return '/' + path.relative_to(ROOT).as_posix()


def vi_names() -> dict[str, str]:
    """Card id → Vietnamese name, read from `src/data` (`id: '…'` followed by `nameVi: '…'`)."""
    names: dict[str, str] = {}
    for f in sorted((ROOT / 'src/data').rglob('*.ts')):
        text = f.read_text(encoding='utf-8')
        for m in re.finditer(r"id: '([a-z0-9_]+)',(?:\s*\n[^\n]*){0,3}?\s*nameVi: '([^']+)'", text):
            names.setdefault(m.group(1), m.group(2))
    return names


NAMES = vi_names()


def label(stem: str) -> str:
    return NAMES.get(stem, stem.replace('_', ' '))


def item(id_: str, lbl: str, path: Path, kind: str, group: str, tags: list[str]) -> dict:
    w, h = png_size(path)
    return {'id': id_, 'label': lbl, 'src': url(path), 'w': w, 'h': h, 'kind': kind, 'group': group, 'tags': tags}


def units() -> list[dict]:
    """Six poses per side: idle 0 1, walk 2 3, attack 4 5 (`imageArt.POSES`)."""
    prefixes = sorted({m.group(1) for f in ART.glob('*_0.png') if (m := re.match(r'(.+?)(_foe)?_0$', f.stem))})
    out = []
    for p in prefixes:
        if not all((ART / f'{p}_{i}.png').exists() for i in range(6)):
            continue
        frames = {}
        for team, mid in (('ally', ''), ('foe', '_foe_')):
            if team == 'foe' and not (ART / f'{p}_foe_0.png').exists():
                continue
            name = (lambda i: f'{p}_{i}') if team == 'ally' else (lambda i: f'{p}{mid}{i}')
            frames[team] = {anim: [url(ART / f'{name(i)}.png') for i in idx]
                            for anim, idx in (('idle', (0, 1)), ('walk', (2, 3)), ('attack', (4, 5)))}
        it = item(f'unit_{p}', label(p), ART / f'{p}_0.png', 'unit', 'boss' if p.startswith('boss_') else 'unit', [p])
        it['units'] = frames
        out.append(it)
    return out


def flat(folder: Path, id_of, kind: str, group_of, skip=lambda s: False) -> list[dict]:
    out = []
    for f in sorted(folder.glob('*.png')):
        if skip(f.stem):
            continue
        out.append(item(id_of(f.stem), label(f.stem), f, kind, group_of(f.stem), [f.stem]))
    return out


SIZE_SUFFIX = re.compile(r'-(\d+)$')


def sized(folder: Path, id_prefix: str, group: str) -> list[dict]:
    """One item per base name; shows the largest copy and tags every size (`x`, `x-48`, `x-128`…)."""
    bases: dict[str, list[Path]] = {}
    for f in sorted(folder.glob('*.png')):
        bases.setdefault(SIZE_SUFFIX.sub('', f.stem), []).append(f)
    out = []
    for base, files in sorted(bases.items()):
        files.sort(key=lambda f: png_size(f)[0] * png_size(f)[1])
        big = files[-1]
        sizes = ['×'.join(map(str, png_size(f))) for f in files]
        out.append(item(f'{id_prefix}{base}', label(base), big, 'object', group, [base, *sizes]))
    return out


def king_of(stem: str) -> str:
    return stem.split('_', 1)[0]


def ui_kits() -> list[dict]:
    out = []
    for kit in sorted(p for p in UI.iterdir() if p.is_dir()):
        for f in sorted(kit.rglob('*.png')):
            rel = f.relative_to(kit).with_suffix('').as_posix()
            out.append(item(f'ui_{kit.name}_{rel.replace("/", "_")}', f'{kit.name} {rel}', f, 'object', kit.name, [kit.name]))
    return out


def build() -> dict:
    cats = [
        ('units', 'Lính', units()),
        ('buildings', 'Công trình', [
            *flat(ART / 'iso', lambda s: f'building_{s}', 'object', king_of, skip=lambda s: s.startswith('wall')),
            *flat(ART / 'iso-neutral', lambda s: f'building_{s}', 'object', lambda s: 'neutral'),
        ]),
        ('walls', 'Tường núi', flat(ART / 'iso', lambda s: f'iso_{s}', 'object', lambda s: 'wall',
                                    skip=lambda s: not s.startswith('wall'))),
        ('plots', 'Ô bàn cờ', flat(ART / 'iso/plots', lambda s: f'plot_{s}', 'tile', king_of)),
        ('terrain', 'Nền đất', flat(ART / 'iso/terrain', lambda s: f'terrain_{s}', 'tile', lambda s: 'iso')),
        ('wilds', 'Hoang dã', [
            *flat(ART / 'iso/wilds', lambda s: f'wild_{s}', 'object', lambda s: 'wild'),
            *flat(ART / 'iso/polish', lambda s: f'wild_{s}', 'object', lambda s: 'forest'),
        ]),
        ('cards', 'Tranh thẻ', sized(ART / 'cards', 'card_art_', 'card-art')),
        ('portraits', 'Chân dung vua', sized(ART / 'portraits', 'portrait_', 'portraits')),
        ('king_cards', 'Nền thẻ vua', flat(ART / 'king-cards', lambda s: f'king_card_{s}', 'object', lambda s: 'king-cards')),
        ('fx', 'Hiệu ứng (ảnh)', flat(ART / 'fx', lambda s: s, 'object', lambda s: 'fx')),
        ('ui_icons', 'Biểu tượng', sized(ART / 'icons', '', 'ui-icons')),
        ('menu', 'Nền menu', flat(ART / 'menu', lambda s: f'menu_{s}', 'object', lambda s: 'menu')),
        ('ui_kits', 'Khung giao diện (Kenney)', ui_kits()),
    ]
    seen: set[str] = set()
    for _, _, items in cats:
        for it in items:
            if it['id'] in seen:
                sys.exit(f'duplicate id {it["id"]}')
            seen.add(it['id'])
    return {'version': 1, 'pixelScale': 2,
            'categories': [{'id': c, 'label': lbl, 'items': items} for c, lbl, items in cats if items]}


if __name__ == '__main__':
    data = build()
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print({c['id']: len(c['items']) for c in data['categories']})
