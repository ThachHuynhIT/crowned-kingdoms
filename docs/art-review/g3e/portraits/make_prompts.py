"""One Codex prompt per king portrait (sequential, one image per run).

    python docs/art-review/g3e/portraits/make_prompts.py wheat [king ...]

Every prompt starts by telling Codex to read docs/ART_STYLE.md and attaches the approved style reference (see the
mandatory block in that document). Portrait specifics (square bust, flat themed background, 64x64 art px) are below.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g3e/portraits'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm (`{ref}`): lấy PHONG CÁCH (pixel art ấm áp, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ); KHÔNG sao chép hình ngôi nhà.

"""

BODY = """Create one pixel-art character PORTRAIT for Crowned Kingdoms: {name} — {desc}
Composition: head-and-shoulders bust, FRONT-FACING (face toward the viewer, very slight three-quarter allowed), centered, the head occupies about 55% of the image height, shoulders cropped by the bottom edge. Warm cozy medieval fantasy pixel art, crisp square pixel clusters about 16x16 source pixels each, upper-left lighting, dark material-colored outlines (never pure black), saturated warm palette, readable at 64x64 pixels: strong silhouette, large simple shapes, a clear crown or headgear that identifies the kingdom, no tiny details.
Background: one FLAT solid color panel ({bg}), no gradient, no pattern, no frame, no vignette.
Image 1024x1024. No text, labels, UI, watermark, blur or antialiasing. No other characters.
Kingdom theme: {theme}
"""

KINGS = {
    'wheat': ('Vua Lúa Mì (Wheat King)', 'a kindly, sun-tanned farmer-king with a crown woven from golden wheat ears, straw-yellow and ochre robe with a patched green collar, warm smile, small mustache.', 'warm light-green meadow tone #9bb85a', 'harvest farmland, golden wheat, wood and clay.'),
    'stone': ('Vua Đá Núi (Stone King)', 'a stern broad bearded mountain king in grey-blue stone plate, a heavy crown of cut rune-carved stone with a small crystal, deep-set eyes.', 'cool slate blue-grey tone #6c7a8a', 'mountains, quarry, runes, crystal.'),
    'arcane': ('Vua Phép Thuật (Arcane King)', 'an elegant scholar mage-king with a tall purple hood-crown, long silver hair, glowing violet crystal brooch, floating tiny runes around the shoulders, wise calm face.', 'deep violet tone #5a3f86', 'books, runes, purple crystals.'),
    'grove': ('Vua Rừng Xanh (Grove King)', 'an antlered druid-king with a crown of leaves, flowers and small antlers, moss-green cloak with root-like shoulder pads, gentle wise face with a leafy beard.', 'forest green tone #3f7a47', 'ancient forest, roots, flowers.'),
    'tide': ('Vua Thủy Triều (Tide King)', 'a weathered sea-captain king with a tricorn hat decorated with shells and a gold anchor crown, rope-trimmed teal coat, salt-and-pepper beard, confident grin.', 'sea teal tone #3f8f9a', 'ships, rope, shells, sea.'),
    'forge': ('Vua Lò Rèn (Forge King)', 'a soot-smudged muscular blacksmith king with a steel crown set with glowing embers, leather apron over plate pauldrons, thick red beard, determined face.', 'dark ember red-brown tone #8a4a32', 'anvil, steel, coals.'),
    'clock': ('Vua Đồng Hồ (Clockwork King)', 'an eccentric inventor-king with brass goggles pushed up on a crown made of gears, copper-brown coat with a watch chain, a mechanical monocle, curious smile.', 'brass amber tone #b88a3c', 'gears, copper, springs.'),
    'moon': ('Vua Ánh Trăng (Moon King)', 'a pale mysterious king in a deep indigo hooded cloak with a silver crescent-moon crown, long dark hair, calm half-lidded eyes, stars embroidered on the collar. Mystic but still in the same warm cozy world.', 'night indigo tone #3f4a8a', 'moon, ancient stone, shadows.'),
    'nomad': ('Vua Du Mục (Nomad Khan)', 'a steppe khan with a fur-trimmed pointed hat topped with a feather and gold band, braided black beard, red and sand-gold patterned coat, sharp friendly eyes.', 'desert sand-gold tone #c99a5a', 'tents, woven carpets, steppe banners.'),
}


def build_prompt(out, king):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    name, desc, bg, theme = KINGS[king]
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + BODY.format(name=name, desc=desc, bg=bg, theme=theme)


def main(only=None):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for king in KINGS:
        if only and king not in only:
            continue
        d = P / king
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_prompt(out, king), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE} - < {prompt} > .superpowers/codex-p-{king}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{king} ok" >> .superpowers/p.log; else echo "{king} MISSING" >> .superpowers/p.log; fi')
    runner.append('echo done >> .superpowers/p.log')
    path = ROOT / '.superpowers/p.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
