"""One Codex prompt per main-menu parallax layer (G5, 2026-11-09; plan missing-art-assets Task 7).

    python docs/art-review/g5/menu/make_prompts.py [layer ...]

Every prompt tells Codex to read docs/ART_STYLE.md ("Giao diện (UI)" → "Menu chính", "Quy tắc vẽ", "Góc nhìn") and
attaches the approved style reference. The dithered dusk sky stays painted in code (UI_PALETTE.sky); the three hill
layers that drift over it become pictures. Each layer is a horizontal strip that repeats left-to-right, cut by
make_assets.py to its native size: 256 art px wide, as tall as the code layer it replaces (HILL_LAYERS in
src/render/uiArt.ts: 120, 90, 60), transparent above the ridge.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g5/menu'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Giao diện (UI)" (đoạn "Menu chính"), mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`{ref}`): lấy PHONG CÁCH (pixel art ấm áp, cỡ cụm pixel, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái); KHÔNG sao chép hình ngôi nhà.

"""

BODY = """Create one pixel-art PARALLAX BACKGROUND LAYER for the Crowned Kingdoms main menu: {name}.
The menu sky behind it is a warm dusk gradient (top to bottom: #F6B26B apricot, #F08A5D orange, #B85C7A rose, #6B4A8A violet), painted separately. This layer sits in front of that sky; {depth}
Format: a WIDE landscape image (aspect ratio 3:2, 1536x1024 px). The layer is ONE horizontal band of land along the BOTTOM of the image, its ridge line about {ridge} of the image height from the bottom; everything above the ridge is background. The band will be reduced to 256 art pixels wide, so each art pixel is 6x6 source pixels: crisp square pixel clusters, big simple shapes.
It must REPEAT SEAMLESSLY left to right: the ridge height and the colours at the left edge continue exactly into the right edge (the same height and the same row of shapes at x = 0 and x = width), no vignette, no border.
Content: {visual}
Light: dusk light from the upper-left; tops and left slopes catch a warm rim of light, lower parts fall into shade; flat colour bands with sparse dithering, no smooth gradients.
Background above the ridge: ONE flat solid magenta #FF00FF, no gradient, no glow, no shadow, so it can be cut out; the land itself must not contain magenta.
No text, letters, UI, frame, watermark, people, animals, blur, antialiasing or soft glow.
"""

LAYERS = {
    'hills_far': ('far layer', 'it is the farthest land, so it is pale and hazy, closest to the sky colours.', 'two thirds',
                  'a long chain of soft rolling mountains in hazy violet and dusty rose, a few gentle peaks, one tiny far-away castle with two little towers and a pennant standing on one peak near the middle; very little detail, colours only a step darker than the violet sky.'),
    'hills_mid': ('middle layer', 'it is the middle distance: rolling green-brown hills in warm dusk light, darker than the far layer.', 'half',
                  'rolling hills with patches of meadow and a few rows of rounded and pointed pine trees standing on the ridge, a small windmill and a cottage roof in one place; muted green, olive and warm brown with a purple shade.'),
    'hills_near': ('near layer', 'it is the closest foreground, the darkest layer, almost a silhouette.', 'one third',
                   'a dark foreground strip of bushes, pointed pine trees of different heights and a short wooden fence, with a warm orange rim of dusk light along the top edges; very dark brown-green and plum, nearly a silhouette.'),
}


def build_prompt(out, layer):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    name, depth, ridge, visual = LAYERS[layer]
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + BODY.format(name=name, depth=depth, ridge=ridge, visual=visual)


def main(only=None):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for layer in LAYERS:
        if only and layer not in only:
            continue
        d = P / layer
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_prompt(out, layer), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} - < {prompt} > .superpowers/codex-menu-{layer}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{layer} ok" >> .superpowers/menu.log; else echo "{layer} MISSING" >> .superpowers/menu.log; fi')
    runner.append('echo done >> .superpowers/menu.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    path = ROOT / '.superpowers/menu.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
