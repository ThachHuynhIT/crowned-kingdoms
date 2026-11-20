"""Building idle/activity animations from the approved level-1 isometric pictures (2026-11-20).

    python docs/art-review/building-anim/make_anim.py prompt <card>                 # template.png, source.png, prompt.md
    python docs/art-review/building-anim/make_anim.py cut <card> [-r1]              # density 2 frames, GIF, review board
    python docs/art-review/building-anim/make_anim.py cut <card> [-r1] --density 4  # HiDPI twins  -> <card>/hd/
    python docs/art-review/building-anim/make_anim.py cut <card> [-r1] --density 8  # close-up twins -> <card>/uhd/
    python docs/art-review/building-anim/make_anim.py contact <out.png> <card> ...  # strips of several cards (review)
    python docs/art-review/building-anim/make_anim.py list                          # every card and its source

Each animation has 3 frames. Frame 0 is the shipped picture (`public/assets/art/ai-v1/iso[-neutral]/<card>.png`, or
its ai-v1-hd / ai-v1-uhd twin), unchanged. Frames 1 and 2 come from ONE Codex image (`anim-source.png`, 1536x1024):
three panels side by side, each 512 px wide, redrawn from `template.png`, which holds three identical copies of the
approved source building at the same canvas position. Only the moving parts (sails, smoke, banners, fire, glow) may
change. The prompt is built from the "Prompt isometric dùng lại" block of docs/ART_STYLE.md
(`docs/art-review/g3e/buildings/make_prompts.py` `iso_template`).

Geometry: the shipped picture is the source object (keyed with the cutter that made it: `iso-board/make_assets.py`
threshold key for most cards, `g5/recut_border_key.py` border-connected key for the re-keyed Forge cards) box-reduced
to a grid of `full` cells and cropped with `base_box`. The script checks that it reproduces the shipped density-2
picture pixel for pixel, then maps each Codex panel onto that same grid (after an integer offset search against the
template), so frames have the base's size and feet anchor. Density 4/8 use the same grid at m = density/2 times the
cells (as `iso.reduce_hd` / the recut's m-times size), so every HD/UHD frame is exactly m times its density-2 twin.

Padding: moving parts may reach past the base (smoke above a chimney, a flag tip). `pad` = (left, top, right, bottom)
native px of transparent margin added to all 3 frames of a card (frame 0's pixels unchanged); left = right and
bottom = 0, so the feet anchor (0.5, 1) holds. It is fixed in EXTRAS or found at density 2 (smallest pad holding every
frame, at most PAD_MAX) and saved in `<card>/anim.json`; density 4/8 reuse it times m.

Report per frame: % of pixels inside the building mask (base alpha OR frame alpha) whose max channel difference is
above TOL or whose alpha differs (the resampling floor is about 0.3%). `locked` frames (`<card>_anim_N.png`) copy
the base pixel wherever the difference is at most TOL, so static pixels are bit-identical to the base; `raw/` keeps
the unlocked cut. Panel 1 (Codex's own copy of frame 0) is cut too and reported as `drift`.
"""
import importlib.util
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
A = ROOT / 'docs/art-review/building-anim'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
ISO_REFERENCE = 'docs/art-review/style-references/iso-building-approved.png'
ART_SETS = {2: 'ai-v1', 4: 'ai-v1-hd', 8: 'ai-v1-uhd'}
OUT_SUB = {2: '', 4: 'hd', 8: 'uhd'}

_spec = importlib.util.spec_from_file_location('iso_assets', ROOT / 'docs/art-review/iso-board/make_assets.py')
iso = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(iso)
_spec = importlib.util.spec_from_file_location('make_prompts', ROOT / 'docs/art-review/g3e/buildings/make_prompts.py')
mp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mp)

PANEL_W, CANVAS_H, PANELS = 512, 1024, 3
FIT_DEFAULT = (400, 860)  # object box in a panel (the first samples used 470 x 940, kept in their template.json)
FEET_Y = 990
TOL = 40          # max channel difference treated as "unchanged" when locking static pixels
SEARCH = 24       # +- px offset search when registering a panel to the template
PAD_MAX = (8, 10, 8, 0)
GIF_SCALE = 6
BORDER_KEY_CARDS = {'forge_bombardiers', 'forge_flame_tower', 'forge_iron_drake'}  # re-keyed by recut_border_key.py

STATIC = ('The walls, roof, door, windows and every other part of the building do NOT change at all.')

# card -> (subject, what moves in panels 2 and 3)
CARDS = {
    # --- samples (approved 20/11: catapult, throne; windmill rejected and dropped, stays static) ---
    'wheat_windmill': (
        'Cối Xay Gió (windmill, economy building) — idle animation, sails turning',
        'ONLY the four cloth sails and their wooden arms move: they turn around the hub (the round wooden boss on '
        'the cap), clockwise, staying in the SAME slanted plane of the right (south-east) face of the cap. '
        'Panel 2: the sails turned 30 degrees from panel 1; panel 3: turned 60 degrees from panel 1 (a further 30 '
        'degrees turns them back onto panel 1, since the four sails repeat every 90 degrees, so the loop is seamless). '
        'Every sail keeps the same cloth, lattice, wood and colours as in panel 1 (its length on screen follows the tilted '
        'plane, see the geometry guide); the hub stays exactly in place; no sail tip goes outside the grey ellipse of '
        'the guide. '
        'Where a sail moves away, redraw the thatch, wall or black background that was behind it exactly as in '
        'panel 1. The thatched cap, tower, windows, door, stone base and flour sacks do NOT change at all.'),
    'stone_catapult': (
        'Tháp Ném Đá (stone catapult tower) — activity loop, the catapult winding up and the rune crystals pulsing',
        'ONLY these small parts change: (a) the wooden throwing arm with its sling cup and boulder is winched back a '
        'little: panel 2 the arm tilted back by about 8 degrees around its axle with the rope a bit tighter, panel 3 '
        'by about 16 degrees (the loop then snaps back to panel 1 as the shot is released); the A-frame, axle, winch '
        'drum and all the stonework stay exactly where they are; (b) the small glowing BLUE rune gems and crystals '
        '(on the battlements, the shield banners and the crystal clusters at the base) pulse: panel 2 slightly '
        'brighter, panel 3 brightest with one extra light pixel row on each gem, no glow halo spilling onto the '
        'stone or the background. The tower walls, battlements, door, banners shapes, boulders at the base and every '
        'other pixel do NOT change.'),
    'wheat_throne': (
        'Ngai Bó Lúa (the Wheat king\'s throne keep, it shoots at enemies) — firing loop',
        'ONLY these small parts change: (a) the golden wheat-sheaf crown on the top gathers light and fires: panel 2 '
        'a few of its gold ears glow brighter (lighter gold pixels, no blur), panel 3 the crown at its brightest '
        'with a small crisp pixel burst of golden light (a few square pixel sparks) just ABOVE the crown tips, '
        'inside the empty black space above it, as the shot leaves; (b) the two hanging blue-and-gold wheat banners '
        'on the front sway in the wind: panel 2 their lower ends swing a few pixels to the left, panel 3 a few pixels '
        'to the right, the top rod of each banner stays fixed. The keep walls, battlements, timber beams, door, '
        'window, steps, sacks and wheat sheaves at the base do NOT change at all.'),
    # --- thrones (they shoot) ---
    'arcane_throne': (
        'Ngai Pháp Sư (the Arcane king\'s throne tower, it shoots magic bolts) — firing loop',
        'ONLY these small parts change: the big purple crystal on the top charges and fires: panel 2 its facets a '
        'little brighter (lighter violet pixels), panel 3 at its brightest with a few crisp square violet-white '
        'spark pixels just above its tip in the empty space; the small gold star ornaments on the banners twinkle '
        '(one lighter pixel each in panel 3). ' + STATIC),
    'clock_throne': (
        'Ngai Đồng Hồ (the Clockwork king\'s throne, it shoots) — working loop',
        'ONLY these small parts change: (a) the big golden gear on the top turns clockwise in place around its own '
        'centre: panel 2 turned by one third of the spacing between two teeth, panel 3 by two thirds (so the loop '
        'repeats seamlessly), same size, same teeth, same colours; (b) the clock hands on the front tick forward a '
        'little each panel; (c) a small round steam puff (2-3 crisp light grey pixel clusters, no haze) rises from the '
        'copper pipe on the left: small in panel 2, larger and higher in panel 3. ' + STATIC),
    'forge_throne': (
        'Ngai Lò Rèn (the Forge king\'s throne, it shoots) — working loop',
        'ONLY these small parts change: (a) the fire in the brazier on the right of the top flickers: different '
        'flame tongue shapes in each panel, same size and colours (yellow, orange, red); (b) the smoke above the '
        'chimney on the left: the grey puffs rise, panel 2 a bit higher, panel 3 higher still with a new small puff '
        'at the chimney mouth (crisp pixel clusters, no haze; they may rise above the top of the picture into the '
        'empty space). The anvil, the drum walls, banners, tools, sacks and door do NOT change at all.'),
    'grove_throne': (
        'Ngai Cây Cổ Thụ (the Grove king\'s great tree throne, it shoots) — idle loop',
        'ONLY these small parts change: (a) the leaf clusters at the OUTER edge of the canopy rustle in the wind: a '
        'few edge clusters shift 1-2 art pixels left in panel 2 and right in panel 3; (b) the small hanging green '
        'fruits / lanterns and the two green banners sway gently, lower ends a few pixels left in panel 2, right in '
        'panel 3; (c) two or three tiny glowing green-gold sparkle pixels near the canopy appear in panel 3. The '
        'trunk, roots, door, antlers and the treehouse platform do NOT change at all.'),
    'moon_throne': (
        'Ngai Trăng (the Moon king\'s throne tower, it shoots) — firing loop',
        'ONLY these small parts change: (a) the dark crescent moon orb on the top charges: panel 2 its purple rim a '
        'little brighter, panel 3 at its brightest with a few crisp violet spark pixels just above it; (b) every '
        'small candle flame on the tower and at its base flickers (flame tip 1 pixel taller or leaning left/right). '
        + STATIC),
    'nomad_throne': (
        'Ngai Lều Khả Hãn (the Nomad king\'s great yurt throne, it shoots) — idle loop',
        'ONLY these small parts change: (a) the red pennant on the pole waves: its free end ripples, panel 2 and 3 '
        'with different wave shapes, the pole stays fixed; (b) the white horsetail standard sways a few pixels; '
        '(c) the red entrance curtains flutter slightly at their lower edges. The yurt dome, walls, crown ornament, '
        'carpet and saddle do NOT change at all.'),
    'stone_throne': (
        'Ngai Đá (the Stone king\'s throne keep, it shoots) — firing loop',
        'ONLY these small parts change: the glowing BLUE runes pulse: the rune ring around the top boulder and the '
        'rune marks on the shield banners, panel 2 a little brighter, panel 3 brightest (one lighter pixel row, no '
        'glow halo on the stone); the blue crystals at the base twinkle (one white pixel each in panel 3). The '
        'boulder, battlements, walls, door, pickaxe and rocks do NOT change at all.'),
    'tide_throne': (
        'Ngai Thủy Triều (the Tide king\'s coral keep, it shoots) — firing loop',
        'ONLY these small parts change: (a) the white trident flag on the pole waves (different ripple shapes in '
        'panels 2 and 3, the pole fixed); (b) the small cannon on the top fires: panel 2 unchanged cannon, panel 3 a '
        'small crisp puff of white-grey smoke pixels just in front of its muzzle (no haze). The coral crown, walls, '
        'banners, door, wheel, barrels and anchor do NOT change at all.'),
    # --- towers (they shoot) ---
    'wheat_scarecrow': (
        'Bù Nhìn Gác (scarecrow watch tower, it slings stones) — firing loop',
        'ONLY these small parts change: the scarecrow\'s sling arm: panel 2 the arm swung back a little, panel 3 swung '
        'further back and up with the sling pouch out (the loop snaps back as it throws); its straw hat brim and '
        'loose straw tufts flutter by one pixel. The platform, posts, straw roof, ladder, rail and sacks do NOT '
        'change at all.'),
    'stone_crystal': (
        'Tháp Pha Lê (crystal tower, it fires beams) — firing loop',
        'ONLY these small parts change: the big blue crystal on the top and the blue rune line down the front '
        'pulse: panel 2 brighter facets, panel 3 brightest with two or three crisp white-blue spark pixels around '
        'the crystal tip; the small crystals at the base twinkle (one white pixel each in panel 3). No glow halo on '
        'the stone. ' + STATIC),
    'stone_mountain_heart': (
        'Tim Núi (mountain heart tower with a glowing lava crystal) — pulsing loop',
        'ONLY these small parts change: (a) the big red-orange lava crystal on the top pulses: panel 2 its glowing '
        'cracks brighter yellow-orange, panel 3 brightest, with two or three crisp ember pixels rising just above '
        'it; (b) the blue rune lines and the blue crystals at the base pulse brighter in panel 3. No glow halo. '
        + STATIC),
    'arcane_mage_tower': (
        'Tháp Pháp Sư (mage tower, it shoots lightning) — firing loop',
        'ONLY these small parts change: (a) the jagged violet lightning bolt coming out of the crystal crackles: in '
        'each panel it has a DIFFERENT zig-zag shape and branching, about the same length, same violet and white '
        'colours, crisp pixels, no glow; (b) the purple crystal on the roof pulses brighter in panel 3. The house, '
        'roof, gold frame and door do NOT change at all.'),
    'clock_gear_tower': (
        'Tháp Bánh Răng (gear turret tower, it shoots) — working loop',
        'ONLY these small parts change: (a) the big golden gear behind the turret turns clockwise in place around its '
        'centre: panel 2 by one third of a tooth spacing, panel 3 by two thirds, same size and teeth; (b) the small '
        'gears on the wall turn the same way; (c) panel 3: a small crisp puff of grey smoke pixels at the turret '
        'barrels\' muzzles. ' + STATIC),
    'clock_steam_cannon': (
        'Đại Bác Hơi Nước (steam cannon tower) — firing loop',
        'ONLY these small parts change: (a) a small round steam puff (crisp light grey pixel clusters, no haze) rises '
        'from the copper pipe on the top: small in panel 2, bigger and higher in panel 3; (b) the small gears turn a '
        'little; (c) panel 3: a crisp puff of white-grey smoke just in front of the big cannon\'s muzzle. The cannon '
        'barrel, roof, walls, boiler and door do NOT change at all.'),
    'forge_flame_tower': (
        'Tháp Phun Lửa (flame-thrower tower) — firing loop',
        'ONLY these small parts change: (a) the jet of fire from the nozzle flickers: in each panel the flame has '
        'different tongue shapes and a slightly different length (a few pixels), same yellow-orange-red colours, '
        'crisp pixels; (b) the glowing furnace windows on the front flicker brighter/darker. The nozzle, pipes, '
        'barrel tank, walls, banners and door do NOT change at all.'),
    'grove_thorn_tower': (
        'Tháp Gai (thorn tower) — idle loop',
        'ONLY these small parts change: (a) the green vines and leaves hanging on the tower sway gently (leaf '
        'clusters shift 1-2 pixels left in panel 2, right in panel 3); (b) the red flowers pulse open: panel 3 their '
        'petals a little wider and brighter; (c) the two green banners sway at their lower ends. The wooden walls, '
        'thorn spikes, roots, windows and door do NOT change at all.'),
    'moon_shadow_spire': (
        'Ngọn Tháp Bóng Đêm (shadow spire, it shoots) — firing loop',
        'ONLY these small parts change: the purple orb held by the crescent on the top pulses: panel 2 brighter, '
        'panel 3 brightest with three or four crisp violet spark pixels around it; the small lamps on the walls '
        'flicker. ' + STATIC),
    'neutral_archer_tower': (
        'Tháp Cung (archer tower) — idle loop',
        'ONLY the small blue flag on the top pole moves: it waves, with a different ripple shape in panels 2 and 3, '
        'the pole fixed. The roof, the archer window with the bow, the wooden and stone walls and door do NOT change '
        'at all.'),
    'nomad_watchtower': (
        'Tháp Canh Du Mục (nomad watchtower) — idle loop',
        'ONLY the red pennants on the poles at the top move: each waves with a different ripple shape in panels 2 '
        'and 3, the poles fixed; the hanging banner on the front sways by one pixel at its lower edge. ' + STATIC),
    'tide_cannon': (
        'Pháo Đài San Hô (tide cannon tower) — firing loop',
        'ONLY these small parts change: (a) the white trident flag waves (different ripple shapes in panels 2 and 3, '
        'the pole fixed); (b) panel 3: a crisp puff of white-grey smoke pixels just in front of the brass cannon\'s '
        'muzzle as it fires (panel 2: a tiny spark at the touch hole). The cannon, cannonballs, coral, walls, '
        'barrels and anchor do NOT change at all.'),
    'tide_kraken': (
        'Hang Thủy Quái (kraken lair) — idle loop',
        'ONLY these small parts change: (a) the tentacles sway slowly: their curled TIPS move a few pixels (left in '
        'panel 2, right in panel 3), their bases stay in place; (b) the water of the whirlpool swirls: the spiral '
        'pattern and foam highlights rotate a little each panel. The brick rim, coral and shells do NOT change at '
        'all.'),
    'tide_wave_tower': (
        'Tháp Sóng (wave tower) — idle loop',
        'ONLY these small parts change: (a) the white foam crest of the curling wave on the right ripples and its '
        'spray droplets move (different crisp foam shapes in each panel); (b) the turquoise crystal on the top '
        'pulses brighter in panel 3. ' + STATIC),
    # --- other buildings ---
    'arcane_apprentices': ('Học Đồ (apprentices\' hall)',
        'ONLY these small parts change: the floating spell books around the roof bob up and down: panel 2 each book '
        '2 pixels higher, panel 3 1 pixel higher; the small violet crystal finials twinkle (one lighter pixel in '
        'panel 3). ' + STATIC),
    'arcane_archmage': ('Đại Pháp Sư (archmage tower)',
        'ONLY these small parts change: the floating purple orb on the top bobs (panel 2: 2 pixels higher, panel 3: '
        '1 pixel higher) and pulses brighter in panel 3; the gold stars on the walls twinkle. ' + STATIC),
    'arcane_frost_mages': ('Pháp Sư Băng (frost mages\' tower)',
        'ONLY these small parts change: the violet crystal on the spire pulses brighter in panel 3; tiny white '
        'glint pixels move along the icicles and the ice crystals at the base (different positions each panel). '
        + STATIC),
    'arcane_library': ('Thư Viện Phép (arcane library)',
        'ONLY these small parts change: the round rose window glows (panel 2 a little brighter, panel 3 brightest '
        'violet-gold); the hanging lantern\'s flame flickers. ' + STATIC),
    'arcane_ward': ('Kết Giới (arcane ward dome)',
        'ONLY these small parts change: the shimmering lighter facets on the blue dome drift slowly (the light '
        'streaks move a few pixels each panel), the floating shields pulse brighter in panel 3, the runes of the '
        'magic ring on the ground pulse. The dome outline, the obelisk and the ring shape do NOT change.'),
    'clock_bell_tower': ('Tháp Chuông (clockwork bell tower)',
        'ONLY these small parts change: the bronze bell swings: panel 2 tilted a few degrees to the left, panel 3 a '
        'few degrees to the right, hanging from the same point; the gears on the wall turn a little. ' + STATIC),
    'clock_colossus': ('Xưởng Người Khổng Lồ (colossus factory)',
        'ONLY these small parts change: (a) grey smoke puffs above the copper chimney rise (crisp pixel clusters, '
        'panel 2 higher, panel 3 higher still with a new small puff; they may rise into the empty space above); '
        '(b) the glowing furnace windows flicker; (c) the big gear on the wall turns a little. ' + STATIC),
    'clock_spiders': ('Xưởng Nhện Máy (clockwork spider workshop)',
        'ONLY these small parts change: (a) smoke puffs above the chimney rise (crisp pixel clusters, may go into '
        'the empty space above); (b) the glowing furnace lamp on the left flickers; (c) the small gears turn a '
        'little. ' + STATIC),
    'clock_spring_workshop': ('Xưởng Lò Xo (spring workshop)',
        'ONLY these small parts change: (a) smoke puffs above the copper chimney rise (crisp pixel clusters, may go '
        'into the empty space above); (b) the gears on the walls turn a little each panel. ' + STATIC),
    'clock_windup_soldiers': ('Lính Lên Dây Cót (wind-up soldiers\' workshop)',
        'ONLY these small parts change: (a) the big brass wind-up key on the front turns around its own axis (panel '
        '2 a quarter turn shown narrower, panel 3 edge-on, as a key rotating); (b) smoke puffs above the chimney '
        'rise; (c) the gears turn a little. ' + STATIC),
    'forge_armory': ('Kho Vũ Khí (armory)',
        'ONLY these small parts change: (a) grey smoke puffs above the chimney rise (crisp pixel clusters, may go '
        'into the empty space above); (b) the wall lanterns\' flames flicker. ' + STATIC),
    'forge_blast_furnace': ('Lò Cao (blast furnace)',
        'ONLY these small parts change: (a) the grey smoke puffs above the furnace top rise (panel 2 higher, panel 3 '
        'higher still with a new small puff; crisp pixel clusters, they may rise into the empty space above); (b) the '
        'fire in the furnace mouth and at the top opening flickers (different flame shapes). ' + STATIC),
    'forge_bombardiers': ('Xưởng Pháo Thủ (bombardiers\' workshop)',
        'ONLY these small parts change: (a) the glowing chimney top and the furnace windows flicker; (b) a few small '
        'orange spark pixels and a small grey smoke puff rise above the chimney (may go into the empty space above). '
        + STATIC),
    'forge_iron_drake': ('Hang Rồng Sắt (iron drake lair)',
        'ONLY these small parts change: (a) the grey smoke curl above the chimney rises and changes shape (may go '
        'into the empty space above); (b) the red-orange glow behind the bars and at the drake\'s mouth flickers; '
        '(c) the drake\'s eye glows brighter in panel 3. ' + STATIC),
    'forge_smithy': ('Lò Rèn (smithy)',
        'ONLY these small parts change: (a) the smoke puffs above the chimney rise (may go into the empty space '
        'above); (b) the forge fire in the side opening flickers (different flame shapes). ' + STATIC),
    'forge_swordsmen': ('Doanh Trại Kiếm Sĩ (swordsmen\'s barracks)',
        'ONLY these small parts change: the glowing window flickers warmer/brighter, and a small white glint pixel '
        'runs along the crossed swords on the gable (a different position each panel). ' + STATIC),
    'grove_bear_cave': ('Hang Gấu (bear cave)',
        'ONLY these small parts change: (a) the bear peeking out of the cave breathes: panel 2 its head 1 pixel '
        'lower, panel 3 back up with its eyes closed (a blink); (b) the leaf clusters of the tree on top rustle at '
        'their edges (1-2 pixels). The rocks, moss, cave mouth and honey pot do NOT change at all.'),
    'grove_sapling': ('Cây Non (sacred sapling)',
        'ONLY these small parts change: (a) the leaf clusters rustle at their edges (1-2 pixels left in panel 2, right '
        'in panel 3); (b) the hanging lantern sways slightly and its light flickers; (c) the tiny green sparkle '
        'pixels around the tree move to new positions. The stone ring, flowers and post do NOT change at all.'),
    'grove_spirit_stags': ('Cổng Hươu Thần (spirit stag gate)',
        'ONLY these small parts change: (a) the tiny glowing firefly / sparkle pixels drift to new positions; (b) the '
        'ivy leaves on the arch rustle at their edges; (c) the green banners sway by one pixel. The arch, stone '
        'stags and pillars do NOT change at all.'),
    'grove_spring': ('Suối Thiêng (sacred spring)',
        'ONLY these small parts change: (a) the waterfall flows: its light stripes move DOWN a few pixels each '
        'panel (so the loop reads as falling water); (b) the pool ripples: the white highlights and sparkles on the '
        'water move to new positions; (c) the floating sparkles above drift. The stone rim, roots, lily pads and '
        'flowers do NOT change at all.'),
    'grove_treant': ('Người Cây (treant grove)',
        'ONLY these small parts change: (a) the leaf clusters of the crown rustle at their edges; (b) the two branch '
        'arms sway a little (their tips 2 pixels up in panel 2, down in panel 3); (c) the face blinks in panel 3. '
        'The trunk, roots and door do NOT change at all.'),
    'grove_wolf_den': ('Hang Sói (wolf den)',
        'ONLY these small parts change: (a) the green banners sway at their lower ends; (b) the fern and leaf '
        'clusters on the mound rustle at their edges; (c) two small yellow wolf eyes glow inside the dark den mouth '
        'in panel 3. The roots, rocks and skull do NOT change at all.'),
    'moon_altar': ('Tế Đàn Trăng (moon altar)',
        'ONLY these small parts change: the violet flame in the brazier in the alcove flickers (different flame '
        'shapes), and every small candle flame flickers. ' + STATIC),
    'moon_crypt': ('Hầm Mộ (crypt)',
        'ONLY these small parts change: every small candle flame flickers, and the glowing windows pulse a little '
        'brighter in panel 3. ' + STATIC),
    'moon_reaper_shrine': ('Đền Thần Chết (reaper shrine)',
        'ONLY these small parts change: every small candle flame flickers, the arched windows\' glow pulses '
        'brighter in panel 3, and a white glint pixel moves along the scythe blade. ' + STATIC),
    'moon_summoning_circle': ('Vòng Triệu Hồi (summoning circle)',
        'ONLY these small parts change: the crescent rune circle on the platform glows (panel 2 brighter, panel 3 '
        'brightest violet), and every small candle flame flickers. ' + STATIC),
    'moon_vampires': ('Lâu Đài Ma Cà Rồng (vampire manor)',
        'ONLY these small parts change: the small bat above the door flaps its wings (panel 2 wings up, panel 3 '
        'wings down), and every candle flame flickers. ' + STATIC),
    'neutral_barracks': ('Doanh Trại (barracks)',
        'ONLY these small parts change: (a) the blue flag on the pole waves (different ripple shapes, the pole '
        'fixed); (b) a small grey smoke puff rises from the chimney (may go into the empty space above). ' + STATIC),
    'neutral_mercenary_camp': ('Trại Lính Đánh Thuê (mercenary camp)',
        'ONLY these small parts change: (a) the blue flag on the tent pole waves (different ripple shapes, the pole '
        'fixed); (b) the hanging coin sign sways a little on its chains. The tent, awning, weapon rack and chest do '
        'NOT change at all.'),
    'neutral_well': ('Giếng (well)',
        'ONLY these small parts change: (a) the blue flag on the roof waves (different ripple shapes, the pole '
        'fixed); (b) the hanging bucket sways a little on its rope; (c) a glint pixel moves on the coins in the '
        'bucket. The roof, posts and stone well do NOT change at all.'),
    'nomad_bazaar': ('Chợ Du Mục (nomad bazaar)',
        'ONLY these small parts change: the red curtains and the hanging tassels flutter slightly at their lower '
        'edges (a few pixels left in panel 2, right in panel 3). The tent roof, frame and goods do NOT change.'),
    'nomad_caravan': ('Đoàn Lữ Hành (caravan tent)',
        'ONLY these small parts change: the red curtains and the hanging pennant edges flutter slightly at their '
        'lower edges. The tent roof, walls, door, barrels and crates do NOT change.'),
    'nomad_horse_archers': ('Kỵ Xạ (horse archers\' tent)',
        'ONLY these small parts change: (a) a small grey smoke puff rises from the chimney (may go into the empty '
        'space above); (b) the red curtains flutter slightly at their lower edges. ' + STATIC),
    'nomad_khan_guard': ('Cận Vệ Khả Hãn (khan guard tent)',
        'ONLY these small parts change: (a) the red-yellow pennant on the top pole waves (different ripple shapes, '
        'the pole fixed); (b) the red curtains flutter slightly. ' + STATIC),
    'nomad_riders': ('Kỵ Binh (riders\' stable tent)',
        'ONLY these small parts change: the red curtains and the hanging banners flutter slightly at their lower '
        'edges. ' + STATIC),
    'nomad_stables': ('Chuồng Ngựa (stables)',
        'ONLY these small parts change: the hanging tassels at the roof corners and the curtains sway slightly at '
        'their lower edges. ' + STATIC),
    'stone_golem_forge': ('Lò Golem (golem forge)',
        'ONLY these small parts change: the cyan rune lines on the walls and roof pulse (panel 2 brighter, panel 3 '
        'brightest, no halo), the golem\'s eyes inside the doorway glow brighter in panel 3, and the small crystals '
        'twinkle. ' + STATIC),
    'stone_miners': ('Mỏ Đá (miners\' lodge)',
        'ONLY these small parts change: the hanging lanterns\' flames flicker, and the blue crystals on the rock '
        'and in the cart twinkle (one white pixel at a different spot each panel). ' + STATIC),
    'stone_quarry': ('Mỏ Khai Thác Đá (quarry)',
        'ONLY these small parts change: the stone block hanging from the wooden crane swings slightly on its rope '
        '(2 pixels left in panel 2, 2 right in panel 3), and the blue crystals twinkle. The crane frame, rocks, '
        'house and cart do NOT change.'),
    'stone_wall': ('Tường Thành (stone wall)',
        'ONLY these small parts change: the torch flame on the middle post flickers (different flame shapes, may '
        'rise a pixel or two higher), and the blue runes and crystals on the wall pulse brighter in panel 3. The '
        'battlements, stakes, gate and banner do NOT change.'),
    'tide_harbor': ('Bến Cảng (harbor)',
        'ONLY these small parts change: (a) a small grey smoke puff rises from the chimney (may go into the empty '
        'space above); (b) the wall lantern flickers; (c) the little boat bobs 1 pixel up in panel 2. ' + STATIC),
    'tide_hookmen': ('Lính Móc Câu (hookmen\'s shack)',
        'ONLY these small parts change: the torn teal cloth awning and the small red pennant flap at their free '
        'edges (different ripple shapes in each panel). ' + STATIC),
    'tide_pirates': ('Tàu Cướp Biển (pirate ship)',
        'ONLY these small parts change: (a) the green pennant on the mast top waves; (b) the striped sail billows '
        'slightly (its free lower edge moves 1-2 pixels). The hull, cabin, mast, cannon and barrels do NOT change.'),
    'tide_treasure': ('Kho Báu (treasure chest)',
        'ONLY these small parts change: bright white-gold glint pixels sparkle on the coins, gems and pearls (a few '
        'crisp 1-2 pixel stars, at different spots in each panel). The chest, lid, sand and shells do NOT change.'),
    'wheat_field': ('Ruộng Lúa (wheat field)',
        'ONLY these small parts change: the golden wheat ears sway in the wind as a wave across the field: panel 2 '
        'the ear tips lean 1-2 pixels one way, panel 3 the other way. The fence, gate and soil do NOT change.'),
    'wheat_granary': ('Kho Thóc (granary)',
        'ONLY these small parts change: the two hanging wheat bundles on the front sway slightly (lower ends 1-2 '
        'pixels left in panel 2, right in panel 3). ' + STATIC),
    'wheat_militia': ('Dân Quân (militia house)',
        'ONLY the blue pennant on the ridge pole moves: it waves with a different ripple shape in panels 2 and 3, the '
        'pole fixed. ' + STATIC),
    'wheat_peasant_horde': ('Khởi Nghĩa Nông Dân (peasant uprising camp)',
        'ONLY the torn red banner on the ridge pole moves: it waves with a different ripple shape in panels 2 and 3, '
        'the pole fixed; the cloth patches on the roof stay still. ' + STATIC),
    'wheat_reapers': ('Đội Thợ Gặt (reapers\' farmhouse)',
        'ONLY a small grey smoke puff above the chimney moves: it rises, panel 2 higher, panel 3 higher still with a '
        'new small puff at the chimney mouth (crisp pixel clusters, no haze; they may rise into the empty space '
        'above). ' + STATIC),
}
THRONES = [c for c in CARDS if c.endswith('_throne')]

# second round (r2) for cards whose first loop did not read: replaces the moving-parts text of CARDS
REDRAW_NOTE = ('THE FIRST ATTEMPT WAS REJECTED because almost nothing visibly changed between the panels. This time the '
               'listed moving parts MUST change clearly and readably (several art pixels), while everything else '
               'stays pixel-identical. ')
REDRAW: dict[str, str] = {
    'grove_throne': (
        'ONLY these parts change: (a) the two hanging GREEN BANNERS on the trunk swing clearly: panel 2 their lower '
        'ends 3-4 art pixels to the left, panel 3 3-4 art pixels to the right, their tops fixed; (b) the round green '
        'fruits hanging under the canopy swing on their stems the same way (2-3 pixels); (c) panel 3: four or five '
        'tiny bright yellow-green firefly pixels around the canopy. The canopy, trunk, roots, door, antlers and '
        'treehouse do NOT change.'),
    'moon_throne': (
        'ONLY these parts change: (a) the dark moon orb on the top charges up: panel 2 a thin bright violet crescent '
        'rim lights up on its left edge (2 pixels wide), panel 3 the rim is wider and brighter and four or five crisp '
        'violet-white spark pixels float just above the orb; (b) every candle flame on the tower and at its base '
        'clearly flickers: panel 2 the flames lean left and are 1 pixel taller, panel 3 lean right and shorter. '
        'The tower, battlements, banners and door do NOT change.'),
    'grove_thorn_tower': (
        'ONLY these parts change: (a) the red FLOWERS on the tower clearly pulse: panel 2 every flower opens wider '
        '(petals 1-2 pixels bigger, brighter red), panel 3 back to a half-open bud; (b) the two green banners swing '
        'at their lower ends 2-3 pixels left in panel 2 and right in panel 3; (c) the leafy vine tips hanging free at '
        'the top corners sway 2 pixels. The wooden walls, thorn spikes, roots, windows and door do NOT change.'),
    'neutral_archer_tower': (
        'ONLY the blue flag on the top pole changes, clearly in BOTH panels 2 and 3: panel 2 the flag ripples with '
        'its free end bent DOWN by 2-3 art pixels, panel 3 with its free end bent UP and a deeper wave fold in the '
        'middle; the pole and the flag attached edge stay fixed. The roof, archer window, walls and door do NOT '
        'change.'),
    'arcane_frost_mages': (
        'ONLY these parts change: (a) the violet crystal on the spire pulses clearly: panel 2 brighter (lighter violet '
        'facets), panel 3 brightest with three crisp white spark pixels around its tip; (b) five or six crisp white '
        'glint pixels sit on the icicles and the ice crystals at the base, at DIFFERENT spots in panel 2 and panel 3 '
        '(a twinkle); (c) panel 3: two or three tiny white snowflake pixels drift in the empty space next to the roof. '
        'The tower walls, roof, icicle shapes, banners and door do NOT change.'),
}
TOWERS = ['wheat_scarecrow', 'stone_crystal', 'stone_mountain_heart', 'arcane_mage_tower', 'clock_gear_tower',
          'clock_steam_cannon', 'forge_flame_tower', 'grove_thorn_tower', 'moon_shadow_spire', 'neutral_archer_tower',
          'nomad_watchtower', 'tide_cannon', 'tide_kraken', 'tide_wave_tower']

# per-card layout: `shift` moves the building sideways in each panel (px); `pad` fixes the padding (otherwise found
# at density 2); `fit` is the object box in a panel; `spokes` draws a geometry guide (windmill sample only).
EXTRAS = {
    'wheat_windmill': dict(shift=-15, pad=(4, 4, 4, 0), fit=(470, 940),
                           spokes=((307, 213), (107, -202), (152, 93), 30)),
    'stone_catapult': dict(pad=(0, 0, 0, 0), fit=(470, 940)),
    'wheat_throne': dict(pad=(0, 6, 0, 0), fit=(470, 940)),
}
DROPPED = {'wheat_windmill'}  # owner review 20/11/2026: stays static


def source_of(card: str) -> Path:
    king = card.split('_', 1)[0]
    if card == 'wheat_reapers':
        return iso.BUILDINGS['wheat_reapers']
    if king == 'wheat':
        return ROOT / f'docs/art-review/iso-board/wheat/building_{card}/source.png'
    if king == 'neutral':
        return ROOT / f'docs/art-review/neutral-iso/{card}/source.png'
    return ROOT / f'docs/art-review/g5/{king}/{card}/source.png'


def shipped_path(card: str, density: int) -> Path:
    sub = 'iso-neutral' if card.startswith('neutral_') else 'iso'
    return ROOT / 'public/assets/art' / ART_SETS[density] / sub / f'{card}.png'


def card_dir(card: str) -> Path:
    return A / card


# ---- geometry ----------------------------------------------------------------------------------------------------

def border_background(rgb: np.ndarray, thresh: int) -> np.ndarray:
    """Pixels darker than `thresh` that are connected to the image border (flood fill through a 1 px frame)."""
    cand = rgb.max(axis=2) < thresh
    m = np.full((cand.shape[0] + 2, cand.shape[1] + 2), 255, np.uint8)
    m[1:-1, 1:-1] = np.where(cand, 255, 0)
    img = Image.fromarray(m).copy()
    ImageDraw.floodfill(img, (0, 0), 128)
    return (np.array(img) == 128)[1:-1, 1:-1]


def scale_k() -> float:
    return iso.REAPERS_WIDTH / iso.keyed(iso.BUILDINGS['wheat_reapers']).width


class Geom:
    """`obj`: the source object (RGBA, alpha 0/255, cropped); `full`: the density-2 cell grid over `obj`;
    `box`: the shipped picture's cells inside that grid. Density m/2 uses m-times cells."""

    def __init__(self, card: str):
        self.card = card
        self.border = card in BORDER_KEY_CARDS
        src = source_of(card)
        ship = np.array(Image.open(shipped_path(card, 2)).convert('RGBA'))
        if self.border:
            a = np.array(Image.open(src).convert('RGB'))
            solid = ~border_background(a, 6)
            ys, xs = np.where(solid)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            rgba = np.dstack([a, np.where(solid, 255, 0).astype(np.uint8)])[y0:y1, x0:x1]
            self.obj = Image.fromarray(rgba)
            self.full = (ship.shape[1], ship.shape[0])
            self.box = (0, 0, ship.shape[1], ship.shape[0])
            check = self.reduce_border(self.obj, self.full)
        else:
            self.obj = iso.keyed(src)
            k = scale_k()
            self.full = (max(1, round(self.obj.width * k)), max(1, round(self.obj.height * k)))
            self.box = iso.reduce_to(self.obj, self.full).getbbox()
            check = np.array(iso.reduce_to(self.obj, self.full).crop(self.box))
        if check.shape != ship.shape or not (check == ship).all():
            raise SystemExit(f'{card}: the source cut does not reproduce the shipped picture')
        self.size = (ship.shape[1], ship.shape[0])

    @staticmethod
    def reduce_border(obj: Image.Image, size: tuple[int, int], box=None) -> np.ndarray:
        """`recut_border_key.recut`'s mask-weighted box reduction (alpha 0/255, RGB of transparent px 0)."""
        a = np.array(obj).astype(np.float32)
        m = (a[..., 3] > 0).astype(np.float32)
        kw = dict(box=box) if box else {}
        mm = np.array(Image.fromarray(m, mode='F').resize(size, Image.BOX, **kw))
        out = np.zeros((size[1], size[0], 4), dtype=np.uint8)
        for c in range(3):
            wk = np.array(Image.fromarray(a[..., c] * m, mode='F').resize(size, Image.BOX, **kw))
            out[..., c] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
        out[..., 3] = np.where(mm >= 0.5, 255, 0)
        out[out[..., 3] == 0] = 0
        return out


def layout(card: str, meta: dict | None = None) -> tuple[float, tuple[int, int], tuple[int, int], int]:
    """Scale, pasted size and top-left of the object in a panel."""
    g = GEOMS.setdefault(card, Geom(card))
    ex = EXTRAS.get(card, {})
    meta = meta or {}
    fit = tuple(meta.get('fit', ex.get('fit', FIT_DEFAULT)))
    shift = meta.get('shift', ex.get('shift', 0))
    s = min(1.0, fit[0] / g.obj.width, fit[1] / g.obj.height)
    w, h = round(g.obj.width * s), round(g.obj.height * s)
    return s, (w, h), ((PANEL_W - w) // 2 + shift, FEET_Y - h), shift


GEOMS: dict[str, Geom] = {}


# ---- prompt ------------------------------------------------------------------------------------------------------

HEADER = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục "Góc nhìn" (khung BẮT BUỘC, mục con "Isometric (trục đo 2.5D) cho sprite thế giới", khối "Prompt isometric dùng lại", "Kiểm trước khi duyệt (isometric)") và mục "Quy tắc vẽ".

ẢNH ĐÍNH KÈM:
1. `{template}` — KHUNG CẦN VẼ LẠI: ba bản GIỐNG HỆT NHAU của công trình đã duyệt, đặt cạnh nhau ở cùng vị trí trong ba ô rộng 512 px. Đây là ảnh gốc để CHỈNH SỬA, không phải gợi ý phong cách.
2. `{source}` — ảnh nguồn đã duyệt của chính công trình này (độ phân giải đầy đủ), để nhìn rõ chi tiết.
3. `{ref}` — mẫu phong cách đã duyệt (nhà Thợ Gặt): CHỈ lấy phong cách, KHÔNG lấy góc nhìn chính diện của nó.
4. `{iso_ref}` — mẫu góc nhìn isometric đã duyệt.

"""

TASK = """
THIS IS AN ANIMATION EDIT OF AN EXISTING APPROVED PICTURE, NOT A NEW DRAWING.
Output: ONE image 1536x1024 px, the same layout as attached image 1: three panels side by side, each 512 px wide,
flat pure black #000000 background everywhere outside the building, no panel borders or grid lines.
Each panel shows the SAME building at the SAME position, size and camera as in image 1, pixel for pixel. The three
panels are three frames of a short looping animation (frame 1 left, frame 2 middle, frame 3 right).
- Panel 1 (left): an EXACT copy of the building of image 1. Change nothing.
- Panels 2 and 3: the same exact copy, where {moving}
STRICT: the footprint, outline, silhouette, walls, roof, door, windows, colours, shading and EVERY static pixel stay
IDENTICAL in all three panels; do not shift, rescale, re-render, re-shade, recolour, sharpen or "improve" the
building; do not add or remove details; no camera change. Only the moving parts listed above differ between panels,
in small readable steps (they must read at 60 px wide in the game). Same pixel-cluster size as image 1.
No motion blur, speed lines, soft glow, halo, smoke haze, gradients or antialiasing; no text, labels or numbers.
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
"""

GUIDE_NOTE = """GEOMETRY GUIDE (attached image 5, `{guide}`): the same three panels dimmed, with the TARGET position of each
of the four sail arms in that panel drawn as red lines from the white hub to a yellow tip dot; the grey dotted
ellipse is the tilted circle all sail tips travel on (the sails turn IN THE SLANTED PLANE of the cap's right face,
so their tips always lie on that ellipse; they are never drawn as an upright frontal cross). Panel 1 has no red lines
because it stays the exact approved picture. In panels 2 and 3 put the sail arms exactly along the red lines, with
the hub on the white dot. Seen in this tilted plane, a sail pointing
toward a narrow end of the ellipse looks shorter and one pointing toward a wide end looks longer; keep the cloth
width consistent with that foreshortening. The guide is for geometry only: do NOT draw its lines, dots or the dim
colours in the output; the output keeps the full colours of image 1.
"""


def make_template(card: str) -> Path:
    d = card_dir(card)
    d.mkdir(parents=True, exist_ok=True)
    Image.open(source_of(card)).convert('RGBA').save(d / 'source.png')
    g = GEOMS.setdefault(card, Geom(card))
    s, (w, h), (x, y), shift = layout(card)
    fit = EXTRAS.get(card, {}).get('fit', FIT_DEFAULT)
    (d / 'template.json').write_text(json.dumps({'shift': shift, 'fit': list(fit)}) + '\n', encoding='utf-8')
    small = g.obj.resize((w, h), Image.LANCZOS)
    a = np.array(small)
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    small = Image.fromarray(a)
    canvas = Image.new('RGBA', (PANEL_W * PANELS, CANVAS_H), (0, 0, 0, 255))
    for i in range(PANELS):
        canvas.alpha_composite(small, (i * PANEL_W + x, y))
    canvas.convert('RGB').save(d / 'template.png')
    spokes = EXTRAS.get(card, {}).get('spokes')
    if spokes:
        draw_guide(canvas, (x, y), spokes).save(d / 'guide.png')
    return d / 'template.png'


def draw_guide(canvas: Image.Image, xy: tuple[int, int], spokes) -> Image.Image:
    """The template dimmed, with the target arm of every sail per panel (red lines, yellow tip dots) and the tilted
    circle the tips run on (grey dots). A geometry guide for Codex only; it is never cut."""
    (hx, hy), v1, v2, step = spokes
    g = Image.eval(canvas.convert('RGB'), lambda c: c // 3)
    dr = ImageDraw.Draw(g)
    for i in range(PANELS):
        cx, cy = i * PANEL_W + xy[0] + hx, xy[1] + hy
        for a in range(0, 360, 6):
            t = math.radians(a)
            px, py = cx + math.cos(t) * v1[0] + math.sin(t) * v2[0], cy + math.cos(t) * v1[1] + math.sin(t) * v2[1]
            dr.rectangle((px - 1, py - 1, px + 1, py + 1), fill=(150, 150, 150))
        for q in range(4 if i else 0):  # panel 1 keeps the approved sails: no target lines
            t = math.radians(i * step + 90 * q)
            px, py = cx + math.cos(t) * v1[0] + math.sin(t) * v2[0], cy + math.cos(t) * v1[1] + math.sin(t) * v2[1]
            dr.line((cx, cy, px, py), fill=(255, 40, 40), width=5)
            dr.ellipse((px - 7, py - 7, px + 7, py + 7), fill=(255, 230, 0))
        dr.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), fill=(255, 255, 255))
    return g


def write_prompt(card: str) -> Path:
    subject, moving = CARDS[card]
    if card in REDRAW:
        moving = REDRAW_NOTE + REDRAW[card]
    d = card_dir(card)
    rel = lambda p: p.relative_to(ROOT).as_posix()
    block = mp.iso_template()  # the "Prompt isometric dùng lại" block of docs/ART_STYLE.md
    block = block.replace('[subject]', subject)
    block = block.replace('[Materials and identifying details.]',
                          'Materials, palette and details exactly as in the attached approved picture of this building.')
    block = block.replace('Whole asset visible, transparent background, padding around it.',
                          'Whole asset visible in every panel, flat black #000000 background, padding around it.')
    block = block.replace('Concept preview only; native sprite size and pixel cleanup are a separate production step.\n', '')
    text = HEADER.format(out=rel(d / 'anim-source.png'), template=rel(d / 'template.png'), source=rel(d / 'source.png'),
                         ref=REFERENCE, iso_ref=ISO_REFERENCE) + block + TASK.format(moving=moving)
    attach = [rel(d / 'template.png'), rel(d / 'source.png'), REFERENCE, ISO_REFERENCE]
    if (d / 'guide.png').exists() and EXTRAS.get(card, {}).get('spokes'):
        attach.append(rel(d / 'guide.png'))
        text = text.replace('Khi xong, in đường dẫn', GUIDE_NOTE.format(guide=rel(d / 'guide.png')) + 'Khi xong, in đường dẫn')
    (d / 'prompt.md').write_text(text, encoding='utf-8')
    (d / 'attachments.txt').write_text('\n'.join(attach) + '\n', encoding='utf-8')
    return d / 'prompt.md'


# ---- cut ---------------------------------------------------------------------------------------------------------

def register(panel: np.ndarray, ref: np.ndarray) -> tuple[int, int, float]:
    """Integer (dx, dy) that best moves `panel` onto `ref` (mean abs RGB difference on the ref's object), coarse to
    fine."""
    mask = ref.max(axis=2) >= iso.KEY
    best = (0, 0, float('inf'))

    def score(dx: int, dy: int) -> float:
        sh = np.roll(np.roll(panel, -dy, axis=0), -dx, axis=1)
        return float(np.abs(sh[mask].astype(int) - ref[mask].astype(int)).mean())

    for step, centre, radius in ((4, (0, 0), SEARCH), (1, None, 4)):
        cx, cy = (centre if centre else best[:2])
        for dy in range(cy - radius, cy + radius + 1, step):
            for dx in range(cx - radius, cx + radius + 1, step):
                v = score(dx, dy)
                if v < best[2]:
                    best = (dx, dy, v)
    return best


def cut_panel(card: str, sheet: Image.Image, template: Image.Image, i: int, meta: dict, m: int,
              pad: tuple[int, int, int, int]) -> tuple[Image.Image, tuple]:
    """Panel i on the shipped picture's cell grid at m x density 2, widened by `pad` (density-2 px)."""
    g = GEOMS.setdefault(card, Geom(card))
    box = (i * PANEL_W, 0, (i + 1) * PANEL_W, CANVAS_H)
    dx, dy, err = register(np.array(sheet.crop(box).convert('RGB')), np.array(template.crop(box).convert('RGB')))
    _, (w, h), xy, _ = layout(card, meta)
    # native cell (u, v) of the uncropped density-2 grid covers panel px [x0 + u*cx, x0 + (u+1)*cx)
    cx, cy = w / g.full[0], h / g.full[1]
    x0, y0 = i * PANEL_W + xy[0] + dx, xy[1] + dy
    pl, pt, pr, pb = pad
    u0, v0, u1, v1 = g.box[0] - pl, g.box[1] - pt, g.box[2] + pr, g.box[3] + pb
    mg = 160  # black margin so a padded region may run past the sheet's edge
    region = (mg + x0 + u0 * cx, mg + y0 + v0 * cy, mg + x0 + u1 * cx, mg + y0 + v1 * cy)
    big = Image.new('RGB', (sheet.width + 2 * mg, sheet.height + 2 * mg), (0, 0, 0))
    big.paste(sheet.crop(box), (mg + box[0], mg))  # only this panel: a neighbour must not leak in
    rgb = np.array(big)
    if g.border:
        alpha = np.where(border_background(rgb, iso.KEY), 0, 255).astype(np.uint8)
    else:
        alpha = np.where(rgb.max(axis=2) < iso.KEY, 0, 255).astype(np.uint8)
    keyed = Image.fromarray(np.dstack([rgb, alpha]))
    size = ((u1 - u0) * m, (v1 - v0) * m)
    if g.border:
        out = Geom.reduce_border(keyed, size, region)
    else:
        out = np.array(keyed.convert('RGBa').resize(size, Image.BOX, box=region).convert('RGBA'))
        out[..., 3] = np.where(out[..., 3] >= 128, 255, 0)
    return Image.fromarray(out), (dx, dy, err)


def padded(img: Image.Image, pad: tuple[int, int, int, int], m: int = 1) -> Image.Image:
    pl, pt, pr, pb = (v * m for v in pad)
    out = Image.new('RGBA', (img.width + pl + pr, img.height + pt + pb), (0, 0, 0, 0))
    out.paste(img, (pl, pt))
    return out


def diff_stats(base: np.ndarray, frame: np.ndarray) -> dict:
    mask = (base[..., 3] > 0) | (frame[..., 3] > 0)
    d = np.abs(base.astype(int) - frame.astype(int))
    alpha_diff = d[..., 3] > 0
    big = ((d[..., :3].max(axis=2) > TOL) | alpha_diff) & mask
    n = int(mask.sum())
    return dict(n=n, big=100 * big.sum() / n, alpha=100 * (alpha_diff & mask).sum() / n, big_mask=big)


def neighbours(mask: np.ndarray) -> np.ndarray:
    """How many of the 8 neighbours of each pixel are set."""
    p = np.pad(mask.astype(np.int8), 1)
    h, w = mask.shape
    return sum(p[1 + dy:1 + dy + h, 1 + dx:1 + dx + w] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)


def lock(base: np.ndarray, frame: np.ndarray) -> np.ndarray:
    """Base pixels except where the frame really changed: changes above TOL, minus "speckle" (a changed pixel with
    fewer than 3 changed neighbours on or next to the base picture: Codex's redraw noise along outlines, which would
    flicker in the game). Isolated pixels out in the empty space (sparks) are kept."""
    big = diff_stats(base, frame)['big_mask']
    solid = base[..., 3] > 0
    near = solid | (neighbours(solid) > 0)
    big &= ~(near & (neighbours(big) < 3))
    out = base.copy()
    out[big] = frame[big]
    return out


def lock_like_d2(card: str, i: int, base: np.ndarray, frame: np.ndarray, m: int) -> np.ndarray:
    """HD/UHD lock: take the frame's pixels only where the density-2 locked frame differs from its base (grown by
    one density-2 pixel), scaled m times; everywhere else the HD base. Codex's fine-detail drift, which is larger at
    high density, never reaches the static pixels."""
    d = card_dir(card)
    b2 = np.array(Image.open(d / f'{card}_anim_0.png').convert('RGBA')).astype(int)
    f2 = np.array(Image.open(d / f'{card}_anim_{i}.png').convert('RGBA')).astype(int)
    mk = np.abs(b2 - f2).max(axis=2) > 0
    g = mk.copy()
    g[1:, :] |= mk[:-1, :]
    g[:-1, :] |= mk[1:, :]
    g[:, 1:] |= mk[:, :-1]
    g[:, :-1] |= mk[:, 1:]
    big = np.kron(g, np.ones((m, m), bool))
    out = base.copy()
    out[big] = frame[big]
    return out


def find_pad(card: str, sheet, template, meta) -> tuple[int, int, int, int]:
    """Smallest pad (left = right, bottom 0) that holds the locked frames 1-2 cut with PAD_MAX."""
    base = np.array(padded(Image.open(shipped_path(card, 2)).convert('RGBA'), PAD_MAX))
    alpha = base[..., 3] > 0
    for i in (1, 2):
        alpha |= lock(base, np.array(cut_panel(card, sheet, template, i, meta, 1, PAD_MAX)[0]))[..., 3] > 0
    ys, xs = np.where(alpha)
    W, H = GEOMS[card].size
    left = max(0, PAD_MAX[0] - xs.min())
    right = max(0, xs.max() + 1 - (PAD_MAX[0] + W))
    top = max(0, PAD_MAX[1] - ys.min())
    side = int(max(left, right))
    top = int(top)
    return (side, top, side, 0)


def upscale(img: Image.Image, n: int) -> Image.Image:
    return img.resize((img.width * n, img.height * n), Image.NEAREST)


def on_bg(img: Image.Image, bg=(96, 140, 72, 255)) -> Image.Image:
    out = Image.new('RGBA', img.size, bg)
    out.alpha_composite(img)
    return out


def diff_view(base: np.ndarray, mask: np.ndarray) -> Image.Image:
    g = base.copy()
    lum = (g[..., :3].mean(axis=2) * 0.5).astype(np.uint8)
    g[..., 0] = g[..., 1] = g[..., 2] = lum
    g[mask] = (255, 40, 200, 255)
    return Image.fromarray(g)


def cut(card: str, tag: str = '', density: int = 2) -> dict:
    """Cut `anim-source<tag>.png` against `template<tag>.png` (tag '' = the current round). Density 2 writes
    `<card>_anim_N.png`, `raw/`, the GIF, `review<tag>.png` and `anim.json` (pad + stats); density 4/8 write the
    m-times twins into `hd/` / `uhd/` with the pad saved at density 2."""
    d = card_dir(card)
    m = density // 2
    sheet = Image.open(d / f'anim-source{tag}.png').convert('RGB')
    if sheet.size != (PANEL_W * PANELS, CANVAS_H):
        sheet = sheet.resize((PANEL_W * PANELS, CANVAS_H), Image.LANCZOS)
        print(f'note: anim-source resized to {sheet.size}')
    template = Image.open(d / f'template{tag}.png').convert('RGB')
    mp_ = d / f'template{tag}.json'
    meta = json.loads(mp_.read_text(encoding='utf-8')) if mp_.exists() else {}
    meta.setdefault('fit', list(EXTRAS.get(card, {}).get('fit', (470, 940))))  # pre-json templates used 470 x 940
    GEOMS.setdefault(card, Geom(card))
    state_path = d / 'anim.json'
    state = json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {}
    if density == 2:
        pad = tuple(EXTRAS[card]['pad']) if 'pad' in EXTRAS.get(card, {}) else find_pad(card, sheet, template, meta)
    else:
        if state.get('tag') != tag:
            raise SystemExit(f'{card}: cut density 2 for round "{tag}" first (anim.json has "{state.get("tag")}")')
        pad = tuple(state['pad'])
    ship = Image.open(shipped_path(card, density)).convert('RGBA')
    ship2 = GEOMS[card].size
    if ship.size != (ship2[0] * m, ship2[1] * m):
        raise SystemExit(f'{card}: density {density} base {ship.size} is not {m}x the density-2 base {ship2}')
    base_img = padded(ship, pad, m)  # frame 0: the shipped pixels unchanged, plus the transparent margin
    base = np.array(base_img)

    out_dir = d / OUT_SUB[density]
    (out_dir / 'raw').mkdir(parents=True, exist_ok=True)
    frames, raws, lines, stats = [base_img], [base_img], [], {}
    for i in range(PANELS):
        out, (dx, dy, err) = cut_panel(card, sheet, template, i, meta, m, pad)
        arr = np.array(out)
        st = diff_stats(base, arr)
        key = 'drift' if i == 0 else f'frame{i}'
        stats[key] = round(st['big'], 1)
        label = 'drift (panel 1 = Codex copy of frame 0)' if i == 0 else f'frame {i}'
        lines.append(f'{label}: offset ({dx:+d},{dy:+d}) err {err:.1f}; changed >{TOL} {st["big"]:.1f}% | '
                     f'alpha {st["alpha"]:.1f}% of {st["n"]} mask px')
        if i == 0:
            out.save(out_dir / 'raw' / f'{card}_anim_panel1.png')
            continue
        out.save(out_dir / 'raw' / f'{card}_anim_{i}.png')
        if density == 2:
            locked = Image.fromarray(lock(base, arr))
        else:
            locked = Image.fromarray(lock_like_d2(card, i, base, arr, m))
        locked.save(out_dir / f'{card}_anim_{i}.png')
        frames.append(locked)
        raws.append(out)
    base_img.save(out_dir / f'{card}_anim_0.png')
    head = (f'{card}{tag} density {density}: {base_img.width}x{base_img.height} (shipped {ship.width}x{ship.height}, '
            f'pad l/t/r/b {pad} x{m})')
    print(head)
    print('\n'.join(lines))
    if density != 2:
        return stats

    state = {'tag': tag, 'pad': list(pad), 'size': [base_img.width, base_img.height],
             'shipped': [ship.width, ship.height], **stats}
    state_path.write_text(json.dumps(state) + '\n', encoding='utf-8')
    gif = [on_bg(upscale(f, GIF_SCALE)).convert('P', palette=Image.ADAPTIVE) for f in frames]
    gif[0].save(d / f'{card}_anim.gif', save_all=True, append_images=gif[1:], duration=180, loop=0, disposal=2)

    # review board: template | codex sheet on top; native x6: base, raw 1-2, locked 1-2, diff masks
    top_h = 300
    cells = [('frame 0 (shipped)', base_img)]
    cells += [(f'raw {i}', raws[i]) for i in (1, 2)]
    cells += [(f'locked {i}', frames[i]) for i in (1, 2)]
    cells += [(f'diff {i} >{TOL}', diff_view(base, diff_stats(base, np.array(raws[i]))['big_mask'])) for i in (1, 2)]
    cw = base_img.width * GIF_SCALE + 16
    ch = base_img.height * GIF_SCALE + 28
    W = max(920, cw * len(cells) + 16)
    H = top_h + 40 + ch + 20 + 18 * (len(lines) + 2)
    board = Image.new('RGBA', (W, H), (40, 36, 44, 255))
    dr = ImageDraw.Draw(board)
    board.paste(template.resize((450, top_h), Image.LANCZOS), (8, 24))
    board.paste(sheet.resize((450, top_h), Image.LANCZOS), (470, 24))
    dr.text((8, 6), 'template (3 x approved base)', fill=(230, 230, 230, 255))
    dr.text((470, 6), f'Codex anim-source{tag}.png', fill=(230, 230, 230, 255))
    y = top_h + 40
    for j, (name, im) in enumerate(cells):
        x = 8 + j * cw
        dr.text((x, y), name, fill=(230, 230, 230, 255))
        board.alpha_composite(on_bg(upscale(im.convert('RGBA'), GIF_SCALE)), (x, y + 16))
    y += ch + 12
    dr.text((8, y), head, fill=(255, 220, 120, 255))
    for n, line in enumerate(lines):
        dr.text((8, y + 18 * (n + 1)), line, fill=(230, 230, 230, 255))
    board.save(d / f'review{tag}.png')
    return stats


def contact(out: Path, cards: list[str]) -> None:
    """One strip per card: locked frames 0-2 at x4 and the two diff masks, for quick batch review."""
    rows = []
    for c in cards:
        d = card_dir(c)
        fs = [Image.open(d / f'{c}_anim_{i}.png').convert('RGBA') for i in range(3)]
        base = np.array(fs[0])
        ims = [on_bg(upscale(f, 4)) for f in fs]
        ims += [upscale(diff_view(base, diff_stats(base, np.array(f))['big_mask']), 4) for f in fs[1:]]
        w = sum(i.width + 6 for i in ims) + 150
        row = Image.new('RGBA', (w, ims[0].height + 4), (40, 36, 44, 255))
        ImageDraw.Draw(row).text((4, 4), c, fill=(255, 230, 120, 255))
        x = 150
        for im in ims:
            row.alpha_composite(im, (x, 2))
            x += im.width + 6
        rows.append(row)
    W = max(r.width for r in rows)
    sheet = Image.new('RGBA', (W, sum(r.height for r in rows)), (40, 36, 44, 255))
    y = 0
    for r in rows:
        sheet.alpha_composite(r, (0, y))
        y += r.height
    sheet.save(out)


if __name__ == '__main__':
    args = sys.argv[1:]
    density = 2
    if '--density' in args:
        i = args.index('--density')
        density, args = int(args[i + 1]), args[:i] + args[i + 2:]
    if density not in OUT_SUB:
        raise SystemExit('--density must be 2, 4 or 8')
    if args[:1] == ['list']:
        for c in CARDS:
            print(c, source_of(c).relative_to(ROOT).as_posix(), 'DROPPED' if c in DROPPED else '')
    elif args[:1] == ['contact']:
        contact(Path(args[1]), args[2:])
    elif len(args) in (2, 3) and args[0] in ('prompt', 'cut') and args[1] in CARDS:
        if args[0] == 'prompt':
            print(make_template(args[1]))
            print(write_prompt(args[1]))
        else:
            cut(args[1], args[2] if len(args) == 3 else '', density)
    else:
        raise SystemExit(f'usage: make_anim.py prompt|cut <card> [-r1] [--density 4|8] | contact <out> <card>... | list')
