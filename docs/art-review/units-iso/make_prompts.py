"""Codex prompts for the diagonal-direction unit sheets (spec docs/superpowers/specs/2026-11-12-unit-asset-rules-design.md).

    python docs/art-review/units-iso/make_prompts.py militia
    python docs/art-review/units-iso/make_prompts.py --frames 12 militia

`--rows` (owner 12/11/2026: "codex vẽ 1 hình chứa tất cả hành động, 3 hàng mỗi hàng 1 loại; đứng yên chỉ cần 3"): ONE
sheet per direction, row 1 idle (3 frames), row 2 walk (4), row 3 attack (4), in a 4-column grid.

`--frames 12` (owner 12/11/2026: "mỗi nhân vật 12 động tác để hoạt ảnh mượt hơn"): per direction 4 idle, 4 walk and
4 attack frames, drawn in two 3×2 sheets (A: idle 1–4, walk 1–2; B: walk 3–4, attack 1–4). Each run attaches the
direction's 6-frame sample (same character, camera and size) and run B also attaches run A's sheet.

Writes <unit>/prompt-se.md and <unit>/prompt-nw.md and .superpowers/units-iso.sh (one Codex run per direction). Every
prompt starts with the mandatory ART_STYLE header of docs/art-review/g3e/units/make_prompts.py (read the document,
attached approved reference) and attaches: the approved style reference, the approved isometric building (camera),
and the unit's current pose sheet (same character). SAMPLE ONLY: the owner approves one unit before any group.
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
P = ROOT / 'docs/art-review/units-iso'
spec = importlib.util.spec_from_file_location('unit_prompts', ROOT / 'docs/art-review/g3e/units/make_prompts.py')
up = importlib.util.module_from_spec(spec)
spec.loader.exec_module(up)

ISO_REF = 'docs/art-review/style-references/iso-building-approved.png'

FACING = {
    'se': ('DOWN-RIGHT (south-east)', 'a three-quarter FRONT view: face, chest and the front of the weapon hand turned toward the lower right of the screen; the left side of the body is nearer the viewer'),
    'nw': ('UP-LEFT (north-west)', 'a three-quarter BACK view: the back of the head, the back and shoulders turned toward the viewer, the character looking and moving toward the upper left of the screen; the face is NOT visible (at most a sliver of cheek)'),
}

BODY = """Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit {name} — {role}
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `{iso}` — use its CAMERA: classic 2:1 isometric, looking down at about 30 degrees, so the top of the head, hat and shoulders are visible; (3) `{sheet}` — this unit's current sheet: draw exactly the SAME character (face, hair, clothes, colours, proportions, weapon and shield, outline thickness, pixel size), only the camera and the facing change.
Facing: every cell faces {facing}: {how}. The game mirrors this sheet horizontally for the other side, so do not draw any mirrored copy.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 3 columns x 2 rows of equal square cells (each 512x512 px). Each cell holds ONE full-body copy of the character, the same size in every cell (about the same height as in the attached sheet), the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of 8x8 source pixels, the same block size in every cell.
Cells in reading order (left to right, top row first):
1. IDLE frame 1: standing, weight on both feet, weapon held upright.
2. IDLE frame 2: identical to idle 1 but breathing in: shoulders and head 1 art pixel lower; feet do not move.
3. WALK frame 1: walking toward the facing direction, the near foot forward, arms swinging, body 1 art pixel lower than idle.
4. WALK frame 2: the other foot forward, the other arm swing, body at idle height.
5. ATTACK frame 1 (wind-up): {windup}
6. ATTACK frame 2 (strike): {strike}
All movement follows the facing direction (diagonal on screen), never a pure left-right side view. The poses must read as a silhouette at 64x64 art pixels: big simple limb and weapon movements, no motion blur, no speed lines, no effects.
Team colours: ALLY version, blue accents exactly as in the attached sheet (the red enemy version is made later by a recolour tool).
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting (the left side of each shape lighter), a 1-art-pixel dark outline in a darker shade of each material (never pure black), the same palette as the attached sheet.
Background: ONE flat solid magenta #FF00FF filling the whole canvas (every cell), no gradient, no texture, no glow, NO cast shadow and no ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
"""

UNITS = {
    'militia': {
        'windup': 'the spear pulled back to the hip along the facing direction, front knee bent, shield raised in front of the chest.',
        'strike': 'a lunge toward the facing direction, the spear thrust straight out along it with the arm fully extended, the shield stays on the body.',
    },
}


BODY12 = """Create ONE pixel-art ANIMATION SHEET (part {part} of 2) for the Crowned Kingdoms unit {name} — {role}
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `{iso}` — its CAMERA (classic 2:1 isometric, looking down at about 30 degrees); (3) `{sample}` — the approved sample of THIS unit facing this way: draw exactly the SAME character at the SAME size, camera, facing, palette, outline and pixel size{extra}.
Facing: every cell faces {facing}: {how}. Do not draw any mirrored copy.
This sheet is part of a 12-frame animation set (4 idle, 4 walk, 4 attack) played in a loop, so neighbouring frames must change only a little and the loops must close smoothly (the last frame of each loop leads back into its first).
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 3 columns x 2 rows of equal square cells (each 512x512 px). Each cell holds ONE full-body copy of the character, the same size in every cell, the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of 8x8 source pixels.
Cells in reading order (left to right, top row first):
{cells}
All movement follows the facing direction (diagonal on screen), never a pure left-right side view. Big simple limb and weapon movements that read at 64x64 art pixels; no motion blur, speed lines or effects.
Team colours: ALLY version, blue accents exactly as in the sample.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the sample's palette.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, texture, glow, cast shadow or ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
"""

CELLS12 = {
    'a': [
        'IDLE 1: standing at rest, weight on both feet, weapon upright (as the sample).',
        'IDLE 2: breathing in, shoulders and head 1 art pixel lower.',
        'IDLE 3: breathing in fully, shoulders and head 2 art pixels lower, weapon tip 1 art pixel lower.',
        'IDLE 4: breathing out, back to 1 art pixel lower (between idle 3 and idle 1).',
        'WALK 1: contact: the near foot just landed forward, the far foot back, arms swinging, body 1 art pixel lower.',
        'WALK 2: passing: the far foot lifted passing the near leg, body at idle height.',
    ],
    'b': [
        'WALK 3: contact on the other side: the far foot forward, the near foot back, the other arm swing, body 1 art pixel lower.',
        'WALK 4: passing on the other side: the near foot lifted passing, body at idle height (leads back into walk 1).',
        'ATTACK 1 (anticipation): {a1}',
        'ATTACK 2 (wind-up): {a2}',
        'ATTACK 3 (strike): {a3}',
        'ATTACK 4 (recovery): {a4}',
    ],
}

ATTACK12 = {
    'militia': {
        'a1': 'weight shifts back, the spear starts to draw back, shield up.',
        'a2': 'the spear pulled fully back to the hip along the facing direction, front knee bent, shield raised in front of the chest.',
        'a3': 'a lunge toward the facing direction, the spear thrust straight out along it with the arm fully extended.',
        'a4': 'pulling back from the lunge, the spear half withdrawn, returning toward the idle stance.',
    },
}


def main12(units):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for unit in units:
        name, role, *_ = up.UNITS[unit]
        for d, (facing, how) in FACING.items():
            sample = f'docs/art-review/units-iso/{unit}/poses-{d}-source.png'
            for part in ('a', 'b'):
                out = f'docs/art-review/units-iso/{unit}/frames12-{d}-{part}-source.png'
                prev = f'docs/art-review/units-iso/{unit}/frames12-{d}-a-source.png'
                extra = (f'; (4) `{prev}` — part 1 of this set: continue it exactly (same size, position and baseline)'
                         if part == 'b' else '')
                cells = '\n'.join(f'{i + 1}. {c}' for i, c in enumerate(CELLS12[part])).format(**ATTACK12[unit])
                text = up.HEADER.format(out=out, doc=up.STYLE_DOC, ref=up.REFERENCE) + BODY12.format(
                    part=1 if part == 'a' else 2, name=name, role=role, iso=ISO_REF, sample=sample, extra=extra,
                    facing=facing, how=how, cells=cells)
                prompt = P / unit / f'prompt12-{d}-{part}.md'
                prompt.write_text(text, encoding='utf-8', newline='\n')
                rel = prompt.relative_to(ROOT).as_posix()
                images = f'-i {up.REFERENCE} -i {ISO_REF} -i {sample}' + (f' -i {prev}' if part == 'b' else '')
                runner.append(f'codex exec --sandbox workspace-write -C "$PWD" {images} - < {rel} > .superpowers/codex-iso12-{unit}-{d}-{part}.out 2>&1')
                runner.append(f'if [ -s {out} ]; then echo "{unit} {d} {part} ok"; else echo "{unit} {d} {part} MISSING"; fi >> .superpowers/units-iso12.log')
    runner.append('echo done >> .superpowers/units-iso12.log')
    path = ROOT / '.superpowers/units-iso12.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


BODY_ROWS = """Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit {name} — {role}
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `{iso}` — its CAMERA (classic 2:1 isometric, looking down at about 30 degrees); (3) `{sample}` — the approved sample of THIS unit facing this way: draw exactly the SAME character at the SAME size, camera, facing, palette, outline and pixel size.
Facing: every cell faces {facing}: {how}. Do not draw any mirrored copy.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 4 columns x 3 rows of equal cells (each 384 px wide and 341 px tall), ONE ROW PER ANIMATION. Each used cell holds ONE full-body copy of the character, the same size in every cell, the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of 6x6 source pixels.
Row 1 — IDLE, 3 frames in the first three cells (the 4th cell of row 1 stays EMPTY magenta), a gentle breathing loop:
1. standing at rest, weight on both feet, weapon upright (as the sample);
2. breathing in, shoulders and head 1 art pixel lower;
3. breathing out, halfway back (leads back into frame 1).
Row 2 — WALK, 4 frames, a smooth loop toward the facing direction:
1. contact: the near foot just landed forward, the far foot back, arms swinging, body 1 art pixel lower;
2. passing: the far foot lifted passing the near leg, body at idle height;
3. contact on the other side: the far foot forward, the near foot back, the other arm swing, body 1 art pixel lower;
4. passing on the other side (leads back into frame 1).
Row 3 — ATTACK, 4 frames:
1. anticipation: {a1}
2. wind-up: {a2}
3. strike: {a3}
4. recovery: {a4}
Neighbouring frames change only a little so the loops play smoothly. All movement follows the facing direction (diagonal on screen), never a pure left-right side view. Big simple limb and weapon movements that read at 64x64 art pixels; no motion blur, speed lines or effects.
Team colours: ALLY version, blue accents exactly as in the sample.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the sample's palette.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, texture, glow, cast shadow or ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
"""


def main_rows(units):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for unit in units:
        name, role, *_ = up.UNITS[unit]
        for d, (facing, how) in FACING.items():
            sample = f'docs/art-review/units-iso/{unit}/poses-{d}-source.png'
            out = f'docs/art-review/units-iso/{unit}/rows-{d}-source.png'
            text = up.HEADER.format(out=out, doc=up.STYLE_DOC, ref=up.REFERENCE) + BODY_ROWS.format(
                name=name, role=role, iso=ISO_REF, sample=sample, facing=facing, how=how, **ATTACK12[unit])
            prompt = P / unit / f'prompt-rows-{d}.md'
            prompt.write_text(text, encoding='utf-8', newline='\n')
            rel = prompt.relative_to(ROOT).as_posix()
            runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {up.REFERENCE} -i {ISO_REF} -i {sample} - < {rel} > .superpowers/codex-rows-{unit}-{d}.out 2>&1')
            runner.append(f'if [ -s {out} ]; then echo "{unit} {d} ok"; else echo "{unit} {d} MISSING"; fi >> .superpowers/units-rows.log')
    runner.append('echo done >> .superpowers/units-rows.log')
    path = ROOT / '.superpowers/units-rows.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


def main(units):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for unit in units:
        name, role, *_ = up.UNITS[unit]
        sheet = f'docs/art-review/g3e/units/{unit}/poses-source.png'
        for d, (facing, how) in FACING.items():
            out = f'docs/art-review/units-iso/{unit}/poses-{d}-source.png'
            text = up.HEADER.format(out=out, doc=up.STYLE_DOC, ref=up.REFERENCE) + BODY.format(
                name=name, role=role, iso=ISO_REF, sheet=sheet, facing=facing, how=how, **UNITS[unit])
            prompt = P / unit / f'prompt-{d}.md'
            prompt.parent.mkdir(parents=True, exist_ok=True)
            prompt.write_text(text, encoding='utf-8', newline='\n')
            rel = prompt.relative_to(ROOT).as_posix()
            runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {up.REFERENCE} -i {ISO_REF} -i {sheet} - < {rel} > .superpowers/codex-iso-{unit}-{d}.out 2>&1')
            runner.append(f'if [ -s {out} ]; then echo "{unit} {d} ok"; else echo "{unit} {d} MISSING"; fi >> .superpowers/units-iso.log')
    runner.append('echo done >> .superpowers/units-iso.log')
    path = ROOT / '.superpowers/units-iso.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--rows' in args:
        main_rows([a for a in args if a != '--rows'] or ['militia'])
    elif '--frames' in args:
        i = args.index('--frames')
        if args[i + 1] != '12':
            raise SystemExit('--frames supports 12 only')
        main12([a for j, a in enumerate(args) if j not in (i, i + 1)] or ['militia'])
    else:
        main(args or ['militia'])
