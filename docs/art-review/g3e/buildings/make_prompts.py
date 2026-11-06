"""Write one Codex prompt per building of a group and a runner script (sequential, one image per run).

    python docs/art-review/g3e/buildings/make_prompts.py wheat [building_id ...]
    python docs/art-review/g3e/buildings/make_prompts.py iso-sample     # the two isometric samples (2026-11-06 gate)

The style rules are NOT written here: the prompt is built from the "Prompt mẫu dùng lại" block of docs/ART_STYLE.md
(single source of truth) and the approved reference image is always attached. Generation refuses to run when either is
missing (see tools/test_art_prompts.py). Prompts land in <group>/<id>/prompt.md (provenance); the AI source goes next to
it as source.png. Groups are one king each (plan: playable kings first)."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
B = ROOT / 'docs/art-review/g3e/buildings'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Góc nhìn" (khung BẮT BUỘC, quy ước công trình, mẫu đã duyệt, kiểm trước khi duyệt) và mục "Quy tắc vẽ". Ảnh tham chiếu đã duyệt được đính kèm (`{ref}`): lấy GÓC NHÌN, cách đổ khối mái/mặt tiền, mức chi tiết và phong cách từ đó; KHÔNG sao chép nguyên hình dạng của nó cho công trình khác.

"""

FOOTER = """
YÊU CẦU SẢN XUẤT (ghi đè phần "transparent background" ở trên): ảnh 1024×1024, nền ĐEN PHẲNG #000000 hoàn toàn (không quầng sáng, không bóng đổ lên nền, không nền đất/cỏ dưới chân, không viền ô; trong công trình không có điểm đen thuần). MỘT công trình duy nhất đứng giữa ảnh theo chiều ngang, rộng khoảng 440–460 px, chân công trình chạm một đường nằm ngang ở khoảng y = 900, chiều cao tối đa 520 px. "Pixel" lớn khoảng 7×7 điểm ảnh.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
"""

GROUPS = {
    'wheat': dict(theme='farm kingdom: warm bright wood, golden straw, clay tiles, grain sacks, wooden fences, gold and earth tones.', items=[
        ('building_wheat_field', 'Ruộng Lúa (wheat field, economy; LOW building, about 250 px tall)',
         'a tidy plot of ripe golden wheat in neat rows with a low wooden fence and a small gate in front; the fence posts and gate have visible height. This is flat ground, not a house: keep the same high downward viewpoint and front-facing fence, no roof.'),
        ('building_wheat_granary', 'Kho Thóc (granary, support)',
         'a wooden granary raised on posts with a ladder, thatched or tiled broad roof, sacks of grain at the door, hanging wheat bundles.'),
        ('building_wheat_peasant_horde', 'Khởi Nghĩa Nông Dân (peasant uprising camp, troop building)',
         'a rough camp longhouse with a patched cloth-and-straw roof, a torn red banner on the ridge, pitchforks and scythes leaning on a rack, a hay cart beside it.'),
        ('building_wheat_reapers', 'Đội Thợ Gặt (reapers, troop building)',
         'a farmhouse barn with clay-tile roof, a big sickle hung beside the door, wheat sheaves, grain baskets, rakes and sacks (as in the approved reference, but a different building: change the proportions, add a hayloft window).'),
        ('building_wheat_scarecrow', 'Bù Nhìn Gác (scarecrow watch tower, tower, TALL building but at most 520 px)',
         'a short wooden watch platform with a small straw roof and a big straw-hat scarecrow standing on it holding a sling, ladder at the front, sacks on the rail.'),
        # added 2026-11-06 (owner: PR #12 must carry every Wheat king asset); replaces the old two-sided ai-v1 cottage
        ('building_wheat_militia', 'Dân Quân (village militia house, troop building)',
         'a small cosy village guardhouse with a golden thatched roof, cream plaster walls with dark timber beams, a wooden rack of short spears and two round wooden shields with a plank cross leaning by the door (the militia\'s gear), a small blue pennant on the ridge, a water barrel.'),
        ('building_wheat_throne', 'Ngai Bó Lúa (the Wheat king\'s throne keep, the TALLEST building of the kingdom, up to 520 px tall, it shoots at enemies)',
         'a sturdy round stone-and-timber keep, straight and upright, whose flat crenellated top is clearly seen from above (a visible top platform, as the tower rule requires) with a giant golden wheat-sheaf crown standing on it and a small archer slit; golden wheat banners with a blue trim hang on the front, a wide arched wooden door, stacked grain sacks at the base. Royal but rustic, gold and warm stone.'),
        ('building_wheat_windmill', 'Cối Xay Gió (windmill, economy)',
         'a stone-and-timber windmill whose body is straight and upright, seen with the camera pitched 45 degrees DOWN: the viewer clearly sees the TOP of the windmill, i.e. the upper surface of its large rounded thatched cap/dome (a visible oval-ish roof plane with rows of straw, seen from above), not just its side profile and not a pointed tip seen sideways. Four cloth-sail blades are mounted on the front of the cap, frontal to the viewer (not turned). A door at the front center, a short stone base and flour sacks. Keep the facade straight-on; do not rotate or tilt the body.'),
    ]),
}


def style_template():
    """The fenced `text` block after "Prompt mẫu dùng lại" in docs/ART_STYLE.md."""
    doc = ROOT / STYLE_DOC
    if not doc.exists():
        raise SystemExit(f'{STYLE_DOC} is missing: refusing to generate images without the style document')
    text = doc.read_text(encoding='utf-8')
    m = re.search(r'\*\*Prompt mẫu dùng lại\*\*.*?```text\n(.*?)```', text, re.S)
    if m is None:
        raise SystemExit(f'{STYLE_DOC}: "Prompt mẫu dùng lại" block not found')
    if not (ROOT / REFERENCE).exists():
        raise SystemExit(f'{REFERENCE} is missing: refusing to generate images without the approved reference')
    return m.group(1).replace('\r\n', '\n')


def iso_template():
    """The fenced `text` block after "Prompt isometric dùng lại" in docs/ART_STYLE.md (world sprites, 2026-11-06)."""
    doc = ROOT / STYLE_DOC
    if not doc.exists():
        raise SystemExit(f'{STYLE_DOC} is missing: refusing to generate images without the style document')
    text = doc.read_text(encoding='utf-8')
    m = re.search(r'\*\*Prompt isometric dùng lại\*\*.*?```text\n(.*?)```', text, re.S)
    if m is None:
        raise SystemExit(f'{STYLE_DOC}: "Prompt isometric dùng lại" block not found')
    if not (ROOT / REFERENCE).exists():
        raise SystemExit(f'{REFERENCE} is missing: refusing to generate images without the approved reference')
    return m.group(1).replace('\r\n', '\n')


ISO_DIR = 'docs/art-review/iso-board'

# The sample gate of 2026-11-06: one building and one ground tile, approved before anything else is drawn.
ISO_SAMPLES = [
    # v2 (owner feedback 2026-11-06): main door on the RIGHT wall, house in the middle of its plot.
    # v3 (owner feedback 2026-11-06): the back-right roof corner rose above the front roof; the roof must sit
    # squarely on the walls with every eave parallel to the wall top below it.
    ('sample-building', 'Đội Thợ Gặt (the reapers\' farmhouse barn, a troop building of the Wheat king), seen in 2:1 isometric',
     'The same building as the attached approved reference, redrawn in isometric: a farmhouse barn with a clay-tile '
     'roof seen from above, cream plaster and dark timber walls, a hayloft window. The MAIN DOOR (big double wooden '
     'door with a small stone step) is on the RIGHT wall (the wall facing south-east, on the right of the image); the '
     'left wall has only a window and a big sickle hung on it. Wheat sheaves, grain baskets, rakes and sacks stand '
     'beside the door on the right wall. No wooden deck or platform under the house: the walls stand directly on '
     'the ground. The house stands in the MIDDLE of its square plot; its footprint is one small diamond. '
     'ROOF GEOMETRY (most important): a simple gable roof whose ridge runs along the left-right diagonal axis, '
     'sitting squarely on top of the walls. All four eave corners are at the SAME height: the right-hand eave runs '
     'exactly parallel to the top of the right wall below it and the left-hand eave exactly parallel to the top of '
     'the left wall, both at the true 2:1 slope. The left and right eave corners are on the same screen row. The '
     'back-right part of the roof must NOT rise higher than the front part; no eave line is drawn flat. Gable end '
     'triangle on the right wall above the door, a hayloft window in that gable. '
     'Theme: farm kingdom, warm bright wood, golden straw, clay tiles.'),
    # v2 (owner feedback 2026-11-06): bare empty land, not a farm field; tiny low corner posts.
    ('sample-plot', 'one open (empty) building plot of the Wheat king, a single flat 2:1 isometric ground tile',
     'A diamond of BARE, EMPTY LAND waiting for a building: flat packed brown earth with a few sparse tufts of '
     'short grass, a few small pebbles and faint patches of dry soil. It is NOT a farm field: NO furrows, NO tilled '
     'rows, NO crops. A thin rim of short grass frames the diamond and the two front edges show a few pixels of '
     'earth thickness. At each of the four diamond corners only a TINY, LOW wooden stake (a stub just a few pixels '
     'tall, much smaller than in a fence) marks the corner without hiding the ground. Flat ground only: no building. '
     'Theme: farm kingdom, warm earth and grass.'),
    # added 2026-11-06 (owner: a plot with a building on it is paved with stone)
    ('sample-plot-built', 'one built plot of the Wheat king (the ground under a building), a single flat 2:1 isometric ground tile',
     'The SAME diamond tile as an open plot (same size, same thin rim of short grass, the same four TINY, LOW wooden '
     'corner stakes only a few pixels tall, same few pixels of earth thickness on the two front edges), but the '
     'whole inside is a COURTYARD PAVED WITH STONE: warm grey and sandy flagstones and a few bricks laid along the '
     'two diagonal axes, small gravel in the joints, a little moss. Flat ground only: no building, no props. '
     'Theme: farm kingdom, warm stone, earth and grass.'),
]

ISO_FOOTER = """
YÊU CẦU SẢN XUẤT (ghi đè phần "transparent background" ở trên): ảnh 1024×1024, nền ĐEN PHẲNG #000000 hoàn toàn (không quầng sáng, không bóng đổ lên nền, không nền đất/cỏ ngoài chính vật thể). MỘT vật thể duy nhất ở giữa ảnh. Công trình: hình thoi chân rộng khoảng 440 px, đáy hình thoi chân ở khoảng y = 900, đứng thẳng trên nền đen (không bệ, không sàn gỗ). Ô đất: hình thoi rộng khoảng 900 px, cao khoảng 450 px (đúng 2:1), nằm giữa ảnh. "Pixel" lớn khoảng 7×7 điểm ảnh, cạnh thoi là bậc pixel 2 ngang – 1 dọc.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
"""


def build_iso_prompt(out, name, desc, template=None):
    template = template or iso_template()
    body = template.replace('[subject]', name).replace('[Materials and identifying details.]', desc)
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE).replace(
        'mục "Góc nhìn" (khung BẮT BUỘC, quy ước công trình, mẫu đã duyệt, kiểm trước khi duyệt)',
        'mục "Góc nhìn" (khung BẮT BUỘC, mục con "Isometric (trục đo 2.5D) cho sprite thế giới", khối "Prompt isometric dùng lại", "Kiểm trước khi duyệt (isometric)")',
    ).replace(
        'lấy GÓC NHÌN, cách đổ khối mái/mặt tiền, mức chi tiết và phong cách từ đó',
        'CHỈ lấy phong cách, bảng màu, chất liệu và cỡ cụm pixel từ đó, KHÔNG lấy góc nhìn chính diện của nó (góc nhìn là isometric 2:1)',
    ) + body + ISO_FOOTER


def main_iso_sample(only=None):
    template = iso_template()
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for ident, name, desc in ISO_SAMPLES:
        if only and ident not in only:
            continue
        d = ROOT / ISO_DIR / ident
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_iso_prompt(out, name, desc, template), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} - < {prompt} > .superpowers/codex-iso-{ident}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{ident} ok" >> .superpowers/b-iso-sample.log; else echo "{ident} MISSING" >> .superpowers/b-iso-sample.log; fi')
    runner.append('echo done >> .superpowers/b-iso-sample.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    path = ROOT / '.superpowers/b-iso-sample.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


def build_prompt(out, name, desc, theme, template=None):
    template = template or style_template()
    body = template.replace('[building and function]', f'{name}').replace(
        '[Materials and identifying tools.]', f'{desc} Theme: {theme}')
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + body + FOOTER


def main(group, only=None):
    if group == 'iso-sample':
        main_iso_sample(only)
        return
    cfg = GROUPS[group]
    template = style_template()
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for ident, name, desc in cfg['items']:
        if only and ident not in only:
            continue
        d = B / group / ident
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_prompt(out, name, desc, cfg['theme'], template), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} - < {prompt} > .superpowers/codex-b-{ident}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{ident} ok" >> .superpowers/b-{group}.log; else echo "{ident} MISSING" >> .superpowers/b-{group}.log; fi')
    runner.append(f'echo done >> .superpowers/b-{group}.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)  # git-ignored scratch; absent in a fresh worktree
    path = ROOT / f'.superpowers/b-{group}.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:] or None)
