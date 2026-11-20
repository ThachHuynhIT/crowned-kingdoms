# Vật trang trí môi trường quanh bàn cờ — đợt 20/11/2026

Chủ dự án (20/11/2026): mặt đất quanh bàn cờ còn trống; vẽ càng nhiều càng tốt, file nặng cũng được, chủ dự án sẽ tự lọc.

- **Cách vẽ:** `make_objects.py prompts` dựng prompt từ khối "Prompt isometric dùng lại" của `docs/ART_STYLE.md` (qua `g3e/buildings/make_prompts.py`, gọi qua `make_decor._buildings_tool`), mỗi lượt Codex vẽ một bảng 6 (3×2) hoặc 8 (4×2) vật trên nền magenta. Đính kèm: ảnh phong cách Thợ Gặt, nhà isometric đã duyệt và `approved-wilds-ref.png` (các vật hoang dã đã duyệt đang dùng trong game).
- **Cách cắt:** `make_objects.py cut` tách từng ô lưới (mảnh liền nhau gán theo tâm vào ô), khoá magenta (min(r,b)−g ≥ 90, chặt hơn make_decor để giữ hoa tím/hồng), thu nhỏ BOX có trọng số mặt nạ về chiều cao đích (2 px ảnh mỗi đơn vị thế giới = sd), bóc viền magenta còn sót và viền tối (`tools/strip_decor_outline.py`). hd/uhd đúng 2×/4× khung sd (cùng chân, cùng footprint).
- **Kết quả:** `objects/<id>/runtime/{sd,hd,uhd}/<id>.png`, `objects/<id>/meta.json`, `catalog.json` (id, tall, radius, batch). Bảng duyệt: `review-<batch>.png`. Nguồn: `batches/<batch>/source.png` + `prompt.md`.
- **Duyệt sơ bộ:** Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 — mọi bảng đúng góc isometric, ánh sáng trên-trái và phong cách các vật đã duyệt; không bảng nào phải vẽ lại. Chưa đưa vào game (`DECOR_CATALOG` không đổi).
- **Lưu ý kỹ thuật:** vài vật mảnh/sáng còn ánh hồng do hoà màu với nền magenta: bông lúa của `grass_tall`/`grass_dry`, rêu rủ của `tree_mossy_ancient`, tán bạc của `tree_olive`, `rock_quartz`, kẽ hoa của `tree_cherry`. Vật phẳng nằm đất (hoa, sỏi, lá) nhỏ; chiều cao đích chỉnh trong `BATCHES` rồi chạy lại `cut` (không cần gọi Codex).

| batch | vật |
|---|---|
| trees_a | tree_birch (cao), tree_willow (cao), tree_cherry (cao), tree_young_oak (cao), tree_fir_small (cao), tree_dead (cao) |
| trees_b | tree_fruit (cao), tree_bushy (cao), tree_pair (cao), tree_poplar (cao), tree_maple_red (cao), tree_spruce_blue (cao) |
| crags | crag_tall (cao), standing_stone (cao), standing_stones_ring (cao), crag_mossy (cao), rock_spire (cao), boulders_grassy (cao) |
| rocks | boulder_mossy_a, boulder_mossy_b, rock_cluster_a, rock_cluster_b, pebbles_a, pebbles_b, rock_flat, rock_split |
| bushes | bush_flower_pink, bush_flower_white, bush_flower_yellow, fern, bush_holly, topiary_round, bramble, bush_lavender |
| grasses | grass_tuft_a, grass_tuft_b, grass_tall, reeds, cattails, grass_dry, clover_patch, dandelions |
| flowers | flowers_red, flowers_blue, flowers_yellow, flowers_white, flowers_purple, flowers_mixed, sunflowers, tulips_orange |
| forest_floor | mushroom_single, mushroom_ring, mushroom_red, mushroom_cluster, stump_moss, stump_axe, woodpile, leaf_pile |
| forest_floor_b | log_mushrooms, log_hollow, branches_fallen, stump_small, leaves_red, rabbit_hole, anthill, thistles |
| ruins | well_old, pillar_ruined (cao), statue_broken, shrine_stone, cart_wheel_broken, column_fallen, ruin_wall, milestone |
| farm | crate, crates_stack, sack, sacks_pile, hay_bale, hay_bales_stack, scarecrow, campfire_unlit |
| camp | tent, signpost_double, lantern_post, beehive, bird_bath, footpath_stones, stepping_stones, water_trough |
| farm_b | wheelbarrow, pumpkins, flower_pots, bench, rain_barrel, buckets, basket_apples, firewood_chopping |
| trees_c | tree_pine_cluster (cao), tree_oak_old (cao), tree_yellow (cao), tree_sapling (cao), tree_blossom_white (cao), tree_broken (cao) |
| rocks_b | rock_sand, rock_dark, rock_ore, rock_round_pair, boulder_lichen, rocks_grass, stone_cairn, rock_crystal |
| bushes_b | bush_round_dark, bush_autumn, bush_hydrangea, bush_rose, bush_berry_blue, bush_tall_grass, bush_juniper, bush_sprouts |
| trees_d | tree_pine_tall (cao), tree_copper_beech (cao), tree_rowan (cao), tree_larch_gold (cao), tree_olive (cao), stump_sprouting |
| crags_b | rock_arch (cao), crag_flat_top (cao), boulder_giant (cao), rock_pillars (cao), crag_tree (cao), cave_mouth (cao) |
| wild_misc | pond_small, puddle, log_long, roots_exposed, moss_patch, rock_vines, fern_large, mushroom_giant |
| village_b | hitching_post, grindstone, millstone, plough, barrel_pair, fence_broken, washtub, woodcart_small |
| flowers_b | cosmos_pink, foxgloves, bluebells, marigolds, lilies_white, heather, forget_me_nots, wild_garlic |
| stones_b | stone_bench, arch_broken (cao), rune_stone, stone_steps, obelisk_small, fountain_dry, statue_lion, stone_lantern |
| trees_e | tree_round_small (cao), tree_oak_orange (cao), tree_birch_twin (cao), tree_leaning (cao), tree_cypress (cao), tree_mossy_ancient (cao) |
| crags_c | crag_red (cao), crag_mossy_tall (cao), boulders_field (cao), rocky_hill (cao), crag_slate (cao), standing_stones_pair (cao) |
| water_edge | lily_pads, driftwood, rowboat, fishing_basket, mooring_post, wet_stones, reeds_wide, marsh_grass |
| bushes_c | hedge_segment, bush_small_round, bush_leafy_wide, bush_flower_red, bush_lilac, bush_dead, bush_gooseberry, bush_rock |
| grasses_b | grass_flowers_patch, grass_clump_wide, wheat_wild, grass_seedheads, grass_short_cluster, sedge, horsetail, grass_bluish |
| camp_b | bedroll, cooking_tripod, log_seat, banner_pole, weapon_rack, archery_target, chest_small, tent_green |
| trees_f | tree_pear (cao), tree_chestnut (cao), tree_hawthorn (cao), tree_elm (cao), tree_pine_pair (cao), tree_hollow (cao) |
| rocks_c | rock_mossy_flat, rock_pointed, rocks_tiny_pair, boulder_cracked, rock_quartz, rock_brown_round, gravel_patch, rocks_flowers |
| farm_c | cabbages, milk_churns, pitchfork_hay, chicken_coop, tools_leaning, apple_crate, wheat_sheaf, feed_trough |
| wild_b | stumps_cluster, sapling_small, fern_mix, hollyhocks, wild_strawberries, clover_flowers, rock_flowers_purple, log_small_mushroom |
| ruins_b | wall_corner_ruin, pillar_stump, floor_tiles_broken, stairs_ruin, statue_head, urn_broken, gate_posts, well_ruined |
| markers | signpost_left, notice_board, road_marker, carved_pole, lamp_stone, flag_marker, boundary_stones, wishing_stones |

Tổng: 254 vật, 34 lượt Codex (mức dùng 48% → 99%).
