"""Environment objects around the board (owner 20/11/2026: "the ground around the board is still too bare"): prompts,
runner and cutting for many new wild decorations, drawn several per Codex call on one themed sheet.

    python docs/art-review/env/make_objects.py ref                 # approved-wilds reference sheet (attached to every call)
    python docs/art-review/env/make_objects.py prompts [batch ...]  # writes batches/<batch>/prompt.md and .superpowers/env-run.sh
    python docs/art-review/env/make_objects.py cut [batch ...]      # sheet -> objects/<id>/runtime/{sd,hd,uhd}/<id>.png + review
    python docs/art-review/env/make_objects.py catalog              # catalog.json of every cut object

Reuses the approved pipelines without editing them:
- prompt: the "Prompt isometric dùng lại" block of docs/ART_STYLE.md, read through the buildings tool (via
  `make_decor._buildings_tool`), with the approved style reference, the approved isometric building and a sheet of the
  shipped (approved) wilds attached; flat magenta #FF00FF background like make_decor.py (no dark keying rim);
- cut: magenta key + mask-weighted box reduction to a target height in art px (`make_decor.cut_one`'s maths, here on
  one grid cell of a sheet), density 2 = sd; HiDPI/close-up twins are EXACTLY 2x / 4x the sd cut (density 4 / 8), as
  make_decor.py and make_wilds.py do; then the dark rim peeled by `tools/strip_decor_outline.py` (owner: no dark outline
  on decor) with m x its passes, plus a magenta-fringe peel on the alpha edge.
Nothing is written outside docs/art-review/env/ (and the runner under .superpowers/).
"""
import importlib.util
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[3]
D = Path(__file__).resolve().parent
OBJ = D / 'objects'
BATCH = D / 'batches'
REFERENCE = 'docs/art-review/style-references/harvester-house-front-approved.png'
ISO_REF = 'docs/art-review/style-references/iso-building-approved.png'
WILDS_REF = 'docs/art-review/env/approved-wilds-ref.png'


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


decor = _load('make_decor', 'docs/art-review/iso-board/decor/make_decor.py')
sys.path.insert(0, str(ROOT / 'tools'))
from strip_decor_outline import DEFAULT_PASSES, strip_outline  # noqa: E402

# batch -> (cols, rows, [(id, description, target height in sd art px, tall, radius in world px)])
# Heights follow the shipped wilds (trees ~100, bushes ~31, rocks 20-34, barrel 30) at 2 art px per world unit.
BATCHES = {
    'trees_a': (3, 2, [
        ('tree_birch', 'a slender white birch tree: white bark with dark marks, light airy yellow-green leaf clumps', 104, True, 16),
        ('tree_willow', 'a weeping willow: a thick short trunk and long drooping curtains of pale green leaves', 100, True, 26),
        ('tree_cherry', 'a cherry blossom tree: dark brown twisting trunk, a round crown of pale pink blossoms (soft pink, never magenta)', 96, True, 24),
        ('tree_young_oak', 'a young oak tree: a thin trunk and a small round crown of fresh green leaves', 78, True, 16),
        ('tree_fir_small', 'a small fir tree: a narrow cone of dark blue-green needle tiers, short trunk', 80, True, 13),
        ('tree_dead', 'a dead leafless tree: grey-brown gnarled bare branches, cracked bark, no leaves', 92, True, 18),
    ]),
    'trees_b': (3, 2, [
        ('tree_fruit', 'an apple tree: a round green crown dotted with small red apples, a few apples on the ground', 90, True, 22),
        ('tree_bushy', 'a broad bushy deciduous tree with a very full dense dark-green crown reaching low', 92, True, 26),
        ('tree_pair', 'a cluster of two trees growing together: one green oak and one smaller pine side by side', 104, True, 30),
        ('tree_poplar', 'a tall narrow poplar tree: a column-shaped crown of mid-green leaves', 112, True, 13),
        ('tree_maple_red', 'a maple tree in autumn: a round crown of red and crimson leaves, a few red leaves on the ground', 96, True, 24),
        ('tree_spruce_blue', 'a blue-green spruce tree with drooping layered branches, a dense cone shape', 104, True, 17),
    ]),
    'crags': (3, 2, [
        ('crag_tall', 'a tall grey rock crag with vertical cracked faces and tufts of grass on its ledges', 100, True, 26),
        ('standing_stone', 'a single tall ancient standing stone (menhir), weathered grey with lichen patches', 62, True, 10),
        ('standing_stones_ring', 'a small ring of five weathered standing stones on grass, seen in isometric', 66, True, 30),
        ('crag_mossy', 'a big mossy rock outcrop: rounded grey boulders stacked, covered in green moss and small ferns', 88, True, 28),
        ('rock_spire', 'a narrow pointed rock spire of layered brown-grey stone with a little grass at its foot', 110, True, 16),
        ('boulders_grassy', 'a heap of large boulders half buried in tall grass, with small yellow flowers', 78, True, 30),
    ]),
    'rocks': (4, 2, [
        ('boulder_mossy_a', 'one round grey boulder with a thick cap of green moss on top', 34, False, 14),
        ('boulder_mossy_b', 'one smaller flat grey boulder with moss patches and a grass tuft', 28, False, 12),
        ('rock_cluster_a', 'a cluster of three grey rocks of different sizes touching each other', 28, False, 14),
        ('rock_cluster_b', 'a cluster of four small brown-grey rocks', 24, False, 12),
        ('pebbles_a', 'a small low pile of grey pebbles on the ground', 12, False, 8),
        ('pebbles_b', 'a few scattered light pebbles and a tiny grass tuft', 12, False, 9),
        ('rock_flat', 'a low wide flat stone slab lying on the ground, slightly mossy at the edges', 18, False, 13),
        ('rock_split', 'a boulder split in two halves with a small plant growing in the crack', 30, False, 13),
    ]),
    'bushes': (4, 2, [
        ('bush_flower_pink', 'a round green bush covered in small soft-pink flowers (never magenta)', 32, False, 10),
        ('bush_flower_white', 'a round green bush covered in small white flowers', 32, False, 10),
        ('bush_flower_yellow', 'a round green bush covered in small yellow flowers', 32, False, 10),
        ('fern', 'a fern plant: long feathery arching green fronds spreading out from the centre', 28, False, 9),
        ('bush_holly', 'a holly bush: dark glossy spiky green leaves with clusters of red berries', 32, False, 10),
        ('topiary_round', 'a neatly trimmed round topiary ball bush on a very short stem', 36, False, 9),
        ('bramble', 'a tangled bramble thicket: thorny arching stems, few leaves, a few dark blackberries', 30, False, 12),
        ('bush_lavender', 'a clump of lavender: upright grey-green stems with purple flower spikes', 28, False, 10),
    ]),
    'grasses': (4, 2, [
        ('grass_tuft_a', 'a small tuft of bright green grass blades', 18, False, 6),
        ('grass_tuft_b', 'a wider tuft of green grass with a few longer blades', 22, False, 7),
        ('grass_tall', 'a clump of tall wild grass with seed heads, green and straw tones', 32, False, 8),
        ('reeds', 'a clump of reeds: tall thin green and tan stems', 38, False, 8),
        ('cattails', 'a clump of cattails: tall green leaves with brown sausage-shaped seed heads', 40, False, 8),
        ('grass_dry', 'a tuft of dry golden-tan grass', 22, False, 7),
        ('clover_patch', 'a low patch of clover leaves with a few small white clover flowers', 12, False, 9),
        ('dandelions', 'a few dandelions: green leaf rosettes, two yellow flowers and one white puffball', 18, False, 7),
    ]),
    'flowers': (4, 2, [
        ('flowers_red', 'a small cluster of red poppies with green stems and leaves', 18, False, 8),
        ('flowers_blue', 'a small cluster of blue cornflowers with green stems', 18, False, 8),
        ('flowers_yellow', 'a small cluster of yellow buttercups with green leaves', 16, False, 8),
        ('flowers_white', 'a small cluster of white daisies with yellow centres', 16, False, 8),
        ('flowers_purple', 'a small cluster of purple violets with heart-shaped leaves', 14, False, 7),
        ('flowers_mixed', 'a small mixed wildflower patch: red, yellow, white and blue flowers among grass', 18, False, 9),
        ('sunflowers', 'two or three small sunflowers with big yellow heads on tall green stems', 38, False, 7),
        ('tulips_orange', 'a small clump of orange tulips with long green leaves', 22, False, 7),
    ]),
    'forest_floor': (4, 2, [
        ('mushroom_single', 'one brown-capped mushroom with a cream stem', 14, False, 5),
        ('mushroom_ring', 'a fairy ring: a flat circle of small cream and brown mushrooms on the ground, seen in isometric', 24, False, 14),
        ('mushroom_red', 'one red-capped toadstool with white spots and a white stem, plus a tiny one beside it', 20, False, 6),
        ('mushroom_cluster', 'a cluster of five small tan mushrooms growing together', 16, False, 7),
        ('stump_moss', 'a tree stump covered in green moss on its top and sides, a few roots', 30, False, 10),
        ('stump_axe', 'a tree stump with an axe stuck in its cut top, wood chips on the ground', 36, False, 10),
        ('woodpile', 'a neat stack of split firewood logs, the cut ends facing the viewer on the left side', 32, False, 14),
        ('leaf_pile', 'a small heap of fallen autumn leaves: orange, red, yellow and brown', 16, False, 10),
    ]),
    'forest_floor_b': (4, 2, [
        ('log_mushrooms', 'a fallen mossy log with a row of small mushrooms growing on it, lying along a diagonal axis', 32, False, 16),
        ('log_hollow', 'a hollow fallen log with a dark open end, lying along a diagonal axis, a fern beside it', 28, False, 16),
        ('branches_fallen', 'a few fallen dry branches and twigs lying on the ground', 20, False, 12),
        ('stump_small', 'a small low cut tree stump with visible rings', 20, False, 8),
        ('leaves_red', 'a scatter of fallen red and crimson leaves on the ground', 16, False, 10),
        ('rabbit_hole', 'a small earthen mound with a round rabbit burrow hole, a little grass around it', 16, False, 9),
        ('anthill', 'a cone-shaped anthill of brown earth and pine needles', 20, False, 8),
        ('thistles', 'a clump of thistles: spiky grey-green leaves and purple thistle flowers', 26, False, 8),
    ]),
    'ruins': (4, 2, [
        ('well_old', 'an old round stone well with a small wooden roof and a bucket on a rope', 54, False, 16),
        ('pillar_ruined', 'a broken ruined stone column standing upright, its top snapped off, ivy climbing it', 58, True, 10),
        ('statue_broken', 'a broken old stone statue on a square pedestal: only the legs and part of the body remain, mossy', 50, False, 12),
        ('shrine_stone', 'a small stone wayside shrine: a little stone house-shaped niche on a pillar with a candle inside', 46, False, 11),
        ('cart_wheel_broken', 'a broken wooden cart wheel leaning on a rock, some spokes missing', 24, False, 10),
        ('column_fallen', 'a fallen stone column lying on the ground in two pieces along a diagonal axis, grass around it', 32, False, 18),
        ('ruin_wall', 'a short crumbling fragment of an old stone wall with an empty arched window, moss and grass', 44, False, 20),
        ('milestone', 'a small old carved stone milestone marker, rounded top, no letters', 24, False, 6),
    ]),
    'farm': (4, 2, [
        ('crate', 'one wooden crate with plank sides and corner braces', 24, False, 8),
        ('crates_stack', 'two wooden crates on the ground and one stacked on top', 38, False, 12),
        ('sack', 'one tied burlap grain sack standing upright', 20, False, 7),
        ('sacks_pile', 'a pile of three burlap grain sacks lying together', 24, False, 12),
        ('hay_bale', 'one rectangular golden hay bale tied with two strings, a box shape on the diagonal axes', 22, False, 12),
        ('hay_bales_stack', 'three rectangular hay bales: two on the ground and one on top', 34, False, 14),
        ('scarecrow', 'a scarecrow on a wooden post: straw hat, patched shirt, arms out sideways, straw sticking out', 54, False, 8),
        ('campfire_unlit', 'an unlit campfire: a ring of grey stones around a few crossed logs, no fire, no smoke', 16, False, 9),
    ]),
    'camp': (4, 2, [
        ('tent', 'a small canvas camping tent, cream fabric on a wooden pole frame, the open flap on the right side', 46, False, 18),
        ('signpost_double', 'a wooden signpost with two plank arrows pointing different ways, no letters', 42, False, 7),
        ('lantern_post', 'a wooden lantern post: a tall post with an arm holding a small iron lantern (unlit)', 56, False, 6),
        ('beehive', 'a wooden beehive box: stacked white-painted wooden boxes with a little roof, on a short stand', 30, False, 8),
        ('bird_bath', 'a small stone bird bath: a shallow bowl of water on a stone pedestal', 28, False, 8),
        ('footpath_stones', 'a short trail of five flat stepping stones set in the grass, following a diagonal axis', 22, False, 16),
        ('stepping_stones', 'three round flat stepping stones in a small cluster, flush with the ground', 18, False, 12),
        ('water_trough', 'a wooden water trough on short legs, filled with water', 22, False, 14),
    ]),
    'farm_b': (4, 2, [
        ('wheelbarrow', 'a wooden wheelbarrow with one wheel, empty', 24, False, 12),
        ('pumpkins', 'a small group of three orange pumpkins with green leaves and vines', 18, False, 10),
        ('flower_pots', 'two clay flower pots with red and yellow flowers', 20, False, 7),
        ('bench', 'a simple wooden bench along a diagonal axis', 22, False, 12),
        ('rain_barrel', 'a wooden rain barrel with a lid and a small spout, beside a bucket', 30, False, 8),
        ('buckets', 'two wooden buckets with iron bands, one tipped over', 16, False, 8),
        ('basket_apples', 'a woven wicker basket full of red apples', 16, False, 6),
        ('firewood_chopping', 'a chopping block (short thick log) with split logs scattered around it', 20, False, 10),
    ]),
    'trees_c': (3, 2, [
        ('tree_pine_cluster', 'a cluster of three pine trees of different heights growing close together', 108, True, 28),
        ('tree_oak_old', 'a huge old oak with a thick gnarled trunk, exposed roots and a wide green crown', 108, True, 30),
        ('tree_yellow', 'a round deciduous tree in early autumn: bright golden-yellow leaves', 94, True, 24),
        ('tree_sapling', 'a thin sapling tree tied to a wooden stake, a few green leaves', 56, True, 8),
        ('tree_blossom_white', 'a small tree covered in white blossom, like a pear tree in spring', 88, True, 22),
        ('tree_broken', 'a tree broken by lightning: a tall splintered trunk with a few leafy branches left', 84, True, 16),
    ]),
    'rocks_b': (4, 2, [
        ('rock_sand', 'a sandy-tan sandstone rock with horizontal layers', 26, False, 11),
        ('rock_dark', 'a dark slate-grey angular rock with a few sharp facets', 26, False, 11),
        ('rock_ore', 'a grey rock with small glinting iron-ore and copper veins', 26, False, 11),
        ('rock_round_pair', 'two smooth round river stones resting together', 18, False, 10),
        ('boulder_lichen', 'a big grey boulder with orange and pale lichen patches', 38, False, 15),
        ('rocks_grass', 'three small rocks half hidden in a tuft of tall grass', 22, False, 11),
        ('stone_cairn', 'a cairn: a small stack of balanced flat stones', 30, False, 7),
        ('rock_crystal', 'a small grey rock with a few pale blue crystals sticking out', 26, False, 9),
    ]),
    'bushes_b': (4, 2, [
        ('bush_round_dark', 'a dense round dark-green bush', 30, False, 10),
        ('bush_autumn', 'a bush with orange and red autumn leaves', 30, False, 10),
        ('bush_hydrangea', 'a hydrangea bush with big round clusters of pale blue flowers', 32, False, 10),
        ('bush_rose', 'a wild rose bush with small red roses', 32, False, 10),
        ('bush_berry_blue', 'a low bush with clusters of blueberries', 26, False, 10),
        ('bush_tall_grass', 'a big clump of ornamental tall grass, arching blades, cream plumes', 36, False, 9),
        ('bush_juniper', 'a low spreading juniper shrub with blue-green scale leaves', 22, False, 12),
        ('bush_sprouts', 'three young leafy sprouts growing from bare earth', 14, False, 7),
    ]),
    'trees_d': (3, 2, [
        ('tree_pine_tall', 'a very tall slim Scots pine: a long bare orange-brown trunk and a flat-topped dark-green crown', 116, True, 14),
        ('tree_copper_beech', 'a copper beech tree: a round crown of deep red-purple leaves, smooth grey trunk', 96, True, 24),
        ('tree_rowan', 'a rowan tree: a light open crown of feathery green leaves with bunches of orange-red berries', 88, True, 20),
        ('tree_larch_gold', 'a larch tree in autumn: a narrow cone of soft golden-yellow needles', 100, True, 15),
        ('tree_olive', 'an old olive-like tree: a twisted grey trunk and a silvery grey-green airy crown', 82, True, 22),
        ('stump_sprouting', 'a big old tree stump with fresh green shoots and small leafy branches sprouting from it', 46, False, 12),
    ]),
    'crags_b': (3, 2, [
        ('rock_arch', 'a natural stone arch: two rock legs joined at the top, grass and moss on it', 84, True, 28),
        ('crag_flat_top', 'a wide flat-topped rock outcrop with steep cracked sides and grass growing on its flat top', 70, True, 30),
        ('boulder_giant', 'one giant rounded boulder with a deep crack, moss in the crack, small flowers at its foot', 72, True, 24),
        ('rock_pillars', 'three tall thin stone pillars of different heights standing close together', 96, True, 20),
        ('crag_tree', 'a rocky crag with a small twisted pine tree growing out of a crack on top', 104, True, 26),
        ('cave_mouth', 'a rock mound with a dark cave opening facing the lower right, moss and ferns around the entrance', 72, True, 30),
    ]),
    'wild_misc': (4, 2, [
        ('pond_small', 'a small round pond of blue water edged with stones and reeds, a flat diamond-like shape on the ground', 34, False, 20),
        ('puddle', 'a small muddy puddle of water on brown earth, flat on the ground', 16, False, 12),
        ('log_long', 'a long fallen tree trunk with bark and a broken branch stub, lying along a diagonal axis', 30, False, 24),
        ('roots_exposed', 'gnarled tree roots sticking out of the ground in a low tangle', 16, False, 12),
        ('moss_patch', 'a soft low patch of green moss with a couple of tiny pebbles, flat on the ground', 14, False, 11),
        ('rock_vines', 'a medium grey rock wrapped in creeping green vines with small white flowers', 30, False, 12),
        ('fern_large', 'a large lush fern with many long arching fronds', 38, False, 12),
        ('mushroom_giant', 'one big storybook mushroom with a wide brown-orange cap and a thick pale stem', 34, False, 9),
    ]),
    'village_b': (4, 2, [
        ('hitching_post', 'a wooden hitching post: two posts and a rail with a coiled rope, along a diagonal axis', 26, False, 12),
        ('grindstone', 'a round grindstone wheel on a small wooden frame with a crank handle', 28, False, 9),
        ('millstone', 'an old round millstone lying flat on the ground, a hole in the middle, grass around it', 18, False, 12),
        ('plough', 'an old wooden hand plough with an iron blade, resting on the ground', 22, False, 14),
        ('barrel_pair', 'two wooden barrels side by side, one with a lid, one open with water', 30, False, 11),
        ('fence_broken', 'a short broken wooden fence: two posts, one rail snapped and hanging, along a diagonal axis', 26, False, 14),
        ('washtub', 'a round wooden washtub with a washboard leaning in it', 20, False, 9),
        ('woodcart_small', 'a tiny wooden handcart loaded with firewood logs, two wheels', 30, False, 14),
    ]),
    'flowers_b': (4, 2, [
        ('cosmos_pink', 'a clump of soft pink cosmos flowers on thin green stems (soft pink, never magenta)', 24, False, 8),
        ('foxgloves', 'two tall foxglove spikes with pale purple bell flowers and broad leaves at the base', 36, False, 7),
        ('bluebells', 'a small patch of bluebells: nodding blue bell flowers on arching stems', 18, False, 8),
        ('marigolds', 'a small clump of orange and yellow marigolds', 18, False, 8),
        ('lilies_white', 'a clump of white lilies with long green leaves', 28, False, 8),
        ('heather', 'a low mound of heather with tiny purple-pink flowers', 18, False, 10),
        ('forget_me_nots', 'a small patch of tiny sky-blue forget-me-not flowers', 14, False, 8),
        ('wild_garlic', 'a patch of broad green leaves with round white star-flower heads', 18, False, 9),
    ]),
    'stones_b': (4, 2, [
        ('stone_bench', 'an old stone bench: a slab on two blocks, mossy, along a diagonal axis', 22, False, 12),
        ('arch_broken', 'a broken stone archway: one side and half the arch still standing, the rest fallen as blocks', 52, True, 18),
        ('rune_stone', 'a tall flat carved standing stone with spiral patterns (no letters), lichen', 40, False, 8),
        ('stone_steps', 'three worn stone steps going up a small grassy rise, on the diagonal axes', 20, False, 14),
        ('obelisk_small', 'a small weathered stone obelisk on a square base', 46, False, 8),
        ('fountain_dry', 'a small dry round stone fountain basin with a short central spout, cracked, grass in it', 30, False, 16),
        ('statue_lion', 'a weathered stone lion statue sitting on a plinth, a bit chipped, mossy', 40, False, 10),
        ('stone_lantern', 'a small stone garden lantern: a square stone cap and box on a short pillar', 34, False, 7),
    ]),
    'trees_e': (3, 2, [
        ('tree_round_small', 'a small tree with a neat round ball-shaped green crown on a straight trunk', 74, True, 16),
        ('tree_oak_orange', 'an oak tree in autumn with a full crown of orange and russet leaves', 98, True, 24),
        ('tree_birch_twin', 'two slender white birch trunks growing from one base, light green airy leaves', 104, True, 18),
        ('tree_leaning', 'a wind-bent tree leaning to one side, its crown swept sideways, green leaves', 88, True, 22),
        ('tree_cypress', 'a tall narrow dark-green cypress tree shaped like a flame', 108, True, 11),
        ('tree_mossy_ancient', 'an ancient tree draped with hanging grey-green moss, gnarled trunk, dark green crown', 100, True, 26),
    ]),
    'crags_c': (3, 2, [
        ('crag_red', 'a red-orange sandstone crag with layered horizontal bands and a few grass tufts', 90, True, 26),
        ('crag_mossy_tall', 'a tall narrow mossy rock column with ferns growing on its ledges', 104, True, 18),
        ('boulders_field', 'a loose spread of seven grey boulders of mixed sizes with grass between them', 56, True, 32),
        ('rocky_hill', 'a low grassy hill with grey rocks breaking through its top and sides', 64, True, 32),
        ('crag_slate', 'a jagged dark slate-grey crag with sharp angular slabs pointing upward', 96, True, 24),
        ('standing_stones_pair', 'two tall weathered standing stones side by side with a fallen lintel stone at their feet', 70, True, 18),
    ]),
    'water_edge': (4, 2, [
        ('lily_pads', 'a small cluster of floating green lily pads with one pink-white water lily flower, flat', 12, False, 10),
        ('driftwood', 'a bleached grey piece of driftwood lying on the ground along a diagonal axis', 20, False, 13),
        ('rowboat', 'a small wooden rowboat beached on the ground, two oars inside, along a diagonal axis', 26, False, 20),
        ('fishing_basket', 'a woven fishing creel basket with a fishing rod leaning on it', 26, False, 7),
        ('mooring_post', 'a short thick wooden mooring post with a coil of rope around it', 26, False, 6),
        ('wet_stones', 'a group of smooth wet dark river stones with a little water shine', 16, False, 11),
        ('reeds_wide', 'a wide dense clump of reeds and tall rushes', 36, False, 12),
        ('marsh_grass', 'a patch of marsh grass with a few small blue flowers', 20, False, 10),
    ]),
    'bushes_c': (4, 2, [
        ('hedge_segment', 'a short trimmed green hedge block running along a diagonal axis', 26, False, 16),
        ('bush_small_round', 'a small round green bush', 22, False, 8),
        ('bush_leafy_wide', 'a wide low leafy bush with big bright green leaves', 26, False, 13),
        ('bush_flower_red', 'a round green bush covered in small red flowers', 32, False, 10),
        ('bush_lilac', 'a lilac bush with cone-shaped light purple flower clusters', 36, False, 11),
        ('bush_dead', 'a dead dry brown bush of bare twigs', 28, False, 10),
        ('bush_gooseberry', 'a low bush with small green leaves and translucent green and red berries', 24, False, 10),
        ('bush_rock', 'a green bush growing against a small grey rock', 28, False, 12),
    ]),
    'grasses_b': (4, 2, [
        ('grass_flowers_patch', 'a tuft of green grass with a few tiny white and yellow flowers', 20, False, 8),
        ('grass_clump_wide', 'a wide low clump of lush green grass', 18, False, 10),
        ('wheat_wild', 'a few stalks of wild wheat with golden ears', 30, False, 7),
        ('grass_seedheads', 'a tuft of grass with fluffy cream seed heads', 28, False, 7),
        ('grass_short_cluster', 'three tiny tufts of short grass close together', 12, False, 9),
        ('sedge', 'a clump of sedge with stiff blue-green blades', 26, False, 8),
        ('horsetail', 'a clump of horsetail plants: jointed green stems with whorls of thin needles', 26, False, 7),
        ('grass_bluish', 'a tuft of blue-grey ornamental grass', 22, False, 7),
    ]),
    'camp_b': (4, 2, [
        ('bedroll', 'a rolled-up bedroll and blanket lying on the ground, tied with straps', 16, False, 10),
        ('cooking_tripod', 'a wooden tripod over a cold ring of stones with an iron cooking pot hanging from it, no fire', 34, False, 10),
        ('log_seat', 'a short log lying on its side used as a seat, along a diagonal axis', 16, False, 12),
        ('banner_pole', 'a wooden pole with a plain blank cream cloth banner, no emblem, no letters', 58, False, 6),
        ('weapon_rack', 'a small wooden rack holding three spears and a round wooden shield', 36, False, 12),
        ('archery_target', 'a round straw archery target with red and white rings on a wooden stand', 34, False, 10),
        ('chest_small', 'a small wooden chest with iron bands, closed', 20, False, 8),
        ('tent_green', 'a small green canvas tent on poles, the open flap on the right side', 40, False, 16),
    ]),
    'trees_f': (3, 2, [
        ('tree_pear', 'a pear tree with a round green crown and small yellow-green pears hanging', 88, True, 22),
        ('tree_chestnut', 'a big chestnut tree with a broad dome of large dark-green leaves and pale flower candles', 100, True, 26),
        ('tree_hawthorn', 'a small hawthorn tree, bushy and low, covered in tiny white blossom', 70, True, 18),
        ('tree_elm', 'a tall elm tree with a vase-shaped spreading crown of green leaves', 108, True, 24),
        ('tree_pine_pair', 'two young pine trees of slightly different heights side by side', 90, True, 20),
        ('tree_hollow', 'an old tree with a big dark hollow in its thick trunk and a modest green crown', 92, True, 22),
    ]),
    'rocks_c': (4, 2, [
        ('rock_mossy_flat', 'a low flat rock completely covered in soft green moss', 16, False, 12),
        ('rock_pointed', 'a single pointed upright grey rock', 30, False, 8),
        ('rocks_tiny_pair', 'two tiny grey rocks side by side', 12, False, 7),
        ('boulder_cracked', 'a medium boulder cracked across its top, moss in the crack', 32, False, 13),
        ('rock_quartz', 'a white quartz rock with pale glittering facets', 24, False, 10),
        ('rock_brown_round', 'a round warm brown rock', 22, False, 10),
        ('gravel_patch', 'a flat patch of grey gravel and small stones on the ground', 12, False, 12),
        ('rocks_flowers', 'two small rocks with a cluster of tiny yellow and white flowers between them', 20, False, 11),
    ]),
    'farm_c': (4, 2, [
        ('cabbages', 'a small row of three green cabbages growing in soil', 16, False, 12),
        ('milk_churns', 'two metal milk churns with lids standing together', 26, False, 8),
        ('pitchfork_hay', 'a small pile of loose hay with a wooden pitchfork stuck in it', 32, False, 11),
        ('chicken_coop', 'a small wooden chicken coop with a sloped plank roof and a little ramp, no animals', 40, False, 14),
        ('tools_leaning', 'a rake, a shovel and a hoe leaning together against a short post', 38, False, 8),
        ('apple_crate', 'a wooden crate full of red and green apples', 20, False, 9),
        ('wheat_sheaf', 'a single upright tied sheaf of golden wheat', 32, False, 7),
        ('feed_trough', 'a low wooden feed trough filled with grain, along a diagonal axis', 16, False, 12),
    ]),
    'wild_b': (4, 2, [
        ('stumps_cluster', 'three small tree stumps of different heights close together', 22, False, 13),
        ('sapling_small', 'a tiny young tree sapling with a few leaves', 32, False, 6),
        ('fern_mix', 'a fern growing together with tall grass and a small flower', 30, False, 10),
        ('hollyhocks', 'two tall hollyhock stalks with pink and white flowers up the stem', 46, False, 8),
        ('wild_strawberries', 'a low patch of wild strawberry leaves with small red berries and white flowers', 12, False, 9),
        ('clover_flowers', 'a patch of clover with pink-purple clover flower heads', 14, False, 9),
        ('rock_flowers_purple', 'a small rock with purple wildflowers growing around it', 22, False, 11),
        ('log_small_mushroom', 'a short small log with two little mushrooms on it, along a diagonal axis', 18, False, 10),
    ]),
    'ruins_b': (4, 2, [
        ('wall_corner_ruin', 'a crumbled corner of an old stone wall, two short wall stubs meeting at a right angle on the diagonal axes, moss', 40, False, 18),
        ('pillar_stump', 'the short stump of a broken stone column on a square base', 26, False, 9),
        ('floor_tiles_broken', 'a flat patch of broken old stone floor tiles in grass, flat on the ground', 14, False, 16),
        ('stairs_ruin', 'a short ruined stone staircase of four steps leading nowhere, moss on the steps', 34, False, 16),
        ('statue_head', 'a fallen giant stone statue head lying on the ground, worn and mossy, calm face', 30, False, 13),
        ('urn_broken', 'a large cracked clay urn with a broken rim, tipped on its side', 20, False, 9),
        ('gate_posts', 'two old stone gate posts with round stone caps, no gate between them, on a diagonal axis', 44, False, 16),
        ('well_ruined', 'a ruined round stone well, its wall half collapsed, no roof', 26, False, 14),
    ]),
    'markers': (4, 2, [
        ('signpost_left', 'a wooden signpost with a single plank arrow pointing left, no letters', 34, False, 7),
        ('notice_board', 'a small wooden notice board on two posts with blank paper notes pinned on it, no text', 40, False, 12),
        ('road_marker', 'a short wooden road-marker post with a painted red band at the top', 26, False, 5),
        ('carved_pole', 'a carved wooden pole with simple geometric bands and a small wooden roof cap', 52, False, 6),
        ('lamp_stone', 'a short stone post with an iron lamp cage on top (unlit)', 36, False, 6),
        ('flag_marker', 'a thin stick with a small plain red cloth flag, stuck in the ground', 30, False, 4),
        ('boundary_stones', 'a row of three small white-washed boundary stones along a diagonal axis', 20, False, 14),
        ('wishing_stones', 'a small pile of round stones with a few flowers placed on top', 20, False, 8),
    ]),
}

FOOTER = """
PRODUCTION (overrides "transparent background" above): ONE image 1536x1024 (landscape), ONE flat solid magenta #FF00FF
background filling the whole canvas, no gradient, no ground patch, no grass carpet under the objects, no cast shadow on
the background; no object may contain magenta or hot pink. This is a SHEET of {n} separate objects laid out on an
invisible grid of {cols} columns x {rows} rows of equal cells (each cell {cw}x{ch} px), read left to right, top row
first. Put exactly ONE object in each cell, centred in it, as large as possible while staying fully inside its cell with
a clear magenta margin: objects must never touch each other or the canvas edge. No grid lines, no numbers, no labels.
Every object uses the SAME isometric 2:1 view, the SAME upper-left light and the SAME pixel-art finish as the attached
approved wild objects (third attachment: shipped trees, rocks, bushes, stump, log, barrel, haystack, sign, cart).
Edges are shaded with each object's own darker tones; no black or dark-red outline ring around the silhouettes.
When done, print the saved path and the image size.
"""


def prompt(batch: str, out: str) -> str:
    cols, rows, items = BATCHES[batch]
    tpl = decor._buildings_tool().iso_template()
    listing = ' '.join(f'Cell {i + 1}: {desc}.' for i, (_, desc, *_rest) in enumerate(items))
    body = tpl.replace('[subject]', f'a sheet of {len(items)} small wild field decorations for the countryside around the '
                                    'kingdom board (nature and rural objects, not buildings)')
    body = body.replace('[Materials and identifying details.]', listing)
    head = (f"Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh "
            "nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.\n\n"
            "BẮT BUỘC TRƯỚC KHI VẼ: mở và đọc `docs/ART_STYLE.md` — mục \"Góc nhìn\" (isometric 2:1) và mục \"Quy tắc vẽ\". "
            f"Ảnh đính kèm: `{REFERENCE}` (phong cách), `{ISO_REF}` (góc nhìn isometric đã duyệt) và `{WILDS_REF}` "
            "(các vật trang trí hoang dã đã duyệt và đang dùng trong game: cùng loại, lấy góc nhìn, cỡ cụm pixel và độ hoàn thiện).\n\n")
    return head + body + FOOTER.format(n=len(items), cols=cols, rows=rows, cw=1536 // cols, ch=1024 // rows)


def make_ref() -> None:
    """The shipped wilds (close-up twins, outline already peeled) on grass: the approved same-kind reference."""
    src = ROOT / 'public/assets/art/ai-v1-uhd/iso/wilds'
    ids = ['tree_oak', 'tree_pine_dark', 'tree_autumn', 'boulders_big', 'bush_green', 'bush_berry', 'rock_large',
           'stump', 'log', 'barrel', 'haystack', 'sign', 'wheat_cart']
    ims = [Image.open(src / f'{i}.png').convert('RGBA') for i in ids]
    k = 0.5
    ims = [im.resize((round(im.width * k), round(im.height * k)), Image.NEAREST) for im in ims]
    row1, row2 = ims[:4], ims[4:]
    w = max(sum(i.width for i in row1) + 20 * 5, sum(i.width for i in row2) + 20 * 10)
    h1, h2 = max(i.height for i in row1), max(i.height for i in row2)
    sheet = Image.new('RGBA', (w, h1 + h2 + 60), (93, 155, 58, 255))
    x = 20
    for im in row1:
        sheet.alpha_composite(im, (x, 20 + h1 - im.height))
        x += im.width + 20
    x = 20
    for im in row2:
        sheet.alpha_composite(im, (x, 40 + h1 + h2 - im.height))
        x += im.width + 20
    sheet.convert('RGB').save(ROOT / WILDS_REF)
    print(ROOT / WILDS_REF, sheet.size)


def prompts(batches) -> None:
    refs = f'-i {REFERENCE} -i {ISO_REF} -i {WILDS_REF}'
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"', 'source .superpowers/env-usage.sh']
    for b in batches:
        d = BATCH / b
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(prompt(b, out), encoding='utf-8')
        p = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'env_call {b} {out} "codex exec --sandbox workspace-write -C $PWD --json {refs} - < {p}"')
    runner.append('echo done >> .superpowers/env.log')
    import os
    run = ROOT / '.superpowers' / os.environ.get('ENV_RUNNER', 'env-run.sh')
    run.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(run)


# ---- cutting -------------------------------------------------------------------------------------------------------

def solid_mask(a: np.ndarray) -> np.ndarray:
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # make_decor.cut_one's magenta key, tightened to min(r, b) - g >= 90 so purple and pink flowers stay solid;
    # the blended rim it leaves is peeled by `peel_fringe`.
    return ~((np.minimum(r, b) - g >= 90) & (r > 150) & (b > 150))


def cell_masks(a: np.ndarray, cols: int, rows: int) -> list[np.ndarray]:
    """Connected pieces (>= 120 px) of the keyed sheet, each given to the grid cell holding its centre."""
    solid = solid_mask(a)
    h, w = solid.shape
    grown = np.array(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    seen = np.zeros((h, w), bool)
    out = [np.zeros((h, w), bool) for _ in range(cols * rows)]
    for sy, sx in zip(*np.where(grown)):
        if seen[sy, sx]:
            continue
        q, ys, xs = deque([(sy, sx)]), [], []
        seen[sy, sx] = True
        while q:
            y, x = q.popleft()
            ys.append(y)
            xs.append(x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and grown[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        if len(ys) < 120:
            continue
        ys, xs = np.array(ys), np.array(xs)
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        c = min(cols - 1, int(cx * cols / w)) + cols * min(rows - 1, int(cy * rows / h))
        out[c][ys, xs] = True
    return [m & solid for m in out]


def reduce_piece(a: np.ndarray, mask: np.ndarray, th: int, times: int = 1) -> Image.Image:
    """make_decor.cut_one's reduction on one masked piece: crop, mask-weighted BOX to th (x times) art px tall."""
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop, m = a[y0:y1, x0:x1], mask[y0:y1, x0:x1].astype(np.float32)
    tw = max(1, round((x1 - x0) * th / (y1 - y0)))
    th, tw = th * times, tw * times
    mm = np.array(Image.fromarray(m, mode='F').resize((tw, th), Image.BOX))
    out = np.zeros((th, tw, 4), dtype=np.uint8)
    for k in range(3):
        wk = np.array(Image.fromarray((crop[..., k] * m).astype(np.float32), mode='F').resize((tw, th), Image.BOX))
        out[..., k] = np.clip(np.round(wk / np.maximum(mm, 1e-6)), 0, 255).astype(np.uint8)
    out[..., 3] = np.where(mm >= 0.5, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def peel_fringe(im: Image.Image, passes: int) -> Image.Image:
    """Alpha-edge pixels still tinted by the magenta key (red and blue both well above green) become transparent."""
    a = np.array(im)
    for _ in range(passes):
        op = a[..., 3] > 0
        pad = np.pad(op, 1)
        edge = op & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
        r, g, b = (a[..., k].astype(int) for k in range(3))
        kill = edge & (r > g + 70) & (b > g + 70) & (np.abs(r - b) < 70) & (r > 140)
        if not kill.any():
            break
        a[kill] = 0
    return Image.fromarray(a, 'RGBA')


def finish(im: Image.Image, m: int) -> Image.Image:
    im = peel_fringe(im, m)
    out, _ = strip_outline(im, m * DEFAULT_PASSES)
    bbox = out.getbbox()
    return out, bbox


def cut(batches) -> None:
    for b in batches:
        cols, rows, items = BATCHES[b]
        src = BATCH / b / 'source.png'
        if not src.exists():
            print(f'{b}: no source.png, skipped')
            continue
        a = np.array(Image.open(src).convert('RGB')).astype(float)
        masks = cell_masks(a, cols, rows)
        cuts = {}
        for (oid, _desc, th, tall, radius), mask in zip(items, masks):
            if not mask.any():
                print(f'{b}/{oid}: EMPTY cell')
                continue
            base = OBJ / oid / 'runtime'
            sd, bbox = finish(reduce_piece(a, mask, th, 1), 1)
            # HiDPI / close-up twins: EXACTLY m x the sd crop box (same foot and footprint), like cut_hd in make_wilds.py.
            for tier, m in (('sd', 1), ('hd', 2), ('uhd', 4)):
                im = sd if m == 1 else finish(reduce_piece(a, mask, th, m), m)[0]
                im = im.crop(tuple(v * m for v in bbox))
                (base / tier).mkdir(parents=True, exist_ok=True)
                im.save(base / tier / f'{oid}.png')
                if m == 1:
                    cuts[oid] = im
            meta = {'id': oid, 'tall': tall, 'radius': radius, 'batch': b, 'description': _desc,
                    'size_sd': list(cuts[oid].size)}
            (OBJ / oid / 'meta.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
            print(f'{b}/{oid}: {cuts[oid].width}x{cuts[oid].height}{" (tall)" if tall else ""}')
        review(b, items, cuts)


def review(b: str, items, cuts) -> None:
    """Every object at 2x on the approved isometric empty plot, a shipped wild beside the first one for scale."""
    iso = ROOT / 'public/assets/art/ai-v1/iso'
    plot = Image.open(iso / 'plots/wheat_open.png').convert('RGBA')
    tall_batch = any(t for _, _, _, t, _ in items)
    ref = Image.open(iso / ('wilds/tree_oak.png' if tall_batch else 'wilds/bush_green.png')).convert('RGBA')
    k = 2
    cols = 4
    cell_w, cell_h = 300, 330 if tall_batch else 230
    n = len(items)
    rws = (n + cols - 1) // cols
    sheet = Image.new('RGBA', (cell_w * cols + 20, cell_h * rws + 70), (46, 34, 26, 255))
    d = ImageDraw.Draw(sheet)
    try:
        f = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
        t = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 22)
    except OSError:
        f = t = None
    d.text((10, 10), f'env/{b} — duyệt từng vật trên ô isometric (zoom 2); ô 1 có vật đang dùng để so cỡ', fill=(245, 232, 205), font=t)
    for i, (oid, _, _, tall, _) in enumerate(items):
        x, y = 10 + (i % cols) * cell_w, 50 + (i // cols) * cell_h
        p = plot.resize((plot.width * k, plot.height * k), Image.NEAREST)
        px, py = x + (cell_w - p.width) // 2, y + cell_h - 40 - p.height
        sheet.alpha_composite(p, (px, py))
        cx, cy = px + p.width // 2, py + p.height // 2
        if oid not in cuts:
            d.text((x + 4, y + cell_h - 32), f'{i + 1}. {oid} (TRỐNG)', fill=(255, 120, 120), font=f)
            continue
        o = cuts[oid].resize((cuts[oid].width * k, cuts[oid].height * k), Image.NEAREST)
        if i == 0:
            r = ref.resize((ref.width * k, ref.height * k), Image.NEAREST)
            sheet.alpha_composite(r, (cx + 20, max(y, cy + 20 - r.height)))
            sheet.alpha_composite(o, (max(x, cx - 20 - o.width), max(y, cy + 20 - o.height)))
        else:
            sheet.alpha_composite(o, (cx - o.width // 2, max(y, cy + 20 - o.height)))
        tag = ' (cao)' if tall else ''
        d.text((x + 4, y + cell_h - 32), f'{i + 1}. {oid}{tag}', fill=(245, 232, 205), font=f)
    out = D / f'review-{b}.png'
    sheet.convert('RGB').save(out)
    print(out)


def catalog() -> None:
    rows = []
    for b, (_, _, items) in BATCHES.items():
        for oid, desc, th, tall, radius in items:
            if (OBJ / oid / 'runtime/sd' / f'{oid}.png').exists():
                rows.append({'id': oid, 'tall': tall, 'radius': radius, 'batch': b})
    (D / 'catalog.json').write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8')
    print(D / 'catalog.json', len(rows))


if __name__ == '__main__':
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == 'ref':
        make_ref()
    elif cmd == 'catalog':
        catalog()
    else:
        {'prompts': prompts, 'cut': cut}[cmd](args or list(BATCHES))
