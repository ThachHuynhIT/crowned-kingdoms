"""Isometric world sprites of the four neutral buildings (missing-art sweep, 2026-11-09).

    python docs/art-review/neutral-iso/make_prompts.py sample            # neutral_barracks only (gate)
    python docs/art-review/neutral-iso/make_prompts.py set [<id> ...]    # the rest, once sample-review.md says ĐÃ DUYỆT

`neutral_archer_tower`, `neutral_well` and `neutral_mercenary_camp` are still painted in code (`paintBuilding`), and
`neutral_barracks` uses the old 45-degree `barracks.png` in the isometric world. The prompt is NOT written here: it is
the G5 king-set prompt of `docs/art-review/g3e/buildings/make_prompts.py` (the "Prompt isometric dùng lại" block of
docs/ART_STYLE.md, which the prompt tells Codex to read), loaded as a module and given a neutral theme. Attached: the
approved style reference, the approved isometric building, the approved Wheat throne and Militia hall, and (for the
set) the approved neutral sample. Writes `<id>/prompt.md` and `.superpowers/b-neutral-<stage>.sh`.
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = ROOT / 'docs/art-review/neutral-iso'
_spec = importlib.util.spec_from_file_location('bprompts', ROOT / 'docs/art-review/g3e/buildings/make_prompts.py')
bp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bp)

SAMPLE = 'neutral_barracks'
THEME = ('neutral kingdom-for-hire shared by every king: plain warm medieval village, grey fieldstone, warm brown '
         'timber, red-brown clay or wooden shingle roofs, a small blue pennant, a little gold; no king\'s emblem')
WHEAT_REFS = ['public/assets/art/ai-v1/iso/wheat_throne.png', 'public/assets/art/ai-v1/iso/wheat_militia.png']


def items():
    bp.G5_THEME['neutral'] = THEME
    return [i for i in bp.g5_set('neutral') if i[1] == 'building']


def approved_sample():
    review = HERE / 'sample-review.md'
    if not review.exists() or 'ĐÃ DUYỆT' not in review.read_text(encoding='utf-8'):
        raise SystemExit('neutral sample is not approved (docs/art-review/neutral-iso/sample-review.md)')
    src = HERE / SAMPLE / 'source.png'
    if not src.exists():
        raise SystemExit(f'{src} is missing')
    return src.relative_to(ROOT).as_posix()


def main(stage, only):
    template = bp.iso_template()  # refuses without docs/ART_STYLE.md or the approved reference
    refs = [bp.REFERENCE, *bp.ISO_REFS['building'].split(), *WHEAT_REFS]
    if stage == 'sample':
        wanted = {SAMPLE}
    elif stage == 'set':
        refs.append(approved_sample())
        wanted = set(only) or {i[0] for i in items()} - {SAMPLE}
    else:
        raise SystemExit('stage: sample | set')
    for r in refs:
        if not (ROOT / r).exists():
            raise SystemExit(f'{r} is missing: refusing to draw without the approved references')
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for ident, kind, name, desc, _wheat in items():
        if ident not in wanted:
            continue
        d = HERE / ident
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        extra = ('\n\nẢNH ĐÃ DUYỆT CÙNG LOẠI (đính kèm): ' + ', '.join(f'`{r}`' for r in refs[2:]) +
                 ' — giữ đúng góc nhìn isometric 2:1, cỡ, mật độ cụm pixel, viền, ánh sáng trên-trái và độ hoàn thiện '
                 'của các ảnh này. Đây là công trình TRUNG LẬP dùng chung cho mọi vua: không mang huy hiệu hay màu chủ '
                 'đạo riêng của vua nào.\n')
        (d / 'prompt.md').write_text(bp.build_iso_set_prompt(out, kind, name, desc, template) + extra, encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        images = ' '.join(f'-i {r}' for r in refs)
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" {images} - < {prompt} '
                      f'> .superpowers/codex-neutral-{ident}.out 2>&1 &')
    runner.append('wait')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    path = ROOT / f'.superpowers/b-neutral-{stage}.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '', sys.argv[2:])
