"""One Codex prompt per card illustration (sequential, one image per run).

    python docs/art-review/g3e/cards/make_prompts.py wheat_field [card_id ...]

`cards.json` is the catalogue dumped from the card registry (id, Vietnamese name, owner, kind, rarity and the
description). Every prompt starts by telling Codex to read docs/ART_STYLE.md and attaches the approved style
reference plus the approved portrait of the card's king (to keep the kingdom's palette). Card specifics (landscape
4:3 picture for the picture window of a tall card, one subject, readable at 96x72, no text) are below.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
D = ROOT / 'docs/art-review/g3e/cards'
STYLE_DOC = 'docs/ART_STYLE.md'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
CATALOG = D / 'cards.json'

# The building prompts use the "Prompt mẫu dùng lại" block of docs/ART_STYLE.md word for word (the mandatory frame
# says not to retype it): reuse the building tool's extractor instead of copying the text here.
_spec = importlib.util.spec_from_file_location('building_prompts', ROOT / 'docs/art-review/g3e/buildings/make_prompts.py')
_buildings = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_buildings)
BUILDING_KINDS = ('troop', 'tower', 'economy', 'support')

CARD_OVERRIDE = """
YÊU CẦU CHO TRANH THẺ (ghi đè phần "transparent background" và "Whole building visible" ở trên): đây là TRANH MINH HỌA của một thẻ bài, không phải sprite tách nền. Ảnh 4:3 (1024x768), công trình ở giữa chiếm khoảng 70% khung, đặt trong một cảnh nền sơn nhẹ: {bg}; nền nhạt và mềm hơn công trình, không khung, không viền, không vignette. Một tông màu chủ đạo ({hue}) cùng 2-3 sắc độ và một điểm nhấn ấm nhỏ; phải đọc được khi thu nhỏ còn 48x36 px (hình khối lớn, ít chi tiết nhỏ). Không chữ, số, khung thẻ, UI, watermark, làm mờ hay anti-aliasing. Giữ NGUYÊN các quy tắc góc nhìn 45 độ ở trên.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
"""

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `{doc}` — mục "Quy tắc vẽ" và mục "Góc nhìn" (khung BẮT BUỘC). Ảnh tham chiếu đã duyệt đính kèm: `{ref}` (phong cách: pixel art ấm áp, viền là màu tối hơn của chính vật liệu, ánh sáng trên-trái, bão hòa ấm, họa tiết chất liệu rõ; KHÔNG sao chép hình ngôi nhà){portrait_note}

"""

PORTRAIT_NOTE = """ và `{portrait}` (chân dung đã duyệt của vua sở hữu thẻ: lấy BẢNG MÀU và không khí của vương quốc đó, KHÔNG vẽ lại nhân vật này)."""

BODY = """Create one pixel-art CARD ILLUSTRATION for Crowned Kingdoms: "{name}" — {summary}
What it is: {kind_desc}
Format: LANDSCAPE aspect ratio 4:3 (target 1024x768 px, to be reduced to about 96x72 art pixels, so each art pixel is about 10x10 source pixels). One clear subject, centred, filling about 70% of the frame, with a simple themed scene behind it. Buildings and units follow the game's view: Stardew-style 2.5D looking down at 45 degrees, front facing, roof or top visible (see the approved reference); spells and enchantments are one iconic magical object with its effect.
Colour: ONE dominant hue ({hue}) with 2-3 tints and shades and one small warm accent; strong silhouette, large simple shapes, no tiny details: it must still read at 48x36 px.
Style: warm cozy medieval fantasy pixel art, crisp square pixel clusters, upper-left lighting, dark material-colored outlines (never pure black), saturated warm palette, readable material texture.
Background: {bg}, painted lower-contrast and softer than the subject; no frame, no border, no vignette.
No text, letters, numbers, labels, UI, card frame, watermark, blur, antialiasing or smooth gradients. No characters except those that belong to the subject (soldiers of a troop building).
Kingdom theme: {theme}
{visual}
"""

KIND = {
    'troop': 'a building of the kingdom that trains soldiers (barracks, hall, workshop); one or two of its small soldiers may stand in front of it',
    'tower': 'a defensive tower or turret that shoots at enemies; show its top and its weapon clearly',
    'economy': 'a productive building or resource site that earns gold (mill, mine, field, market)',
    'support': 'a supporting building that buffs, heals or summons; show a clear magical or practical sign of its aura',
    'enchantment': 'an enchantment or blessing cast on a building: one iconic charm, emblem or glowing object with a visible effect',
    'tome': 'a spell: a spellbook, scroll or one iconic spell effect (not a building and not a character)',
    'throne': "the king's throne seat: a grand throne with the kingdom's emblem and a banner",
}

THEMES = {
    'wheat': ('golden ochre', 'a golden wheat field under a warm sky, a windmill silhouette far away', 'harvest farmland, golden wheat, wood and clay.'),
    'stone': ('cool slate blue-grey', 'jagged slate mountains with faintly glowing rune stones and mist', 'mountains, quarry, runes, crystal.'),
    'arcane': ('deep violet and purple', 'floating books, rune circles and drifting purple crystals', 'books, runes, purple crystals.'),
    'grove': ('forest green', 'ancient trees with hanging vines, glowing spores and mushrooms', 'ancient forest, roots, flowers.'),
    'tide': ('sea teal', 'a stormy teal sea with waves, a ship silhouette and a lighthouse', 'ships, rope, shells, sea.'),
    'forge': ('ember red-brown', 'a furnace glow, a lava river, chains and flying sparks', 'anvil, steel, coals.'),
    'clock': ('brass amber', 'giant interlocking brass gears, a clock face and drifting steam', 'gears, copper, springs.'),
    'moon': ('night indigo', 'a crescent moon, a star-filled sky and a ruined stone arch', 'moon, ancient stone, shadows.'),
    'nomad': ('desert sand-gold', 'steppe and dunes at sunset, felt tents and long banners', 'tents, woven carpets, steppe banners.'),
    'neutral': ('warm stone and wood brown', 'a plain meadow with a dirt road and a few trees', 'common buildings and tools of any kingdom, wood and stone.'),
}


# What the picture must show, per card, when the name and the function are not enough to draw the right subject.
VISUAL = {
    'arcane_apprentices': 'a small magic academy: a violet-roofed hall with a round window, an open book and a quill sign above the door, floating books drifting around it, and three tiny apprentice mages in pointed hats on the steps.',
    'arcane_archmage': 'a tall slender archmage tower with a star-shaped observatory dome, a large violet crystal orb floating above the top, golden constellations engraved on the walls, and a robed archmage with a staff on the balcony.',
    'arcane_frost_mages': 'a violet-stone tower coated with ice, icicles hanging from the eaves, pale blue frost crystals around its base, two small frost mages with glowing blue hands at the door; the top of the tower visible.',
    'arcane_haste_rune': 'the SUBJECT is a haste rune charm: a glowing violet rune disc with swift wing-like streaks and trailing sparks, floating above a small stone pedestal; one iconic charm, no building, no people.',
    'arcane_library': 'a grand arcane library: a violet-roofed hall with tall arched windows full of glowing books, a stack of floating tomes beside the door, a round rune window on the front, a lantern with a violet flame.',
    'arcane_mage_tower': 'a compact mage tower with a pointed violet roof, a glowing purple crystal on the top, a lightning arc leaping from the crystal toward the right, rune bands around the tower body; the roof and top clearly visible.',
    'arcane_mirror': 'the SUBJECT is a tall ornate mirror in a violet-gold frame standing on a small base, showing a duplicate glowing rune in its glass, two sparkles at the edges; one iconic object, no building, no people.',
    'arcane_spark_rune': 'the SUBJECT is a spark rune charm: a violet rune stone with bright yellow-white lightning sparks bursting from it, small floating embers; one iconic charm, no building, no people.',
    'arcane_throne': 'the SUBJECT is a star throne: a high-backed violet-and-silver throne decorated with gold stars and a crescent, a constellation banner behind it, small floating crystals, standing on a rune-circle dais; front facing, seen from the 45-degree downward view.',
    'arcane_ward': 'a ward circle: a glowing violet rune ring on the ground around a short stone obelisk, a translucent blue-violet shield dome shimmering above it, small floating shield glyphs; flat ground ring seen from the 45-degree downward view.',
    'grove_bear_cave': 'a bear cave: a mossy rock mound with a dark cave mouth, a big brown forest bear peeking out of it, gnawed bones and honey pots at the entrance, ferns and a gnarled tree growing over the rock; the top of the mound visible.',
    'grove_deep_roots': 'the SUBJECT is a deep roots charm: thick glowing green roots curling out of a small patch of earth around a carved wooden rune disc, tiny green sparks rising; one iconic charm, no building, no people.',
    'grove_sapling': 'a young sapling: a small tree with a bright leafy crown growing from a round stone planter ringed with flowers, a wooden stake and a hanging lantern, glowing green spores; a living tree, not a house.',
    'grove_spirit_stags': 'a glade shrine with two white spirit stags with glowing antlers standing beside a moss-covered stone arch, flowers and floating pale-green spores; the two stags are the clear subject.',
    'grove_spring': 'a rejuvenating spring: a round mossy stone basin with clear glowing blue-green water, a small waterfall trickling in, lily pads, flowers and fireflies around it; flat basin seen from the 45-degree downward view.',
    'grove_spring_rain': 'the SUBJECT is a spring rain charm: a small green storm cloud raining glowing droplets onto a cluster of sprouting flowers and seedlings, a tiny rainbow arc; one iconic charm, no building, no people.',
    'grove_thorn_tower': 'a tower woven from living thorned vines and gnarled wood, a crown of sharp thorns on top with a glowing green sap tip, red thorn flowers; the top of the tower clearly visible.',
    'grove_treant': 'an awakened ancient tree: a huge treant with a bark face, glowing amber eyes and branch arms, roots like feet, a small moss-covered stone beneath it, leaves falling; the treant is the subject.',
    'grove_wolf_den': 'a wolf den: a hollow among big roots and rocks with a dark opening, three grey wolves resting and watching in front, a skull totem on a post, moss and ferns; the top of the roots visible.',
    'tide_cannon': 'a sea fortress: a squat stone-and-timber bastion on a rocky shore with a big bronze cannon on its roof pointing right, cannonballs stacked beside it, a teal pennant, barnacles and rope on the walls; the roof and cannon clearly visible.',
    'tide_harbor': 'a harbor: a wooden pier with a small dockside warehouse with a teal roof, a moored fishing boat, crates, barrels and coiled rope, a hanging lantern and gulls; seen from the 45-degree downward view.',
    'tide_hookmen': 'a dockside barracks hut of weathered driftwood with a rack of long boat hooks and ropes beside the door, a torn teal sail as an awning, and two small sailors with boat hooks standing in front.',
    'tide_kraken': 'a deep whirlpool pit in the sea with four large teal-purple kraken tentacles rising out of the dark water around a ring of rocks, foam and a small broken boat plank; the tentacles are the clear subject.',
    'tide_pirates': 'a pirate ship moored at the shore: a small wooden ship with a black-and-teal skull-less sail, a cannon port and a rope ladder, barrels on the deck, and three tiny pirates with cutlasses on the beach in front.',
    'tide_privateers': 'the SUBJECT is a mercenary contract: a rolled parchment tied with a teal ribbon and a wax seal lying on a pile of gold coins with a cutlass beside it; one iconic object, no building, no people.',
    'tide_treasure': 'the SUBJECT is an open treasure chest half buried in beach sand, overflowing with gold coins, pearls and gems, a starfish and shells beside it, a soft golden glow; one iconic object, no building, no people.',
    'tide_undertow_rune': 'the SUBJECT is an undertow rune charm: a teal rune stone ringed by a swirling current of water with foam streaks pulling to one side, small bubbles and a seashell; one iconic charm, no building, no people.',
    'tide_wave_tower': 'a lighthouse-like wave tower: a round white-and-teal stone tower on a rock with a glowing teal crystal lamp on top, a big curling wave of water rolling out from its base toward the right; the top of the tower clearly visible.',
    'forge_armory': 'an armory: a sturdy brick-and-iron hall with a slate roof, racks of shields, helmets and breastplates visible at the open door, a large steel shield hung on the front wall, a red banner; stacked armor crates beside it.',
    'forge_blast_furnace': 'a blast furnace: a tall brick furnace stack with a glowing orange mouth, smoke rising from the top chimney, iron pipes and chains, a small ore cart and an ingot pile beside it; the top of the stack visible.',
    'forge_bombardiers': 'a rough barracks of dark timber and iron plates with a rack of fire-pots and flame throwers by the door, a red banner, and two small soldiers with fire-pots standing in front, embers drifting.',
    'forge_ember_rune': 'the SUBJECT is an ember rune charm: a glowing red-orange rune disc embedded in a lump of burning coals, small flames and flying sparks around it; one iconic charm, no building, no people.',
    'forge_flame_tower': 'a flame tower: a squat iron-and-brick tower with a fire nozzle on top spraying a fan of orange flame to the right, a barrel of oil and pipes on its side; the top of the tower and the flame clearly visible.',
    'forge_iron_drake': 'a drake roost: a rocky ledge with an iron-plated dragon lair, a steel-scaled iron drake with glowing ember eyes coiled in front of the dark opening, a trail of smoke, bones and chains; the drake is the clear subject.',
    'forge_master_hammer': 'the SUBJECT is a master smith hammer: a large steel warhammer with a glowing red-hot head resting upright on a small anvil, showers of golden sparks; one iconic object, no building, no people.',
    'forge_smithy': 'a blacksmith forge: a stone-and-timber smithy with a glowing forge open at the front, an anvil with a hammer, a water barrel, hanging tongs and swords, a smoking chimney; a different building shape from the armory.',
    'forge_swordsmen': 'a steel barracks: a long stone hall with an iron-banded roof, crossed swords above the door, a weapon rack with swords and a training dummy, and three tiny steel swordsmen in front.',
    'stone_catapult': 'a stout slate-stone tower whose top platform holds a large wooden-and-iron catapult arm loaded with a boulder; stacked stone blocks and spare boulders beside the base.',
    'stone_crystal': 'a slender slate tower crowned with a large glowing blue-white crystal on its top platform, thin crystal beams, crystal shards around the base, runes carved on the tower.',
    'stone_golem_forge': 'a slate-stone workshop with a broad slab roof and a big chimney, a half-built rune-carved stone golem standing in the open doorway, chisels, hammers and rock blocks outside, softly glowing runes.',
    'stone_miners': 'a mining hall built into a rocky hillside with a timber-framed mine entrance, ore carts on rails, pickaxes on a rack and hanging lanterns; two small miners with helmets and pickaxes in front of it, a pile of rubble.',
    'stone_mountain_heart': 'a squat stone shrine tower whose top holds a huge pulsing red-orange mountain-heart crystal inside a carved stone ring, cracks of light, shock rings on the ground around the base.',
    'stone_quarry': 'an open stone quarry: stepped cut grey rock faces, a wooden crane and hoist, stacked blocks of cut stone, a small cart and a low timber shed; keep the same 45-degree downward view so the pit and its steps are visible.',
    'stone_rune_carving': 'the SUBJECT is a slab of slate with a freshly carved glowing rune, a chisel and mallet resting beside it, glowing rune dust in the air; one iconic object, no building, no people.',
    'stone_stoneskin': 'the SUBJECT is a stone-skin charm: a smooth round stone medallion with a glowing rune, overlapping stone plates forming around it like armour; one iconic charm, no building, no people.',
    'stone_throne': 'the SUBJECT is a throne carved from a single block of slate with rune lines and a boulder-shaped backrest, standing on a stone dais with a mountain-emblem banner behind it; front facing, seen from the 45-degree downward view.',
    'stone_wall': 'a sturdy slate-stone wall section with a gate and a crenelated top, stacked stone blocks and two wooden spikes, a torch on a post; thick and tough, front facing, its top visible.',
    'wheat_fertilizer': 'the SUBJECT is one burlap sack of rich dark compost tipped over a patch of young green sprouts, golden-green glowing motes drifting up from it; a small seedling growing; one iconic charm, no building, no people.',
    'wheat_field': 'a tidy plot of ripe golden wheat in neat rows with a low wooden fence and a small gate in front; the fence posts and the gate have visible height. This is flat farmland, not a house: keep the same 45-degree downward view so the rows recede, and show a few wheat sheaves.',
    'wheat_granary': 'a wooden granary raised on posts with a ladder, a broad thatched roof, sacks of grain at the door and hanging wheat bundles.',
    'wheat_militia': 'a humble thatched cottage barracks with a rack of pitchforks and wooden shields beside the door, a small red banner on the roof, and two small peasant militiamen with pitchforks standing in front.',
    'wheat_peasant_horde': 'a rough camp longhouse with a patched cloth-and-straw roof, a torn red banner on the ridge, pitchforks and scythes leaning on a rack, a hay cart beside it; two or three small angry peasants with pitchforks in front.',
    'wheat_reapers': 'a farmhouse barn with a clay-tile roof, a big sickle hung beside the door, wheat sheaves, grain baskets, rakes and sacks; a different building from the approved reference house (change the proportions and props).',
    'wheat_throne': 'the SUBJECT is a throne made of bound golden wheat sheaves and warm wood with golden wheat-ear ornaments, a wheat-emblem banner behind it, standing on a stone dais; front facing, seen from the 45-degree downward view.',
    'wheat_windmill': 'a stone-and-timber windmill whose body is straight and upright, seen with the camera pitched 45 degrees DOWN: the viewer clearly sees the TOP of the windmill (the upper surface of its cap), with the sails fixed on the front; a flour sack cart at the door.',
    'wheat_scarecrow': 'the SUBJECT is a big straw-hat SCARECROW standing upright on a short wooden watch platform with a small straw roof, holding a sling; ladder at the front, sacks on the rail. The scarecrow is the first thing the eye sees (no crossbow or ballista).',
}


# G5 (2026-11-09): cards that had no picture yet (Clock, Moon, Nomad, neutral, the new thrones).
VISUAL.update({
    'clock_bell_tower': 'a slender brass-and-stone clock bell tower with a big bronze bell visible in its open top, gears on the side, ripples of sound around the bell; the top of the tower clearly visible.',
    'clock_colossus': 'a big brass workshop hall with a huge furnace door, a giant brass automaton half-assembled on a gantry in front of it, steam and gears; the colossus is the clear subject.',
    'clock_gear_tower': 'a squat brass turret built around a large spinning cogwheel, a small repeating gun on top, copper pipes; the top and the gun clearly visible.',
    'clock_rewind': 'the SUBJECT is an ornate brass pocket watch floating open, its hands spinning backwards with a glowing blue trail curling counter-clockwise; one iconic object, no building, no people.',
    'clock_spiders': 'a small brass workshop with a round porthole door, three little clockwork spiders crawling out of it, scattered gears and springs; the spiders are the subject.',
    'clock_spring_workshop': 'a cosy workshop with a blue slate roof and a big coiled spring hanging as a sign, crates of springs and gears at the door, a crank on the wall.',
    'clock_steam_cannon': 'a heavy brass steam cannon on a riveted stone base, a pressure boiler behind it puffing steam, a stack of cannonballs; the cannon clearly visible.',
    'clock_throne': 'the SUBJECT is a throne of polished brass with a big cogwheel backrest and a clock face set in it, gear ornaments, a gear-emblem banner behind it, standing on a stone dais; front facing, seen from the 45-degree downward view.',
    'clock_tick_rune': 'the SUBJECT is a round brass rune medallion with a ticking second hand on it, small glowing blue tick marks around its rim; one iconic charm, no building, no people.',
    'clock_windup_soldiers': 'a toy-like tin barracks painted blue and gold with a giant wind-up key on its roof, two little tin soldiers with keys in their backs marching out of the door.',
    'forge_throne': 'the SUBJECT is a throne forged from dark iron with a giant anvil as its seat back, glowing ember-red seams, hammers crossed above it and a red banner, standing on a stone dais; front facing, seen from the 45-degree downward view.',
    'grove_throne': 'the SUBJECT is a throne grown from a living ancient tree, its backrest a curved trunk with a leafy crown and antlers, roots for legs, moss and flowers, a leaf banner; front facing, seen from the 45-degree downward view.',
    'moon_altar': 'a moonstone altar shrine with violet candles and a silver crescent on top, small offering bowls on its steps, a faint violet glow; mysterious but cute, not gory.',
    'moon_blood_moon_rune': 'the SUBJECT is a crimson moon rune disc with a crescent carved in it, glowing red-violet light drifting like mist from its rim; one iconic charm, no building, no people, not gory.',
    'moon_blood_pact': 'the SUBJECT is a rolled violet contract scroll sealed with a crescent wax seal, a small silver dagger crossed over it and a few gold coins; one iconic object, no building, no people, not gory.',
    'moon_crypt': 'a small stone crypt with a violet tiled roof and a crescent over the door, three cute skeletons peeking out of the open door, candles on the steps; not scary.',
    'moon_eclipse_pact': 'the SUBJECT is a dark eclipse disc ringed by a thin silver crescent floating above an open book of pacts, a single fading heart-shaped light leaving it; one iconic object, no building, no people.',
    'moon_reaper_shrine': 'a tall moonstone shrine with a hooded reaper statue holding a crescent scythe in an arched niche, violet banners, candles; mysterious but cute.',
    'moon_shadow_spire': 'a slender dark moonstone spire with a floating violet crystal on top, small cute shadow ghosts circling it; the top of the spire clearly visible.',
    'moon_summoning_circle': 'a glowing violet summoning circle on a moonstone floor ringed by candles and small standing stones, a small cute ghost rising from its centre.',
    'moon_throne': 'the SUBJECT is a pale moonstone throne with a crescent-moon backrest and a dark eclipse disc above it, violet cushions, candles, a crescent banner, standing on a stone dais; front facing, seen from the 45-degree downward view.',
    'moon_vampires': 'a small elegant gothic manor with violet roofs and pointed towers, lit arched windows, bats circling the towers, a red carpet at the door; charming, not scary.',
    'neutral_archer_tower': 'a sturdy wooden archer tower on a stone base with a shingled roof, a bow and arrow slits, a quiver rack; the top of the tower clearly visible.',
    'neutral_barracks': 'a plain timber barracks with a shingled roof, a weapon rack of spears and shields by the door, a blue pennant, a training dummy.',
    'neutral_clear_land': 'the SUBJECT is a patch of wild land being cleared: an axe stuck in a stump, a pile of cut brush and a fresh square of tilled earth with a little marker stake; one iconic scene, no building, no people.',
    'neutral_demolish': 'the SUBJECT is a big wooden mallet striking a small cracked wooden house that falls apart into planks and a puff of dust, a few gold coins bouncing out; one iconic scene, no people.',
    'neutral_duplicate': 'the SUBJECT is a small house and its glowing translucent copy beside it, linked by a shimmering blue mirror light; one iconic scene, no people.',
    'neutral_fortify': 'the SUBJECT is a round steel shield with an iron rivet ring and a stone-brick emblem, glowing golden lines of strength around it; one iconic charm, no building, no people.',
    'neutral_mercenary_camp': 'a canvas tent camp with a striped awning, a signboard with a coin symbol, a weapon rack and a chest of gold coins at the entrance.',
    'neutral_move': 'the SUBJECT is a small house lifted on wooden rollers with ropes, a dotted arrow showing it moving to a new spot; one iconic scene, no people.',
    'neutral_promote': 'the SUBJECT is a small golden star badge with an upward arrow rising above a little house, sparkles around it; one iconic object, no people.',
    'neutral_royal_seal': 'the SUBJECT is a heavy golden royal seal stamping a crown emblem in red wax on a parchment, a small glow; one iconic object, no people.',
    'neutral_sharpen': 'the SUBJECT is a sword blade on a round whetstone with bright sparks flying, a gleaming edge; one iconic object, no people.',
    'neutral_well': 'a small stone village well with a wooden roof, a rope and bucket, a few gold coins glinting in the bucket.',
    'nomad_bazaar': 'a colourful steppe market stall of golden felt and red cloth with rugs, pots, spices and sacks laid out under its awning.',
    'nomad_caravan': 'a loaded caravan wagon with a golden felt cover, bundles, barrels and rugs tied on, a small horse beside it.',
    'nomad_horse_archers': 'a round golden felt yurt-barracks with a rack of short recurve bows and quivers, a horse tied at the post beside it.',
    'nomad_khan_guard': 'a large red-and-gold guard yurt with a spiked horse-tail standard, lamellar armour and glaives on a rack by the entrance.',
    'nomad_relocate': 'the SUBJECT is a folded felt yurt being packed onto a horse with ropes and poles, a dotted trail across the steppe to a new spot; one iconic scene, no people.',
    'nomad_riders': 'a wooden stable-barracks with a red felt roof and a horse-head carving, two saddled horses at the rail, sabres on the wall.',
    'nomad_stables': 'a long open stable with a golden felt roof, horses peeking out of the stalls, hay bales and a water trough.',
    'nomad_throne': 'the SUBJECT is a low throne of golden felt cushions and carved wood under a small round canopy with a golden crown finial, rugs and a horse-tail standard, standing on a raised wooden dais; front facing, seen from the 45-degree downward view.',
    'nomad_watchtower': 'a tall wooden steppe watchtower wrapped in red felt with a small platform on top, flags fluttering, a bow and a horn at the top; the top clearly visible.',
    'nomad_wind_rune': 'the SUBJECT is a carved bone rune charm tied with a red ribbon, swirling streaks of steppe wind and grass blades whirling around it; one iconic charm, no building, no people.',
    'tide_throne': 'the SUBJECT is a throne carved from pink coral and pearl with a seashell backrest, an anchor and a small brass cannon beside it, a sea-teal banner, standing on a stone dais; front facing, seen from the 45-degree downward view.',
})

def load_cards():
    return {c['id']: c for c in json.loads(CATALOG.read_text(encoding='utf-8'))}


def build_prompt(out, card):
    if not (ROOT / STYLE_DOC).exists() or not (ROOT / REFERENCE).exists():
        raise SystemExit('docs/ART_STYLE.md or the approved reference image is missing: refusing to generate images')
    hue, bg, theme = THEMES[card['owner']]
    portrait = f"docs/art-review/g3e/portraits/{card['owner']}/source.png"
    has_portrait = card['owner'] != 'neutral' and (ROOT / portrait).exists()
    note = PORTRAIT_NOTE.format(portrait=portrait) if has_portrait else '.'
    head = HEADER.format(out=out, doc=STYLE_DOC, ref=REFERENCE, portrait_note=note)
    if card['kind'] in BUILDING_KINDS:
        # A building card: the approved template block, with the card as the building and its function and theme.
        body = _buildings.style_template().replace('[building and function]', f"{card['nameVi']} ({KIND[card['kind']]}). Card function: {card['summary']}").replace(
            '[Materials and identifying tools.]', f"{VISUAL.get(card['id'], '')} Materials and identifying tools of this kingdom: {theme}".strip())
        return head + body + CARD_OVERRIDE.format(bg=bg, hue=hue)
    body = BODY.format(visual=VISUAL.get(card['id'], ''), name=card['nameVi'], summary=card['summary'], kind_desc=KIND[card['kind']], hue=hue, bg=bg, theme=theme)
    return head + body


def main(only):
    cards = load_cards()
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for cid in only:
        card = cards[cid]
        d = D / cid
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(build_prompt(out, card), encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        images = f'-i {REFERENCE}'
        portrait = f"docs/art-review/g3e/portraits/{card['owner']}/source.png"
        if card['owner'] != 'neutral' and (ROOT / portrait).exists():
            images += f' -i {portrait}'
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" {images} - < {prompt} > .superpowers/codex-c-{cid}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{cid} ok" >> .superpowers/c.log; else echo "{cid} MISSING" >> .superpowers/c.log; fi')
    runner.append('echo done >> .superpowers/c.log')
    path = ROOT / '.superpowers/c.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit('usage: make_prompts.py <card_id> [card_id ...]')
    main(sys.argv[1:])
