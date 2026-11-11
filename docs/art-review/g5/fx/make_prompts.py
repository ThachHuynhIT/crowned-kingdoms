"""One Codex prompt per battle FX sprite (G5, 2026-11-09; plan missing-art-assets Task 7).

    python docs/art-review/g5/fx/make_prompts.py [fx_id ...]

Every prompt tells Codex to read docs/ART_STYLE.md ("Quy tắc vẽ", "Góc nhìn") and attaches the approved style
reference plus the approved boulder icon (the closest approved image of the same kind). FX keep their native sizes
(2026-11-09, second try) are drawn at the image-art density: 2 art px per world px, like units and buildings, so a 32x32
picture shows exactly as big as the 16x16 code boulder (the 16 px try lost its outline). Arrows stay hand-drawn: eight
directions of a sprite that never rotates.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g5/fx'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
SAME_KIND = 'docs/art-review/g3e/icons/icon_boulder/source.png'

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`{ref}`): lấy PHONG CÁCH (pixel art ấm áp, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm); KHÔNG sao chép hình ngôi nhà. Ảnh thứ hai (`{same}`) là icon đá tảng đã duyệt: lấy cỡ cụm pixel và độ đậm của khối.

"""

BODY = """Create one pixel-art BATTLE EFFECT sprite for Crowned Kingdoms: {name} — {meaning}
Format: a SQUARE image (1:1, target 1024x1024 px), to be reduced to {size}x{size} art pixels, so each art pixel is {px}x{px} source pixels. ONE bold simple shape centered, filling about 85% of the frame, readable at {size}x{size}: strong silhouette, a clear 1-art-pixel outline all round, big flat clusters, 3 to 4 tones, no tiny details.
Subject: {visual}
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting (top-left lighter, bottom-right darker), a 1-art-pixel outline in a darker tone of the subject's own colour (never pure black), saturated warm palette.
View: seen as a small sprite floating over the battlefield, no ground, no cast shadow, no scene.
Background: ONE flat solid magenta #FF00FF filling the whole canvas, no gradient, no glow, no shadow, so it can be cut out; the subject itself must not contain magenta.
No text, letters, numbers, UI frame, watermark, blur, antialiasing, soft glow or smooth gradients. Only this one subject.
"""

FX = {
    'boulder': ('Đá tảng rơi', 'the royal boulder falling onto the battlefield.', 32,
                'one big round grey boulder, slightly lumpy, two or three short cracks, a bright highlight on the top-left and a darker shaded bottom-right; warm grey stone, no crown mark, no speed lines.'),
    'pulse': ('Xung lực công trình', 'the burst a pulsing building sends out.', 32,
              'a bold eight-pointed golden starburst with a white-hot core, four long rays and four short diagonal rays; gold and white.'),
    'shield': ('Khiên bảo hộ', 'a magic ward bubble around a protected soldier.', 32,
               'a round water-blue protective bubble ring, thick bright rim, the inside left mostly empty and pale, one small white shine on the top-left; water blue and white.'),
    'stun': ('Choáng', 'stars circling the head of a stunned unit.', 16,
             'three small five-pointed golden stars with white centres arranged in a small arc; gold and white.'),
    'spark': ('Tia lửa trúng đòn', 'the tiny spark where a hit lands.', 8,
              'one tiny four-pointed white-gold spark, a white core and gold tips; gold and white.'),
}


def build_prompt(out, fx):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists() or not (ROOT / SAME_KIND).exists():
        raise SystemExit('docs/ART_STYLE.md or an approved reference image is missing: refusing to generate images')
    name, meaning, size, visual = FX[fx]
    head = HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE, same=SAME_KIND)
    return head + BODY.format(name=name, meaning=meaning, size=size, px=1024 // size, visual=visual)


def main(only=None):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for fx in FX:
        if only and fx not in only:
            continue
        d = P / fx
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_prompt(out, fx), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} -i {SAME_KIND} - < {prompt} > .superpowers/codex-fx-{fx}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{fx} ok" >> .superpowers/fx.log; else echo "{fx} MISSING" >> .superpowers/fx.log; fi')
    runner.append('echo done >> .superpowers/fx.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    path = ROOT / '.superpowers/fx.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
