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
    'icon_gold': ('Vàng (tài nguyên)', 'the resource "gold": the kingdom currency.', 'a stack of three shiny gold coins, the front coin with a small crown stamped on it, a bright highlight on the top-left edge; gold with warm orange shading.'),
    'icon_life': ('Máu / Mạng (tài nguyên)', 'the resource "life": hit points and lives.', 'a plump red heart with a bright highlight on the top-left and a small steel-grey rim of plating on the lower edge; saturated red with a dark red shade.'),
    'icon_level': ('Cấp (tài nguyên)', 'the resource "level": the upgrade level of a building.', 'a bold golden upward arrow standing on a short stack of two stone steps, small gold sparkles beside the arrow; gold arrow, grey stone steps.'),
    'icon_enchant_stack': ('Chồng bùa (tài nguyên)', 'the resource "enchant stack": the number of charms stacked on a building.', 'three round rune discs stacked on top of each other like a short tower, each disc with a different glowing violet rune, the top one brightest; grey stone discs, violet runes, gold rims.'),
    # king badges (2026-11-06): shown on the calendar for the years that king attacks; one heraldic shape per king
    'icon_king_wheat': ('Huy hiệu Vua Lúa Mì (huy hiệu vua)', 'the badge of the Wheat king, shown on the year calendar when the Wheat kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a golden-yellow field and one bold golden wheat sheaf tied with a blue band in the middle, a tiny gold crown on the top edge of the shield; golden yellow, warm brown wood, a blue accent. The wheat sheaf must stay readable as a thumbnail.'),
    # the eight other kings (G5, 2026-11-09), same shield as the approved Wheat badge
    'icon_king_stone': ('Huy hiệu Vua Đá Núi (huy hiệu vua)', 'the badge of the Đá Núi king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a cool slate-grey field with one bold grey mountain peak carved with a glowing blue rune in the middle, a tiny gold crown on the top edge of the shield; slate grey, blue rune glow. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    'icon_king_arcane': ('Huy hiệu Vua Phép Thuật (huy hiệu vua)', 'the badge of the Phép Thuật king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a deep violet field with one bold glowing purple crystal and a small gold star in the middle, a tiny gold crown on the top edge of the shield; deep violet, purple, gold. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    'icon_king_grove': ('Huy hiệu Vua Rừng Xanh (huy hiệu vua)', 'the badge of the Rừng Xanh king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a leaf-green field with one bold oak leaf and a small acorn in the middle, a tiny gold crown on the top edge of the shield; leaf green, bark brown. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    'icon_king_tide': ('Huy hiệu Vua Thuỷ Triều (huy hiệu vua)', 'the badge of the Thuỷ Triều king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a sea-teal field with one bold curling white-capped wave and a small anchor in the middle, a tiny gold crown on the top edge of the shield; sea teal, white foam, brass. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    'icon_king_forge': ('Huy hiệu Vua Lò Rèn (huy hiệu vua)', 'the badge of the Lò Rèn king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, an ember-red field with one bold dark iron anvil and a small orange flame above it in the middle, a tiny gold crown on the top edge of the shield; ember red, dark iron, orange. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    'icon_king_clock': ('Huy hiệu Vua Đồng Hồ (huy hiệu vua)', 'the badge of the Đồng Hồ king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a brass-gold field with one bold cogwheel with a small clock face in its centre in the middle, a tiny gold crown on the top edge of the shield; brass, copper, steel blue. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    'icon_king_moon': ('Huy hiệu Vua Ánh Trăng (huy hiệu vua)', 'the badge of the Ánh Trăng king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a deep violet night field with one bold silver crescent moon and two tiny stars in the middle, a tiny gold crown on the top edge of the shield; violet night, silver. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    'icon_king_nomad': ('Huy hiệu Vua Du Mục (huy hiệu vua)', 'the badge of the Du Mục king, shown on the year calendar when that kingdom attacks.', 'a small heraldic shield (pointed bottom) with a warm wooden rim, a sandy ochre field with one bold horse head and a small red banner in the middle, a tiny gold crown on the top edge of the shield; ochre, warm brown, red. Same shield shape, rim, crown and size as the approved Wheat badge; the emblem must stay readable as a thumbnail.'),
    # the seven in-game icons still painted in code (G5, 2026-11-09)
    'icon_crown': ('Vương Miện (tài nguyên)', 'Crown Points and the royal crown.', 'a small golden royal crown with five points, three red and blue gems on the band, a bright highlight on the top-left; gold, red and blue accents.'),
    'icon_boulder': ('Đá Tảng Hoàng Gia (can thiệp)', 'the royal boulder the king drops on the battlefield.', 'a big round grey boulder with a few cracks and a small golden crown mark carved on it, three short speed lines above it showing it falls; warm grey stone.'),
    'icon_skull': ('Thổ Phỉ / quân địch (lịch)', 'raiders and enemy armies on the year calendar.', 'a small cute cartoon skull, round and friendly, with dark eye holes and a tiny crack, no gore; bone white with a soft brown outline.'),
    'icon_reroll': ('Đổi bài (hành động)', 'redraw the hand of cards.', 'two playing cards fanned slightly with a bold circular green arrow looping around them; cream cards with a green arrow.'),
    'icon_sell': ('Bán bài (hành động)', 'sell a card for gold.', 'one playing card with a gold coin in front of its lower corner and a small plus sign; cream card, gold coin.'),
    'icon_lock': ('Khoá (trạng thái)', 'a locked plot or a locked king.', 'a sturdy closed iron padlock with a brass keyhole plate, a bright highlight on the top-left; dark iron and brass.'),
    'icon_conquer': ('Chinh phục (sự kiện)', 'conquering an enemy king.', 'a planted battle flag on a short pole with a small golden crown on the flag and a laurel wreath around the pole base; red flag, gold crown, green laurel.'),
    'icon_soul': ('Linh hồn (tài nguyên)', 'the resource "soul": energy taken from fallen enemies.', 'a ghostly pale cyan-white soul flame shaped like a teardrop with a tiny wisp tail and two small dark eye hollows, a few tiny floating cyan sparks; pale cyan with a deeper teal shade.'),
    # P0 stats, statuses and actions still missing (10/11/2026, `tools/asset-admin/planned.json`); same frame as above
    'icon_attack': ('Sát thương (chỉ số)', 'the stat "attack damage" of a unit or tower.', 'one short steel sword pointing up-right with a brass crossguard and a brown leather grip, a small white glint on the blade; steel grey, brass, brown.'),
    'icon_armor': ('Giáp (chỉ số)', 'the stat "armor": damage taken is reduced.', 'a steel chest plate (cuirass) seen from the front with two rivets and a brass trim along the neck; steel grey with a warm brass edge.'),
    'icon_range': ('Tầm đánh (chỉ số)', 'the stat "attack range".', 'a wooden longbow drawn with an arrow nocked, pointing up-right, a small dashed arc in front of the arrow tip; warm wood, steel arrow head, white dashes.'),
    'icon_speed': ('Tốc độ (chỉ số)', 'the stat "move speed".', 'a single brown leather boot with a small white wing on its heel and three short speed lines behind it; brown leather, white wing.'),
    'icon_cooldown': ('Hồi chiêu (chỉ số)', 'the stat "cooldown / attack interval".', 'a small brass hourglass with blue sand half run through, a curved arrow circling around it; brass, glass, blue sand.'),
    'icon_shield': ('Khiên (trạng thái)', 'the status "shielded": absorbs damage.', 'a kite-shaped steel shield with a blue field and a glowing light-blue rim, a small sparkle on the top-left; steel, blue, light blue glow.'),
    'icon_heal': ('Hồi máu (trạng thái)', 'the effect "heal".', 'a bold green plus sign with a soft lighter-green rim and two tiny green sparkles beside it; fresh green.'),
    'icon_burn': ('Bỏng (trạng thái)', 'the status "burning": damage over time from fire.', 'one bold flame with an orange outer tongue, a yellow core and a small dark-red base; orange, yellow, dark red.'),
    'icon_poison': ('Độc (trạng thái)', 'the status "poisoned": damage over time.', 'a round glass flask with a cork, filled with bubbling bright green liquid, two green bubbles rising; glass, bright green, cork brown.'),
    'icon_slow': ('Làm chậm (trạng thái)', 'the status "slowed".', 'a small snail with a spiral shell and a light-blue frost crystal on top of the shell; brown-orange shell, pale skin, light blue ice.'),
    'icon_stun': ('Choáng (trạng thái)', 'the status "stunned".', 'three small golden stars circling in a ring above a tiny bump, like a cartoon dizzy halo; gold stars with orange shading.'),
    'icon_flying': ('Bay (đặc tính)', 'the trait "flying": only ranged attacks can hit it.', 'a single spread white-and-grey feathered wing seen from the side, upward stroke; white feathers, soft grey shading.'),
    'icon_disabled': ('Bị vô hiệu (trạng thái)', 'the status "disabled": a building cannot act.', 'a small round wooden-and-iron gear with a red diagonal bar across it like a no-entry sign; iron grey gear, bold red bar.'),
    'icon_revive': ('Hồi sinh (hiệu ứng)', 'the effect "revive": a fallen unit returns.', 'a small grey tombstone with a bright golden upward arrow rising from behind it and a few gold sparkles; grey stone, gold arrow.'),
    'icon_sacrifice': ('Hiến tế (hiệu ứng)', 'the effect "sacrifice": give up something for power.', 'a small stone altar bowl with a red flame burning in it and one drop of red falling into it; grey stone, red-orange flame.'),
    'icon_move': ('Di chuyển (hành động)', 'the action "move a building to another plot".', 'a wooden signpost with two arrows pointing left and right, the right arrow bigger and green; warm wood, green arrow.'),
    'icon_upgrade': ('Nâng cấp (hành động)', 'the action "upgrade a building".', 'a small iron hammer over a golden upward chevron, two gold sparkles; iron grey hammer with wood handle, gold chevron.'),
    'icon_unlock': ('Mở khoá (hành động)', 'the action "unlock" a plot or a reward.', 'an opened brass padlock with the shackle swung open and a small key beside it; brass and iron.'),
    'icon_quest': ('Nhiệm vụ (bảng)', 'a quest to complete for a reward.', 'a rolled parchment scroll, half open, tied with a red ribbon, a small red exclamation-shaped wax seal; cream parchment, red ribbon.'),
    'icon_decree': ('Sắc lệnh (bảng)', 'a royal decree that changes the rules for the run.', 'a flat parchment page with a big red wax seal stamped with a small crown at the bottom, a few dark lines as text; cream parchment, red wax, gold crown.'),
    'icon_pause': ('Tạm dừng (nút)', 'the button "pause the battle".', 'two thick vertical rounded bars side by side, cream-coloured with a warm brown outline, like a pause symbol carved in wood.'),
    'icon_save': ('Lưu (nút)', 'the button "save the game".', 'a small closed wooden chest with brass corners and a brass lock, lid slightly domed; warm wood, brass.'),
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
        extra = ' -i docs/art-review/g3e/icons/icon_king_wheat/source.png' if icon.startswith('icon_king_') and icon != 'icon_king_wheat' else ''
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE}{extra} - < {prompt} > .superpowers/codex-i-{icon}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{icon} ok" >> .superpowers/i.log; else echo "{icon} MISSING" >> .superpowers/i.log; fi')
    runner.append('echo done >> .superpowers/i.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)  # git-ignored scratch; absent in a fresh worktree
    path = ROOT / '.superpowers/i.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
