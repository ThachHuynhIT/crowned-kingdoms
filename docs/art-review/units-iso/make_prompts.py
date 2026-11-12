"""Codex prompts for the diagonal-direction unit sheets (spec docs/superpowers/specs/2026-11-12-unit-asset-rules-design.md).

    python docs/art-review/units-iso/make_prompts.py militia

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
    main(sys.argv[1:] or ['militia'])
