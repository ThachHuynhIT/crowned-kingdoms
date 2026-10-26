"""Write one Codex prompt per building of a group and a runner script (sequential, one image per run).

    python docs/art-review/g3e/buildings/make_prompts.py wheat [building_id ...]

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


def build_prompt(out, name, desc, theme, template=None):
    template = template or style_template()
    body = template.replace('[building and function]', f'{name}').replace(
        '[Materials and identifying tools.]', f'{desc} Theme: {theme}')
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + body + FOOTER


def main(group, only=None):
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
    path = ROOT / f'.superpowers/b-{group}.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:] or None)
