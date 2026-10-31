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
