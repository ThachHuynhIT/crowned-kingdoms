"""Copy every original (source) picture of the game art into one folder, sorted into clusters.

    python tools/collect_art_sources.py            # -> art-sources/ (git-ignored, rebuilt from scratch)

Owner request 20/11/2026: all the original pictures in one separate folder, split into sub-folders per cluster, so
they can be browsed and touched up in one place. The originals stay where the cutting scripts read them
(`docs/art-review/...`); this folder is a copy, so editing a picture here does not change the game until it is copied
back next to its script and re-cut. Each copy is named after its path below the item folder, `/` -> `__`.

Clusters: units/{front,iso}, buildings/<king>, levels/<king>, plots/<king>, environment/{wilds,decor,forest,terrain,
walls,objects,ground}, building-anim, icons, cards, portraits, king-cards, menu, release, fx, other.
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'docs/art-review'
OUT = ROOT / 'art-sources'
KINGS = ('wheat', 'stone', 'arcane', 'grove', 'tide', 'forge', 'clock', 'moon', 'nomad', 'neutral')


def is_source(p: Path) -> bool:
    return p.suffix.lower() == '.png' and 'source' in p.stem.lower()


def king_of(name: str) -> str:
    for k in KINGS:
        if name.startswith(k + '_') or name == k or f'_{k}_' in name or name.endswith('_' + k):
            return k
    return 'other'


def cluster(rel: Path) -> tuple[str, Path]:
    """(destination folder below art-sources, path kept for the file name) of a source picture."""
    parts = rel.parts
    top = parts[0]
    rest = Path(*parts[1:])
    if top == 'g3e' and len(parts) > 2:
        group = parts[1]
        sub = Path(*parts[2:])
        if group == 'units':
            return 'units/front', sub
        if group == 'buildings':
            return f'buildings/{king_of(sub.parts[0] if len(sub.parts) > 1 else sub.stem)}', sub
        if group in ('icons', 'cards', 'portraits'):
            return group, sub
        if group.startswith('batch-'):
            if 'wilds' in group:
                return 'environment/wilds', Path(group) / sub
            if 'terrain' in group:
                return 'environment/terrain', Path(group) / sub
            if 'plots' in group:
                return 'plots/early-batches', Path(group) / sub
            return 'units/front', Path(group) / sub
        return f'other/g3e-{group}', sub
    if top == 'units-iso':
        return 'units/iso', rest
    if top == 'levels':
        return f'levels/{king_of(parts[1])}', rest
    if top == 'building-anim':
        return 'building-anim', rest
    if top == 'g5' and len(parts) > 2:
        group = parts[1]
        sub = Path(*parts[2:])
        if group in KINGS:
            item = sub.parts[0]
            return (f'plots/{group}' if item.startswith('plot_') else f'buildings/{group}'), sub
        if group in ('menu', 'fx', 'king-cards'):
            return group, sub
        return f'other/g5-{group}', sub
    if top == 'iso-board' and len(parts) > 2:
        group = parts[1]
        sub = Path(*parts[2:])
        if group == 'wheat':
            item = sub.parts[0]
            if item.startswith('plot_'):
                return 'plots/wheat', sub
            if 'wall' in item or item.startswith('terrain_'):
                return 'environment/walls', sub
            return 'buildings/wheat', sub
        if group in ('wilds', 'decor', 'terrain'):
            return f'environment/{group}', sub
        if group == 'polish':
            return 'environment/forest', sub
        if group.startswith('sample-'):
            return 'other/iso-board-samples', Path(group) / sub
        return f'other/iso-board-{group}', sub
    if top == 'neutral-iso':
        return 'buildings/neutral', rest
    if top == 'oblique-wall':
        return 'environment/walls', rest
    if top == 'env' and len(parts) > 2:
        return f'environment/{parts[1]}', Path(*parts[2:])
    if top == 'release':
        return 'release', rest
    return f'other/{top}', rest


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    counts: dict[str, int] = {}
    total = 0
    for p in sorted(SRC.rglob('*.png')):
        if not is_source(p):
            continue
        rel = p.relative_to(SRC)
        folder, keep = cluster(rel)
        name = re.sub(r'[\\/]', '__', keep.as_posix())
        dest = OUT / folder / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, dest)
        counts[folder] = counts.get(folder, 0) + 1
        total += p.stat().st_size
    lines = ['# Ảnh gốc của game (bản sao)', '',
             'Tạo bởi `python tools/collect_art_sources.py`. Ảnh gốc thật vẫn nằm trong `docs/art-review/...`, cạnh script cắt;',
             'sửa ở đây thì phải chép về chỗ cũ rồi chạy lại script cắt mới vào game.', '',
             '| Cụm | Số ảnh |', '|---|---|']
    lines += [f'| `{k}` | {v} |' for k, v in sorted(counts.items())]
    lines += ['', f'Tổng: {sum(counts.values())} ảnh, {total / 1e6:.0f} MB.']
    (OUT / 'README.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'{sum(counts.values())} source pictures, {total / 1e6:.0f} MB -> {OUT}')
    for k, v in sorted(counts.items()):
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
