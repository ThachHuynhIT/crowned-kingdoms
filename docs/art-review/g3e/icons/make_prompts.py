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

SET_NOTE = """The SECOND attached image is an approved icon of this same set: match its outline thickness, art-pixel size, framing, tone count and finish exactly, but do NOT copy its object; draw only the object described above.
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
    # per-decree icons (20/11/2026, `icon_decree_*` in tools/asset-admin/planned.json; effects from src/data/decrees.ts);
    # same frame as the approved P0 set, the approved icon_decree source is attached as the set reference
    'icon_decree_harvest_tax': ('Thuế Mùa Màng (sắc lệnh)', 'the decree "harvest tax": extra gold at the start of every year.', 'one golden wheat sheaf tied with a brown cord, a big shiny gold coin leaning in front of its lower half; golden yellow wheat, bright gold coin, brown cord.'),
    'icon_decree_expand_borders': ('Mở Rộng Bờ Cõi (sắc lệnh)', 'the decree "expand borders": open locked plots of land at once.', 'a square patch of green grass seen from the front with a wooden boundary stake planted in it, a small blue pennant on the stake, and two short bold white arrows pointing outward to the left and right of the patch; green grass, warm wood, blue pennant.'),
    'icon_decree_mobilize': ('Tổng Động Viên (sắc lệnh)', 'the decree "mobilize": every troop building gets more soldiers.', 'a big chunky war horn held diagonally, mouthpiece at the lower left and the wide bell opening at the upper right facing the viewer, a cream-brown animal horn with two thick brass bands, a short red cord looped under it, three bold sound lines above the bell; the horn fills most of the square frame; cream horn, brass, red cord.'),
    'icon_decree_recast_crown': ('Đúc Lại Vương Miện (sắc lệnh)', 'the decree "recast the crown": the throne gains one level.', 'a small golden royal crown resting on top of a dark iron anvil, a few bright orange sparks flying from the crown; gold crown, dark iron anvil, orange sparks.'),
    'icon_decree_royal_armory': ('Kho Vũ Khí Hoàng Gia (sắc lệnh)', 'the decree "royal armory": every soldier deals more damage.', 'three big steel weapons fanned out from one point at the bottom like a bouquet, a sword in the middle, an axe on the left and a spear on the right, tied together at the bottom with a red ribbon and a small gold crown medallion; bright steel grey blades, warm wood handles, red ribbon, gold.'),
    'icon_decree_new_armor': ('Áo Giáp Mới (sắc lệnh)', 'the decree "new armor": every soldier gets more hit points.', 'a grey chainmail shirt (hauberk) with short sleeves, its ring texture shown as a simple checker of light and dark grey, a small red heart badge on the chest; steel grey mail, red heart.'),
    'icon_decree_royal_archers': ('Cung Thủ Hoàng Gia (sắc lệnh)', 'the decree "royal archers": every tower and the throne shoot farther.', 'a brown leather quiver standing upright, full of arrows with blue-and-white feather fletching sticking out of the top, a small gold crown badge on the quiver; brown leather, blue fletching, gold.'),
    'icon_decree_merchant_guild': ('Phường Hội Thương Nhân (sắc lệnh)', 'the decree "merchant guild": free card redraws every year.', 'a small brass balance scale, one pan holding a cream playing card and the other pan holding a gold coin, the two pans level; brass, cream card, gold coin.'),
    'icon_decree_fourth_hand': ('Bàn Tay Thứ Tư (sắc lệnh)', 'the decree "fourth hand": draw one more card every year.', 'a brown leather glove seen from the back holding four cream playing cards fanned out above it, the fourth card on the right slightly brighter with a small gold sparkle; brown glove, cream cards.'),
    'icon_decree_bigger_boulder': ('Đá Tảng Lớn (sắc lệnh)', 'the decree "bigger boulder": the royal boulder hits harder and wider.', 'a big round cracked grey boulder with a wide orange-and-yellow impact starburst behind its lower half and a bold gold plus sign on its top-right; warm grey stone, orange burst, gold plus.'),
    'icon_decree_quick_reflex': ('Phản Xạ Nhanh (sắc lệnh)', 'the decree "quick reflex": the royal intervention recharges faster.', 'a round brass stopwatch with a cream face and a small winder on top, a bold yellow lightning bolt crossing over its face diagonally; brass, cream face, yellow bolt.'),
    'icon_decree_amnesty': ('Lệnh Ân Xá (sắc lệnh)', 'the decree "amnesty": the kingdom gains one life.', 'an opened iron shackle (manacle) with its broken chain hanging, a plump red heart floating just above it; dark iron, saturated red heart.'),
    'icon_decree_treasury': ('Ngân Khố (sắc lệnh)', 'the decree "treasury": a pile of gold right now.', 'an open wooden treasure chest with brass corners, its lid raised, overflowing with shiny gold coins heaped above the rim; warm wood, brass, bright gold.'),
    'icon_decree_academy': ('Học Viện Hoàng Gia (sắc lệnh)', 'the decree "royal academy": pick one of two rare cards of your king for the deck.', 'a small wooden lectern holding an open book with cream pages, a white quill pen standing in a little ink pot beside it on the lectern, a small gold star above the book; warm wood, cream pages, white quill, gold star.'),
    'icon_decree_purge': ('Thanh Lọc (sắc lệnh)', 'the decree "purge": remove cards from the deck.', 'one cream playing card torn into two halves with a jagged tear down the middle, the halves pulled slightly apart and tilted, two tiny paper scraps falling; cream card with a red-brown border.'),
    'icon_decree_trade': ('Giao Thương (sắc lệnh)', 'the decree "trade": reward offers show more cards to choose from.', 'a small two-wheeled wooden merchant cart loaded with a tied grain sack, a crate and a rolled red cloth, seen from the side; warm wood, beige sack, red cloth.'),
    'icon_decree_rune_festival': ('Lễ Hội Phù Chú (sắc lệnh)', 'the decree "rune festival": every enchanted building gets one more charm stack.', 'a round red-and-gold paper festival lantern hanging from a short cord, a glowing golden-yellow rune symbol painted on its front, two tiny yellow sparkles; red paper, gold bands, bright yellow rune (no pink, purple or magenta anywhere).'),
    'icon_decree_moat': ('Hào Nước (sắc lệnh)', 'the decree "moat": every enemy moves slower.', 'a short stretch of grey stone castle wall with a crenellated top rising out of a wide band of blue rippled water in front of it; warm grey stone, bright blue water with white ripple highlights.'),
    # per-quest icons (20/11/2026, `icon_quest_*`; conditions from src/data/quests.ts); the approved icon_quest source is the set reference
    'icon_quest_untouched': ('Ngai Vô Sự (nhiệm vụ)', 'the quest "untouched throne": win a battle without the throne losing any health.', 'a small high-backed wooden throne with a red cushion and a gold crown on top, enclosed in a light-blue glowing round protective dome with a bright highlight on the top-left; dark wood, red, gold, light blue dome.'),
    'icon_quest_three_barracks': ('Ba Doanh Trại (nhiệm vụ)', 'the quest "three barracks": own three troop buildings at once.', 'three small pointed army tents in a row, the middle one bigger and in front, each with red-and-cream stripes and a tiny red pennant on top; red and cream canvas, brown poles.'),
    'icon_quest_no_reroll': ('Tiết Kiệm (nhiệm vụ)', 'the quest "thrift": never redraw the hand during the quest.', 'a round clay piggy bank seen from the side with a coin slot on its back and a gold coin dropping into the slot; terracotta orange-pink clay, gold coin.'),
    'icon_quest_slaughter': ('Đại Thắng (nhiệm vụ)', 'the quest "great victory": defeat at least one hundred enemies in one battle.', 'a small pyramid of three cute round cartoon skulls (two at the bottom, one on top) with a tiny red battle flag planted on the top skull, no gore; bone white, red flag.'),
    'icon_quest_double_rune': ('Bùa Chồng Bùa (nhiệm vụ)', 'the quest "rune on rune": one building carries two charm stacks.', 'two round grey stone rune medallions overlapping side by side like linked rings, each with a glowing light-blue rune, the right one brighter, a small gold sparkle where they overlap; grey stone, light-blue and white runes, gold rims (no pink, purple or magenta anywhere).'),
    'icon_quest_land_grab': ('Khai Phá (nhiệm vụ)', 'the quest "clear new land": open more plots during the quest.', 'a wooden-handled iron shovel stuck upright in a small mound of brown earth, a tiny green sprout growing beside the mound; warm wood, iron grey, brown earth, green sprout.'),
    'icon_quest_master_builder': ('Thợ Cả (nhiệm vụ)', 'the quest "master builder": own a building of high level.', 'a steel mason trowel with a wooden handle resting diagonally on a small neat stack of three red bricks, a small gold star above; steel grey, red-orange brick, gold star.'),
    'icon_quest_blitz': ('Chớp Nhoáng (nhiệm vụ)', 'the quest "blitz": win a battle very quickly.', 'two crossed short steel swords with a bold yellow lightning bolt striking down through the crossing point; steel grey blades, brass guards, bright yellow bolt.'),
    'icon_quest_hoard': ('Kho Đầy (nhiệm vụ)', 'the quest "full hoard": end a year with a lot of gold.', 'a tall heaped mound of gold coins with a gold goblet standing on top of the heap, a bright highlight on the top-left; gold with warm orange shading.'),
    'icon_quest_no_help': ('Tự Lực (nhiệm vụ)', 'the quest "self-reliance": win a battle without the royal intervention.', 'a raised clenched fist in a brown leather bracer, knuckles toward the viewer, three short strength lines beside it; warm skin tone, brown leather.'),
    'icon_quest_offering': ('Lễ Vật (nhiệm vụ)', 'the quest "offering": play a sacrifice card.', 'two open cupped hands held together, offering a glowing gold coin with two small gold sparkles above it; warm skin tone, bright gold.'),
    'icon_quest_diversity': ('Trăm Nghề (nhiệm vụ)', 'the quest "hundred trades": own all four kinds of building at once (troop, tower, economy, support).', 'a round wooden shield split by a cross into four quarters coloured red, slate grey, gold and leaf green, a brass boss in the centre; red, grey, gold, green, warm wood rim.'),
    'icon_quest_wager': ('Đặt Cược (nhiệm vụ)', 'the quest "wager": pay gold now, win two battles in a row for a bigger prize.', 'two ivory dice tumbling, the front one showing round red pips, a gold coin lying behind them; ivory white dice, red pips, gold coin.'),
    # per-perk icons (20/11/2026, optional `icon_perks_optional` in tools/asset-admin/planned.json; effects from src/data/kings/*.ts `perks`);
    # the approved icon_attack source is attached as the set reference
    'icon_perk_wheat_p1': ('Hạt Giống Tốt (đặc quyền)', 'the king perk "Hạt Giống Tốt": start the run with a level-1 wheat field in front of the throne.', 'a small open burlap seed sack full of golden seeds with one bright green sprout growing out of the seeds; beige burlap, golden seeds, green sprout.'),
    'icon_perk_wheat_p2': ('Thuế Nhẹ (đặc quyền)', 'the king perk "Thuế Nhẹ": the first card redraw each year is free.', 'one light white feather lying diagonally across a single gold coin; white feather with soft grey shading, bright gold coin.'),
    'icon_perk_wheat_p3': ('Toàn Dân Cầm Giáo (đặc quyền)', 'the king perk "Toàn Dân Cầm Giáo": militia and peasant soldiers get more health and damage.', 'a wooden pitchfork and a steel-tipped spear crossed in an X; warm wood shafts, iron prongs, steel spear head.'),
    'icon_perk_stone_p1': ('Nền Móng Vững (đặc quyền)', 'the king perk "Nền Móng Vững": the throne gets much more health.', 'a big square grey foundation stone block with a carved glowing blue rune on its front, resting on two flat stone slabs; slate grey stone, blue rune.'),
    'icon_perk_stone_p2': ('Đá Gọi Đá (đặc quyền)', 'the king perk "Đá Gọi Đá": start the run with a level-1 catapult tower in front of the throne.', 'a small wooden catapult seen from the side with its arm raised and a round grey stone in its bucket; warm wood, iron bands, grey stone.'),
    'icon_perk_stone_p3': ('Tường Không Đổ (đặc quyền)', 'the king perk "Tường Không Đổ": every building gets more health.', 'a short sturdy grey stone brick wall segment with a small round steel shield bolted to its front, no crenellations; warm grey stone, steel shield.'),
    'icon_perk_arcane_p1': ('Sách Phép Dày (đặc quyền)', 'the king perk "Sách Phép Dày": each building can hold more charm stacks.', 'a very thick deep navy-blue spellbook seen from the side so the many cream page edges show, a gold ribbon bookmark with a small glowing light-blue rune tag hanging out; navy-blue leather, cream pages, gold, light-blue rune (no pink, purple or magenta anywhere).'),
    'icon_perk_arcane_p2': ('Bùa Đầu Mùa (đặc quyền)', 'the king perk "Bùa Đầu Mùa": the throne starts the run with one spark charm.', 'a round grey stone charm with a glowing orange spark rune in its centre and four small orange sparks flying out around it; grey stone, bright orange spark.'),
    'icon_perk_arcane_p3': ('Ma Lực Dồi Dào (đặc quyền)', 'the king perk "Ma Lực Dồi Dào": the royal intervention recharges much faster.', 'a round glass bottle with a cork, full of glowing bright blue mana liquid that overflows over the rim in two drops; glass, bright blue, cork brown.'),
    'icon_perk_grove_p1': ('Rễ Từ Trước (đặc quyền)', 'the king perk "Rễ Từ Trước": new forest buildings start already two years old.', 'a small young leafy tree with its brown roots spreading wide below it, the roots visible as if the soil were cut away; leaf green, bark brown.'),
    'icon_perk_grove_p2': ('Sói Đầu Đàn (đặc quyền)', 'the king perk "Sói Đầu Đàn": the wolf den spawns one more wolf.', 'a grey wolf head in profile howling upward, ears back, a white muzzle; grey and white fur, dark grey shading.'),
    'icon_perk_grove_p3': ('Đất Lành (đặc quyền)', 'the king perk "Đất Lành": during battle the throne slowly regains health.', 'one fresh green leaf with a glowing light-green water droplet on it and a small green plus sparkle; fresh green, light green glow.'),
    'icon_perk_tide_p1': ('Túi Đầy (đặc quyền)', 'the king perk "Túi Đầy": start the run with extra gold.', 'a fat sea-blue cloth money bag tied at the top with a rope, a small white anchor stitched on it, two gold coins peeking out of the top; sea blue cloth, rope, gold.'),
    'icon_perk_tide_p2': ('Gió Thuận (đặc quyền)', 'the king perk "Gió Thuận": every knockback of our side is stronger.', 'a white ship sail billowing full of wind on a short wooden mast, three curved wind lines blowing into it from the left; white sail, warm wood, pale blue wind lines.'),
    'icon_perk_tide_p3': ('Chuộc Tù (đặc quyền)', 'the king perk "Chuộc Tù": losing a battle still pays half the victory gold.', 'one gold coin broken cleanly into two halves, the right half missing and only a few gold crumbs beside it; bright gold with orange shading.'),
    'icon_perk_forge_p1': ('Than Hồng (đặc quyền)', 'the king perk "Than Hồng": every burn deals more damage.', 'a lump of black coal glowing with bright orange-red cracks and two small flames licking up from it; black coal, orange-red glow, yellow flame tips.'),
    'icon_perk_forge_p2': ('Học Việc (đặc quyền)', 'the king perk "Học Việc": start the run with a level-1 forge in front of the throne.', 'a pair of iron blacksmith tongs holding a glowing red-hot iron bar; dark iron tongs, red-orange hot metal.'),
    'icon_perk_forge_p3': ('Thép Tốt (đặc quyền)', 'the king perk "Thép Tốt": every soldier of our side gets a little more armor.', 'one shiny steel ingot bar in trapezoid shape with a bright white glint on the top-left; cool steel grey with light highlights.'),
    'icon_perk_clock_p1': ('Dây Cót Căng (đặc quyền)', 'the king perk "Dây Cót Căng": every ramp-up starts already wound by a few seconds.', 'a brass wind-up key with a big round looped handle and a short notched shaft, two small curved motion lines beside it; brass with warm orange shading.'),
    'icon_perk_clock_p2': ('Bánh Răng Dự Phòng (đặc quyền)', 'the king perk "Bánh Răng Dự Phòng": start the run with a level-1 gear tower in front of the throne.', 'two interlocking brass cogwheels, one big and one small, teeth meshing; brass and copper.'),
    'icon_perk_clock_p3': ('Giờ Vàng (đặc quyền)', 'the king perk "Giờ Vàng": the battle rage and the battle time limit come later.', 'a golden bell hanging from a short wooden yoke, slightly swung to the right, two short ring lines beside it; bright gold bell, warm wood yoke.'),
    'icon_perk_moon_p1': ('Hồn Đói (đặc quyền)', 'the king perk "Hồn Đói": harvesting souls needs fewer souls.', 'a dark slate-grey stone chalice with pale cyan soul wisps swirling down into it; dark slate grey stone with cool blue shading, pale cyan wisps (no pink, purple or magenta anywhere).'),
    'icon_perk_moon_p2': ('Trăng Non (đặc quyền)', 'the king perk "Trăng Non": the starting deck has one more Blood Pact card.', 'a silver crescent moon with one red blood drop hanging from its lower tip; silver with cool grey shading, saturated red drop.'),
    'icon_perk_moon_p3': ('Mạng Thứ Tư (đặc quyền)', 'the king perk "Mạng Thứ Tư": start the run with four lives but a weaker throne.', 'four small plump red hearts arranged in a diamond, the bottom heart with a small crack; saturated red with dark red shading.'),
    'icon_perk_nomad_p1': ('Vó Ngựa (đặc quyền)', 'the king perk "Vó Ngựa": cavalry move faster and hit harder.', 'one iron horseshoe opening upward with nail holes and three short speed lines trailing behind it to the left; iron grey with a warm highlight.'),
    'icon_perk_nomad_p2': ('Thảo Nguyên Rộng (đặc quyền)', 'the king perk "Thảo Nguyên Rộng": start the run with two edge plots already open.', 'an unrolled tan leather map showing a green land patch, with two small bold white arrows pointing to its left and right edges; tan leather, green land, white arrows.'),
    'icon_perk_nomad_p3': ('Nhổ Trại Nhanh (đặc quyền)', 'the king perk "Nhổ Trại Nhanh": the mobile tent gets one more free move each year.', 'a rolled-up felt tent bundle tied with two red ropes, strapped across two short wooden poles; cream-brown felt, red rope, warm wood.'),
}


def build_prompt(out, icon):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    name, meaning, visual = ICONS[icon]
    prompt = HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + BODY.format(name=name, meaning=meaning, visual=visual)
    if set_reference(icon) and not icon.startswith('icon_king_'):
        prompt += SET_NOTE
    return prompt


def set_reference(icon):
    """The approved icon of the same set, attached next to the style reference (' -i <path>' or '')."""
    for prefix, ref in (('icon_king_', 'icon_king_wheat'), ('icon_decree_', 'icon_decree'), ('icon_quest_', 'icon_quest'), ('icon_perk_', 'icon_attack')):
        if icon.startswith(prefix) and icon != ref:
            return f' -i docs/art-review/g3e/icons/{ref}/source.png'
    return ''


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
        extra = set_reference(icon)
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i {REFERENCE}{extra} - < {prompt} > .superpowers/codex-i-{icon}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{icon} ok" >> .superpowers/i.log; else echo "{icon} MISSING" >> .superpowers/i.log; fi')
    runner.append('echo done >> .superpowers/i.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)  # git-ignored scratch; absent in a fresh worktree
    path = ROOT / '.superpowers/i.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1:] or None)
