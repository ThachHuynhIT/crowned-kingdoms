"""One Codex prompt per king portrait (sequential, one image per run).

    python docs/art-review/g3e/portraits/make_prompts.py arcane [king ...]

Every prompt starts by telling Codex to read docs/ART_STYLE.md and attaches the approved style reference (see the
mandatory block in that document). Portrait specifics (large vertical half-length figure for a tall king card,
2:3, 96x144 art px, one dominant hue per king, flat or lightly patterned background, no text) are below.
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
Format: a LARGE VERTICAL HALF-LENGTH figure for a tall king card, aspect ratio 2:3 (target 1024x1536 px, to be reduced to 96x144 art pixels, so each art pixel is about 10x10 source pixels). The figure is seen from the head down to the knees or waist, standing or seated with a commanding, regal posture, FRONT-FACING (very slight three-quarter allowed), centered, filling most of the frame; the head is about 22% of the image height.
Body: a hardened veteran king shaped by many battles — broad shoulders, thick arms, visible scars, faded and scuffed armor or clothing, scratches and dents. NOT a gentle farmer.
Signature object (clearly readable, big simple shape): {prop}
Colour: ONE dominant hue for the whole picture ({hue}), with 2-3 tints and shades of it plus one small warm accent; it must be recognisable as a thumbnail at 24x36 px: strong silhouette, large simple shapes, no tiny details.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, dark material-colored outlines (never pure black), saturated warm palette, readable material texture.
Background: a themed fantasy scene behind the king: {bg}. Keep it painted in the same pixel-art style, in the king's single dominant hue family, slightly lower contrast and softer than the figure so the king stays the clear focus; no frame, no border, no vignette.
No text, letters, numbers, labels, UI, card frame, watermark, blur, antialiasing or smooth gradients. No other characters.
Kingdom theme: {theme}
"""

KINGS = {
    'wheat': ('Vua Lúa Mì (Wheat King)', 'a scarred, sun-weathered war-veteran king with a gold circlet crown worked with small wheat-ear motifs in metal, a thick neck and heavy forearms, a short grizzled beard, battered bronze and leather armor pieces over a rich cloth tunic.', 'a battered iron sickle in one hand and a tall staff topped with a cast-gold wheat-sheaf emblem in the other. CLOTHING: made of woven cloth only — a long woolen cloak and tunic in deep ochre, burnt orange and cream with embroidered patterns (diamond and zigzag borders, a repeating wheat-ear embroidery, stitched trim, a patterned sash). NO straw, NO hay and NO wheat stalks forming the clothes or cloak', 'golden ochre', 'golden wheat fields rolling to the horizon under a glowing low sun, a distant windmill and granary silhouette, drifting golden grain motes and fireflies, soft warm clouds; muted olive-gold', 'harvest farmland, golden wheat, wood and clay.'),
    'stone': ('Vua Đá Núi (Stone King)', 'a stern, massive, bearded mountain king in cracked grey-blue stone plate, a heavy crown of cut rune-carved stone with a small crystal, deep-set eyes, rock-hard arms.', 'a huge stone warhammer, or a tower shield carved with glowing runes, armor made of layered stone plates', 'cool slate blue-grey', 'jagged slate mountain peaks, giant rune-carved standing stones with faintly glowing runes, floating rock shards and crystal veins, cold mist; slate blue-grey', 'mountains, quarry, runes, crystal.'),
    'arcane': ('Vua Phép Thuật (Arcane King)', 'a powerful, battle-scarred mage-king, broad-shouldered under a tall violet hood-crown, long silver hair, a scar across one cheek, a glowing violet crystal brooch, worn and scorched robes.', 'a tall magic staff topped with a glowing crystal held in one hand, seated on a throne made of stacked giant books, rune glyphs and small crystals drifting around his body', 'deep violet and purple', 'floating bookshelves and open spellbooks, large glowing rune circles, drifting purple crystals and tiny sparks; deep violet', 'books, runes, purple crystals.'),
    'grove': ('Vua Rừng Xanh (Grove King)', 'a huge antlered druid-king, bark-scarred skin, a crown of leaves and real deer antlers, a moss-green cloak with root-like shoulder pads, a leafy beard.', 'a gnarled root staff wrapped in vines, deer antlers, bark armor', 'forest green', 'giant ancient trees with hanging vines and roots, glowing spores and fireflies, big mushrooms and flowers, a faint sunbeam; forest green', 'ancient forest, roots, flowers.'),
    'tide': ('Vua Thủy Triều (Tide King)', 'a weathered sea-captain king, broad and heavily scarred, a tricorn hat decorated with shells and a gold anchor crown, a salt-stained teal captain coat, salt-and-pepper beard.', 'a huge rusted anchor held like a mace, or a long sea-blade, rope and shells on the coat', 'sea teal', 'a stormy teal sea with big waves, a tall ship silhouette and a lighthouse, gulls, floating shells and a faint sea-glow; sea teal', 'ships, rope, shells, sea.'),
    'forge': ('Vua Lò Rèn (Forge King)', 'a soot-smudged, muscular, burn-scarred blacksmith king with a steel crown set with glowing embers, a leather apron over plate pauldrons, a thick red beard.', 'a massive forge hammer resting on his shoulder, glowing coals and sparks, a small anvil', 'ember red-brown', 'a roaring furnace glow, a lava river, hanging chains, big anvils and flying sparks, dark smoke; ember red-brown', 'anvil, steel, coals.'),
    'clock': ('Vua Đồng Hồ (Clockwork King)', 'a broad-shouldered, battle-worn inventor-king with brass goggles pushed up on a crown made of gears, a copper-brown coat with a watch chain, a mechanical monocle, a half-mechanical arm.', 'a giant brass wrench and big cogwheels, a brass-lens goggle', 'brass amber', 'giant interlocking brass gears and a huge clock face, drifting steam, floating cogs and springs, copper pipes; brass amber', 'gears, copper, springs.'),
    'moon': ('Vua Ánh Trăng (Moon King)', 'a tall, pale, scarred king in a deep indigo hooded cloak with a silver crescent-moon crown, long dark hair, calm half-lidded eyes, stars embroidered on the collar. Mystic but still in the same warm cozy world.', 'a long scythe whose blade is a crescent moon, an indigo hooded cloak with stars', 'night indigo', 'a huge crescent moon and a star-filled indigo sky, a ruined stone arch, drifting mist and small floating lights; night indigo', 'moon, ancient stone, shadows.'),
    'nomad': ('Vua Du Mục (Nomad Khan)', 'a steppe khan, lean and strong, a fur-trimmed pointed hat topped with a feather and gold band, a braided black beard, a battle-worn red and sand-gold patterned coat, sharp eyes.', 'a recurve bow in one hand and a curved sabre at the hip, a fur-trimmed hat', 'desert sand-gold', 'endless steppe and sand dunes at sunset, round felt tents, long fluttering banners, a soaring eagle, a huge sun; desert sand-gold', 'tents, woven carpets, steppe banners.'),
}


def build_prompt(out, king):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    name, desc, prop, hue, bg, theme = KINGS[king]
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + BODY.format(name=name, desc=desc, prop=prop, hue=hue, bg=bg, theme=theme)


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
    (ROOT / '.superpowers').mkdir(exist_ok=True)  # git-ignored scratch; absent in a fresh worktree
    path = ROOT / '.superpowers/p.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
