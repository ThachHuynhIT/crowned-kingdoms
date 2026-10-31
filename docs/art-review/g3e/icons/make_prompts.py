"""One Codex prompt per UI icon (sequential, one image per run).

    python docs/art-review/g3e/icons/make_prompts.py [icon_id ...]

Every prompt starts by telling Codex to read docs/ART_STYLE.md and attaches the approved style reference (see the
mandatory block in that document). Icon specifics (square, one bold object, 32x32 art px, flat magenta key background
that is cut out later, no text) are below. Native size 32x32 was chosen by the project owner on 2026-11-01.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g3e/icons'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`{ref}`): lấy PHONG CÁCH (pixel art ấm áp, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

"""

BODY = """Create one pixel-art UI ICON for Crowned Kingdoms: {name} — {meaning}
Format: a SQUARE image (aspect ratio 1:1, target 1024x1024 px, to be reduced to 32x32 art pixels, so each art pixel is 32x32 source pixels). ONE bold, simple object centered, filling about 80% of the frame, readable as a thumbnail at 16x16 px: strong silhouette, big simple shapes, 3 to 4 tones per material, no tiny details.
Object: {visual}
Style: warm cozy medieval fantasy pixel art for a Stardew-like wooden-and-cream UI, crisp square pixel clusters, upper-left lighting (top-left edges lighter, bottom-right edges darker), a 1-art-pixel dark brown outline around the whole object (never pure black), saturated warm palette, slight material texture.
View: flat front view of the object as an icon, NOT the 45-degree world view and NOT isometric; no ground, no cast shadow, no scene.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, no texture, no glow and no shadow, so it can be cut out; the object itself must not contain magenta.
No text, letters, numbers, labels, UI frame, card frame, watermark, blur, antialiasing or smooth gradients. Only this one object.
"""

ICONS = {
    'icon_troop': ('Lính (loại thẻ)', 'the card kind "troop": a barracks that spawns soldiers.', 'a small steel helmet with a red plume in front of two crossed swords, the helmet is the main shape, swords peek out behind it; steel greys with a red accent.'),
    'icon_tower': ('Tháp (loại thẻ)', 'the card kind "tower": a defensive tower that shoots.', 'a round stone tower with a crenellated top, a small arched door and an arrow slit, a tiny pennant on top; warm grey stone with a wood-brown door.'),
    'icon_tome': ('Bùa/Sách phép (loại thẻ)', 'the card kind "tome": a spell or enchantment.', 'a closed leather spellbook seen slightly from above with a brass clasp and a small glowing gold star on the cover, a few sparkles above it; deep purple leather with gold.'),
    'icon_economy': ('Kinh tế (loại thẻ)', 'the card kind "economy": buildings that earn gold.', 'a plump leather coin pouch tied with a cord, a few gold coins spilling out in front of it, one coin shown edge-on; warm brown leather with bright gold coins.'),
    'icon_support': ('Hỗ trợ (loại thẻ)', 'the card kind "support": buildings that buff neighbours.', 'a round wooden-and-steel shield with a green leaf-shaped cross emblem, a small glowing green plus sign above it; wood brown, steel grey, leaf green.'),
    'icon_enchantment': ('Bùa phép (loại thẻ)', 'the card kind "enchantment": a rune charm attached to a building.', 'a round carved stone medallion with a glowing violet rune symbol in the centre, a thin gold ring around it, three small violet sparkles; grey stone, violet rune, gold rim.'),
    'icon_throne': ('Ngai (loại thẻ)', 'the card kind "throne": the throne of the king.', 'a tall high-backed wooden throne with a red cushion and gold trim, a small gold crown on top of the backrest; dark wood, red velvet, gold.'),
}


def build_prompt(out, icon):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    name, meaning, visual = ICONS[icon]
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + BODY.format(name=name, meaning=meaning, visual=visual)


def main(only=None):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for icon in ICONS:
        if only and icon not in only:
            continue
        d = P / icon
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_prompt(out, icon), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} - < {prompt} > .superpowers/codex-i-{icon}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{icon} ok" >> .superpowers/i.log; else echo "{icon} MISSING" >> .superpowers/i.log; fi')
    runner.append('echo done >> .superpowers/i.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)  # git-ignored scratch; absent in a fresh worktree
    path = ROOT / '.superpowers/i.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
