"""One Codex prompt per king-select card background (G5, 2026-11-09; plan missing-art-assets Task 7 step 4).

    python docs/art-review/g5/king-cards/make_prompts.py [king ...]

Every prompt tells Codex to read docs/ART_STYLE.md and attaches the approved style reference, the approved card art
and that king's approved portrait. The picture is only the card's background: the game still draws the "K", the suit,
the portrait window and the portrait over it (src/render/kingCardArt.ts), so the middle and the two glyph corners stay
plain paper. Native size 66x96 (KING_CARD_NATIVE), cut by make_assets.py.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
P = ROOT / 'docs/art-review/g5/king-cards'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
CARD_REF = 'docs/art-review/style-references/card-art-approved.png'

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Quy tắc vẽ", mục "Góc nhìn" (khung BẮT BUỘC) và mục "Giao diện (UI)". Ảnh tham chiếu đã duyệt đính kèm: `{ref}` (phong cách: pixel art ấm, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái), `{card}` (tranh thẻ đã duyệt: độ hoàn thiện) và `{portrait}` (chân dung đã duyệt của vua này: lấy bảng màu và chủ đề). KHÔNG chép hình của chúng.

"""

BODY = """Create one pixel-art PLAYING-CARD FACE BACKGROUND for the king-select screen of Crowned Kingdoms: the {name}.
Format: PORTRAIT image, aspect ratio 2:3 (1024x1536 px). It will be reduced to 66x96 art pixels (about 16 source px per art pixel), so use big crisp square pixel clusters and simple shapes; no detail smaller than one cluster.
Layout (in art pixels of the final 66x96 card):
- An ornamental BORDER band about 7 art px wide on the left, right and top and about 14 art px at the bottom, running all round the card: {ornament}
- The MIDDLE (art px x 9..57, y 8..80) is plain flat paper in {paper}, no pattern: the portrait is drawn there.
- The TOP-LEFT corner (x 1..9, y 1..18) and the BOTTOM-RIGHT corner (x 57..65, y 78..95) are plain flat paper too: the game draws a letter "K" and a card suit there. Make these two plain patches TALL: about one fifth of the card height and one seventh of its width each.
- A 1-art-pixel dark outline round the whole card in {outline}; slightly rounded corners.
Style: warm cozy medieval fantasy pixel art, upper-left lighting, colours from the attached portrait of this king. Flat colour clusters, sparse dithering, no smooth gradients.
Background outside the card: ONE flat solid magenta #FF00FF; the card itself must not contain magenta.
No text, letters, numbers, card suits, faces, people, watermark, blur or antialiasing. Only the empty card face.
"""

KINGS = {
    'wheat': ('Wheat King (golden harvest)', 'braided golden wheat ears and small sickles, with a thin red-ribbon line inside; golden yellow and warm brown',
              'warm cream wheat-paper', 'dark brown'),
    'stone': ('Stone King (mountain hold)', 'carved grey stone blocks with a few glowing blue runes and small hammer marks; slate grey and cool blue',
              'pale slate-grey parchment', 'dark slate'),
    'arcane': ('Arcane King (mage tower)', 'violet crystals and tiny gold stars joined by thin gold filigree; deep violet, purple and gold',
               'pale lavender parchment', 'deep violet'),
    'grove': ('Grove King (forest)', 'oak leaves, acorns and a curling green vine; leaf green and bark brown',
              'pale spring-green parchment', 'dark forest green'),
    'tide': ('Tide King (sea)', 'curling teal waves with white foam, small shells and a thin rope line; sea teal, white and brass',
             'pale sea-foam parchment', 'dark teal'),
    'forge': ('Forge King (smithy)', 'dark iron plates with rivets, a short chain and small orange embers; dark iron and ember orange',
              'pale peach parchment', 'near-black brown'),
    'clock': ('Clock King (clockwork)', 'interlocking brass cogs and small gears with a thin copper line; brass, copper and steel blue',
              'pale brass-cream parchment', 'dark bronze'),
    'moon': ('Moon King (night, cute not spooky)', 'small silver crescent moons and stars on a soft violet night band with tiny ivy; violet, silver and soft blue',
             'pale periwinkle parchment', 'deep night blue'),
    'nomad': ('Nomad King (steppe riders)', 'a woven steppe-rug pattern with small horseshoes and red pennants; ochre, warm brown and red',
              'pale sand parchment', 'dark brown'),
}


def build_prompt(out, king):
    portrait = f'public/assets/art/ai-v1/portraits/{king}.png'
    for f in (STYLE_DOC, REFERENCE, CARD_REF, portrait):
        if not (ROOT / f).exists():
            raise SystemExit(f'{f} is missing: refusing to generate images')
    name, ornament, paper, outline = KINGS[king]
    head = HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE, card=CARD_REF, portrait=portrait)
    return head + BODY.format(name=name, ornament=ornament, paper=paper, outline=outline)


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
        refs = f'-i {REFERENCE} -i {CARD_REF} -i public/assets/art/ai-v1/portraits/{king}.png'
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" {refs} - < {prompt} > .superpowers/codex-kc-{king}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{king} ok" >> .superpowers/kc.log; else echo "{king} MISSING" >> .superpowers/kc.log; fi')
    runner.append('echo done >> .superpowers/kc.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    path = ROOT / '.superpowers/kc.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
