# Crowned Kingdoms — Toàn bộ image asset còn thiếu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay mọi hình placeholder còn được game dùng bằng image art đã duyệt; Codex vẽ bằng imagegen, Claude duyệt mẫu và nhóm theo uỷ quyền ngày 09/11/2026.

**Architecture:** Lấy roster/card/frame thật trong TypeScript làm nguồn inventory; phân biệt ảnh chưa có, ảnh nguồn đang chờ duyệt, ảnh đã publish và ảnh thực sự được runtime dùng. Mở rộng prompt/cutter hiện có, thêm approval lists trong `imageArt.ts`, giữ nguyên frame API và painter fallback. Không đổi luật, dữ liệu cân bằng, save hay mô phỏng để phục vụ art.

**Tech Stack:** Python 3 · Pillow/NumPy (pipeline hiện có) · Codex CLI + imagegen · TypeScript strict · Phaser 4 · Vitest · Vite.

**Spec:** Yêu cầu chủ dự án 09/11/2026 trong task này; toàn bộ `docs/ART_STYLE.md`; `docs/art-review/HANDOFF.md`; `docs/art-review/g3e/DECISIONS.md`; `docs/ASSET_MANIFEST.md`; spec tổng `docs/superpowers/specs/2026-10-16-crowned-kingdoms-design.md` §11; world/camera theo `2026-11-06-iso-board-redesign-design.md` và `2026-11-08-iso-board-polish-design.md` trong cùng thư mục specs.

**Phạm vi phiên lập kế hoạch:** chỉ tạo file này. Mọi command dưới đây dành cho thực thi sau; không generate, sửa code, commit hoặc chạy node/npm/npx trong phiên này. Workspace có thay đổi và ảnh G5 đang được bổ sung bởi công việc khác; inventory dưới đây là snapshot đọc ngày 09/11, phải reconcile trước khi chạy runner, không ghi đè công việc đó.

## Global Constraints

- Codex tạo **mọi ảnh mới** bằng imagegen, qua prompt script; Claude phụ trách pipeline/tích hợp và review. Không vẽ prompt từ trí nhớ, không thay imagegen bằng painter hay tải pack mới.
- Trước mỗi lần vẽ, đọc `docs/ART_STYLE.md`; chính prompt bắt Codex đọc tài liệu, đính kèm `docs/art-review/style-references/harvester-house-front-approved.png` và ảnh đã duyệt cùng loại nếu có. Reference phải xuất hiện bằng `-i` thật trong runner, không chỉ được nhắc bằng chữ.
- Dùng nguyên khối template đúng loại từ tài liệu: world building/plot = iso 2:1, cửa phải, nhà giữa ô, mái đúng trục; tranh thẻ = 45° chính diện; unit = bộ chibi/¾ đi-đánh hiện có. Không nhân dịp này vẽ lại lính đã duyệt thành iso. Portrait giữ quy chuẩn riêng 96×144.
- Chủ dự án đã uỷ quyền: “toàn bộ hình ảnh từ giờ bạn được toàn quyền tự quyết và duyệt”, 09/11/2026. **Claude** ghi `ĐÃ DUYỆT` trong `sample-review.md` trước group và `group-review.md` trước publish; không đòi owner duyệt lại. Một mẫu cho mỗi loại mới, rồi từng nhóm; ảnh tồn tại không phải approval.
- Mọi PNG adopt phải do script cắt/thu nhỏ, mật độ cùng bộ đang dùng; mép alpha 0/255, chỉ bóng riêng được khai báo alpha 128. FX shield cũ alpha 90/50 là painter fallback, không thành ngoại lệ cho PNG mới. Không giới hạn RGB/số màu cũ.
- Mỗi PNG có manifest + CREDITS + source/prompt/review trace; world có projection/anchor/size thật. `nativeSize` manifest ghi kích thước nguồn, `finalSize` ghi PNG publish, không nhầm với kích thước world. Bảng dưới dùng “native xuất” để chỉ PNG runtime, không phải ảnh concept 1024 px.
- Unit origin `(0.5,1)`, y-sort theo chân, không xoay sprite; ally/foe cùng hình học, foe đỏ có dấu hình, không chỉ đổi hue. Plot neo giữa thoi, không dùng feet; icon/card/FX neo theo consumer hiện hữu.
- Một world atlas `sprites`, mỗi chiều ≤4096; không thêm atlas world thứ hai. Portrait/card/UI texture riêng hiện hữu được giữ. Nearest, camera free zoom/snapView, HUD không zoom, touch ≥44×44, `FONT_UI`/chữ Việt.
- Tối đa **3 `codex exec` đang chạy trên toàn runner**, kể cả runner khác; prompt/cutter/test/tích hợp shared files chỉ một coordinator ghi. Không chạy đồng thời generator ghi chung `.superpowers/u.sh`, `up.sh`, `i.sh`.
- Thứ tự: unit vua chơi được → quân dùng chung/raiders/summons → bosses → buildings/plots → cards → icons → FX → phần terrain/UI/menu procedural còn lại. Không chặn đơn vị ưu tiên cao bởi skin phụ.
- Giữ code art làm fallback nhưng không coi fallback là đã hoàn tất coverage. Không đổi frame name, simulation, RunState v6, RNG hay `src/game` imports. Đọc skill Phaser migration và skill đúng tác vụ trước khi sửa Phaser.
- Gate thực thi: `npm run lint && npm run typecheck && npm test && npm run build` (Git Bash: thêm `< /dev/null` từng lệnh), Python gates và browser 1280×720 + 375×812. Đây là điều kiện nghiệm thu triển khai, không phải command đã chạy khi viết plan.

## Review Focus

1. Nguồn có nhưng chưa nối: G5, card concept và icon concept phải được reuse/review; không redraw vì admin backlog cũ. Test coverage theo registry + đường dẫn thật (Task 1, 4–6).
2. Pose nhảy chân/đổi nhân vật: sáu frame dùng cùng scale/canvas/foot, vũ khí không bị crop; xem GIF idle/walk/attack và flip trái (Task 2–3).
3. Foe recolour phá băng/tinh thể/nước hoặc không nhìn ra phe: dùng team mask, giữ màu vật liệu, đủ red marker, cùng alpha/bounds (Task 2, 6).
4. Atlas vượt 4096, missing PNG hoặc approval sai vẫn bật: kiểm pack cuối với toàn roster và missing-file fallback, không chỉ một nhóm (Task 1, 8).
5. Thu nhỏ làm mất ý nghĩa và seam/slice: cards ở cả 96×72/48×36, icon 16 px, plot 128 px, terrain nối mép, UI chín-slice và hai viewport (Task 4–8).

---

## Inventory đối chiếu code ngày 09/11/2026

> **Cập nhật 09/11/2026 (Claude, sau khi Codex viết bảng):** bộ isometric của cả sáu vua G5 (Rừng Xanh, Thuỷ Triều, Lò Rèn, Đồng Hồ, Ánh Trăng, Du Mục: Ngai, mọi công trình và bốn skin ô) đã duyệt, cắt và nối vào `G5_ART_APPROVED` (commit `48ac69d`). Các dòng Tide/Forge/Clock/Moon/Nomad ở bảng Buildings và phần G5 của dòng Plots dưới đây đã xong; còn lại của nhóm này chỉ là Stone, Arcane và neutral.

Nguồn đếm: `src/data/kings/*.ts`, `neutral.ts`, `raiders.ts`, `bosses.ts`; `atlas.ts::spriteList/withImageArt`, `imageArt.ts`, `src/ui/cards/cardImage.ts`, `src/ui/realm/kingBadge.ts`, `uiArt.ts` và `uiKit.ts`. Mỗi danh sách id dưới đây là scope đóng của nhóm. Ký hiệu `A = public/assets/art/ai-v1`, `U = docs/art-review/g3e/units`, `B = docs/art-review/g3e/buildings`, `C = docs/art-review/g3e/cards`, `I = docs/art-review/g3e/icons`. Các đường dẫn rút gọn trong bảng được mở rộng theo các root này.

### Đã có — không vẽ lại

| Nhóm | Id/phạm vi đã làm | Bằng chứng runtime / xử lý |
|---|---|---|
| Units | `militia,reaper,peasant,golem,miner,rubble,slinger,footman` | 8 `IMAGE_UNITS`, 12 PNG/id (6 pose ×2 phe). `spearman` là nguồn cũ bị thay, không phải UnitId mới |
| Buildings | 8 Wheat: `wheat_throne,wheat_field,wheat_windmill,wheat_granary,wheat_peasant_horde,wheat_militia,wheat_reapers,wheat_scarecrow`; 8 Grove: `grove_throne,grove_bear_cave,grove_sapling,grove_spirit_stags,grove_spring,grove_thorn_tower,grove_treant,grove_wolf_den`; `neutral_barracks` | 17 `IMAGE_BUILDINGS`. Wheat/Grove iso; barracks có PNG góc cũ, chỉ chuyển iso sau review, không gọi nó “chưa có ảnh” |
| Plots | Wheat/Grove × `open,locked,throne,built` | 8 PNG trong `IMAGE_PLOTS`; plot cũ 45° trong manifest/admin không thay được skin iso |
| Portrait | cả 9 vua `wheat,stone,arcane,grove,tide,forge,clock,moon,nomad` | `portraitAssets.ts`, `A/portraits/<king>.png` 96×144; không vẽ portrait mới, không dùng placeholder vuông để đếm thiếu |
| Cards | 10 Wheat: `wheat_throne,wheat_field,wheat_fertilizer,wheat_windmill,wheat_harvest_festival,wheat_granary,wheat_peasant_horde,wheat_militia,wheat_reapers,wheat_scarecrow` | `ILLUSTRATED`/`VERTICAL_CARD_ART`, 20 PNG 96×72 và 48×36 |
| Badge | `icon_king_wheat` 32×32 +16×16 | `KING_BADGE_FILES`; không lẫn badge và `icon_crown` |
| World decor | 15 `DECOR_APPROVED`; `forest_pine_a,forest_pine_b,forest_rock`; `enemy_portal`; `wall_cliff`; `grass_0..2`; seamless `water,sand` | approval lists hiện có, giữ nguồn/PNG. Tường 45°/cottage cũ là archive, không redraw hoặc nạp lại |
| UI đã có ảnh | 10 base frame `panel,tooltip,button,buttonHover,buttonDown,buttonActive,card,cardUncommon,cardRare,cardSelected` | Kenney CC0 qua `UI_KIT_FILES`, 6 PNG source. Giữ nguyên; themed frames chưa dùng kit nên vẫn nằm trong inventory thiếu bên dưới |

### Units/bosses còn placeholder

Tổng **45 UnitId = 42 thường +3 boss**; 8 đã nối, **37 thiếu ×12 =444 PNG runtime**. `src/render/unitArt.ts::paintUnit` vẫn vẽ 37 loại này; không bỏ units chỉ có trong enemy roster hoặc custom summon. Mỗi id cần standing sample rồi **một sheet 3×2** `U/<id>/poses-source.png`, cắt thành `A/<id>_{0..5}.png` và `A/<id>_foe_{0..5}.png`. Thứ tự 0/1 idle, 2/3 walk, 4/5 attack theo `POSES`; cả hai phe, kể cả boss để hoàn tất atlas contract hiện tại (boss chỉ dùng foe trong gameplay).

| Loại / số | Id và sprite world hiện tại | Native xuất dự kiến; anchor | Prompt script |
|---|---|---|---|
| Arcane /4 | `apprentice,frost_mage` 16×16; `archmage` 16×24; `construct` 24×24 | canvas 32×32 /32×48 /48×48; feet | mở rộng `U/make_prompts.py`, `U/make_poses.py` |
| Grove /5 | `wolf` 16×16; `bear,treant` 24×32; `stag` 24×24; `dryad` 16×24 | 32×32 /48×64 /48×48 /32×48; feet | như trên |
| Tide /3 | `pirate` 16×16; `hookman,musketeer` 16×24 | 32×32 /32×48; feet | như trên |
| Forge /4 | `swordsman,bombardier,shieldbearer` 16×16; `iron_drake` 24×32 | 32×32 /48×64; feet | như trên |
| Clock /4 | `tin_soldier,spider,gear_gunner` 16×16; `colossus` 24×32 | 32×32 /48×64; feet | như trên |
| Moon /4 | `skeleton,wraith,vampire` 16×16; `moon_reaper` 24×32 | 32×32 /48×64; feet | như trên |
| Nomad /3 | `rider,horse_archer,khan_guard` 24×24 | 48×48; feet | như trên |
| Neutral /1 | `mercenary` 16×16 (`footman` đã có) | 32×32; feet | như trên |
| Raiders /4 | `bandit,bandit_archer` 16×16; `boar_rider` 24×24; `ogre` 24×32 | 32×32 /48×48 /48×64; feet | như trên |
| Boss summons /2 | `frog,hornet` 16×16 trong `raiders.ts` | 32×32; feet | như trên |
| Boss /3 | `boss_bog_ogre,boss_hornet_queen,boss_crownless_king` 48×48 | 96×96; feet | như trên, thêm boss briefs |

Canvas trên là contract xuất mới (2 art px/world unit), không ép ảnh cũ vào kích thước này. Đặt silhouette cùng mật độ với militia/golem đã duyệt; padding đủ cho attack. Standing preview 4 px/world chỉ để review; runtime 2 px/world. Claude chốt HEIGHT/foot trong catalog sau mẫu; nếu mẫu cần canvas lớn hơn để không crop, sửa metadata catalog có review trước group, không phóng cả nhân vật hoặc sửa `UnitDef.sprite` cho vừa ảnh. Summon `rubble` đã có; skeleton/hornet/frog/construct cũng xuất đúng một thiết kế/id. Bóng gương Crownless tái dùng unit đối tượng, không sinh UnitId mới.

### Buildings/plots: thiếu ảnh và thiếu adoption

`spriteList` tạo **74 building frames** (9 Ngai +65 thẻ xây được). 17 đã nối; **57 frame còn code**. Ngoài ra 1 barracks chuyển góc cũ → iso. Không sinh nhà cho `tome/enchantment`.

| Loại / số | Id | Nguồn hiện tại → target | Native xuất / anchor / prompt |
|---|---|---|---|
| Stone /8 | `stone_throne,stone_catapult,stone_golem_forge,stone_quarry,stone_wall,stone_crystal,stone_miners,stone_mountain_heart` | `paintThrone/paintBuilding` → `A/iso/<id>.png`; card concept 45° không dùng làm world sprite | scale chung Wheat (Reapers rộng64 px), canvas crop nguyên theo source; feet; `B/make_prompts.py` thêm `remaining-iso` |
| Arcane /7 | `arcane_throne,arcane_mage_tower,arcane_apprentices,arcane_library,arcane_frost_mages,arcane_ward,arcane_archmage` | như trên | như trên |
| Neutral /3 mới +1 chuyển iso | `neutral_archer_tower,neutral_well,neutral_mercenary_camp`; `neutral_barracks` | 3 painter + barracks PNG cũ → `A/iso/<id>.png` | như trên |
| Tide /8 | `tide_throne,tide_pirates,tide_cannon,tide_harbor,tide_wave_tower,tide_treasure,tide_hookmen,tide_kraken` | source đã có ở `docs/art-review/g5/tide/<id>/source.png`, chưa group approval/wiring → `A/iso/<id>.png` | cutter G5 cùng Wheat; feet; `B/make_prompts.py g5-iso-set tide` chỉ chạy id thiếu |
| Forge /8 | `forge_throne,forge_swordsmen,forge_flame_tower,forge_smithy,forge_bombardiers,forge_blast_furnace,forge_armory,forge_iron_drake` | nguồn G5 có phần lớn; snapshot thiếu `forge_swordsmen,forge_smithy` → `A/iso/<id>.png` | như trên; `g5-iso-set forge` |
| Clock /8 | `clock_throne,clock_windup_soldiers,clock_gear_tower,clock_spring_workshop,clock_bell_tower,clock_spiders,clock_steam_cannon,clock_colossus` | nguồn G5 có đủ, chưa group approval/wiring → `A/iso/<id>.png` | như trên; `g5-iso-set clock` |
| Moon /7 | `moon_throne,moon_crypt,moon_shadow_spire,moon_altar,moon_vampires,moon_summoning_circle,moon_reaper_shrine` | snapshot thiếu `moon_vampires`, reuse nguồn G5 còn lại → `A/iso/<id>.png` | như trên; `g5-iso-set moon` |
| Nomad /8 | `nomad_throne,nomad_riders,nomad_horse_archers,nomad_stables,nomad_bazaar,nomad_watchtower,nomad_caravan,nomad_khan_guard` | source G5 đủ, chưa group approval/wiring → `A/iso/<id>.png` | như trên; `g5-iso-set nomad` |
| Plots /28 | `{stone,arcane,tide,forge,clock,moon,nomad}_{open,locked,throne,built}` | shared `paintPlot` resampled iso → `A/iso/plots/<king>_<state>.png`; Stone/Arcane cần 8 mới, G5 reuse nguồn | width128, thoi mặt đất2:1, chiều cao canvas theo thickness/post thật và `centre_plot`; centre; `B/make_prompts.py` |

G5: Grove đã group-approved/publish; 5 vua còn lại có **59 mục =39 nhà +20 plot**, snapshot **50 source có /9 thiếu**: 3 nhà ở trên + `plot_{forge,moon}_{locked,throne,built}`. Cả 6 vua đã sample-approved trong `docs/art-review/g5/<king>/sample-review.md`, không chạy lại mẫu. Chỉ Grove có `group-review.md` khi đọc. Source có sẵn **không cần vẽ lại**; nguồn đang xuất hiện trong worktree thì refresh trước dispatch. Không dùng số source để suy toàn nhóm đã duyệt. `docs/art-review/g5/catalog.json` chưa tồn tại, không dựa vào catalog giả định.

### Cards, icons, FX và phần procedural khác

| Loại / số | Id / current source | Target file / native xuất / anchor | Prompt script |
|---|---|---|---|
| Cards /92 chưa nối | `CONTENT.allCards()` 102 trừ10 Wheat; painter32×24. **47 có source chưa nối**: Stone10 + Arcane10 + Grove9 + Tide9 + Forge9; **45 chưa có source**, liệt kê ngay dưới | `A/cards/<id>.png`96×72 và `<id>-48.png`48×36 (184 PNG); card image area, không feet | `C/make_prompts.py`, `C/make_assets.py`; catalog phải102 thay94 |
| Runtime icons /14 | `troop,tower,tome,throne,crown,boulder,skull,gold,level,enchant,reroll,sell,lock,conquer` từ `ICON_IDS`, tất cả `paintIcon` | `A/icons/icon_<id>.png`32×32 và `-16.png`16×16; centre, world-atlas frame giữ16×16 | mở rộng `I/make_prompts.py`, `I/make_assets.py` |
| King badges /8 | `stone,arcane,grove,tide,forge,clock,moon,nomad`, hiện ô màu trong `kingBadge.ts` | `A/icons/icon_king_<king>{,-16}.png`32/16; centre | như trên, reference badge Wheat |
| FX /14 | `arrow_{e,ne,n,nw,w,sw,s,se}`, `boulder,boulder_shadow,spark,pulse,shield,stun` từ `fxArt.ts/atlas.ts` | `A/fx/<id>.png`; lần lượt16×16 mỗi arrow,32×32,48×16,8×8,32×32,32×32,16×16 (2× native painter); centre theo consumer | thêm chế độ `--kind fx` vào `I/make_prompts.py`; cutter `I/make_assets.py` |
| Ground /2 nguồn còn code | `flowers,path` trong `fieldArt.ts::paintFieldTile`, road tail cũng dùng path | `A/iso/terrain/{flowers,path}.png`128×128 seamless top-down, origin UV; mask/chiếu iso vẫn là code hình học | `B/make_prompts.py terrain-textures` mở rộng |
| UI base /4 | `slot,slotHover,slotSelected,bar` còn painter, các base khác Kenney | `A/ui/<id>.png`18×18 ba slot,8×6 bar; chín-slice metadata hiện tại | `I/make_prompts.py --kind ui`, `I/make_assets.py` mở rộng |
| UI themed /90 | 10 `SKINNABLE_FRAMES` ×9 king trong `uiArt.ts`, hiện tất cả painter | `A/ui/<king>/<base>.png`; panel24×24, button*16×16, card*24×32, bar8×6; slice/border giữ `UI_FRAMES` | như trên; một nguồn master/loại + xuất theme có mask, không90 lần imagegen nếu palette variants đủ |
| UI decor /2 | `clockDial,firefly` trong `UI_DECOR_IDS` (clock dự phòng nhưng có trong texture) | `A/ui/{clockDial,firefly}.png`28×28,3×3; như consumer | như trên |
| King card decoration /10 nền | `paintKingCard(king,false)`9 và locked theme dùng chung; không phải9 portrait thiếu | `A/ui/king-card/<king>.png` và `locked.png`,66×96, cửa sổ `(9,8,48,72)`; top-left | như trên; artwork nền/viền, ký hiệu K/suit/?/lock vẫn compositor rõ nét |
| Menu /4 nguồn | `paintSky`, `paintHills(0..2)` trong `uiArt.ts` | `A/ui/menu/sky.png`4×256, `hill_0.png`128×120, `hill_1.png`128×90, `hill_2.png`128×60; top-left, parallax nguyên | như trên; giữ size này trong catalog trước mẫu |

Cards có **57 source hợp lệ theo id =10 Wheat đã nối +47 cần review/adopt**; còn **45 id chưa có source** dưới đây. Không tính thư mục `_rejected_no_scarecrow` hoặc folder chỉ có prompt. Vì source đang được bổ sung, Task1 phải refresh trước dispatch; tổng runtime vẫn102, chưa nối92 =47 reuse +45 mới.

- Clock10: `clock_throne,clock_windup_soldiers,clock_gear_tower,clock_spring_workshop,clock_tick_rune,clock_bell_tower,clock_spiders,clock_rewind,clock_steam_cannon,clock_colossus`.
- Moon10: `moon_throne,moon_crypt,moon_shadow_spire,moon_blood_pact,moon_blood_moon_rune,moon_altar,moon_vampires,moon_summoning_circle,moon_eclipse_pact,moon_reaper_shrine`.
- Nomad10: `nomad_throne,nomad_riders,nomad_horse_archers,nomad_stables,nomad_relocate,nomad_bazaar,nomad_wind_rune,nomad_watchtower,nomad_caravan,nomad_khan_guard`.
- Ba Ngai chưa có card source: `grove_throne,tide_throne,forge_throne` (world G5 không phải tranh thẻ).
- Neutral12: `neutral_barracks,neutral_archer_tower,neutral_clear_land,neutral_move,neutral_well,neutral_mercenary_camp,neutral_sharpen,neutral_fortify,neutral_promote,neutral_demolish,neutral_duplicate,neutral_royal_seal`.

### Backlog admin không phải runtime contract

`tools/asset-admin/planned.json` có **733 mục**: units82, bosses3, buildings258, thrones36, cards102, portraits9, projectiles17, vfx26, terrain76, decor11, ui_icons101, menu7, release5. `tools/build_planned_assets.py` trừ availability của admin manifest, không trừ `IMAGE_*`/approval runtime; có expanded14-frame, level variants, building fire animation, 44 icon proposal, optional decree/quest/perk, release/screenshots. Không thực thi733 prompt theo file này.

Phải ghi disposition cho từng planned id trong catalog: `reuse`, `generate`, `adopt-existing`, `superseded`, `future-runtime`. Các phần 20-frame unit, boss28/34/32-frame, house cấp2–5/fire, 15 họ projectile và26 VFX proposal, 75 dual-grid raster masks, 11 decor mới, icon decree18/quest13/perk27, win/lose picture, app/store screenshots **chưa có consumer hiện tại** thì `future-runtime`, không thêm gameplay/animation mới để hợp thức hoá. Runtime hiện chỉ8 arrow+6 FX; mọi shot đang tái dùng arrow vẫn nhận ảnh arrow thật. UI glyph/text, HP bars, selection/aim/range geometry, render mask và seed placement là compositor chức năng, không phải tranh placeholder cần imagegen. Menu skyline/hills và themed borders là artwork nên đã đưa vào scope. Texture grass/water/sand đã có ảnh; giữ mask code để nối liền, không vẽ lại terrain75 mask chỉ vì planned nói thiếu.

## Phần P0 — Khoá catalog và pipeline

### Task 1: Catalog coverage, cổng approval và runner giới hạn3 (Claude; Codex review pipeline)

**Files:**
- Create: `docs/art-review/missing-assets/catalog.json`, `docs/art-review/missing-assets/inventory.md`, `docs/art-review/missing-assets/acceptance.md`, `tools/test_missing_art.py`, `src/render/missingImageArt.test.ts`
- Modify: `tools/test_art_prompts.py`, `docs/art-review/g3e/units/make_prompts.py`, `docs/art-review/g3e/units/make_poses.py`, `docs/art-review/g3e/buildings/make_prompts.py`, `docs/art-review/g3e/cards/make_prompts.py`, `docs/art-review/g3e/cards/cards.json`, `docs/art-review/g3e/icons/make_prompts.py`
- Create: `docs/art-review/missing-assets/run_jobs.py` (coordinator, không vẽ), `.superpowers` chỉ scratch khi thực thi

**Interfaces:** catalog rows có `id,kind,owner,frameNames,sourcePath,targetPaths,worldSize,nativeSize,anchor,projection,promptScript,references,status,reviewPath,plannedIds`; status một trong năm disposition trên. `run_jobs.py --catalog <path> --batch <id> --stage sample|group --jobs 1..3 --resume` chỉ chạy prompt đã dựng, không tự phát minh prompt; `--jobs 4` fail. Tất cả test Python dùng tempfile, không thay prompt đang review.

- [ ] **Step 1: Test coverage hỏng.** `missingImageArt.test.ts` dùng CONTENT thật:45 units/102 cards/74 building frames, không thiếu id ở bảng; mỗi unit12 frame; cards9×10+12; không đưa perk vào card. Catalog phân biệt PNG có thật/approval/runtime. Thêm assertion toàn registry so với approval lists, file PNG/manifest/credits cho từng file và duplicate targets. Coverage có stage: inventory test xanh trước, final completeness chỉ bắt bật khi Task8 kết thúc; không skip silent những id thiếu.
- [ ] **Step 2:** `python -m unittest discover -s tools -p test_art_prompts.py` và `python -m unittest discover -s tools -p test_missing_art.py` → FAIL ca mới trước sửa. `npx vitest run src/render/missingImageArt.test.ts < /dev/null` → FAIL mapping mới. Không chạy test script hiện hữu trực tiếp trên repo nếu nó ghi đè prompt; chuyển những test runner sang tempfile trước.
- [ ] **Step 3:** Tạo catalog từ literal TS/CONTENT khi thực thi; đọc source/file/manifest/G5 reviews, thống kê lại cards/source/G5 không suy từ folder. Sửa drift94→102 và đảm bảo `neutral_duplicate/neutral_royal_seal` +8 Ngai mới có brief. Map733 planned ids thành disposition kèm consumer/evidence, không xoá backlog tương lai. Chốt nativeSize cho mọi runtime row, không để0×0; ghi sourceSize riêng. `inventory.md` in từng id/file/size/anchor/reference/status, totals khớp.
- [ ] **Step 4:** Cổng script từ chối unknown id, thiếu ART_STYLE/reference, review pending/rejected/sai kind/id/source; approval phải field trạng thái chính xác, không tìm substring “ĐÃ DUYỆT” trong câu “CHƯA ĐÃ DUYỆT”. Hash nguồn/review chống duyệt ảnh A rồi publish ảnh B. Sample chưa duyệt chỉ cho1 job/loại; group kèm mẫu của chính loại/king đó. Đính kèm image bằng `-i` thật, output/prompt/log riêng/id, không overwrite file hiện hữu nếu không có revision chỉ định.
- [ ] **Step 5:** Scheduler pool toàn cục tối đa3, lock dùng chung khi runner đã chạy, poll exit code/output PNG, failure ghi rõ và chỉ retry id lỗi; `--resume` bỏ source hợp lệ có sẵn. Tests giả codex đo peak≤3, jobs4 reject, lỗi không publish; test temp registry inventory có source không approval và approval không file. Các command Step2 → PASS phần pipeline/inventory.

**Runner mẫu (Git Bash, sau khi mở rộng CLI ở Task1; chưa chạy trong phiên plan):**

```bash
python docs/art-review/g3e/units/make_prompts.py apprentice
python docs/art-review/missing-assets/run_jobs.py --catalog docs/art-review/missing-assets/catalog.json --batch arcane-standing-sample --stage sample --jobs 1 --resume
# Claude ghi sample-review.md: ĐÃ DUYỆT trước lệnh tiếp theo
python docs/art-review/g3e/units/make_prompts.py --poses apprentice frost_mage archmage construct
python docs/art-review/missing-assets/run_jobs.py --catalog docs/art-review/missing-assets/catalog.json --batch arcane-poses --stage group --jobs 3 --resume
```

Mỗi job do scheduler gọi argv tương đương (không dùng shell interpolation ids):

```bash
codex exec --sandbox workspace-write -C "$PWD" -i docs/art-review/style-references/harvester-house-front-approved.png -i docs/art-review/g3e/units/militia/source.png -i docs/art-review/g3e/units/apprentice/source.png - < docs/art-review/g3e/units/apprentice/poses-prompt.md > .superpowers/codex-apprentice-poses.out 2>&1
```

Lệnh poses trên chỉ hợp lệ sau khi standing của **từng id** đã duyệt; sample của apprentice mở được loại humanoid mage, không tự duyệt identity của archmage/construct. Sau3 job hoàn tất mới dispatch tiếp; không ghép ba runner mỗi runner3.

## Phần P1 — Units trước

### Task 2: 27 units của7 vua còn thiếu +7 neutral/raider/summon (Codex vẽ, Claude duyệt)

**Files:**
- Modify: `docs/art-review/g3e/units/make_prompts.py`, `docs/art-review/g3e/units/make_poses.py`, `tools/test_art_prompts.py`, `tools/test_missing_art.py`, `src/render/imageArt.ts`, `docs/assets.manifest.yml`, `CREDITS.md`
- Create theo34 id thường ở inventory: `docs/art-review/g3e/units/<id>/{prompt.md,source.png,preview.png,sample-review.md,poses-prompt.md,poses-source.png,group-review.md}`, `poses/{sheet.png,idle.gif,walk.gif,attack.gif}` và12 frames; `public/assets/art/ai-v1/<id>_{0..5}.png`, `<id>_foe_{0..5}.png`
- Test: `src/render/missingImageArt.test.ts`, `src/render/imageArt.test.ts`, `src/render/worldArt.test.ts`

**Interfaces:** giữ `IMAGE_UNITS`, `unitPoseFile`, `POSES`, `IMAGE_ART_SCALE=0.5`; thêm metadata cutter cho34 id, scale/canvas chung sáu frame, team mask riêng từng chất liệu. Không tăng `UNIT_FRAME_COUNT=2`.

- [ ] **Step 1:** Python tests cho34 id/ATTACK/STRIKE/HEIGHT đủ; 6 ô đúng thứ tự, chung canvas/scale/foot, alpha chỉ0/255, vũ khí không chạm crop margin. Foe mask chỉ đổi team pixels; băng frost_mage, nước Tide, rune construct không bị quét hue toàn ảnh; alpha/bounds ally=foe. Vitest chứng minh pending không vào IMAGE_ART_FILES và missing texture vẫn painter đúng frame/scale1.
- [ ] **Step 2:** Chạy Python gates + `npx vitest run src/render/imageArt.test.ts src/render/missingImageArt.test.ts src/render/worldArt.test.ts < /dev/null` → FAIL trước mở rộng.
- [ ] **Step 3:** Theo thứ tự Arcane → Grove → Tide → Forge → Clock → Moon → Nomad, rồi mercenary/raiders/frog/hornet. Mỗi loại silhouette mới thử1 standing (mage, quadruped, tree, winged, mounted, mechanical, spectral, amphibian/insect); Claude so cạnh militia/golem, ghi sample review native trên cỏ/sáng/tối. Sau gate loại, approve identity từng standing, mới vẽ sheet3×2. Pose prompt luôn đính kèm standing chính id và sample pose đã duyệt cùng loại; không auto xoay sprite để giả attack.
- [ ] **Step 4:** `python docs/art-review/g3e/units/make_poses.py --sample <id>` rồi `python docs/art-review/g3e/units/make_poses.py <id>` stage only. Claude xem GIF6–8fps idle/walk,10–12fps attack, flip trái, silhouette/foot; ghi group-review `ĐÃ DUYỆT` nêu đủ6×2. Rejected giữ revision riêng, chỉ vẽ lại nguồn lỗi qua prompt script.
- [ ] **Step 5:** Sau review, `python docs/art-review/g3e/units/make_poses.py --export <id>` phải kiểm gate/hash trước ghi public. Đăng ký **408 PNG** của34 id, CREDITS và IMAGE_UNITS; tests Step2 → PASS cho nhóm. Browser mỗi nhóm hai viewport, ít nhất một battle thật + gallery đầy34×2×3 để xem units hiếm/roster-only; ghi thiếu battle evidence trung thực. Không dùng debug gallery thay toàn bộ gameplay QA.

### Task 3: Ba boss, đủ pose cơ bản (Codex vẽ, Claude duyệt)

**Files:** như Task2 cho `boss_bog_ogre,boss_hornet_queen,boss_crownless_king`; source ở `docs/art-review/g3e/units/<boss>/`, runtime `public/assets/art/ai-v1/<boss>_{0..5}.png`, `<boss>_foe_{0..5}.png`; Modify `src/render/imageArt.ts`, manifest, CREDITS; Test `tools/test_missing_art.py`, `src/render/missingImageArt.test.ts`.

**Interfaces:** boss cùng unit frame API96×96 native xuất, không mở28/34/32 animation slots. Frog/hornet của Task2 dùng lại cho summon.

- [ ] **Step 1:** Test3 boss +36 PNG; artwork frame không đổi hitbox/radius/tick. Bounds/feet đủ mace/cánh/vương miện; foe marker và silhouette phân biệt với ogre thường. Chạy Python gates/Vitest Task2 → FAIL boss coverage trước adoption.
- [ ] **Step 2:** Mỗi boss là loại mới:1 standing sample → Claude duyệt → một sheet3×2 → cắt stage/GIF → Claude group review. Ogre cầm chùy/đầm lầy, queen cánh/ngòi, crownless giáp/ngai vỡ theo `bosses.ts`; không vẽ thêm thiết kế copy unit cho mirror.
- [ ] **Step 3:** Export sau gate, manifest36 file, CREDITS, IMAGE_UNITS; tests → PASS. Browser cả3 boss ở1280×720/375×812, summon và phase transition, shield/boulder/death overlap không che toàn board. Native cạnh unit/nhà để so scale; không sửa gameplay vì ảnh to.

## Phần P2 — Buildings và plots

### Task 4: Reuse G5, bổ sung Stone/Arcane/neutral và skin còn thiếu

**Files:**
- Modify: `docs/art-review/g3e/buildings/make_prompts.py`, `docs/art-review/g5/make_assets.py`, `docs/art-review/iso-board/make_assets.py`, `src/render/imageArt.ts`, `docs/assets.manifest.yml`, `CREDITS.md`, `tools/test_art_prompts.py`
- Create: `docs/art-review/missing-assets/iso/<king>/{sample-review.md,group-review.md,sheet.png}`, `<id>/{prompt.md,source.png,native.png}` cho Stone/Arcane/neutral; G5 tiếp tục đúng `docs/art-review/g5/<king>/<id>/` và review ở đó
- Create approved only: `public/assets/art/ai-v1/iso/<cardId>.png`, `iso/plots/<king>_<state>.png` theo inventory
- Test: `src/render/g5ImageArt.test.ts`, `src/render/missingImageArt.test.ts`, `tools/test_g5_art.py`, `tools/test_missing_art.py`

**Interfaces:** mở rộng `remaining-iso --king stone|arcane|neutral --kind building|plot --sample <id>` và `--group --approval <path>` trong building script; neutral không có plot. `make_assets.py` stage/publish theo catalog (đủ expected ids, không chỉ glob source thấy được). G5 giữ CLI hiện hữu `g5-iso-set <king>` và publish `<king>`; thêm filter missing-only.

- [ ] **Step 1:** Test74 building frame coverage,9×4 plots, loại bỏ tome/enchantment; G55 group không bật trước review; source thiếu1 nhà dù đủ4 plots cũng fail publish. Test centre thoi row giữa/width128/alpha/mật độ chung, projection manifest iso_2_1, id/path unique; barracks cũ còn fallback. Commands Python art/g5/missing gates + `npx vitest run src/render/g5ImageArt.test.ts src/render/missingImageArt.test.ts < /dev/null` → FAIL missing coverage.
- [ ] **Step 2:** Refresh59 G5 pending entries. Reuse50 source snapshot, bổ sung9 mục thiếu nếu vẫn thiếu; không gọi lại samples đã duyệt. Claude group review riêng tide/forge/clock/moon/nomad. Có khác biệt đã ghi trong sample Clock (tháp tròn/cửa giữa): giữ ngoại lệ cụ thể đó, không lan sang nhà khác. Publish đủ nhóm, thêm G5_ART_APPROVED39 nhà + IMAGE_PLOTS20 skin.
- [ ] **Step 3:** Stone/Arcane:1 nhà+1 plot mẫu/vua; neutral:1 building mẫu (dùng neutral_archer_tower). Prompt lấy iso_template, style ref +iso-building-approved/iso-plot cùng state +Wheat cùng loại; nhà không lấy card45° làm camera. Claude gate rồi hoàn tất tổng19 building (gồm barracks đổi iso) +8 plots, tính cả mẫu, source không ghi đè archive.
- [ ] **Step 4:** Cắt chung scale Wheat, record chiều rộng/cao thật từng nhà (không ép64×80 vì scale bộ iso đã duyệt khác); plot128 px và centre. Claude review từng group source/native/sheet rồi publish/register + approval lists. Task này thay57 fallback buildings,1 barracks cũ và28 fallback plots; không redraw16 Wheat/Grove đã nối.
- [ ] **Step 5:** Tests Step1 → PASS. Browser9 vua/4 state/Ngai+mọi nhà ở hai viewport, pan/zoom lẻ/3×, cửa nhìn ra đường, unit feet không nổi, không crop mái. Giả thiếu1 PNG kiểm painter fallback; atlas pack vẫn≤4096; screenshot/review theo king.

## Phần P3 — Cards rồi icons

### Task 5: Đủ102 tranh thẻ bằng reuse và phần thật sự chưa vẽ

**Files:**
- Modify: `docs/art-review/g3e/cards/cards.json`, `docs/art-review/g3e/cards/make_prompts.py`, `docs/art-review/g3e/cards/make_assets.py`, `tools/test_art_prompts.py`, `src/render/imageArt.ts`, `src/ui/cards/cardImage.ts`, `src/scenes/PreloadScene.ts`, manifest, CREDITS
- Create/complete: `docs/art-review/g3e/cards/<id>/{prompt.md,source.png,sample-review.md,group-review.md}` cho92 id chưa nối, sheets theo king; `public/assets/art/ai-v1/cards/<id>{,-48}.png`
- Test: `src/render/missingImageArt.test.ts`, `src/ui/cards/cardImage.test.ts`, `tools/test_missing_art.py`

**Interfaces:** approval list `IMAGE_CARDS_APPROVED` trong imageArt làm nguồn chung; `VERTICAL_CARD_ART/CARD_ART_FILES` dựng từ list đó. Không đưa96×72 vào world atlas với scale0.5. Resolve theo texture loaded, thiếu big thì small, thiếu cả hai thì `paintCardArt`32×24.

- [ ] **Step 1:** Test catalog102, VISUAL keys real ids, all kinds đủ; prompt đọc doc và đính kèm Wheat card đã duyệt +style +portrait owner nếu có. World iso không lọt vào card template45°. Test missing big/small/both, pickCardImage không fractional scale; mỗi card mới2 PNG/manifest rows. Python/Vitest commands Task1 + `npx vitest run src/ui/cards/cardImage.test.ts < /dev/null` → FAIL trước sửa.
- [ ] **Step 2:** Refresh source inventory, reuse47 nguồn chưa nối nếu số snapshot còn đúng; Claude review sau khi cắt stage, không coi source cũ đã approved. Vẽ45 id chưa có source trong danh sách (hoặc phần thiếu thực tế sau refresh) qua script. Existing Wheat đủ sample ngôn ngữ card; loại neutral/meta mới chọn `neutral_duplicate` làm1 sample, Claude duyệt trước nhóm neutral. Ngai thiếu dùng subject throne riêng, không lấy world PNG nhét vào illustration.
- [ ] **Step 3:** Cutter thêm stage mặc định + publish gate (hiện `make_assets.py` ghi public ngay). `python docs/art-review/g3e/cards/make_assets.py --stage <id>` rồi review96×72/48×36; `--publish --approval <review> <id>` chỉ sau Claude ĐÃ DUYỆT. Đăng ký184 PNG của92 thẻ, CREDITS, IMAGE_CARDS_APPROVED/adapter runtime; giữ painter fallback.
- [ ] **Step 4:** Tests → PASS; browser tay bài/kho/reward/conquest/council/help/deck cho9 vua+neutral hai viewport, crop/rarity/text không đổi; small card chọn48×36. Thiếu PNG và load failure không hiện texture missing; screenshot theo nhóm.

### Task 6:14 icon runtime,8 badge và reuse icon nguồn

**Files:** Modify `docs/art-review/g3e/icons/make_prompts.py`, `docs/art-review/g3e/icons/make_assets.py`, `src/render/imageArt.ts`, `src/render/atlas.ts`, `src/scenes/PreloadScene.ts`, `src/ui/realm/kingBadge.ts`, manifest, CREDITS; Test `tools/test_art_prompts.py`, `tools/test_missing_art.py`, `src/render/missingImageArt.test.ts`, `src/ui/realm/kingBadge.test.ts`; Create `docs/art-review/g3e/icons/<id>/{prompt.md,source.png,sample-review.md,group-review.md}`, `public/assets/art/ai-v1/icons/<id>{,-16}.png`.

**Interfaces:** `IMAGE_ICONS_APPROVED` id→file và `IMAGE_BADGES_APPROVED` king ids trong imageArt; atlas dùng16px copy hoặc32px với explicit0.5 như metadata, không áp nửa scale lên16px; kingBadge32/16 adapter giữ API.

- [ ] **Step 1:** Test14 runtime ids trùng ICON_IDS,8 badge mới, Wheat không redraw. Map `enchant` khác `enchantment`, `conquer` khác proposed `conquest`, sell có brief riêng; không lấy tên gần giống để coi coverage. Nguồn icon script hiện có `troop,tower,tome,economy,support,enchantment,throne,gold,life,level,enchant_stack,soul,icon_king_wheat`: kiểm file thật và reuse, chưa wired không gọi là done. Python/Vitest gates → FAIL coverage mới.
- [ ] **Step 2:** Reuse source hợp lệ +badge Wheat reference; icon mới qua prompt script,1 mẫu bộ HUD trước group,1 mẫu badge Stone trước8 badge (Claude duyệt). Cắt keyed alpha và32/16 native, đọc ở16px; ký hiệu lock/reroll/sell/conquer không nhầm nhau hoặc chìm nền kem.
- [ ] **Step 3:** Group review → publish44 PNG cho22 thiết kế thiếu runtime; manifest/CREDITS/approval lists, atlas +kingBadge adapters. Không sinh44 proposal icons vì backlog. Existing extra icons không có consumer được future-runtime/reuse, không phá nguồn.
- [ ] **Step 4:** Tests → PASS; browser calendar strip/calendar modal liên quân, HUD/resources/actions/tooltip hai viewport; missing icon/badge fallback. Kiểm blue/red không thay crown/gold/stone material.

## Phần P4 — FX và phần artwork procedural còn lại

### Task 7: FX14, ground2, UI/menu còn thiếu (Codex vẽ, Claude duyệt)

**Files:**
- Modify: `docs/art-review/g3e/icons/make_prompts.py`, `docs/art-review/g3e/icons/make_assets.py`, `docs/art-review/g3e/buildings/make_prompts.py`, `src/render/imageArt.ts`, `src/render/atlas.ts`, `src/render/fieldArt.ts`, `src/render/uiArt.ts`, `src/render/uiKit.ts`, `src/render/kingCardArt.ts`, `src/scenes/PreloadScene.ts`, `src/scenes/MainMenuScene.ts`, manifest, CREDITS
- Create: `docs/art-review/missing-assets/{fx,ground,ui,menu}/<id>/{prompt.md,source.png,sample-review.md,group-review.md,native.png}`, runtime targets đúng bảng inventory
- Test: `tools/test_art_prompts.py`, `tools/test_missing_art.py`, `src/render/missingImageArt.test.ts`, `src/render/atlas.test.ts`, `src/render/groundArt.test.ts`, `src/render/uiArt.test.ts`, `src/render/uiThemed.test.ts`, `src/render/kingCardArt.test.ts`

**Interfaces:** approval lists `IMAGE_FX_APPROVED`, `IMAGE_UI_APPROVED`, `IMAGE_MENU_APPROVED` trong imageArt; `GROUND_TEXTURE_FILES/GROUND_TEXTURES_APPROVED` thêm flowers/path. UI scale1 đúng native metadata, không dùng IMAGE_ART_SCALE chung. `uiFrameDef` tiếp tục nguồn size/slice/border duy nhất; king-card compositor giữ glyph/runtime text và portrait window. Menu image overlay painter, giữ parallax/layout hiện tại.

- [ ] **Step 1:** Tests assert14 FX file/frame,8 arrow hướng riêng không rotate, shadow alpha128 declared; ground seam trái/phải/trên/dưới và cùngUV giữa field/road tail; UI94 missing base/themed +2 decor +10 king-card backgrounds +4 menu sources đủ list. Snapshot nativeSize menu lấy trực tiếp paintSky/HILL_LAYERS vào catalog trước mẫu, không để0×0. Missing PNG giữ painter, loaded metadata không đổi chín-slice; glyph Việt và card locked vẫn đọc được. Python/render Vitest gates → FAIL trước adoption.
- [ ] **Step 2:** FX sample1 arrow (e) rồi sample1 effect (shield vòng pixel rỗng, không blur), shadow sample riêng nếu cần alpha128; Claude review rồi group8 directions/6 FX. Icon script thêm template FX từ ART_STYLE, reference cùng loại nếu chưa có ảnh approved thì dùng approved unit/style và ghi rõ đây là first-kind sample. `fxArt.ts` giữ nguyên fallback, không “vẽ” FX PNG bằng chính painter.
- [ ] **Step 3:** Ground1 seamless path sample → Claude gate →flowers; đính kèm terrain đã duyệt, lấy template texture top-down không iso. Tiếp tục mask/dualGrid/squareToIso bằng code, chỉ đổi chất liệu flowers/path; thêm path cho road tail để không còn vệt procedural khác màu. Không imagegen mask hình học.
- [ ] **Step 4:** UI: mẫu slot,bar,themed panel,king-card background,menu layer,firefly/clockDial theo loại mới; Claude gate trước group tương ứng. Codex vẽ master artwork rồi script theme recolour có mask, review đủ9 king×10 frames; không làm mất hover/down/active/rarity/selected. Kenney base giữ nguyên, artwork mới không thêm chữ imagegen. King-card9 màu+locked từ master approved, compositor K/suit/?/lock giữ đúng layout. Menu4 layers nối ngang/parallax đúng; không invent logo/win/lose raster nếu UI hiện chỉ có text.
- [ ] **Step 5:** Mỗi loại stage native →Claude group-review ĐÃ DUYỆT →publish/register/list→adapter. Cắt alpha0/255 (sky/card background opaque255), shadow128 riêng; theme variants cũng có manifest/CREDITS/source derivation từng PNG. Tests → PASS; browser2 viewport và hover/down/locked/disabled, menu resize/parallax, battle FX đông, ground seam/road tail, text/tooltip tương phản. Không tăng FX frame count hay thêm skill event không tồn tại.

## Phần P5 — Nghiệm thu toàn bộ

### Task 8: Atlas thực, zero placeholder coverage và bằng chứng bàn giao

**Files:** Modify `src/render/atlas.ts`, `src/render/atlas.test.ts`, `src/render/missingImageArt.test.ts`, `docs/art-review/missing-assets/{catalog.json,inventory.md,acceptance.md}`, `docs/art-review/HANDOFF.md`, `docs/ASSET_MANIFEST.md` (sửa checklist palette cũ), `docs/assets.manifest.yml`, `CREDITS.md`.

**Interfaces:** final coverage không chỉ kiểm IMAGE_ART_FILES có file: registry mỗi frame phải có replacement approved thật trong normal load path; UI/card/portrait textures riêng có chứng cứ load. Packer trả kích thước thật với tất cả PNG final, vẫn một `sprites`.

- [ ] **Step 1:** Test pack với toàn artwork và padding, mỗi cạnh≤4096, frame unique, frame rộng hơn shelf reject rõ; test width512 hiện tại có thể vượt height, cho phép tăng shelf width thích hợp đến≤4096 và đo lại, không chia world atlas hay giảm mật độ âm thầm. Test reset IMAGE_FRAMES/new session không giữ scale art cũ, PNG lỗi rơi painter; pack riêng UI≤4096 tương tự.
- [ ] **Step 2:** Final coverage:45/45 unit ids (540 PNG tổng cả96 đã có);74/74 building frames;9/9 king×4 plots;102/102 illustrations;14/14 runtime icons;9/9 badges;14/14 FX. Terrain5 vật liệu dùng ảnh khi có load, UI artwork procedural ở inventory đã có replacements; intentional glyph/mask/geometry vẫn code với disposition có lý do. Không đếm optional backlog thành thiếu runtime hoặc đếm image đã vẽ thành loaded.
- [ ] **Step 3:** `python -m unittest discover -s tools -p test_art_prompts.py`; `python -m unittest discover -s tools -p test_missing_art.py`; `python -m unittest discover -s tools -p test_g5_art.py` → PASS. `npm run lint < /dev/null && npm run typecheck < /dev/null && npm test < /dev/null && npm run build < /dev/null` → exit0. Gate fail thì sửa đúng nguyên nhân; report số test/revision, không gọi đó là đã chạy trong phiên plan.
- [ ] **Step 4:** `npm run dev < /dev/null` rồi browser1280×720 và375×812: chọn9 vua, board mọi state/nhà, units12 poses,3 boss, deck/reward/conquest, calendar, crowns/menu; zoom overview/lẻ/3×, pan/resize, flip, y-sort, translucent shadow declared. Ít nhất một normal battle+boss thật mỗi viewport; gallery bổ sung mọi id khó gặp. Fault injection missing PNG riêng nhóm, console sạch khi tải bình thường; runtime card/portrait/icons không missing texture. Lưu screenshot/video theo id, review Claude.
- [ ] **Step 5:** Acceptance ghi PNG counts/atlas width×height/cache bytes/load time, references source/prompt/sample/group +metadata/manifest/credits, bảng planned dispositions đủ733 id. Nếu triển khai G5 PWA đã có thì rebuild offline cache với art cuối và kiểm offline reload hai viewport; không thực thi plan PWA mới trong task art. Cập nhật HANDOFF trạng thái thật/nguồn đã reuse, bỏ số cũ94 cards/“mọi vua khác shared plot” khi không còn đúng.
- [ ] **Step 6:** Claude review toàn diff/ảnh và xác nhận không có artwork placeholder thường trực còn trong scope; fallback chỉ chạy khi file lỗi. Chỉ khi evidence đầy đủ mới đánh Done. Tích hợp theo feature branch →PR develop; không tự merge/release/push main/develop. Commit/PR là công việc triển khai sau, không thuộc phiên lập kế hoạch này.

## Rủi ro

- **Atlas:**444 pose PNG mới cộng nhà/FX có thể làm shelf512 quá cao. Đo pack bằng PNG thật trước adopt hàng loạt, điều chỉnh shelf width trong≤4096; không giả size bằng UnitDef vì image crop khác. Không nạp concept1024px vào atlas.
- **Consistency:** identity/vũ khí/feet dễ lệch giữa6 ô hoặc giữa standing và sheet. Một source sheet, chung scale/canvas, GIF và mask tests; redraw đúng id qua script sau review.
- **Foe recolour:** băng, pha lê, rune cyan, vải teal có thể bị quét nhầm. Mask team pixels per-id, test vật liệu bất biến và red marker; không dùng một ngưỡng blue toàn roster.
- **Nguồn đang thay đổi:** G5 đang có source mới chưa tracked, catalog admin cũ, prompt tests hiện có ghi vào repo. Refresh/hash/lock và tempfile tests; không overwrite nguồn đang chạy, không dùng số733 làm quota imagegen.
- **Số lượng:** mỗi unit cần sample+pose, nhiều ảnh có sẵn chỉ cần review/cut/adopt. Scheduler≤3, resume id, báo tiến độ accepted/total riêng generated/total; failed group không được bật approval list.
- **Metadata/scale:** sourceSize/finalSize/worldSize khác nhau; world0.5, icon/UI1, card96/48 không đồng nhất. Tests/consumer adapters riêng; không tăng hitbox để chữa art.
- **UI scope:** frame themed90 và menu là code artwork thật dù planned đánh optional; phải hoàn thành inventory runtime. Giữ Kenney đã có, giữ glyph và geometry chức năng để tránh phá chữ, touch hoặc chín-slice.

## Câu hỏi mở

Không có quyết định sản phẩm chặn thực thi. Kích thước crop cuối, team mask và nguồn G5 xuất hiện thêm được chốt bằng mẫu/review/catalog, thuộc quyền Claude đã được giao; không hỏi lại về thứ tự, quyền duyệt, mật độ hay ai vẽ.

## Đã viết

- Inventory runtime theo id, reuse/pending/missing và đối chiếu backlog733 mục.
- Tám task với file, interfaces, checkbox, runner≤3, gates Claude và commands kiểm chứng.
- Quy trình cut/register/wire/fallback/browser, ngân sách atlas và rủi ro consistency/recolour.

