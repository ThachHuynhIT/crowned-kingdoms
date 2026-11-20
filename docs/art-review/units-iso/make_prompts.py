"""Codex prompts for the diagonal-direction unit sheets (spec docs/superpowers/specs/2026-11-12-unit-asset-rules-design.md).

    python docs/art-review/units-iso/make_prompts.py militia
    python docs/art-review/units-iso/make_prompts.py --frames 12 militia

`--rows` (owner 12/11/2026: "codex vẽ 1 hình chứa tất cả hành động, 3 hàng mỗi hàng 1 loại; đứng yên chỉ cần 3"): ONE
sheet per direction, row 1 idle (3 frames), row 2 walk (4), row 3 attack (4), in a 4-column grid. A unit without a
6-frame iso sample (16/11/2026: reaper, peasant, golem, miner, slinger, rubble) attaches instead the approved militia
row sheet of the same direction (same-kind reference) and its own approved front-view pose sheet (character);
optional per-unit 'idle' and 'note' entries in ATTACK12 carry redraw corrections.

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
    # 16/11/2026: the rest of the Wheat and Stone sets, drawn straight as row sheets (no 6-frame iso sample);
    # the actions follow each unit's approved front-view pose sheet (g3e/units/make_prompts.py ATTACK/STRIKE)
    'reaper': {
        'a1': 'weight shifts back, both hands lift the sickle-scythe off the shoulder.',
        'a2': 'the sickle-scythe raised high above and behind the head with both hands, weight on the back foot.',
        'a3': 'a wide low swing: the blade sweeps down and forward along the facing direction at knee height, body leaning forward.',
        'a4': 'the blade low and behind the swing, rising back toward the shoulder, returning toward the idle stance.',
    },
    'peasant': {
        # r1 16/11/2026: r0 SE held the fork lowered forward while NW held it upright; r2: r1 SE faced the viewer
        'idle': ', the pitchfork held UPRIGHT in both hands with the tines up above the head (never lowered or pointed forward); keep it upright through the whole idle and walk rows; the body is clearly TURNED three-quarter toward the facing direction exactly like the militia in image 3 in every cell (r2: r1 stood square to the viewer)',
        'a1': 'weight shifts back, the pitchfork starts to draw back in both hands.',
        'a2': 'the pitchfork pulled back at waist height with both hands, leaning back.',
        'a3': 'a hard jab: the pitchfork thrust forward along the facing direction at chest height, both arms extended, front foot forward.',
        'a4': 'pulling the pitchfork back from the jab, returning toward the idle stance.',
    },
    'golem': {
        # r1 16/11/2026: r0 SE drew an angular block golem with glowing eyes instead of the approved round one
        'note': ' Character check for this unit: rounded, pillow-like WARM grey-brown boulders (no sharp angular blocks), a round friendly face with a small smile and small DARK eyes (no glowing eyes), ONE small blue crystal shard on each shoulder (no crystal clusters), plain blue bands on the wrists and belt with a blue cloth flap, exactly as in image 4.',
        'a1': 'the body leans back, both stone fists start to rise.',
        'a2': 'both stone fists raised high above the head, the body leaning back, the chest rune glowing brighter.',
        'a3': 'both fists slammed down together in front of it along the facing direction at ground level, the body bent forward.',
        'a4': 'the fists lifting off the ground, the body straightening back toward the idle stance.',
    },
    'miner': {
        'a1': 'weight shifts back, the pickaxe starts to rise in both hands.',
        'a2': 'the pickaxe swung up behind the shoulder with both hands, weight on the back foot.',
        'a3': 'the pickaxe brought down hard in front along the facing direction at knee height, body bent forward.',
        'a4': 'the pickaxe lifting back from the blow across the body, returning toward the idle stance.',
    },
    'slinger': {
        'a1': 'the sling lifted, the stone placed in the pouch, the other arm pointing along the facing direction.',
        'a2': 'the sling whirled above the head in one hand, the other arm pointing along the facing direction.',
        'a3': 'the throwing arm swung fully forward along the facing direction at shoulder height, the sling released and empty, front foot forward (no flying stone: the game draws it).',
        'a4': 'the arm coming back down, the sling hanging empty, returning toward the idle stance.',
    },
    'rubble': {
        'a1': 'the rock heap squashes a little lower.',
        'a2': 'the rock heap squashed low and leaning back, ready to hop.',
        'a3': 'a hop forward along the facing direction, the rock heap stretched tall and leaning into the hit, feet off the ground.',
        'a4': 'landing, the heap squashed a little, returning toward the idle stance.',
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


# Units without a 6-frame iso sample (16/11/2026): the APPROVED militia row sheet of the same direction is the
# same-kind reference (camera, facing, grid, baseline, finish) and the unit's own approved front-view pose sheet
# carries the character design.
MILITIA_ROWS = 'docs/art-review/units-iso/militia/rows-{d}-source.png'
# on-screen figure height of the militia in its approved row sheet, in source px
MILITIA_ROWS_FIGURE = 270

BODY_ROWS_NEW = """Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit {name} — {role}
Attached images: (1) the approved style reference; (2) the approved ISOMETRIC building `{iso}` — its CAMERA (classic 2:1 isometric, looking down at about 30 degrees); (3) `{militia}` — the APPROVED animation sheet of another unit (the Wheat militia) facing this same way: copy its camera, facing, grid layout, cell spacing, feet baseline, outline, shading and finish exactly, but NOT its character; (4) `{sheet}` — this unit's own approved front-view pose sheet: draw exactly THIS character (face, hair, body shape, clothes, colours, proportions, weapon, team-colour areas), only the camera and the facing change to match image 3.{note}
Facing: every cell faces {facing}: {how}. Do not draw any mirrored copy.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 4 columns x 3 rows of equal cells (each 384 px wide and 341 px tall), ONE ROW PER ANIMATION, laid out like image 3. Each used cell holds ONE full-body copy of the character, about {fig} px tall in every cell (the SAME size in every cell), the feet on the same baseline near the bottom of the cell, a margin on every side, nothing (weapon included) crossing into another cell, no grid lines drawn. Every art pixel is a clean square block, the same block size in every cell.
Row 1 — IDLE, 3 frames in the first three cells (the 4th cell of row 1 stays EMPTY magenta), a gentle breathing loop:
1. standing at rest as in the idle pose of image 4, weight on both feet{idle};
2. breathing in, shoulders and head 1 art pixel lower;
3. breathing out, halfway back (leads back into frame 1).
Row 2 — WALK, 4 frames, a smooth loop toward the facing direction:
1. contact: the near foot just landed forward, the far foot back, body 1 art pixel lower;
2. passing: the far foot lifted passing the near leg, body at idle height;
3. contact on the other side: the far foot forward, the near foot back, body 1 art pixel lower;
4. passing on the other side (leads back into frame 1).
Row 3 — ATTACK, 4 frames:
1. anticipation: {a1}
2. wind-up: {a2}
3. strike: {a3}
4. recovery: {a4}
Neighbouring frames change only a little so the loops play smoothly. All movement follows the facing direction (diagonal on screen), never a pure left-right side view. Big simple limb and weapon movements that read at 64x64 art pixels; no motion blur, speed lines, dust or effects.
Team colours: ALLY version, blue accents exactly as in image 4.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the palette of image 4.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, texture, glow, cast shadow or ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
"""


def shipped_height(unit):
    from PIL import Image
    with Image.open(ROOT / f'public/assets/art/ai-v1/{unit}_0.png') as im:
        box = im.convert('RGBA').getchannel('A').getbbox()
    return box[3] - box[1]


# 20/11/2026: big units whose wind-up lifts a weapon high over the head ask for a shorter idle figure, so the raised
# club or sword still stays inside the 341 px cell (the cut scales by the idle height, so the game size is unchanged)
ROWS_FIGURE_CAP = {u: 240 for u in ('ogre', 'boss_bog_ogre', 'boss_hornet_queen', 'boss_crownless_king')}


def rows_figure_px(unit):
    """Source-px height asked for in the sheet: the militia's row-sheet height scaled by the shipped height ratio,
    capped so a big unit still fits its 341 px cell."""
    cap = ROWS_FIGURE_CAP.get(unit, 280)
    return min(cap, round(MILITIA_ROWS_FIGURE * shipped_height(unit) / shipped_height('militia') / 10) * 10)


# 17/11/2026: units without a hand-written ATTACK12 entry take their wind-up and strike from the approved front-view
# pose sheet's text (g3e/units/make_prompts.py ATTACK/STRIKE), turned from "to the right" to the facing direction.
DIAGONAL_BODY = (' Body check for this unit: its body is LONG, so turn the WHOLE body diagonally with the camera of image 3:'
                 ' facing DOWN-RIGHT the head and chest are at the lower right and the rear at the upper left, seen from'
                 ' above-front; facing UP-LEFT the head is at the upper left and the rear at the lower right, seen from'
                 ' above-behind. Never a pure side profile, never head-on.')
ROWS_NOTES = {u: DIAGONAL_BODY for u in ('wolf', 'stag', 'spider', 'iron_drake', 'rider', 'horse_archer')}
# r1 17/11/2026: r0 SE hid the face in a dark visor with glowing eyes
ROWS_NOTES['construct'] = ' Character check for this unit: the face is LIGHT carved stone like the rest of the body, with two small violet eyes and a gold circlet with a violet gem on the forehead, exactly as in image 4 (NO dark visor, no shadowed face recess); pale stone plates bound with gold bands, the big violet crystal in the chest, the blue sash across the chest and the blue flap with the gold crown.'
# r1 17/11/2026: r0 SE wore a big leafy mantle and an angry face
ROWS_NOTES['bear'] = ' Character check for this unit: only a FEW small moss patches on the head and shoulders and ONE small white flower on one shoulder (NO leafy mantle or leaf collar), a round friendly face (calm, not angry, except the roar of the wind-up), a big tan-orange belly, the BLUE harness crossing the chest with gold square buckles and a blue belt with small pouches, exactly as in image 4.'
# r1 17/11/2026: r0 lost the chibi head (SE) and turned the bandana into a headband (NW)
ROWS_NOTES['pirate'] = ' Character check for this unit: CHIBI proportions exactly as in image 4 (a big head, about 40% of the height, like the militia in image 3); the BLUE bandana covers the WHOLE top of the head like a cap, knotted at the back with two short tails (hair shows only at the sides and the fringe, never on top of the head); a cream-and-brown striped shirt, a blue sash, brown trousers, boots, a short curved cutlass with a gold guard.'
# r1 17/11/2026: r0 SE drew a second bayonet next to the upright rifle in the recovery frame
ROWS_NOTES['tin_soldier'] = ' Weapon check for this unit: exactly ONE bayonet rifle in every cell, held in both hands during the attack and upright at the side at rest; never two weapons in one cell.'
# r1 17/11/2026: r0 SE drew a scary, narrow-skulled skeleton with an angry brow and a cape
ROWS_NOTES['skeleton'] = ' Character check for this unit: CUTE, not scary, exactly as in image 4: a BIG ROUND smooth skull (about 45% of the height) with one small crack, two ROUND glowing violet eye sockets with NO angry brow, a short torn blue scarf and a torn blue cloth skirt (NO flowing cape), a round wooden shield and a short rusty sword.'
# r1 17/11/2026: r0 SE drew a darker brown horse without the blue blanket and a thin, non-chibi rider
ROWS_NOTES['horse_archer'] = DIAGONAL_BODY + ' Character check for this unit: the horse is LIGHT GOLDEN-TAN with a dark brown mane and tail and a BLUE saddle blanket with gold trim, exactly as in image 4; the rider is CHIBI (a big head under a big round red fur hat with cream fur trim and a red pompom), a red coat with cream fur cuffs, a blue sash across the chest, a short recurve bow and a quiver of arrows on the back.'
ROWS_NOTES['wraith'] = ' Body check for this unit: it FLOATS with a wispy tail and no feet; the walk row is a gentle forward glide with a small bob, the tail swaying. Character check (r1/r2 17/11/2026: r0 SE was pale lavender with a pointed hood): the cloak is the LIGHT pastel dusty pink of image 4, exactly as light as image 4 (r2: r1 came out dark maroon; not pale lavender, not dark red), its shadows a soft mauve, a ROUNDED hood with a stitched seam on top (no pointed tip), a dark hood opening with two glowing PINK-VIOLET eyes, blue trim and a blue clasp with a ribbon.'

# 20/11/2026: the raiders, the boss summons and the three bosses (character notes from their approved g3e pose sheets)
FLOAT_BODY = (' Body check for this unit: it FLIES, hovering a little above the ground with its legs dangling (no feet'
              ' standing on the ground); the walk row is a forward flight along the facing direction with a small bob'
              ' up and down and the wings in different beat positions; the lowest point (stinger tip) stays on about'
              ' the same baseline in every cell.')
ROWS_NOTES['bandit'] = ' Character check for this unit: CHIBI proportions exactly as in image 4 (a big head, about 40% of the height); messy spiky brown hair, a BLUE headband knotted at the side with two tails, a brown cloth mask over the nose and mouth, a cream shirt with torn short sleeves under a brown vest with an orange star patch, a blue sash, patched brown trousers, brown boots, ONE short curved knife in one hand with a gold wrist ring.'
ROWS_NOTES['bandit_archer'] = ' Character check for this unit: CHIBI proportions exactly as in image 4 (a big head); a patched BROWN hood over the head, a BLUE scarf around the neck, a ragged tan tunic with a brown strap across the chest, a blue armband, brown boots, a wooden bow in one hand and a quiver of arrows on the back. During the attack the bow is drawn along the facing direction (no flying arrow: the game draws it).'
ROWS_NOTES['boar_rider'] = DIAGONAL_BODY + ' Character check for this unit: a big shaggy DARK BROWN wild boar with cream tusks and a pink snout, ridden by a CHIBI bandit (a big head) with spiky brown hair, a RED headband, a fur vest with a blue strap, holding a wooden club studded with iron spikes, exactly as in image 4.'
ROWS_NOTES['ogre'] = ' Character check for this unit: a huge, chunky, friendly-goofy OLIVE-GREEN ogre exactly as in image 4: a pot belly, darker green spots, a small tuft of brown hair, two small lower tusks, a big round nose, a ragged tan loincloth with blue dots and a BLUE sash, a wooden club with iron studs. Keep the raised club of the wind-up INSIDE its own cell.'
ROWS_NOTES['frog'] = ' Character check for this unit: a small ROUND chibi frog exactly as in image 4: bright yellow-green skin with darker green spots, a cream belly, big round eyes, pink blush cheeks, a BLUE lily-pad cap on the head and a blue scarf knotted at the neck. It moves in small hops (the walk row is a squash-and-hop loop); the tongue of the strike is short and stays inside the cell.'
ROWS_NOTES['hornet'] = FLOAT_BODY + ' Character check for this unit: a small CUTE round hornet exactly as in image 4: a big round yellow-and-brown head with big eyes and two curled antennae, a fluffy cream collar, a yellow-and-brown striped abdomen with ONE blue stripe, pale see-through wings and a small stinger.'
ROWS_NOTES['boss_bog_ogre'] = ' Character check for this unit: a GIANT swamp ogre exactly as in image 4: olive skin covered in brown MUD drips, long matted swamp-grass hair, a SMALL FROG sitting on top of the head, small tusks, a ragged loincloth with a BLUE sash, a thick LOG club dripping mud. Keep the raised log of the wind-up INSIDE its own cell; any mud splash stays small and next to the club.'
ROWS_NOTES['boss_hornet_queen'] = FLOAT_BODY + ' Character check for this unit: a GIANT hornet QUEEN exactly as in image 4: a cute chibi face, a small GOLD CROWN between two curled antennae, a fluffy cream collar, a blue sash across the chest, a big yellow-and-brown striped abdomen with a stinger, large pale golden wings, and a long golden STINGER SPEAR. Keep the spear and the wings INSIDE its own cell.'
ROWS_NOTES['boss_crownless_king'] = ' Character check for this unit: a big, stocky dark king in DARK BROWN plate armour with GOLD trim exactly as in image 4: a round bucket helmet (NO crown) with two glowing ORANGE eyes in the visor slit, a blue diamond gem on the chest and on the sword guard, a blue belt and a blue tabard with a gold border, a torn DARK WINE-PLUM cape (clearly darker and redder than the magenta background, never pink-magenta), and ONE big straight greatsword. Keep the raised sword of the wind-up INSIDE its own cell.'
# 20/11/2026: the neutral Barracks footman (front-view pose sheet drawn the same day)
ROWS_NOTES['footman'] = ' Character check for this unit: CHIBI proportions exactly as in image 4 (a big head, about 40% of the height, like the militia in image 3); a round grey steel kettle helmet with a raised ridge and a small brim, brown hair showing under it, a BLUE scarf-cape over the shoulders hanging down the front as a blue tabard flap (and down the back as a short blue cape), a cream tunic, a brown belt with a brass buckle, brown bracers and boots, ONE short straight steel sword with a gold guard in the same hand in every cell and ONE round wooden shield with an iron rim and boss on the other arm.'


def _facing_text(t):
    for a, b in (('forward to the right', 'forward along the facing direction'), ('aiming to the right', 'aiming along the facing direction'),
                 ('in front of it to the right', 'in front of it along the facing direction'), ('in front to the right', 'in front along the facing direction'),
                 ('to the right', 'along the facing direction'), ('pointing right', 'pointing along the facing direction')):
        t = t.replace(a, b)
    return t


# r1 corrections that concern ONE direction only (20/11/2026), appended to that direction's note
ROWS_NOTES_DIR = {
    # r0 SE moved the knife to the other hand in attack frames 1-2
    ('bandit', 'se'): ' Weapon check: the knife stays in the SAME hand (the hand on the right of the screen) in every cell of all three rows, including the anticipation and wind-up; never switch hands.',
    # r0 SE drew the club twice in the recovery frame
    ('ogre', 'se'): ' Weapon check: exactly ONE club in every cell; in the recovery frame the club is lifted back up in one hand, never a second club across the body.',
    # r0 NW showed only the right wings and an all-gold spear
    ('boss_hornet_queen', 'nw'): ' Back-view check: BOTH pairs of wings are visible in every cell, spread to the LEFT and to the RIGHT of the back like in image 4 (never only one side); the spear has a BROWN wooden shaft with a gold spear head and gold bands, exactly as in image 4.',
}


def rows_actions(unit, d=None):
    if unit in ATTACK12:
        return {'idle': '', 'note': '', **ATTACK12[unit]}
    return {'idle': '', 'note': ROWS_NOTES.get(unit, '') + ROWS_NOTES_DIR.get((unit, d), ''),
            'a1': 'the first small move into the wind-up below (weight shifting back).',
            'a2': _facing_text(up.ATTACK[unit]),
            'a3': _facing_text(up.STRIKE[unit]),
            'a4': 'coming back out of the strike, returning toward the idle stance.'}


def build_rows_prompt(unit, d):
    if not (ROOT / up.STYLE_DOC).exists() or not (ROOT / up.REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    name, role, *_ = up.UNITS[unit]
    facing, how = FACING[d]
    out = f'docs/art-review/units-iso/{unit}/rows-{d}-source.png'
    sample = f'docs/art-review/units-iso/{unit}/poses-{d}-source.png'
    if (ROOT / sample).exists():
        images = [up.REFERENCE, ISO_REF, sample]
        body = BODY_ROWS.format(name=name, role=role, iso=ISO_REF, sample=sample, facing=facing, how=how,
                                **ATTACK12[unit])
    else:
        militia, sheet = MILITIA_ROWS.format(d=d), f'docs/art-review/g3e/units/{unit}/poses-source.png'
        for ref in (militia, sheet):
            if not (ROOT / ref).exists():
                raise SystemExit(f'{ref} (approved reference) is missing: refusing to generate images')
        images = [up.REFERENCE, ISO_REF, militia, sheet]
        body = BODY_ROWS_NEW.format(name=name, role=role, iso=ISO_REF, militia=militia, sheet=sheet, facing=facing,
                                    how=how, fig=rows_figure_px(unit), **rows_actions(unit, d))
    return up.HEADER.format(out=out, doc=up.STYLE_DOC, ref=up.REFERENCE) + body, images, out


def main_rows(units):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for unit in units:
        for d in FACING:
            text, images, out = build_rows_prompt(unit, d)
            prompt = P / unit / f'prompt-rows-{d}.md'
            prompt.parent.mkdir(parents=True, exist_ok=True)
            prompt.write_text(text, encoding='utf-8', newline='\n')
            rel = prompt.relative_to(ROOT).as_posix()
            attach = ' '.join(f'-i {i}' for i in images)
            runner.append(f'codex exec --json --sandbox workspace-write -C "$PWD" {attach} - < {rel} > .superpowers/codex-rows-{unit}-{d}.out 2>&1')
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
