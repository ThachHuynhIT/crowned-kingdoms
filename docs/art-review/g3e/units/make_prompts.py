"""One Codex prompt per unit pose (sequential, one image per run).

    python docs/art-review/g3e/units/make_prompts.py [unit_id ...]

Every prompt starts by telling Codex to read docs/ART_STYLE.md and attaches the approved style reference (see the
mandatory block in that document). Unit specifics: ONE standing pose first (poses come later), seen from the same
45-degree downward view as the buildings, facing the viewer, ally colours (blue accents; the foe version is made by a
recolour tool, not drawn), flat magenta key background cut out later. Native size decided by the project owner on
2026-11-01: 4 art px per world unit, so a 16x16 unit is 64x64 art px and a 16x24 unit is 64x96.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g3e/units'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`{ref}`): lấy PHONG CÁCH và GÓC NHÌN (pixel art ấm áp, camera nhìn xuống 45°, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

"""

BODY = """Create one pixel-art game UNIT sprite for Crowned Kingdoms: {name} — {role}
Format: a SQUARE image (aspect ratio 1:1, target 1024x1024 px, to be reduced to {native} art pixels, so each art pixel is {block}). ONE small chibi character, standing in an idle pose, centered, whole body visible from the top of the head to the feet with a small margin on every side, the feet near the bottom edge. The head is about 40% of the character height (chibi proportions).
View: the same camera as the approved buildings: looking DOWN at the character at 45 degrees, the character faces the viewer (very slight three-quarter allowed), so a little of the top of the head, hat and shoulders is visible. NOT a side view, NOT a back view, NOT isometric.
Character: {visual}
Team colours: this is the ALLY version, with blue accents (belt, sash or trim). The red enemy version is made later by a recolour tool, so keep the team colour in a few clear separate areas.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting (top-left edges lighter, bottom-right edges darker), a 1-art-pixel dark outline in a darker shade of each material (never pure black), saturated warm palette, readable silhouette at 16x16 world units, large simple shapes, no tiny details.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, no texture, no glow, NO cast shadow and no ground, so it can be cut out; the character itself must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients. Only this one character.
"""

# unit id -> (name, role, visual, native w, native h)
UNITS = {
    'militia': ('Dân Quân (Lúa Mì)', 'a basic village militiaman, the weakest melee unit of the Wheat kingdom.', 'a stout young villager in a cream woollen tunic with a patterned hem, a blue belt, a brown leather cap, sturdy boots, holding a short wooden spear in one hand and a small round wooden shield with a cross of planks in the other; friendly but determined face.', 64, 64),
    'reaper': ('Thợ Gặt (Lúa Mì)', 'a tall melee reaper of the Wheat kingdom who cleaves several enemies.', 'a tall farmer in an ochre woollen tunic and a wide-brimmed straw hat, a blue sash, leather gloves, holding a big curved sickle-scythe resting on the shoulder; calm hard look.', 64, 96),
    'peasant': ('Nông Binh (Lúa Mì)', 'a fast, weak peasant fighter of the Wheat kingdom.', 'a skinny angry peasant in a patched brown tunic and a blue headband, holding a pitchfork up in both hands, a small sack on the belt.', 64, 64),
}


def build_prompt(out, unit):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    name, role, visual, w, h = UNITS[unit]
    # one square canvas for every unit so sizes stay comparable; tall units are drawn narrow inside it
    side = max(w, h)
    block = f'{1024 // side}x{1024 // side} source pixels'
    native = f'{side}x{side}' if w == h else f'{w}x{h} (the character fills the full height of a {side}x{side} square, drawn {w} wide)'
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + BODY.format(
        name=name, role=role, visual=visual, native=native, block=block)


def main(only=None):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for unit in UNITS:
        if only and unit not in only:
            continue
        d = P / unit
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_prompt(out, unit), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} - < {prompt} > .superpowers/codex-u-{unit}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{unit} ok" >> .superpowers/u.log; else echo "{unit} MISSING" >> .superpowers/u.log; fi')
    runner.append('echo done >> .superpowers/u.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)  # git-ignored scratch; absent in a fresh worktree
    path = ROOT / '.superpowers/u.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
