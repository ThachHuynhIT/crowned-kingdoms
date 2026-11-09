"""Publish the approved isometric sets of the six new kings (G5 plan Task 12).

    python docs/art-review/g5/make_assets.py <king> [<king> ...]

Refuses a king whose `docs/art-review/g5/<king>/group-review.md` does not say ĐÃ DUYỆT. Uses the Wheat cutter
(`docs/art-review/iso-board/make_assets.py`): black keyed to alpha 0/255, buildings reduced at the SAME scale as the
Wheat set (the approved Reapers source becomes 64 px wide), plots reduced to 128 px wide with the diamond's centre on
the middle row. Writes `public/assets/art/ai-v1/iso/<cardId>.png` and `iso/plots/<king>_<state>.png`, then adds a
manifest entry per file to docs/assets.manifest.yml (existing ids are left alone).
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
G5 = ROOT / 'docs/art-review/g5'
OUT = ROOT / 'public/assets/art/ai-v1/iso'
MANIFEST = ROOT / 'docs/assets.manifest.yml'
KINGS = ['grove', 'tide', 'forge', 'clock', 'moon', 'nomad', 'stone', 'arcane']
PLOT_STATES = ['open', 'locked', 'throne', 'built']

_spec = importlib.util.spec_from_file_location('iso_assets', ROOT / 'docs/art-review/iso-board/make_assets.py')
iso = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(iso)


def approved(king: str) -> bool:
    review = G5 / king / 'group-review.md'
    return review.exists() and 'ĐÃ DUYỆT' in review.read_text(encoding='utf-8')


def building_sources(king: str) -> dict[str, Path]:
    """cardId → source for the throne and every building card drawn for `king` (folders that are not plots)."""
    out = {}
    for d in sorted((G5 / king).iterdir()):
        if d.is_dir() and not d.name.startswith('plot_') and (d / 'source.png').exists():
            out[d.name] = d / 'source.png'
    return out


def plot_sources(king: str) -> dict[str, Path]:
    return {s: G5 / king / f'plot_{king}_{s}' / 'source.png' for s in PLOT_STATES}


def entry(ident: str, path: str, category: str, source: Path, final: tuple[int, int], anchor: str, notes: str) -> str:
    src = source.relative_to(ROOT).as_posix()
    return (
        f'  - id: {ident}\n'
        f'    path: {path}\n'
        f'    category: {category}\n'
        f'    origin: custom\n'
        f'    source: {src}\n'
        f'    creator: Project owner (OpenAI imagegen via Codex; prompt in {src.replace("source.png", "prompt.md")})\n'
        f'    license: project-owned\n'
        f'    attribution: false\n'
        f'    redistribute: true\n'
        f'    evidence: docs/art-review/g5/\n'
        f'    modified: true\n'
        f'    nativeSize: 1024x1024\n'
        f'    finalSize: {final[0]}x{final[1]}\n'
        f'    anchor: {anchor}\n'
        f'    notes: {notes}\n'
    )


def publish(king: str) -> list[str]:
    if not approved(king):
        raise SystemExit(f'{king}: group not approved (docs/art-review/g5/{king}/group-review.md)')
    plots = plot_sources(king)
    missing = [p for p in [*plots.values()] if not p.exists()]
    if missing:
        raise SystemExit(f'{king}: missing {", ".join(p.relative_to(ROOT).as_posix() for p in missing)}')
    k = iso.REAPERS_WIDTH / iso.keyed(iso.BUILDINGS['wheat_reapers']).width
    entries = []
    (OUT / 'plots').mkdir(parents=True, exist_ok=True)
    for card, src in building_sources(king).items():
        img = iso.reduce(iso.keyed(src), k)
        rel = f'public/assets/art/ai-v1/iso/{card}.png'
        img.save(ROOT / rel)
        print(f'{card}: {img.width}x{img.height}')
        entries.append(entry(f'building_{card}_iso', rel, 'building', src, img.size, 'feet',
                             f'{card}, isometric 2:1 (G5, approved 2026-11-09 by Claude under the owner\'s delegation); black keyed and box-reduced at the Wheat set scale (Reapers = 64 px wide) by docs/art-review/g5/make_assets.py; drawn at 0.5 x 2 (src/render/imageArt.ts IMAGE_BUILDINGS)'))
    for state, src in plots.items():
        img = iso.keyed(src)
        img = iso.centre_plot(iso.reduce(img, iso.PLOT_WIDTH / img.width))
        rel = f'public/assets/art/ai-v1/iso/plots/{king}_{state}.png'
        img.save(ROOT / rel)
        print(f'plots/{king}_{state}: {img.width}x{img.height}')
        entries.append(entry(f'plot_{king}_{state}_iso', rel, 'terrain', src, img.size, 'centre',
                             f'{king} {state} plot, 2:1 isometric diamond (G5, approved 2026-11-09 by Claude under the owner\'s delegation); keyed, reduced to 128 px wide and centred on the widest row by docs/art-review/g5/make_assets.py; anchored at its centre (src/render/imageArt.ts IMAGE_PLOTS)'))
    return entries


def main(kings: list[str]) -> None:
    for king in kings:
        if king not in KINGS:
            raise SystemExit(f'unknown king {king}; one of {KINGS}')
    text = MANIFEST.read_text(encoding='utf-8')
    added = []
    for king in kings:
        for e in publish(king):
            ident = e.split('\n', 1)[0].split('id: ', 1)[1]
            if f'  - id: {ident}\n' not in text:
                added.append(e)
    if added:
        MANIFEST.write_text(text.rstrip('\n') + '\n' + ''.join(added), encoding='utf-8')
    print(f'manifest: {len(added)} entries added')


if __name__ == '__main__':
    main(sys.argv[1:])
