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
    # Stone kingdom (2026-11-06). Stone is WARM grey-brown so the blue -> red foe recolour only touches the team colour.
    'golem': ('Người Đá (Đá)', 'a big, slow stone golem of the Stone kingdom that slams enemies with its fists.', 'a hulking chibi golem built from rounded WARM grey-brown boulders (not blue-grey), a small head sunk between huge rocky shoulders, two big stone fists hanging low, short thick legs, a carved rune on the chest glowing BLUE, a few small blue crystal shards on the shoulders; friendly heavy look.', 96, 96),
    'miner': ('Thợ Mỏ (Đá)', 'a tough melee miner of the Stone kingdom.', 'a stocky bearded mountain miner in a brown leather apron over a grey wool shirt, a BLUE scarf and blue cuffs, a battered brass mining helmet with a small lantern, holding a big iron pickaxe across the body with both hands; gruff grin.', 64, 96),
    'rubble': ('Đá Vụn (Đá)', 'a small rock creature summoned by the Stone kingdom, weak and expendable.', 'a small living heap of WARM grey-brown rocks (not blue-grey) with two tiny stubby rock legs, two small glowing BLUE eyes and a small blue rune mark on the front; cute and clumsy.', 64, 64),
    'slinger': ('Lính Ném Đá (Đá)', 'a ranged sling thrower of the Stone kingdom.', 'a young mountain villager in a grey-brown wool tunic with a BLUE sash and a blue headscarf, a leather pouch of round stones on the belt, holding a leather sling ready in one hand and a stone in the other; alert eager face.', 64, 64),
    # Arcane kingdom (2026-11-09, missing-art plan Task 2). Robes deep violet; the team colour stays BLUE trim only.
    'apprentice': ('Pháp Sư Tập Sự (Phép Thuật)', 'a weak ranged apprentice mage of the Arcane kingdom.', 'a young apprentice in a deep violet hooded robe with BLUE trim and a blue sash, a satchel of books, holding a short wooden wand with a small glowing violet spark at the tip; eager nervous face.', 64, 64),
    'frost_mage': ('Pháp Sư Băng (Phép Thuật)', 'a ranged frost mage of the Arcane kingdom whose bolts slow enemies.', 'a calm mage in a pale lavender robe with BLUE trim and a white fur collar, a pointed hat with frost on the brim, holding a staff topped with a pale ice crystal, tiny snowflakes around the crystal.', 64, 64),
    'archmage': ('Đại Pháp Sư (Phép Thuật)', 'a tall powerful archmage of the Arcane kingdom whose magic hits several enemies.', 'a tall old archmage with a long white beard, a deep violet star-patterned robe with gold and BLUE trim, a tall pointed hat, holding a tall staff crowned with a glowing purple crystal, a floating open spellbook beside the shoulder.', 64, 96),
    'construct': ('Người Máy Phép (Phép Thuật)', 'a sturdy arcane construct of the Arcane kingdom, a slow tanky melee unit.', 'a chunky chibi construct of pale carved stone plates bound with gold bands, a glowing violet crystal core in the chest, small glowing violet eyes, a BLUE cloth sash across the chest, big blocky fists; friendly heavy look.', 96, 96),
    'wolf': ('Sói (Rừng Xanh)', 'a fast forest wolf of the Grove kingdom.', 'a lean grey-brown forest wolf on all fours, bushy tail, alert ears, a BLUE woven collar with a small leaf charm; fierce but cute chibi proportions (big head).', 64, 64),
    'bear': ('Gấu Rừng (Rừng Xanh)', 'a big tanky forest bear of the Grove kingdom that grows angry when hurt.', 'a big round brown bear standing on its hind legs, mossy patches and a small flower on the shoulder, a BLUE leather harness across the chest; heavy friendly look.', 96, 96),
    'treant': ('Thụ Nhân (Rừng Xanh)', 'a huge slow walking tree of the Grove kingdom.', 'a chibi walking tree with a thick bark body, a kind bark face with glowing amber eyes, branch arms, a leafy crown, root feet, a BLUE cloth band tied around the trunk.', 96, 128),
    'stag': ('Hươu Thần (Rừng Xanh)', 'a spirit stag of the Grove kingdom whose hits heal nearby allies.', 'a graceful white spirit stag standing, large pale glowing antlers with tiny leaves, a BLUE ribbon around the neck, soft green glow at the hooves.', 96, 96),
    'dryad': ('Tiên Rừng (Rừng Xanh)', 'a forest dryad of the Grove kingdom.', 'a small forest spirit girl with leafy green hair and a flower crown, a bark-and-leaf dress with a BLUE sash, bare root-like feet, holding a sprouting wooden staff.', 64, 96),
    'pirate': ('Cướp Biển (Thuỷ Triều)', 'a basic pirate brawler of the Tide kingdom.', 'a scrappy young pirate in a striped shirt, a BLUE bandana and blue sash, baggy trousers, boots, holding a short cutlass; cheeky grin.', 64, 64),
    'hookman': ('Lính Móc Câu (Thuỷ Triều)', 'a pirate of the Tide kingdom with a long boat hook that pulls enemies.', 'a tall lanky sailor in a weathered coat with a BLUE neckerchief, a knit cap, holding a long boat hook with both hands.', 64, 96),
    'musketeer': ('Lính Súng Hoả Mai (Thuỷ Triều)', 'a ranged musketeer of the Tide kingdom.', 'a sailor-marine in a long coat with BLUE cuffs and a tricorn hat, a powder horn on the belt, holding a long flintlock musket.', 64, 96),
    'swordsman': ('Kiếm Sĩ (Lò Rèn)', 'a sturdy melee swordsman of the Forge kingdom.', 'a stocky soldier in dark iron plate armour with a BLUE tabard, an open helmet, holding a broad steel sword and a small round iron shield.', 64, 64),
    'bombardier': ('Lính Ném Lửa (Lò Rèn)', 'a ranged fire-pot thrower of the Forge kingdom.', 'a soot-stained soldier in a leather apron over an iron cuirass, a BLUE scarf, goggles on the helmet, holding a small clay fire-pot with a lit fuse.', 64, 64),
    'shieldbearer': ('Lính Khiên (Lò Rèn)', 'a tanky shield carrier of the Forge kingdom that shields allies.', 'a broad soldier carrying a huge riveted iron tower shield with a BLUE anvil emblem, dark iron armour, a short mace on the belt.', 64, 64),
    'iron_drake': ('Rồng Sắt (Lò Rèn)', 'a heavy iron drake of the Forge kingdom that breathes fire.', 'a chibi drake covered in dark riveted iron plates, glowing ember eyes and a glowing ember belly, small wings, a BLUE banner strap around the neck, smoke from the nostrils.', 96, 128),
    'tin_soldier': ('Lính Lên Dây (Đồng Hồ)', 'a basic wind-up tin soldier of the Clock kingdom.', 'a chibi wind-up toy soldier of polished tin and brass, a big brass key turning in its back, a tall shako hat, a BLUE coat with brass buttons, holding a small bayonet rifle; stiff cheerful face.', 64, 64),
    'spider': ('Nhện Máy (Đồng Hồ)', 'a fast little clockwork spider of the Clock kingdom.', 'a small round clockwork spider with a brass body, eight thin copper legs, a glowing amber eye lens, a BLUE painted stripe on the back, tiny gears showing.', 64, 64),
    'gear_gunner': ('Xạ Thủ Bánh Răng (Đồng Hồ)', 'a ranged gear-gun shooter of the Clock kingdom.', 'a young engineer in a brass-buckled leather coat with BLUE trim and goggles, holding a chunky gear-driven repeating gun with a crank.', 64, 64),
    'colossus': ('Người Khổng Lồ Máy (Đồng Hồ)', 'a huge slow clockwork colossus of the Clock kingdom.', 'a chibi giant automaton of riveted brass plates, a round glass head with a glowing core, pipes venting a little steam, big piston arms, a BLUE banner sash across the chest.', 96, 128),
    'skeleton': ('Bộ Xương (Ánh Trăng)', 'a weak summoned skeleton warrior of the Moon kingdom.', 'a cute chibi skeleton (not scary) with a cracked round shield and a short rusty sword, a torn BLUE cloth sash, faint violet glow in the eye sockets.', 64, 64),
    'wraith': ('Bóng Ma (Ánh Trăng)', 'a floating wraith of the Moon kingdom.', 'a cute floating ghost in a tattered pale violet hooded cloak with a BLUE clasp, glowing violet eyes in a dark hood, wispy tail instead of feet (it hovers just above the ground).', 64, 64),
    'vampire': ('Ma Cà Rồng (Ánh Trăng)', 'a vampire noble of the Moon kingdom that heals from its hits.', 'a chibi vampire noble in a dark violet high-collared cape with a BLUE inner lining, pale face, slicked dark hair, small fangs, a thin rapier; charming not scary.', 64, 96),
    'moon_reaper': ('Thần Chết Trăng (Ánh Trăng)', 'a tall reaper of the Moon kingdom.', 'a tall hooded figure in a deep violet robe with BLUE trim, a pale moon mask, holding a big crescent-moon scythe; mysterious but cute.', 96, 128),
    'rider': ('Kỵ Binh (Du Mục)', 'a fast melee horse rider of the Nomad kingdom.', 'a chibi steppe warrior on a small sturdy brown horse, the rider in red-and-gold felt armour with a BLUE sash and a fur hat, holding a curved sabre; the horse has a BLUE saddle blanket.', 96, 96),
    'horse_archer': ('Cung Kỵ (Du Mục)', 'a ranged horse archer of the Nomad kingdom.', 'a chibi steppe archer on a small tan horse, a red felt coat with a BLUE sash, a fur hat, a short recurve bow and a quiver; the horse has a BLUE saddle blanket.', 96, 96),
    'khan_guard': ('Cận Vệ Khả Hãn (Du Mục)', 'an elite heavy guard of the Nomad king.', 'a broad chibi guard in lamellar armour of red and gold plates, a BLUE sash, a spiked helmet with a horse-tail plume, holding a long glaive.', 64, 96),
    'mercenary': ('Lính Đánh Thuê (trung lập)', 'a hired neutral mercenary soldier.', 'a rough chibi sellsword in a patched brown leather jerkin with a BLUE armband, a scarred cheerful face, holding a short sword and a small buckler.', 64, 64),
}

# In-game height in art pixels (4 art px per world unit) of units added after the Wheat set, chosen against the
# approved militia (51 px tall). The standing sample is reduced to this height (make_poses.py --sample) and the pose
# sheet is drawn at a block size that makes this height fit a 512 px cell.
HEIGHT = {'golem': 76, 'miner': 58, 'rubble': 34, 'slinger': 50, 'apprentice': 50, 'frost_mage': 52, 'archmage': 60, 'construct': 70, 'wolf': 40, 'bear': 66, 'treant': 80, 'stag': 58, 'dryad': 52, 'pirate': 50, 'hookman': 58, 'musketeer': 58, 'swordsman': 52, 'bombardier': 50, 'shieldbearer': 54, 'iron_drake': 76, 'tin_soldier': 50, 'spider': 34, 'gear_gunner': 50, 'colossus': 80, 'skeleton': 48, 'wraith': 48, 'vampire': 56, 'moon_reaper': 70, 'rider': 62, 'horse_archer': 62, 'khan_guard': 58, 'mercenary': 50}
MILITIA_HEIGHT = 51
# approved unit of the same kind, attached to every new unit's standing sample (ART_STYLE: "ảnh đã duyệt cùng loại")
UNIT_REFERENCE = 'docs/art-review/g3e/units/militia/source.png'

SCALE_LINE = """Scale and style: the second attached image is the APPROVED Wheat militia; match its chibi style, outline, shading and palette warmth exactly. In the game this unit stands about {pct}% as tall as that militia ({h} art pixels against 51), so give it the matching bulk and proportions, but still draw it large, filling the canvas height.
"""


def build_prompt(out, unit):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    if unit in HEIGHT and not (ROOT / UNIT_REFERENCE).exists():
        raise SystemExit(f'{UNIT_REFERENCE} (the approved unit reference) is missing: refusing to generate images')
    name, role, visual, w, h = UNITS[unit]
    # one square canvas for every unit so sizes stay comparable; tall units are drawn narrow inside it
    side = max(w, h)
    block = f'{1024 // side}x{1024 // side} source pixels'
    native = f'{side}x{side}' if w == h else f'{w}x{h} (the character fills the full height of a {side}x{side} square, drawn {w} wide)'
    body = BODY.format(name=name, role=role, visual=visual, native=native, block=block)
    if unit in HEIGHT:
        body += SCALE_LINE.format(pct=round(100 * HEIGHT[unit] / MILITIA_HEIGHT), h=HEIGHT[unit])
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + body


# --- animation poses (requested by the project owner on 2026-11-05) -------------------------------------
# The game plays idle 2 frames, walk 2 frames, attack 2 frames (docs/ART_STYLE.md "Quy tắc vẽ"; src/render/imageArt.ts
# POSES maps them to files <prefix>_0..5). All six are drawn in ONE image so the character stays identical; the
# unit's own idle sample is attached as the identity reference. Slicing: docs/art-review/g3e/units/make_poses.py.
POSES = [
    ('idle', 0, 'IDLE frame 1: the same standing pose as the attached sample, facing the viewer.'),
    ('idle', 1, 'IDLE frame 2: identical to idle frame 1 but breathing in: shoulders and head 1 art pixel lower, the weapon tip 1 art pixel lower; feet do not move.'),
    ('walk', 0, 'WALK frame 1: body turned three-quarter to the RIGHT, LEFT foot stepping forward, right foot back, arms swinging, body 1 art pixel lower than idle.'),
    ('walk', 1, 'WALK frame 2: body turned three-quarter to the RIGHT, RIGHT foot stepping forward, left foot back, the other arm swing, body at idle height.'),
    ('attack', 0, 'ATTACK frame 1 (wind-up): body turned three-quarter to the RIGHT, {attack_windup}'),
    ('attack', 1, 'ATTACK frame 2 (strike): body turned three-quarter to the RIGHT, {attack_strike}'),
]

# unit id -> (wind-up, strike); the strike text is also what the gate test looks for
ATTACK = {
    'tin_soldier': 'the bayonet drawn back to the hip, the wind-up key spinning.',
    'spider': 'the front legs raised high, body leaning back.',
    'gear_gunner': 'the gun raised and aimed to the right, cranking the handle.',
    'colossus': 'both piston fists raised high, steam venting, leaning back.',
    'skeleton': 'the sword raised behind the head, shield forward.',
    'wraith': 'the cloak arms raised wide, the glow brighter, leaning back.',
    'vampire': 'the rapier drawn back, the cape swirling.',
    'moon_reaper': 'the crescent scythe raised high behind the head with both hands.',
    'rider': 'the rider raising the sabre high, the horse rearing a little.',
    'horse_archer': 'the bow drawn fully, aiming to the right.',
    'khan_guard': 'the glaive raised high behind the shoulder with both hands.',
    'mercenary': 'the sword raised back over the shoulder, buckler forward.',
    'wolf': 'the wolf crouched low on its front legs, ears back, ready to pounce.',
    'bear': 'both big paws raised high, standing tall, mouth open in a roar.',
    'treant': 'both branch arms raised high, leaves shaking, leaning back.',
    'stag': 'the head lowered, antlers forward, a front hoof raised.',
    'dryad': 'the staff drawn back over the shoulder, a green glow gathering at its tip.',
    'pirate': 'the cutlass raised back over the shoulder, weight on the back foot.',
    'hookman': 'the boat hook drawn far back with both hands, leaning back.',
    'musketeer': 'the musket raised to the shoulder, aiming to the right.',
    'swordsman': 'the sword raised high behind the head, shield forward.',
    'bombardier': 'the fire-pot drawn back over the shoulder, the fuse sparking.',
    'shieldbearer': 'the tower shield braced forward with both arms, knees bent.',
    'iron_drake': 'the head pulled back, chest glowing brighter, wings raised.',
    'apprentice': 'the wand drawn back over the shoulder, a small violet spark gathering at its tip, weight on the back foot.',
    'frost_mage': 'the ice staff raised high in both hands, the crystal glowing brighter, frost swirling around it.',
    'archmage': 'the crystal staff raised overhead, the spellbook open and glowing, the free hand drawn back gathering violet light.',
    'construct': 'both blocky stone fists raised high, the body leaning back, the violet core glowing brighter.',
    'militia': 'the spear pulled back to the hip, front knee bent, shield raised in front of the chest.',
    'reaper': 'the sickle-scythe raised high above and behind the head with both hands, weight on the back foot.',
    'peasant': 'the pitchfork pulled back at waist height with both hands, leaning back.',
    'golem': 'both stone fists raised high above the head, the body leaning back, the chest rune glowing brighter.',
    'miner': 'the pickaxe swung up behind the shoulder with both hands, weight on the back foot.',
    'rubble': 'the rock heap squashed low and leaning back, ready to hop.',
    'slinger': 'the sling whirled above the head in one hand, the stone in the pouch, the other arm pointing right.',
}
STRIKE = {
    'tin_soldier': 'a stiff thrust of the bayonet forward to the right, one leg kicked forward.',
    'spider': 'a lunge forward to the right with the front legs stabbing down.',
    'gear_gunner': 'the gun firing to the right, a small muzzle flash and spinning gears (bullets drawn by the game).',
    'colossus': 'both fists slammed down forward to the right at ground level, a puff of steam.',
    'skeleton': 'a slash forward to the right at chest height, leaning in.',
    'wraith': 'a swoop forward to the right with ghostly claws reaching out.',
    'vampire': 'a quick lunge with the rapier forward to the right, cape trailing.',
    'moon_reaper': 'a wide sweep of the scythe forward to the right at knee height.',
    'rider': 'the horse charging to the right, the sabre slashing forward.',
    'horse_archer': 'the arrow just released to the right, the bowstring snapping (the arrow is drawn by the game).',
    'khan_guard': 'a heavy sweep of the glaive forward to the right at chest height.',
    'mercenary': 'a slash forward to the right at chest height, front foot forward.',
    'wolf': 'a leap forward to the right with jaws open, front paws reaching out.',
    'bear': 'a heavy swipe down and forward to the right with one paw, body leaning forward.',
    'treant': 'both branch arms slammed down forward to the right at ground level, roots lifting.',
    'stag': 'a charge to the right with the antlers forward, a small green sparkle at the tips.',
    'dryad': 'the staff thrust forward to the right, a small burst of green leaves at the tip (the bolt itself is drawn by the game).',
    'pirate': 'a slash forward to the right at chest height, front foot forward.',
    'hookman': 'the boat hook thrust far forward to the right at chest height, both arms extended.',
    'musketeer': 'the musket fired to the right, a small puff of smoke at the muzzle (the bullet is drawn by the game), recoil leaning back.',
    'swordsman': 'a strong downward slash forward to the right, body leaning in.',
    'bombardier': 'the throwing arm swung fully forward to the right, the hand empty (the pot is drawn by the game).',
    'shieldbearer': 'a shield bash forward to the right, the whole body pushing in behind it.',
    'iron_drake': 'the head thrust forward to the right breathing a short burst of flame at the mouth (the long flame is drawn by the game).',
    'apprentice': 'the wand thrust forward to the right at arm length, a small violet spark leaving its tip (the bolt itself is drawn by the game), front foot forward.',
    'frost_mage': 'the ice staff swung forward to the right and pointed at chest height, a puff of frost at the crystal (the bolt itself is drawn by the game).',
    'archmage': 'the staff thrust forward to the right, a burst of violet light at the crystal (the bolt itself is drawn by the game), robe swirling.',
    'construct': 'both fists slammed down together in front of it to the right at ground level, the body bent forward, small stone chips at the fists.',
    'militia': 'a long lunge to the right, the spear thrust straight out to the right at chest height with the arm fully extended, the shield stays on the body.',
    'reaper': 'a wide low swing: the blade sweeps down and forward to the right at knee height, body leaning forward.',
    'peasant': 'a hard jab: the pitchfork thrust forward to the right at chest height, both arms extended, front foot forward.',
    'golem': 'both fists slammed down together in front of it to the right at ground level, the body bent forward, small rock chips at the fists.',
    'miner': 'the pickaxe brought down hard in front to the right at knee height, body bent forward.',
    'rubble': 'a hop forward to the right, the rock heap stretched tall and leaning into the hit.',
    'slinger': 'the throwing arm swung fully forward to the right at shoulder height, the sling released and empty, front foot forward (the stone itself is drawn by the game, not here).',
}

POSE_BODY = """Create ONE pixel-art ANIMATION SHEET for the Crowned Kingdoms unit {name} — {role}
The second attached image (`{sample}`) is this unit's standing sample: draw exactly the SAME character in every cell — same face, hair, clothes, colours, proportions, outline thickness, pixel size and the same weapon — only the pose changes.
Format: a LANDSCAPE image, aspect ratio 3:2 (target 1536x1024 px), a grid of 3 columns x 2 rows of equal square cells (each 512x512 px). Each cell holds ONE full-body copy of the character, the same size in every cell, the feet on the same baseline near the bottom of the cell, a margin on every side, nothing crossing into another cell, no grid lines drawn. Each art pixel is a clean square block of {block}, the same block size in every cell.
Cells in reading order (left to right, top row first):
1. {p0}
2. {p1}
3. {p2}
4. {p3}
5. {p4}
6. {p5}
View: the same camera as the approved buildings: looking DOWN at the character at 45 degrees, so a little of the top of the head, hat and shoulders is visible. NOT a pure side view, NOT a back view, NOT isometric. The poses must read clearly as a silhouette at {native} art pixels: big simple limb and weapon movements, no motion blur, no speed lines, no effects.
Team colours: ALLY version, blue accents exactly as in the sample (the red enemy version is made later by a recolour tool).
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, a 1-art-pixel dark outline in a darker shade of each material (never pure black), the same palette as the sample.
Background: ONE flat solid magenta #FF00FF filling the whole canvas (every cell), no gradient, no texture, no glow, NO cast shadow and no ground; the character must not contain magenta.
No text, letters, numbers, labels, UI, frame, watermark, blur, antialiasing or smooth gradients.
"""


def sample_path(unit):
    return P / unit / 'source.png'


def build_pose_prompt(out, unit):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    if not sample_path(unit).exists():
        raise SystemExit(f'{unit}: no standing sample at {sample_path(unit)}: draw and approve the idle sample first')
    name, role, visual, w, h = UNITS[unit]
    side = max(w, h)
    lines = {f'p{i}': text.format(attack_windup=ATTACK[unit], attack_strike=STRIKE[unit]) for i, (_, _, text) in enumerate(POSES)}
    sample = f'docs/art-review/g3e/units/{unit}/source.png'
    if unit in HEIGHT:
        # the character is drawn HEIGHT art px tall in blocks of b px, so make_poses reduces it at ~b (no blurry resampling)
        b = min(8, 460 // HEIGHT[unit])
        block = f'{b}x{b} source pixels; the character is about {HEIGHT[unit]} art pixels tall (about {b * HEIGHT[unit]} source pixels) in every cell'
    else:
        block = f'{512 // side}x{512 // side} source pixels'
    return HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE) + POSE_BODY.format(
        name=name, role=role, sample=sample, native=f'{w}x{h}', block=block, **lines)


def main(only=None, poses=False):
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    tag = 'up' if poses else 'u'
    for unit in UNITS:
        if only and unit not in only:
            continue
        d = P / unit
        d.mkdir(parents=True, exist_ok=True)
        out = (d / ('poses-source.png' if poses else 'source.png')).relative_to(ROOT).as_posix()
        prompt_file = d / ('poses-prompt.md' if poses else 'prompt.md')
        prompt_file.write_text(build_pose_prompt(out, unit) if poses else build_prompt(out, unit), encoding='utf-8')
        prompt = prompt_file.relative_to(ROOT).as_posix()
        if poses:
            images = f'-i {REFERENCE} -i {sample_path(unit).relative_to(ROOT).as_posix()}'
        else:
            images = f'-i {REFERENCE}' + (f' -i {UNIT_REFERENCE}' if unit in HEIGHT else '')
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" {images} - < {prompt} > .superpowers/codex-{tag}-{unit}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{unit} ok" >> .superpowers/{tag}.log; else echo "{unit} MISSING" >> .superpowers/{tag}.log; fi')
    runner.append(f'echo done >> .superpowers/{tag}.log')
    (ROOT / '.superpowers').mkdir(exist_ok=True)  # git-ignored scratch; absent in a fresh worktree
    path = ROOT / f'.superpowers/{tag}.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    args = sys.argv[1:]
    want_poses = '--poses' in args
    main([a for a in args if a != '--poses'] or None, poses=want_poses)
