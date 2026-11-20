"""Ground detail for the land around the board (owner 20/11/2026: "the ground around is too bare"): more seamless
grass tile variants, more seamless ground textures and flat ground decals, drawn by Codex and cut here.

    python docs/art-review/env/make_ground.py prompts [id ...]   # write prompt.md files + .superpowers/env-ground-run.sh
    python docs/art-review/env/make_ground.py cut                # cut every source that exists, catalog + review sheets

Prompts are NOT written from memory: they are built with the functions of docs/art-review/g3e/buildings/make_prompts.py
(the "Prompt texture mặt đất dùng lại" block for tiles and textures, the "Prompt isometric dùng lại" block for the
decals, both read from docs/ART_STYLE.md, which every prompt tells Codex to read). Old scripts are imported, not edited.

Kinds and sizes (runtime files only under docs/art-review/env/ground/<id>/runtime/<tier>/<id>.png):
  tile     seamless grass tile like public/assets/art/ai-v1/grass_*.png: sd 32 px (density 2), hd 64 px. The 1024 px
           source is drawn on a 64x64 art-pixel grid (16 px blocks) and box-reduced 32x / 16x (whole, stays seamless).
           Colour: the "mixable" variants have their mean colour moved onto the existing grass mean (114, 138, 54);
           the lush and dry ones are moved half-way so they stay distinct but blend.
  texture  seamless texture like make_textures.py: sd 128 px (8x reduce), hd 256 px (4x reduce).
  decal    flat ground patch seen in the 2:1 iso view, alpha 0/255. Drawn 9 per sheet (3x3 cells of 341 px on flat
           black), cut per cell, keyed (black connected to the cell border is background; enclosed holes are filled),
           box-reduced 4x (sd), 2x (hd), 1x (uhd) like the shipped wilds. Footprint radius (world px) = sd width / 2.83
           (a flat circle of radius r projects to an ellipse 2.83 r wide).
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
ENV = Path(__file__).resolve().parent
G = ENV / 'ground'
_spec = importlib.util.spec_from_file_location('make_prompts', ROOT / 'docs/art-review/g3e/buildings/make_prompts.py')
mp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mp)

REFERENCE = mp.REFERENCE
ISO_REFS = ['docs/art-review/style-references/iso-plot-open-approved.png',
            'docs/art-review/style-references/iso-building-approved.png']
GRASS_REF = 'docs/art-review/env/ground/ref-grass-existing.png'
GRASS_MEAN = np.array([114.0, 138.0, 54.0])
POCKET_MAX = 1500  # source px: an enclosed dark pocket bigger than this is background seen through a ring

# ---- seamless grass tiles --------------------------------------------------------------------------------------
_G = ('Same family as the attached existing grass tile (ref-grass-existing.png, the current game grass): same warm '
      'mid green base, same small dark-green tuft shapes, so this variant can sit next to it on the same ground. ')
TILES = [
    ('grass_lush', 'LUSH GRASS', _G + 'A lusher, slightly deeper and richer green: denser and fuller tufts, a few '
     'brighter blade highlights on the upper-left of each tuft; no flowers.', 0.5),
    ('grass_dry', 'DRY GRASS', _G + 'Late-summer dry grass: the green drifts toward olive and straw, a few pale '
     'yellow-tan dry blades and tiny bare-earth specks between tufts; still mostly green, not a desert. Keep CLEAR, '
     'well separated tuft shapes like the reference (a dark tuft outline on a lighter base), not an even noise.', 0.5),
    ('grass_clover', 'CLOVER GRASS', _G + 'Many tiny three-leaf clover shapes (each 2 to 3 art pixels) mixed into '
     'the grass, in a slightly bluer green, plus one or two tiny white clover flowers.', 1.0),
    ('grass_mown', 'SHORT-MOWN GRASS', _G + 'Short, even, neatly mown lawn: smaller and flatter tufts, faint soft '
     'stripes of two close greens, very low contrast; no flowers.', 1.0),
    ('grass_tinyflowers', 'GRASS WITH TINY FLOWERS', _G + 'Scattered tiny single-pixel and two-pixel flowers: cream '
     'white, butter yellow and a little soft blue, fewer than 12 flowers in the whole tile.', 1.0),
    ('grass_mossy', 'MOSSY GRASS', _G + 'Patches of soft yellow-green and deep green moss between the tufts, a few '
     'darker damp spots; same overall brightness as the reference.', 1.0),
    # round 2 (same day, quota left)
    ('grass_shade', 'SHADED GRASS', _G + 'Grass in light shade: a touch darker and cooler green overall, tufts a '
     'little longer, no flowers.', 0.5),
    ('grass_sparse', 'SPARSE GRASS', _G + 'Thinner grass with small specks and spots of bare warm brown earth '
     'showing between the tufts (at most a fifth of the tile is earth).', 0.5),
    ('grass_autumn', 'GRASS WITH A FEW FALLEN LEAVES', _G + 'Three or four tiny fallen leaves (2 to 3 art pixels each) '
     'in orange, rust and mustard lie on the grass; otherwise the same grass.', 1.0),
]
TILE_FOOTER = """
YÊU CẦU SẢN XUẤT: ảnh VUÔNG 1024×1024, texture phủ KÍN cả ảnh (không nền đen, không khung, không viền, không khoảng trống), LẶP LIỀN MẠCH theo cả hai chiều. Đây là MỘT ô cỏ nhỏ của game (16×16 px thế giới): vẽ trên lưới 64×64 "pixel" nghệ thuật, mỗi "pixel" là một khối vuông đúng 16×16 điểm ảnh, màu phẳng trong khối (ảnh sẽ được thu nhỏ đúng 16 lần về 64×64 và 32 lần về 32×32). Cỡ búi cỏ như ảnh tham chiếu cỏ hiện tại (ảnh đó cũng là 64×64 phóng 16 lần).
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
"""

# ---- seamless textures -------------------------------------------------------------------------------------------
TEXTURES = [
    ('tex_dirt', 'bare DIRT ground',
     'Warm brown bare soil matching the approved plots\' earth: three close brown tones, soft lumps, tiny darker crumbs '
     'and a few lighter dry specks, evenly spread; no grass, no road ruts, no stones bigger than one cluster.'),
    ('tex_tilled', 'TILLED SOIL',
     'Dark rich freshly tilled farm soil in warm browns: soft parallel furrow ridges running straight across the '
     'texture (lit on the upper-left side, darker in the troughs) that continue seamlessly across both edges; a few '
     'crumbs; no plants.'),
    ('tex_gravel', 'GRAVEL ground',
     'Packed GREY gravel: the texture reads clearly as grey-beige stone, NOT as orange or brown earth. Densely packed '
     'small pebbles in warm light grey, blue-grey, beige and a few sandy ones (each pebble one or two clusters with a '
     'lighter top-left pixel and a darker bottom-right pixel), only thin dusty grey-brown gaps between them, evenly '
     'spread; no big rocks.'),
    ('tex_moss', 'MOSS ground',
     'Soft carpet of GREEN moss: mostly deep forest greens and mid greens (like the approved grass, a little darker '
     'and cooler), with only a few small lighter yellow-green tips; NOT mustard or yellow overall. Small rounded '
     'cushion shapes, a few tiny damp dark spots; not grass blades.'),
    ('tex_meadow', 'TALL MEADOW GRASS seen from above',
     'Tall wild meadow grass seen from straight above: longer swaying blade clusters in warm greens with some straw '
     'tones and a few seed heads, denser and wilder than a lawn; no flowers bigger than one cluster, no path.'),
    ('tex_leaves', 'FALLEN LEAVES on the ground',
     'A forest floor covered in fallen autumn leaves: small leaf shapes (2 to 4 clusters) in warm orange, rust red, '
     'mustard yellow and brown, overlapping, a little dark earth showing between; evenly spread.'),
    # round 2 (same day, quota left)
    ('tex_mud', 'wet MUD ground',
     'Wet dark-brown mud: smooth glossy patches with a few lighter wet highlights, small shallow water spots of muted '
     'teal, a few crumbs; evenly spread.'),
    ('tex_forest_floor', 'FOREST FLOOR',
     'A conifer forest floor: dark earth covered by fallen brown pine needles, small twigs, a few tiny pine cones '
     'seen from above and small moss tufts; evenly spread.'),
    ('tex_dry_grass', 'DRY STRAW GRASS',
     'Dry late-summer grass seen from above: straw yellow, tan and faded olive blades, short and dense, a few bare '
     'earth specks; evenly spread.'),
    ('tex_clover', 'CLOVER FIELD',
     'A dense carpet of small three-leaf clover in fresh greens, with a few tiny white and pink clover flowers; '
     'evenly spread.'),
    ('tex_sandy_dirt', 'SANDY DIRT',
     'Pale sandy dirt: a mix of warm sand and light brown earth, tiny pebbles and a few sparse dry grass blades; '
     'evenly spread.'),
    # round 3
    ('tex_heather', 'HEATHER moorland',
     'Low heather seen from above: small rounded clumps of muted purple-pink flowers and dark olive-green foliage, a '
     'little brown earth between; evenly spread.'),
    ('tex_cobble_worn', 'WORN COBBLESTONES half sunk in earth',
     'Old rounded cobblestones in warm greys and beige, half sunk in packed brown earth with grass blades in some '
     'joints, irregular, flat (seen from straight above); evenly spread.'),
    ('tex_grass_dirt', 'PATCHY GRASS AND DIRT',
     'A worn mix of short green grass and bare warm brown earth in small irregular patches, about half and half, the '
     "grass matching the approved plots' grass rim; evenly spread."),
]

# round 7: a second drawing of every tile and texture (same subject, different arrangement), for more variety on the ground
TILES += [(f'{i}_2', n, d + ' This is a SECOND tile of the same kind: different placement and shapes of every detail.', w)
          for i, n, d, w in TILES]
TEXTURES += [(f'{i}_2', n, d + ' A SECOND version of this texture: a different arrangement and slightly different tones.')
             for i, n, d in TEXTURES]

# ---- decal sheets: 9 per sheet, (id, description with the size it should have on the 1024 sheet) ----------------
_FLAT = ('Every patch lies FLAT on the ground and is seen in the 2:1 isometric view, so its overall outline is squashed '
         'to about twice as wide as it is tall. It has NO height, NO thickness, NO cast shadow and is NOT a diamond tile; '
         'its outer edge is a natural irregular edge (no dark outline ring).')
SHEETS = [
    ('sheet_dirt', 'bare dirt patches', [
        ('decal_dirt_round', 'a roughly round patch of bare warm brown dirt, about 300 px wide'),
        ('decal_dirt_oval', 'a long oval patch of bare dirt, about 320 px wide'),
        ('decal_dirt_kidney', 'a kidney-shaped bare dirt patch with a few short grass blades poking in at the edge, about 280 px wide'),
        ('decal_dirt_small', 'a small bare dirt spot, about 170 px wide'),
        ('decal_dirt_scatter', 'three or four small bare dirt spots close together forming one group, about 300 px wide'),
        ('decal_dirt_worn', 'a worn trampled strip of dirt, like a short footpath piece fading at both ends, about 320 px wide'),
        ('decal_dirt_dark', 'a damp darker-brown dirt patch with a few crumbs, about 260 px wide'),
        ('decal_dirt_pebbly', 'a dirt patch with a few tiny pebbles in it, about 280 px wide'),
        ('decal_dirt_mole', 'a small heap-free molehill spot: a ring of loose crumbly dirt, flat, about 180 px wide'),
    ]),
    ('sheet_greens', 'clover patches and grass tufts seen from above', [
        ('decal_clover_a', 'a patch of three-leaf clover in a bluish green, about 260 px wide'),
        ('decal_clover_b', 'a round clover patch with a few tiny white clover flowers, about 240 px wide'),
        ('decal_clover_c', 'a long clover patch with a few pink clover flowers, about 300 px wide'),
        ('decal_clover_d', 'a small clover patch, about 170 px wide'),
        ('decal_tufts_a', 'a cluster of three darker-green grass tufts seen from above (low, flat, no height), about 220 px wide'),
        ('decal_tufts_b', 'a cluster of five pale yellow-green grass tufts seen from above, about 260 px wide'),
        ('decal_tufts_c', 'a single big round grass tuft seen from above, star-like blades, about 160 px wide'),
        ('decal_tufts_dry', 'a cluster of dry straw-coloured grass tufts seen from above, about 240 px wide'),
        ('decal_weeds', 'a patch of low broad-leaf weeds (plantain rosettes) seen from above, about 220 px wide'),
    ]),
    ('sheet_flowers', 'wildflower patches', [
        ('decal_flowers_white', 'a patch of tiny white daisies among low green leaves, about 260 px wide'),
        ('decal_flowers_yellow', 'a patch of tiny butter-yellow buttercups, about 260 px wide'),
        ('decal_flowers_pink', 'a patch of tiny soft pink flowers, about 240 px wide'),
        ('decal_flowers_lilac', 'a patch of tiny lilac and violet flowers, about 260 px wide'),
        ('decal_flowers_blue', 'a patch of tiny cornflower-blue flowers, about 240 px wide'),
        ('decal_flowers_red', 'a patch of tiny red poppies, about 240 px wide'),
        ('decal_flowers_orange', 'a patch of tiny orange marigold-like flowers, about 220 px wide'),
        ('decal_flowers_mixed', 'a patch of mixed tiny wildflowers: white, yellow, pink and blue, about 300 px wide'),
        ('decal_flowers_dandelion', 'a patch of dandelions: yellow flowers and a few white puff heads, about 230 px wide'),
    ]),
    ('sheet_stones_moss', 'pebble scatters and moss patches', [
        ('decal_pebbles_a', 'a loose scatter of about ten tiny warm grey pebbles, flat on the ground, about 240 px wide'),
        ('decal_pebbles_b', 'a scatter of small sandy and brown pebbles on a faint dusty patch, about 260 px wide'),
        ('decal_pebbles_c', 'a small tight cluster of pebbles, about 160 px wide'),
        ('decal_stepping', 'three flat stepping stones set into the ground in a short curving line, about 320 px wide'),
        ('decal_moss_a', 'a soft round moss patch in yellow-green, about 260 px wide'),
        ('decal_moss_b', 'a deep green moss patch with lighter tips, irregular, about 280 px wide'),
        ('decal_moss_c', 'a small moss patch, about 170 px wide'),
        ('decal_moss_stone', 'a flat stone slab sunk into the ground, half covered by moss, about 220 px wide'),
        ('decal_lichen', 'a flat patch of grey-green lichen and tiny pebbles, about 220 px wide'),
    ]),
    ('sheet_leaves_water', 'fallen leaves and puddles', [
        ('decal_leaves_orange', 'a loose patch of fallen orange autumn leaves, about 260 px wide'),
        ('decal_leaves_red', 'a patch of fallen rust-red leaves, about 240 px wide'),
        ('decal_leaves_yellow', 'a patch of fallen mustard-yellow leaves, about 240 px wide'),
        ('decal_leaves_brown', 'a patch of dry brown leaves and twigs, about 260 px wide'),
        ('decal_puddle_a', 'a small rain puddle: calm teal water with a light reflection streak and a thin muddy rim, about 260 px wide'),
        ('decal_puddle_b', 'a long puddle in a muddy rut, about 300 px wide'),
        ('decal_puddle_c', 'a tiny round puddle, about 160 px wide'),
        ('decal_mud', 'a patch of wet brown mud with a little water in it, about 280 px wide'),
        ('decal_puddle_leaf', 'a small puddle with two fallen leaves floating on it, about 220 px wide'),
    ]),
    ('sheet_dry_marks', 'fairy rings, cracked earth, sand and marks', [
        ('decal_fairy_ring_a', 'a mushroom fairy ring: a flat ring of tiny red-capped and cream mushrooms seen from above (dots, no height) on slightly darker grass, about 320 px wide'),
        ('decal_fairy_ring_b', 'a fairy ring of tiny brown and white mushroom dots, about 280 px wide'),
        ('decal_cracked_a', 'a patch of cracked dry earth: pale tan clay broken into polygon plates by thin dark-brown cracks, about 300 px wide'),
        ('decal_cracked_b', 'a small cracked dry mud patch, about 200 px wide'),
        ('decal_cracked_c', 'a long cracked dry earth patch with a few dry grass blades, about 320 px wide'),
        ('decal_sand_a', 'a small patch of pale warm sand, about 260 px wide'),
        ('decal_sand_b', 'a sand patch with two tiny shells and ripples, about 280 px wide'),
        ('decal_sand_c', 'a small sand spot, about 170 px wide'),
        ('decal_scorched_a', 'a scorched burnt patch: charred dark-brown ground (darkest tone #3A2A22, never pure black), grey ash and a few faint orange embers, about 280 px wide'),
    ]),
    ('sheet_tracks', 'footprints, cart tracks and scorch marks', [
        ('decal_footprints', 'a short trail of small boot footprints pressed into the ground (darker brown prints), walking diagonally, about 300 px wide'),
        ('decal_hoofprints', 'a short trail of horse hoof prints, about 300 px wide'),
        ('decal_pawprints', 'a short trail of small animal paw prints, about 240 px wide'),
        ('decal_cart_tracks_a', 'two thin parallel cart-wheel ruts pressed into the ground (shallow darker-brown lines, NO depth, NO trench walls, grass between them, no green fill), running along the diagonal, fading at both ends, about 330 px wide'),
        ('decal_cart_tracks_b', 'a gently curving pair of thin shallow cart-wheel ruts (flat darker-brown lines, NO trench, NO raised sides), about 320 px wide'),
        ('decal_cart_tracks_c', 'a short faint single shallow wheel rut, a thin flat brown line, about 260 px wide'),
        ('decal_scorched_b', 'a small burnt spot with ash (darkest tone #3A2A22), about 200 px wide'),
        ('decal_scorched_c', 'a long scorched streak of burnt grass and ash, about 300 px wide'),
        ('decal_campfire_ash', 'the flat remains of an old campfire: a ring of small flat stones around grey ash and charcoal bits (no flames, no height), about 240 px wide'),
    ]),
    # round 2 (same day, quota left)
    ('sheet_edges', 'bare earth patches with grassy fringes', [
        ('decal_edge_dirt_a', 'a bare dirt patch whose edge breaks into short grass blades all around, about 300 px wide'),
        ('decal_edge_dirt_b', 'a sandy-dirt patch with a ragged grassy fringe, about 280 px wide'),
        ('decal_edge_dirt_c', 'a small dirt patch with grass tufts growing inside it, about 200 px wide'),
        ('decal_edge_trampled', 'a patch of trampled flattened yellowed grass, about 300 px wide'),
        ('decal_edge_burrow', 'a flat rabbit-burrow mouth: a dark earth hole (darkest #2E2018) with a fan of loose dirt, about 200 px wide'),
        ('decal_edge_rootball', 'a patch of earth with a few flat exposed tree roots snaking across, about 300 px wide'),
        ('decal_edge_gravel', 'a patch of gravel fading into grass at its edge, about 280 px wide'),
        ('decal_edge_clay', 'a reddish clay patch, smooth with a few cracks, about 260 px wide'),
        ('decal_edge_ashgrey', 'a pale grey dusty ground patch with a few pebbles, about 240 px wide'),
    ]),
    ('sheet_flowers2', 'small flower clusters', [
        ('decal_bloom_white_s', 'a small cluster of white star flowers, about 150 px wide'),
        ('decal_bloom_yellow_s', 'a small cluster of yellow flowers, about 150 px wide'),
        ('decal_bloom_pink_s', 'a small cluster of pink flowers, about 150 px wide'),
        ('decal_bloom_violet_s', 'a small cluster of violets, about 150 px wide'),
        ('decal_bloom_blue_s', 'a small cluster of forget-me-nots, about 150 px wide'),
        ('decal_bloom_red_s', 'a small cluster of red flowers, about 150 px wide'),
        ('decal_bloom_line', 'a short loose line of mixed tiny flowers along the ground, about 300 px wide'),
        ('decal_bloom_ring', 'a loose ring of tiny white and yellow flowers, about 260 px wide'),
        ('decal_bloom_heather', 'a low patch of purple heather seen from above, about 260 px wide'),
    ]),
    ('sheet_litter', 'small flat things lying on the ground', [
        ('decal_twigs', 'a few fallen twigs and small sticks lying flat, about 240 px wide'),
        ('decal_straw', 'scattered loose golden straw lying flat, about 280 px wide'),
        ('decal_woodchips', 'scattered pale wood chips and shavings, about 240 px wide'),
        ('decal_acorns', 'a few acorns and oak leaves lying flat, about 200 px wide'),
        ('decal_pinecones', 'a few small pine cones and needles lying flat (seen from above, very low), about 220 px wide'),
        ('decal_mushrooms_flat', 'a small cluster of tiny mushroom caps seen straight from above, about 160 px wide'),
        ('decal_seed_spill', 'a little spill of golden grain from a split sack mark on the ground (no sack), about 220 px wide'),
        ('decal_shards', 'a few flat broken clay pot shards in the grass, about 200 px wide'),
        ('decal_feathers', 'two or three small white and brown feathers lying flat, about 180 px wide'),
    ]),
    # round 3
    ('sheet_large', 'LARGE ground patches', [
        ('decal_big_dirt', 'a large irregular bare dirt patch with a few grass tufts inside, about 330 px wide'),
        ('decal_big_meadow', 'a large patch of mixed wildflowers in low grass, about 330 px wide'),
        ('decal_big_clover', 'a large clover patch with white flowers, about 330 px wide'),
        ('decal_big_sand', 'a large pale sand patch with ripples, about 330 px wide'),
        ('decal_big_moss', 'a large green moss patch, about 330 px wide'),
        ('decal_big_leaves', 'a large drift of fallen autumn leaves, about 330 px wide'),
        ('decal_big_gravel', 'a large grey gravel patch, about 330 px wide'),
        ('decal_big_mud', 'a large wet mud patch with two small puddles, about 330 px wide'),
        ('decal_big_drygrass', 'a large patch of dry straw-coloured grass, about 330 px wide'),
    ]),
    ('sheet_paths', 'short flat path pieces', [
        ('decal_path_stones', 'a short path of four flat round stepping stones in a gentle curve, about 330 px wide'),
        ('decal_path_dirt_bend', 'a short worn dirt footpath piece with a bend, fading at both ends, about 330 px wide'),
        ('decal_path_flagstones', 'a few flat square flagstones laid along the diagonal, with grass in the joints, about 300 px wide'),
        ('decal_path_planks', 'a few flat weathered planks laid in the mud as a walkway (flat on the ground, no height), about 300 px wide'),
        ('decal_path_cobbles', 'a small patch of old cobbles half sunk in the grass, about 280 px wide'),
        ('decal_path_gravel', 'a short gravel footpath piece, about 320 px wide'),
        ('decal_path_crossing', 'a small worn dirt crossing where two faint footpaths meet, about 330 px wide'),
        ('decal_path_end', 'the faded end of a dirt footpath breaking into grass, about 280 px wide'),
        ('decal_path_brick', 'a few flat old red bricks sunk into the ground in a short line, about 260 px wide'),
    ]),
    ('sheet_magic', 'cozy magical and rustic ground marks', [
        ('decal_rune_circle', 'a faded old stone rune circle inlaid flat in the grass, pale grey with faint violet runes, about 320 px wide'),
        ('decal_glow_mushrooms', 'a flat cluster of tiny pale-blue glowing mushroom caps seen from above, about 200 px wide'),
        ('decal_flower_circle', 'a perfect small circle of tiny white flowers, about 260 px wide'),
        ('decal_stone_circle', 'a ring of small flat stones set in the grass (low, flat), about 280 px wide'),
        ('decal_crop_circle', 'a small patch of grass pressed flat in a swirl, about 300 px wide'),
        ('decal_salt_ring', 'a thin ring of white salt or chalk drawn on the ground, about 280 px wide'),
        ('decal_spilled_coins', 'a few small gold coins and a coin lying flat in the grass, about 180 px wide'),
        ('decal_old_well_cover', 'a flat round wooden well cover lying in the grass (flat on the ground), about 200 px wide'),
        ('decal_horseshoe', 'an old rusty horseshoe and a few nails lying flat in the grass, about 160 px wide'),
    ]),
]

# round 4: a second, differently shaped variant of every round-1 sheet (same subjects, new shapes and colours)
SHEETS += [(f'{sid}_2', f'{name}, second variants', [
    (f'{did}_2', 'a NEW variant (different outline, size and details, same subject) of: ' + desc) for did, desc in items])
    for sid, name, items in SHEETS[:7]]
# round 5: the same for the round-2 and round-3 sheets
SHEETS += [(f'{sid}_2', f'{name}, second variants', [
    (f'{did}_2', 'a NEW variant (different outline, size and details, same subject) of: ' + desc) for did, desc in items])
    for sid, name, items in SHEETS[7:13]]
# round 6: a third variant of every base sheet
SHEETS += [(f'{sid}_3', f'{name}, third variants', [
    (f'{did}_3', 'a THIRD variant (again a different outline, size, colour mix and details, same subject) of: ' + desc)
    for did, desc in items]) for sid, name, items in SHEETS[:13]]

DECAL_FOOTER = """
YÊU CẦU SẢN XUẤT (ghi đè "one isolated asset", "For a building"/"For a ground tile" và "transparent background" ở trên): ảnh 1024×1024, nền ĐEN PHẲNG #000000 hoàn toàn (không quầng sáng, không bóng đổ lên nền, không nền cỏ quanh vật). Ảnh là một BẢNG 3 cột × 3 hàng, mỗi ô khoảng 341×341 px (KHÔNG vẽ đường kẻ ô, không chữ số). Mỗi ô chứa ĐÚNG MỘT mảng trang trí mặt đất, nằm giữa ô, cách mép ô ít nhất 30 px, không chạm sang ô khác. Mảng là vật PHẲNG nằm trên đất, nhìn isometric 2:1: dáng tổng thể dẹt (rộng gấp khoảng đôi cao), KHÔNG chiều cao, KHÔNG bóng đổ, KHÔNG mép dày, KHÔNG phải hình thoi; mép ngoài tự nhiên, không viền tối bao quanh. Trong vật không có điểm đen thuần (tông tối nhất khoảng #2E2018). "Pixel" lớn khoảng 7×7 điểm ảnh, màu phẳng, không khử răng cưa.
Thứ tự các ô (trái → phải, trên → dưới):
{items}
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
"""


def tile_prompt(out, name, desc):
    body = mp.build_texture_prompt(out, name, desc).replace(mp.TEXTURE_FOOTER, TILE_FOOTER)
    body = body.replace('7×7 image px', '16×16 image px (a 64×64 art-pixel grid)')
    return body.replace('Ảnh đã duyệt đính kèm thêm để lấy bảng màu:',
                        f'Ảnh cỏ hiện tại của game đính kèm (`{GRASS_REF}`): khớp màu, cỡ búi cỏ và lưới pixel với nó. '
                        'Ảnh đã duyệt đính kèm thêm để lấy bảng màu:')


def decal_prompt(out, name, items):
    note = (f'\n\nẢNH THAM CHIẾU GÓC NHÌN ISOMETRIC ĐÃ DUYỆT (đính kèm): {", ".join(f"`{r}`" for r in ISO_REFS)} — lấy đúng '
            'GÓC NHÌN 2:1, cỡ cụm pixel, bảng màu đất/cỏ và độ hoàn thiện từ các ảnh này.\n\n')
    p = mp.build_iso_prompt(out, f'a sheet of nine FLAT GROUND DECALS ({name}) for the land around the board', _FLAT)
    head, _, rest = p.partition('\n\n')
    listing = '\n'.join(f'{i + 1}. {d}' for i, (_, d) in enumerate(items))
    return (head + note + rest).replace(mp.ISO_FOOTER, DECAL_FOOTER.format(items=listing))


def write_prompts(only=None):
    G.mkdir(parents=True, exist_ok=True)
    ref = ROOT / GRASS_REF
    if not ref.exists():  # the current grass, HD tile 64 px blown up 16x: exactly the format asked for
        Image.open(ROOT / 'public/assets/art/ai-v1-hd/grass_0.png').convert('RGB').resize((1024, 1024), Image.NEAREST).save(ref)
    jobs = []
    for ident, name, desc, _ in TILES:
        jobs.append((ident, tile_prompt, (name, desc), [REFERENCE, GRASS_REF, *mp.TEXTURE_REFS]))
    for ident, name, desc in TEXTURES:
        jobs.append((ident, mp.build_texture_prompt, (name, desc), [REFERENCE, *mp.TEXTURE_REFS]))
    for ident, name, items in SHEETS:
        jobs.append((ident, decal_prompt, (name, items), [REFERENCE, *ISO_REFS]))
    lines = []
    for ident, fn, args, refs in jobs:
        if only and ident not in only:
            continue
        d = G / ('_sheets' if ident.startswith('sheet_') else '') / ident
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        (d / 'prompt.md').write_text(fn(out, *args), encoding='utf-8')
        lines.append(f'{ident}|{(d / "prompt.md").relative_to(ROOT).as_posix()}|{out}|{" ".join(refs)}')
    (ROOT / '.superpowers').mkdir(exist_ok=True)
    (ROOT / '.superpowers/env-ground-jobs.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8', newline='\n')
    print('\n'.join(lines))


# ---- cutting ------------------------------------------------------------------------------------------------------

def save_tiers(ident, tiers):
    for tier, im in tiers.items():
        d = G / ident / 'runtime' / tier
        d.mkdir(parents=True, exist_ok=True)
        im.save(d / f'{ident}.png')


def seam(tile):
    a = np.asarray(tile.convert('RGB')).astype(int)
    wrap = np.abs(a[:, 0] - a[:, -1]).sum(1).mean() + np.abs(a[0] - a[-1]).sum(1).mean()
    w = a.shape[1] // 2
    inner = np.abs(a[:, w] - a[:, w - 1]).sum(1).mean() + np.abs(a[w] - a[w - 1]).sum(1).mean()
    return wrap / 2, inner / 2


def recolour(src, weight):
    a = np.asarray(src.convert('RGB')).astype(float)
    a += weight * (GRASS_MEAN - a.reshape(-1, 3).mean(0))
    return Image.fromarray(np.clip(a.round(), 0, 255).astype(np.uint8))


def pick_down(im, threshold=80):
    """Halve a pixel-art tile without inventing blended colours (a box filter smears the 1 px tufts of the old 32 px
    tiles): each 2x2 block keeps the pixel farthest from the tile's base colour when that one is a real detail
    (distance > threshold: a flower, a tuft), otherwise the pixel closest to the block mean."""
    a = np.asarray(im.convert('RGB')).astype(int)
    h, w = a.shape[0] // 2, a.shape[1] // 2
    blocks = a.reshape(h, 2, w, 2, 3).transpose(0, 2, 1, 3, 4).reshape(h, w, 4, 3)
    far = np.abs(blocks - a.reshape(-1, 3).mean(0)).sum(3)
    near = np.abs(blocks - blocks.mean(2, keepdims=True)).sum(3)
    idx = np.where(far.max(2) > threshold, far.argmax(2), near.argmin(2))
    return Image.fromarray(np.take_along_axis(blocks, idx[..., None, None], 2)[:, :, 0].astype(np.uint8))


def cut_tile(ident, weight):
    src = Image.open(G / ident / 'source.png').convert('RGB')
    assert src.size == (1024, 1024), src.size
    hd = recolour(src, weight).resize((64, 64), Image.BOX)  # 16 px blocks -> 1 px
    return {'sd': pick_down(hd), 'hd': hd}


def cut_texture(ident):
    src = Image.open(G / ident / 'source.png').convert('RGB')
    w, h = src.size
    assert w % 8 == 0 and h % 8 == 0 and w == h, src.size
    return {'sd': src.resize((w // 8, h // 8), Image.BOX), 'hd': src.resize((w // 4, h // 4), Image.BOX)}


def key_cell(cell):
    """Alpha mask of one sheet cell: dark pixels connected to the cell border are background; holes are filled."""
    dark = cell.max(axis=2) <= 28
    h, w = dark.shape
    m = np.pad(np.where(dark, 0, 255).astype(np.uint8), 1)  # border ring of 0: one flood reaches all outside darkness
    flood = Image.fromarray(m).copy()  # a writable copy (fromarray images can be read-only views)
    ImageDraw.floodfill(flood, (0, 0), 128)
    outside = np.asarray(flood)[1:-1, 1:-1] == 128
    # Dark pockets enclosed by the decal: small ones are dark detail (filled), big ones are background seen through a
    # ring (a salt ring, a stone circle) and stay transparent.
    pockets = Image.fromarray(np.where(dark & ~outside, 255, 0).astype(np.uint8)).copy()
    px = np.asarray(pockets)
    for y, x in zip(*np.where(px == 255)):
        if pockets.getpixel((int(x), int(y))) != 255:
            continue
        ImageDraw.floodfill(pockets, (int(x), int(y)), 100)
        region = np.asarray(pockets) == 100
        if region.sum() > POCKET_MAX:
            outside |= region
        pockets.paste(Image.fromarray(np.where(region, 0, np.asarray(pockets)).astype(np.uint8)))
    return ~outside


def reduce_rgba(rgb, mask, factor):
    h, w = mask.shape
    rgba = Image.fromarray(np.dstack([rgb.astype(np.uint8), np.where(mask, 255, 0).astype(np.uint8)]), 'RGBA')
    small = rgba.convert('RGBa').resize((max(1, w // factor), max(1, h // factor)), Image.BOX).convert('RGBA')
    a = np.array(small)
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    a[a[..., 3] == 0] = 0
    return Image.fromarray(a, 'RGBA')


def cut_sheet(ident, items):
    src = np.asarray(Image.open(G / '_sheets' / ident / 'source.png').convert('RGB')).astype(int)
    H, W = src.shape[:2]
    out = {}
    for i, (did, _) in enumerate(items):
        r, c = divmod(i, 3)
        x0, x1, y0, y1 = c * W // 3, (c + 1) * W // 3, r * H // 3, (r + 1) * H // 3
        cell = src[y0:y1, x0:x1]
        mask = key_cell(cell)
        if mask.sum() < 400:
            print(f'{did}: empty cell')
            continue
        ys, xs = np.where(mask)
        # crop to a box that is a whole multiple of 4 so the sd/hd/uhd twins are exactly 1x/2x/4x
        bx0, by0 = xs.min() // 4 * 4, ys.min() // 4 * 4
        bx1, by1 = -(-(xs.max() + 1) // 4) * 4, -(-(ys.max() + 1) // 4) * 4
        bx1, by1 = min(bx1, cell.shape[1] // 4 * 4), min(by1, cell.shape[0] // 4 * 4)
        rgb, m = cell[by0:by1, bx0:bx1], mask[by0:by1, bx0:bx1]
        touches = xs.min() == 0 or ys.min() == 0 or xs.max() == cell.shape[1] - 1 or ys.max() == cell.shape[0] - 1
        out[did] = ({'sd': reduce_rgba(rgb, m, 4), 'hd': reduce_rgba(rgb, m, 2), 'uhd': reduce_rgba(rgb, m, 1)}, touches)
    return out


def font(size):
    try:
        return ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size)
    except OSError:
        return ImageFont.load_default()


def iso_grass(width, height):
    """The game's ground: the three grass tiles in an 8x8 periodic patch, projected 2:1 (groundArt.ts), tiled."""
    tiles = [np.asarray(Image.open(ROOT / f'public/assets/art/ai-v1/grass_{i}.png').convert('RGB')) for i in range(3)]
    n = 8 * 32
    patch = np.zeros((n, n, 3), np.uint8)
    for j in range(8):
        for i in range(8):
            patch[j * 32:(j + 1) * 32, i * 32:(i + 1) * 32] = tiles[(i * 7 + j * 13 + i * j) % 3]
    v, u = np.mgrid[0:n, 0:2 * n]
    qx, qy = u + 0.5 - n, v + 0.5
    x = np.floor(qy - qx / 2).astype(int) % n
    y = np.floor(qy + qx / 2).astype(int) % n
    t = Image.fromarray(patch[y, x])
    out = Image.new('RGB', (width, height))
    for yy in range(0, height, t.height):
        for xx in range(0, width, t.width):
            out.paste(t, (xx, yy))
    return out


def tiling_sheet(rows, path, title):
    """Every tile/texture repeated 3x3 (a seam shows as a straight line), shown at sd, zoomed."""
    f, ft = font(14), font(20)
    cells = []
    for ident, im in rows:
        z = 6 if im.width <= 64 else 2
        big = im.resize((im.width * z, im.height * z), Image.NEAREST)
        rep = Image.new('RGB', (big.width * 3, big.height * 3))
        for i in range(3):
            for j in range(3):
                rep.paste(big, (i * big.width, j * big.height))
        cells.append((ident, im, rep))
    cw = max(c[2].width for c in cells) + 20
    ch = max(c[2].height for c in cells) + 60
    cols = 3
    sheet = Image.new('RGB', (cw * cols + 20, ch * ((len(cells) + cols - 1) // cols) + 50), (40, 34, 30))
    d = ImageDraw.Draw(sheet)
    d.text((10, 10), title, fill=(245, 232, 205), font=ft)
    for k, (ident, im, rep) in enumerate(cells):
        x, y = 10 + (k % cols) * cw, 46 + (k // cols) * ch
        sheet.paste(rep, (x, y + 22))
        wrap, inner = seam(im)
        mean = tuple(int(v) for v in np.asarray(im.convert('RGB')).reshape(-1, 3).mean(0))
        d.text((x, y + 2), f'{ident} {im.width}px  seam {wrap:.0f}/{inner:.0f}  mean {mean}', fill=(245, 232, 205), font=f)
    sheet.save(path)
    print('sheet', path)


def mix_sheet(tiles, path):
    """Old and new grass tiles mixed at random in one square field, then projected like the game's ground."""
    allt = [np.asarray(Image.open(ROOT / f'public/assets/art/ai-v1/grass_{i}.png').convert('RGB')) for i in range(3)]
    allt += [np.asarray(t.convert('RGB')) for t in tiles]
    rng = np.random.default_rng(7)
    n = 16
    field = np.zeros((n * 32, n * 32, 3), np.uint8)
    for j in range(n):
        for i in range(n):
            field[j * 32:(j + 1) * 32, i * 32:(i + 1) * 32] = allt[rng.integers(len(allt))]
    Image.fromarray(field).resize((n * 32 * 3, n * 32 * 3), Image.NEAREST).save(path)
    print('sheet', path)


def decal_review(name, cuts, path):
    f, ft = font(14), font(20)
    z = 2
    cw, ch = 300, 210
    cols = 3
    rows = (len(cuts) + cols - 1) // cols
    W, H = cw * cols + 20, ch * rows + 60
    sheet = iso_grass(W, H).convert('RGBA')
    d = ImageDraw.Draw(sheet)
    d.rectangle((0, 0, W, 40), fill=(40, 34, 30))
    d.text((10, 10), f'{name}: decals at sd x{z} on the game grass (ground at density 2, decal sd = 1 world-screen px)',
           fill=(245, 232, 205), font=ft)
    for k, (did, (tiers, touches)) in enumerate(cuts.items()):
        x, y = 10 + (k % cols) * cw, 50 + (k // cols) * ch
        im = tiers['sd']
        big = im.resize((im.width * z, im.height * z), Image.NEAREST)
        sheet.alpha_composite(big, (x + (cw - big.width) // 2, y + 20 + (ch - 40 - big.height) // 2))
        r = round(im.width / 2.83)
        label = f'{did} {im.width}x{im.height} r{r}' + (' EDGE' if touches else '')
        d.rectangle((x, y, x + 8 + len(label) * 7, y + 18), fill=(40, 34, 30))
        d.text((x + 4, y + 2), label, fill=(255, 120, 100) if touches else (245, 232, 205), font=f)
    sheet.convert('RGB').save(path)
    print('sheet', path)


def cut_all():
    catalog = []
    tile_imgs = []
    for ident, _, _, weight in TILES:
        if not (G / ident / 'source.png').exists():
            print(f'{ident}: no source')
            continue
        tiers = cut_tile(ident, weight)
        save_tiers(ident, tiers)
        tile_imgs.append((ident, tiers['sd']))
        catalog.append({'id': ident, 'kind': 'tile', 'size': {'sd': 32, 'hd': 64}, 'worldSize': 16,
                        'seam': [round(v, 1) for v in seam(tiers['hd'])]})
    tex_imgs = []
    for ident, _, _ in TEXTURES:
        if not (G / ident / 'source.png').exists():
            print(f'{ident}: no source')
            continue
        tiers = cut_texture(ident)
        save_tiers(ident, tiers)
        tex_imgs.append((ident, tiers['sd']))
        catalog.append({'id': ident, 'kind': 'texture', 'size': {'sd': tiers['sd'].width, 'hd': tiers['hd'].width},
                        'worldSize': 64, 'seam': [round(v, 1) for v in seam(tiers['hd'])]})
    if tile_imgs:
        old = [(f'grass_{i} (old)', Image.open(ROOT / f'public/assets/art/ai-v1/grass_{i}.png').convert('RGB')) for i in range(3)]
        tiling_sheet(old + tile_imgs, G / 'review-tiles.png', 'Grass tiles 3x3 (old grass_0..2 first), sd 32 px zoomed 6x')
        mix_sheet([t for _, t in tile_imgs], G / 'review-tiles-mix.png')
    if tex_imgs:
        tiling_sheet(tex_imgs, G / 'review-textures.png', 'Ground textures 3x3, sd 128 px zoomed 2x')
    for ident, name, items in SHEETS:
        if not (G / '_sheets' / ident / 'source.png').exists():
            print(f'{ident}: no source')
            continue
        cuts = cut_sheet(ident, items)
        for did, (tiers, touches) in cuts.items():
            save_tiers(did, tiers)
            sd = tiers['sd']
            catalog.append({'id': did, 'kind': 'decal', 'sheet': ident,
                            'size': {t: [im.width, im.height] for t, im in tiers.items()},
                            'radius': round(sd.width / 2.83), 'touchesCell': bool(touches)})
        decal_review(name, cuts, G / f'review-{ident}.png')
    (G / 'catalog.json').write_text(json.dumps(catalog, indent=1) + '\n', encoding='utf-8')
    print(len(catalog), 'entries ->', G / 'catalog.json')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'prompts':
        write_prompts(sys.argv[2:] or None)
    elif cmd == 'cut':
        cut_all()
    else:
        raise SystemExit(__doc__)
