# Building animations — review (20/11/2026)

Pipeline: `make_anim.py` (see its docstring). 3 frames per card: frame 0 = the shipped L1 picture (unchanged, plus transparent pad), frames 1-2 cut from one Codex 3-panel edit, static pixels locked to the base (difference <= 40 and outline speckle reverted). Density 4/8 twins in `<card>/hd/` and `<card>/uhd/` are exactly 2x/4x the density-2 frames; their static pixels come from the shipped HD/UHD base, only the density-2 change mask takes Codex pixels.
"drift" = how much Codex changed panel 1 (told to copy it unchanged); the resampling floor is ~0.3%.
Approved samples: stone_catapult, wheat_throne (Claude 20/11, delegated). wheat_windmill rejected and dropped.
Codex usage: 39% at the start of the samples, 99% at the end (weekly quota reached).

| card | status | Codex calls | frame size vs shipped (density 2) | drift % | frame 1/2 changed % | d2+hd+uhd |
|---|---|---|---|---|---|---|
| wheat_throne | approved (Claude review 20/11); sparks above the crown need the 6 px top pad | 1 | 54x77 vs 54x71 | 3.0 | 6.0/5.9 | yes |
| arcane_throne | pass | 1 | 34x76 vs 34x76 | 2.8 | 4.1/5.1 | yes |
| clock_throne | pass | 1 | 57x63 vs 49x63 | 1.0 | 9.7/14.1 | yes |
| forge_throne | pass | 1 | 50x70 vs 50x64 | 0.9 | 2.2/2.6 | yes |
| grove_throne | pass | 2 | 62x66 vs 62x66 | 2.1 | 5.8/5.7 | yes |
| moon_throne | pass | 2 | 40x71 vs 40x69 | 2.4 | 4.8/5.1 | yes |
| nomad_throne | pass | 1 | 56x61 vs 56x61 | 1.2 | 6.5/4.0 | yes |
| stone_throne | pass | 1 | 51x60 vs 51x60 | 1.2 | 3.0/4.5 | yes |
| tide_throne | pass | 1 | 47x70 vs 45x70 | 0.2 | 3.0/2.5 | yes |
| wheat_scarecrow | pass | 1 | 45x61 vs 45x61 | 2.8 | 5.0/5.9 | yes |
| stone_crystal | pass (subtle) | 1 | 37x71 vs 37x68 | 0.9 | 1.4/5.5 | yes |
| stone_mountain_heart | pass | 1 | 54x74 vs 54x68 | 1.0 | 3.2/12.9 | yes |
| arcane_mage_tower | pass | 1 | 49x67 vs 49x67 | 1.7 | 3.6/9.7 | yes |
| clock_gear_tower | pass (subtle) | 1 | 51x64 vs 51x64 | 1.1 | 1.7/3.2 | yes |
| clock_steam_cannon | pass; steam reaches the 10 px top-pad limit | 1 | 67x81 vs 57x71 | 0.7 | 1.2/4.3 | yes |
| forge_flame_tower | pass | 1 | 70x64 vs 70x64 | 2.6 | 12.7/7.4 | yes |
| grove_thorn_tower | pass (subtle) | 2 | 43x60 vs 41x60 | 1.4 | 7.7/4.1 | yes |
| moon_shadow_spire | pass | 1 | 40x75 vs 40x75 | 0.8 | 3.7/6.0 | yes |
| neutral_archer_tower | pass | 2 | 46x78 vs 46x78 | 2.2 | 3.2/2.8 | yes |
| nomad_watchtower | pass (subtle) | 1 | 47x77 vs 47x77 | 1.7 | 4.3/2.7 | yes |
| tide_cannon | pass | 1 | 35x39 vs 35x39 | 1.0 | 2.0/3.6 | yes |
| tide_kraken | pass | 1 | 68x54 vs 68x54 | 9.0 | 20.3/10.0 | yes |
| tide_wave_tower | pass | 1 | 56x72 vs 56x72 | 0.9 | 6.9/9.8 | yes |
| wheat_windmill | dropped (owner review: stays static) | 2 | - | - | - | - |
| stone_catapult | approved (Claude review 20/11); re-cut with the despeckle lock: a few single-pixel gem flashes are now dropped | 1 | 58x67 vs 58x67 | 0.8 | 5.0/8.4 | yes |
| arcane_apprentices | pass | 1 | 69x67 vs 69x67 | 4.4 | 6.4/4.6 | yes |
| arcane_archmage | pass (subtle) | 1 | 34x76 vs 34x75 | 0.9 | 3.9/3.5 | yes |
| arcane_frost_mages | skip: r1: only the crystal tip changes in frame 2; a stricter r2 prompt is written but was not run (quota) | 1 | 55x76 vs 55x76 | 1.3 | 1.6/2.0 | yes |
| arcane_library | pass | 1 | 71x68 vs 71x68 | 1.6 | 3.1/4.0 | yes |
| arcane_ward | pass | 1 | 56x47 vs 56x47 | 1.3 | 3.6/12.3 | yes |
| clock_bell_tower | pass | 1 | 48x78 vs 48x78 | 1.6 | 5.1/4.8 | yes |
| clock_colossus | pass; smoke reaches the 10 px top-pad limit and is cut flat | 1 | 67x75 vs 67x65 | 0.8 | 6.4/4.2 | yes |
| clock_spiders | pass | 1 | 65x68 vs 65x58 | 4.4 | 5.3/5.4 | yes |
| clock_spring_workshop | pass | 1 | 67x81 vs 67x71 | 0.6 | 1.6/1.7 | yes |
| clock_windup_soldiers | pass | 1 | 65x71 vs 65x61 | 1.7 | 5.1/5.4 | yes |
| forge_armory | pass | 1 | 72x77 vs 72x67 | 0.9 | 1.7/1.8 | yes |
| forge_blast_furnace | pass | 1 | 52x80 vs 52x70 | 1.7 | 8.5/8.8 | yes |
| forge_bombardiers | pass | 1 | 68x68 vs 68x58 | 1.6 | 4.0/3.5 | yes |
| forge_iron_drake | pass | 1 | 71x71 vs 71x65 | 1.1 | 3.2/4.6 | yes |
| forge_smithy | pass | 1 | 63x74 vs 63x67 | 1.3 | 3.7/2.6 | yes |
| forge_swordsmen | skip: almost nothing changes (window glint lost) | 1 | 76x57 vs 76x57 | 1.3 | 2.1/1.5 | yes |
| grove_bear_cave | skip: bear blink/leaves too small to read | 1 | 66x63 vs 66x63 | 2.1 | 2.1/2.2 | yes |
| grove_sapling | skip: only a few lantern pixels change | 1 | 32x43 vs 32x43 | 2.7 | 5.3/6.8 | yes |
| grove_spirit_stags | skip: nothing visibly moves | 1 | 59x60 vs 59x60 | 1.7 | 2.2/2.0 | yes |
| grove_spring | pass (subtle) | 1 | 52x49 vs 52x49 | 2.4 | 4.6/3.7 | yes |
| grove_treant | pass | 1 | 70x68 vs 70x68 | 5.6 | 12.6/11.8 | yes |
| grove_wolf_den | skip: nothing visibly moves | 1 | 71x47 vs 71x47 | 1.5 | 1.6/1.9 | yes |
| moon_altar | skip: flame change too small | 1 | 56x60 vs 56x60 | 1.5 | 1.5/1.5 | yes |
| moon_crypt | skip: only 2 pixels change | 1 | 37x41 vs 37x41 | 0.8 | 0.9/2.3 | yes |
| moon_reaper_shrine | skip: only one window changes | 1 | 60x61 vs 60x61 | 0.6 | 1.0/3.2 | yes |
| moon_summoning_circle | pass | 1 | 53x62 vs 53x62 | 1.1 | 12.3/13.5 | yes |
| moon_vampires | pass (subtle) | 1 | 64x63 vs 64x63 | 0.8 | 2.3/1.9 | yes |
| neutral_barracks | pass | 1 | 62x66 vs 62x56 | 1.5 | 2.8/3.2 | yes |
| neutral_mercenary_camp | pass | 1 | 68x61 vs 68x61 | 0.9 | 2.4/2.7 | yes |
| neutral_well | pass | 1 | 53x70 vs 53x70 | 1.7 | 6.0/3.6 | yes |
| nomad_bazaar | pass | 1 | 61x48 vs 61x48 | 1.2 | 4.8/4.5 | yes |
| nomad_caravan | pass (subtle) | 1 | 64x56 vs 64x56 | 1.2 | 4.0/2.4 | yes |
| nomad_horse_archers | pass | 1 | 63x67 vs 63x58 | 0.5 | 2.4/2.0 | yes |
| nomad_khan_guard | pass | 1 | 63x58 vs 63x58 | 1.3 | 6.6/4.0 | yes |
| nomad_riders | pass (subtle) | 1 | 77x60 vs 77x60 | 3.2 | 5.0/3.6 | yes |
| nomad_stables | pass (subtle) | 1 | 71x64 vs 71x64 | 3.8 | 6.1/3.1 | yes |
| stone_golem_forge | pass | 1 | 67x66 vs 67x66 | 0.8 | 3.6/6.0 | yes |
| stone_miners | not drawn (Codex quota) | 0 | - | - | - | - |
| stone_quarry | not drawn (Codex quota) | 0 | - | - | - | - |
| stone_wall | not drawn (Codex quota) | 0 | - | - | - | - |
| tide_harbor | not drawn (Codex quota) | 0 | - | - | - | - |
| tide_hookmen | not drawn (Codex quota) | 0 | - | - | - | - |
| tide_pirates | not drawn (Codex quota) | 0 | - | - | - | - |
| tide_treasure | not drawn (Codex quota) | 0 | - | - | - | - |
| wheat_field | not drawn (Codex quota) | 0 | - | - | - | - |
| wheat_granary | not drawn (Codex quota) | 0 | - | - | - | - |
| wheat_militia | not drawn (Codex quota) | 0 | - | - | - | - |
| wheat_peasant_horde | not drawn (Codex quota) | 0 | - | - | - | - |
| wheat_reapers | not drawn (Codex quota) | 0 | - | - | - | - |
