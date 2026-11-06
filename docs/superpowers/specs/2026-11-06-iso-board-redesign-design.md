# Crowned Kingdoms — Bàn cờ isometric

Ngày chốt: **06/11/2026**. A–I là quyết định của chủ dự án; các số triển khai và giao diện hàm dưới đây là đề xuất kỹ thuật của người lập plan. Đây là phần bổ sung thay các quy ước bàn cờ/góc nhìn tương ứng của spec 16/10 và spec oblique 26/10; không thay các luật khác. Thực thi theo [plan](../plans/2026-11-06-iso-board-redesign.md).

## 1. Mục tiêu và phạm vi

Tạo bàn 5×5 thoáng hơn, Ngai tựa núi ở hàng sau, có khu tập kết lính, zoom và nền hình thoi 2:1. Giữ lưới, luật mở ô, auto-battle, hướng địch phía nam và mô phỏng vuông deterministic. HUD không chịu phép chiếu hoặc zoom thế giới.

Không xây tự do, không kéo lính, không xoay camera/sprite, không thay ngân sách/số quân/nhịp trận; không vẽ lại lính. Tăng tầm công trình là thay đổi cân bằng duy nhất được yêu cầu; ảnh hưởng cân bằng khác do hình học phải đo và ghi nhận, không tự bù số.

## 2. P1 — Luật và trận trong góc nhìn hiện tại

### Ngai, lân cận và lưu ván

- `THRONE_PLOT`: **12 → 2** (hàng 0, cột 2). Mở sẵn ô 2 cùng chín ô hàng 1–3/cột 1–3; cả chín ô giữa ban đầu trống. Tổng mở 9 → 10, khoá 16 → 15; giá và bộ đếm mua ô không đổi.
- `neighbours(2)` theo thứ tự Bắc/Đông/Nam/Tây hiện hữu là **[3, 7, 1]**, tập hợp {1,3,7}. Trong ba ô kề Ngai, đầu ván **chỉ ô 7 xây được**; 1 và 3 còn khoá. Điều này không thêm luật bắt buộc xây kề Ngai: `checkPlay` vẫn cho xây trên cả chín ô giữa.
- Chỉ ghi nhận ảnh hưởng, không cân bằng lại: mọi `stat.scope='neighbours'`: `wheat_field`, `wheat_granary`, `stone_quarry`, `stone_wall`, `stone_mountain_heart`, `grove_sapling`, `forge_smithy`, `forge_blast_furnace`, `forge_armory`, `clock_spring_workshop`, `nomad_stables`, thu nhập đếm hàng xóm của Cối Xay Gió và Kho Thóc, bị động Ngai; thứ tự nguồn Ngai trước trong `income`/`modifiers`; Dời Nhà/Thăng Cấp/Dỡ Bỏ và quy tắc cấm tác động Ngai; Tua Ngược (`clock.rewind`), Búa Thợ Cả (`forge.masterHammer`, hoà theo Bắc/Đông/Nam/Tây), Khế Ước Máu (`moon.bloodPact`), Giao Ước Nguyệt Thực (`moon.eclipsePact`, guard từ board), Hợp Đồng Lính Đánh Thuê (`tide.privateers` + reset năm), sắc lệnh tăng cấp Ngai, cấp Ngai sau boss. `battleSetup` phải lấy Ngai ở ô 2, còn ô 12 là ô thường.
- Save **4 → 5**, giữ envelope `formatVersion: 1`. Migrator thuần đổi **nội dung building** 12↔2, mở cả hai; giữ nguyên uid, cấp, bùa, permanent, counters, movedYear, ageBonus và các ô khác. Không sửa tham chiếu uid. Đổi các tham chiếu **chỉ số ô đang chờ** trong `offers`/`pendingOffers` (council selection) bằng cùng hoán vị; kiểm lại điều kiện chọn sau migration, xoá phần chọn phụ không còn hợp lệ để người chơi chọn lại, không bỏ offer hay tự enact. Save 3 phải chạy 3→4→5; save 5 không hoán vị lại. Kiểm legacy Ngai ở ô 12 đúng id/cấp và ô đã mở trước hoán vị; dữ liệu sai trả incompatible qua codec, không “chữa” thành save hợp lệ.
- Codec bỏ `THRONE=12`, import `THRONE_PLOT`, kiểm Ngai đúng id/cấp và **ô Ngai đã mở**. Planning/battle/mandatory offers đều resume được; reload trận dựng lại tick 0 với hình học mới. Không giữ hash trận phiên bản cũ; không lưu camera/zoom/decor, không ghi save mỗi tick/zoom/speed/intervene.
- Mọi camera căn **tâm hình học bàn** `boardOrigin + 5*plot/2`, không căn vị trí Ngai.

### Hình học đề xuất để thực thi

Mọi giá trị ở `src/data`; world vẫn vuông. Bộ số này là lựa chọn kỹ thuật, không phải quyết định art mới.

| Đại lượng | Cũ | Mới | Lý do |
|---|---:|---:|---|
| `BATTLE.plot`, `field`, `boardOrigin` | 32 / 384 / 112 | **64 / 768 / 224** | Bàn 320×320, tâm (384,384), mép [224,544); giữ tỷ lệ khoảng trống |
| `wallY` | 88 | **176** | Cách mép bắc bàn 48; tâm ô Ngai (384,256), chân mới (370,256) vẫn an toàn |
| `enemyAggro`, `siegeAggro` | 48 / 96 | **96 / 192** | Giữ 1,5 / 3 ô |
| `fieldClampMargin`, `spawnOutside` | 32 / 12 | **64 / 24** | Biên theo sân mới |
| `spawnSpacing`, `spawnRowGap`, `edgeSpan` | 10 / 10 / 0,6 | **20 / 20 / 0,6** | Vẫn 24 quân/hàng: floor(0,6×768/20)+1 |
| `spatialCell` | 32 | **64** | Tỷ lệ phân vùng không gian theo ô |
| `structureRadius`, `throneRadius` | 12 / 14 | **12 / 14** | Sprite/thân không phóng đôi; biểu diễn 0,1875 / 0,21875 ô |

Sân và quãng đường gấp đôi phải giữ **số ô di chuyển/tick**: nhân 2 mọi `UnitDef.speed` và mọi `AttackDef.projectileSpeed`, kể cả lính mình/địch, raiders, boss, summon và đạn công trình. Giữ tốc độ cũ khiến đợt 3 dễ hết hard limit trước khi tới Ngai; đây là đổi đơn vị theo hình học để giữ nhịp trận, không phải buff cân bằng mới. Không hứa thời lượng toàn trận giống hệt vì Ngai, tầm và vị trí xuất quân cũng đổi.

| Nhóm đại lượng | Cũ → mới / quy tắc | Phân loại |
|---|---|---|
| `UnitDef.speed` trong chín kings, neutral, raiders, `BOSSES`, `BOSS_SUMMON_UNITS` | Mọi giá trị ×2; ví dụ 0,5/0,6/0,7/0,8/0,9/1/1,1/1,2/1,3/1,4/1,5/1,6/1,8/2 → 1/1,2/1,4/1,6/1,8/2/2,2/2,4/2,6/2,8/3/3,2/3,6/4 | px/tick → giữ ô/tick; mirror/death/kill/start summons lấy stats mới đúng một lần |
| `AttackDef.projectileSpeed` của lính và công trình | 5/6/7/8/9/10 → 10/12/14/16/18/20; thiếu hoặc 0 vẫn 0 | px/tick; không nhân lại trong setup/world |
| Knockback `onHit.px`, charge.knockback, bonus flat knockback, `INTERVENTION.knockback` | 8/16/24→16/32/48; bonus 6→12; intervention 12→24; 0 vẫn 0 | Khoảng dịch px ×2; chia cùng `knockbackTicks=3` nên px/tick cũng ×2 |
| `BATTLE.separationPushMax`, `separationPushCross` | 1→2; 0,2→0,4 | Trần dịch px/tick ×2; fixed→unit vẫn theo overlap thân, không nhân overlap |
| Rage/slow và modifier tốc độ phần trăm | `BATTLE.rageSpeedPct=50`, `BOSS_RULES.crownless.rageSpeedPct=50`, stepBuff/speedPct/slow giữ nguyên | Hệ số không có đơn vị, áp lên tốc độ gốc mới |
| `flyingHitMinRange` | **Giữ 24** world px | Ngưỡng phân loại đòn của lính; tầm unit giữ nguyên nên ngưỡng cũng giữ, để lính tầm 32/40 (forge, tide) vẫn đánh được quân bay như hiện tại; tháp vốn đánh được quân bay |
| Thân lính/boss, `structureRadius`, `throneRadius` | Giữ nguyên world px | Không phóng sprite/thân; mật độ va chạm thưa hơn trên sân mới |
| Wave/rage/hard limit, interval/cooldown/duration | spawnTick [0,120,240], rage 600, limit 900 và mọi tick giữ nguyên | Thời gian, caps và luật thêm hàng không đổi |

Đòn cận chiến và tầm unit giữ nguyên theo quy tắc tầm bên dưới. Địch S xuất y=792+20×row; `spawnMaxY` ít nhất 832, mở rộng theo hàng thật (120 quân tự nhiên 5 hàng → y cuối 872). Clamp bắc vẫn `wallY+radius`, kể cả bay/knockback. Không đổi `composeArmy` thành đường dẫn: con đường chỉ là hình ảnh.

### Khu tập kết và đi xuyên

Trong `src/data/boardGeometry.ts`, khai báo chung `BUILDING_FOOT_OFFSET` và `DEPLOY_BOX`. **Sửa 06/11/2026 sau khi chủ dự án xem mẫu isometric:** nhà đứng **giữa ô** (`BUILDING_FOOT_OFFSET={x:0,y:0}`, thân ngang [−16,+16]), cửa chính ở mặt đông, và khu tập kết là **dải trước cửa** x∈[+18,+30], y∈[−24,+24] (bản đầu là nhà lệch tây 14 px, box x∈[+4,+28]). Box tách thân nhà ít nhất 2 px, nằm trong ô [−32,+32] và không chạm ô kề. Ô đã xây nhà vẽ thành sân lát đá cả ô. BoardRenderer/UnitRenderer và vị trí structure trong world/setup cùng dùng offset; `plotCenter` vẫn là tâm ô, không dịch nền/box. Ngai 32×48, radius 14 cũng dùng offset (thân ngang [−14,+14]); ô Ngai vẫn có box vì `spawnAtThrone` sinh privateers tại đây. Box ở phía đông world, khi chiếu iso hiện phía dưới-phải. Gắn viền đất thấp để nhìn thấy khi vào trận. `deploymentPosition(plot,index,count,radius)` phân bố lưới xác định trong box, co miền tâm theo bán kính; thứ tự hàng rồi cột, đủ count và không tràn ô. Cho phép trùng/chen khi đông, không bỏ quân vì thiếu chỗ; separation xử lý như hiện tại. Không hứa chứa 160 thân không chồng trong box nhỏ. `homeX/homeY` của từng lính là slot của nó.

Áp dụng cho lính trại ban đầu, startSummon và spawnAtThrone; respawn/summon từ công trình dùng cùng box. Triệu hồi khi giết/chết và boss quanh nơi giao chiến giữ `spawnOffset`; không xoá helper toàn cục khi còn nơi dùng. Không thêm pha người chơi bố trí lính.

Trong `separationPush`, bỏ lực structure↔unit **chỉ nếu unit TEAM_ALLY và structure TEAM_ALLY**. Địch vẫn bị công trình phe mình đẩy và dừng đánh ở tầm mép–mép; không mở ngoại lệ cho lính địch đi xuyên công trình cùng phe. Giữ flying, anchored, cross-team unit separation và fixed↔fixed hiện hữu; khi không có team, giữ hành vi cũ.

### Tầm và đơn vị ô

Quy ước đề xuất: **+50% trên world px cũ**, sau đó chia 64 để lưu số ô, không lấy số ô cũ nhân 1,5 rồi nhân 64 (sẽ thành +200%). `cells(n)=n*BATTLE.plot` ở data chuyển một lần sang world px cho `AttackDef`/setup hiện hữu. Không đổi schema mọi đòn của lính sang ô. Tầm vẫn mép–mép.

| Công trình (id) | World px cũ → mới | Ô 64 mới |
|---|---:|---:|
| `wheat_throne`, `wheat_scarecrow` | 72 → **108** | 1,6875 |
| `stone_throne` | 56 → **84** | 1,3125 |
| `arcane_throne`, `arcane_mage_tower` | 80 → **120** | 1,875 |
| `neutral_archer_tower`, `tide_cannon` | 88 → **132** | 2,0625 |
| `stone_catapult`, `nomad_watchtower` | 96 → **144** | 2,25 |
| `stone_crystal`, `grove_thorn_tower` | 64 → **96** | 1,5 |
| `forge_flame_tower` (kể cả cone.range) | 40 → **60** | 0,9375 |
| `clock_gear_tower`, `moon_shadow_spire` | 72 → **108** | 1,6875 |
| `clock_steam_cannon` | 104 → **156** | 2,4375 |
| `tide_kraken` | 56 → **84** | 1,3125 |

Cấp và sắc lệnh cũng khai báo theo ô: tách `TOWER_RANGE` cũ [0,4,8,12,16] thành bonus tầm bắn [0,6,12,18,24] world px (chia 64 để lưu số ô) và `PULSE_RADIUS_BONUS` [0,8,16,24,32] world px (giữ số ô cũ). `DECREE_RULES.archersRange` 12→18 (0,28125 ô), `boulderRadius` 8→16 (0,25 ô). Vì vậy mọi cấp tháp và bonus Cung Thủ Hoàng Gia đều tăng đúng 50% so tầm cũ; Ngai vẫn không nhận bonus tầm theo cấp như hiện tại. Describe và battleSetup phải đọc cùng bảng, không dùng bonus pulse làm bonus đạn.

Đòn range=0 của `stone_mountain_heart`/`tide_wave_tower` vẫn 0; vùng pulse là bán kính hiệu ứng, không được vô tình nhân thêm 1,5. Bán kính liên quan bàn cờ giữ số ô cũ (world mới gấp đôi), khai báo bằng `cells`: taunt 40→80 (1,25 ô), pulse núi 48→96 (1,5), wave 72→144 (2,25), shield 64→128 (2), heal công trình grove 64→128 (2), bell 80→160 (2,5), intervention radius 24→48 (0,75). Aggro theo bảng. Chain/splash/minRange **của công trình** chuyển sang ô giữ số ô cũ: chain 32→64, splash catapult 16→32, cannon tide 12→24, steam 18→36; minRange catapult 24→48 (tide cannon không có minRange). Cone tấn công dùng số tăng 50% nêu trên. Không nhân 2 bán kính thân, radius hiệu ứng/onHit/aura của lính/raiders/bosses; chúng vẫn world px. Riêng knockback là khoảng dịch phải ×2 theo bảng chuyển động, không áp quy tắc bán kính hiệu ứng cho nó. Thêm test chứng minh ranh giới này, tránh đổi lây shared AttackDef.

### Một con đường

`generateField` chỉ giữ hành lang ở giữa trục x từ **mép nam bàn (y=544) tới mép nam sân (y=768)**. Xoá nhánh bắc/trái/phải; nước không đè đường. P1 đường thẳng theo world; P3 chiếu thành đường chéo. Địch vẫn xuất S theo đội hình, không phải chỉ spawn trên con đường.

## 3. P2 — Zoom và quyền sở hữu cử chỉ

Chỉ bậc **1×/2×/3×**, wheel desktop, pinch mobile; kéo map khi zoom cao hơn bậc tổng quan. Giới hạn 3; viewport world quá nhỏ để có vùng chạm 44 thì khoá đặt thẻ, không tạo zoom lẻ. Không ease nội suy zoom như `realmCameraMix` hiện tại: đổi bậc tức thời, có thể ease scroll nhưng pixel-snap. Giữ điểm neo dưới wheel/pinch, clamp pan theo vùng world chiếu; resize giữ tâm đang xem trong biên. HUD giữ camera riêng.

Mặc định P1/P2 ô vuông mobile 1× đã đủ chạm; P3 hình thoi **64×32 ở 1×**, cho touch placement từ **2×** (thoi 128×64). Dung sai tính trong screen px: ô vuông 44×44 quanh điểm chạm giao thoi nào thì ô đó là ứng viên; nhiều ô thì chọn tâm chiếu gần điểm chạm nhất theo khoảng cách bình phương, hoà chọn chỉ số ô nhỏ hơn. Chọn hình học trước rồi kiểm luật ô, không ưu tiên ô xây được để đổi đích. Không dùng AABB thoi thay phép giao polygon. Bắt đầu kéo thẻ bằng touch ở 1× tự chuyển 2×, giữ neo vùng mục tiêu, không phát play ở bước chuyển zoom; không bắt nhảy 3×. Chuột desktop đặt được mọi bậc bằng hit chính xác; touch desktop theo cùng ngưỡng 2× và dung sai. Nút tổng quan ≥ 44×44; không thu nhỏ cả bàn cho vừa 375 px bằng zoom lẻ, pan tới các ô bị cắt.

Máy trạng thái cử chỉ dùng chung: idle / cardDrag / mapPan / pinch / blocked. Pointer bắt đầu ở thẻ sở hữu cardDrag; pointer thứ hai huỷ drag, trả thẻ về tay, huỷ tooltip/long-press/click chờ rồi chuyển pinch; thả một ngón sau pinch không trở thành click/drop. Pan vượt DRAG_SLOP huỷ click; modal/confirm/help chặn map; can thiệp không bị pan phát nhầm. Resize/chuyển pha/shutdown huỷ gesture. Không phát command hay save từ zoom/pan.

## 4. P3 — Isometric và cổng art

### Cổng bắt buộc trước renderer

Đọc lại ART_STYLE mục Quy tắc vẽ/Góc nhìn/Hiển thị mỗi lần tạo ảnh. Cập nhật ART_STYLE ghi **06/11/2026: isometric 2:1 thay chính diện 45°**, cả metadata ô 64/sân 768 và mẫu prompt/checklist; không để câu “NO isometric” tiếp tục là chuẩn. Mẫu nhà Thợ Gặt đã duyệt vẫn đính kèm làm tham chiếu chất liệu/màu/cụm pixel, ghi rõ không lấy góc nhìn cũ. Đính kèm thêm mẫu iso cùng loại sau khi được duyệt. Prompt Codex tự yêu cầu đọc tài liệu; `make_prompts.py` lấy đúng block, `test_art_prompts.py` bảo vệ.

Người thực thi chỉ tạo **1 mẫu công trình + 1 mẫu ô đất iso**, bày cạnh bản hiện tại, log prompt/nguồn/native review dưới `docs/art-review/iso-board/`. Chủ dự án duyệt cặp mẫu trước khi làm phép chiếu/renderer và bộ lớn. Không có duyệt thì dừng P3 tại gate, P1/P2 vẫn nghiệm thu riêng được. Phiên lập spec/plan này không tạo/yêu cầu tạo ảnh.

### Phép chiếu duy nhất

Hàm thuần trong `src/core/iso.ts`, không Phaser/UI/data/game import:

```text
project({x,y})   = {x: x-y,      y: (x+y)/2}
unproject({x,y}) = {x: y + x/2, y: y - x/2}
```

Từ P3 trở đi, mọi hướng đông/tây/nam/bắc trong spec và plan đều là **hướng world**, hiển thị iso là chéo: đông xuống-phải, tây lên-trái, nam xuống-trái, bắc lên-phải.

Chỉ + − × ÷; origin/bù vị trí do view/camera quyết định. **Sửa 06/11/2026 (chủ dự án chọn):** ô vuông 64 chiếu thành thoi **128×64** ở zoom 1 (bản đầu đề xuất 64×32), để art mật độ 2 hiện đúng độ nét gốc; sprite đứng vẽ ×2 (`ISO_SPRITE_SCALE`). Bàn là hình thoi 640×320; sân 768 chiếu thành 1536×768. Desktop dưới 1200 px và điện thoại dùng nút Trinh Sát / Sắc Lệnh thay bảng hai bên; trên điện thoại bàn rộng hơn màn hình nên kéo được bản đồ ở mọi bậc zoom. Điểm âm hợp lệ. Không làm tròn trước inverse/hit-test; chỉ snap toạ độ cuối lúc hiển thị. Giữ nguyên `BattleWorld`, `plotCenter`, spatial hash, bounds, khoảng cách, RNG và hash P1. Phép chiếu không được nhập vào simulation.

- Mọi điểm đất, chân nhà/quân, đạn, boulder, target marker, shadow và health/inspection anchor thế giới cùng qua phép chiếu; UI overlay vẫn screen-space. Không shear/rotate sprite đứng. Neo chân 0,5/1, kích thước công trình không đổi.
- Depth theo **iso foot y = (worldX+worldY)/4**, hoà theo id/plot ổn định; dùng giá trị chưa snap. Plot/nền ở lớp đất; các vật đứng cùng miền depth, không đặt toàn bộ tường ở depth 0,2 khiến vật bị che sai. Tường bắc vẫn logic y=176; renderer ghép chân dọc đường chiếu của (x,176), không kẹp theo screen y.
- Screen pointer → inverse camera hiện hành → unproject → ô floor theo origin/64. Dùng cùng đường chuyển đổi cho click/drag/drop/hover/long-press/mua ô/hai đích/can thiệp. Nhận diện hình sprite nhà/quân có thể dùng screen bounds nhưng phải chọn vật sống phía trước theo iso depth, không dùng AABB thoi làm hit ô. Riêng touch placement dùng phép giao ô vuông dung sai 44×44 với polygon chiếu và chọn tâm gần nhất theo §3 thay floor trực tiếp.
- Vòng tầm world hình tròn chiếu thành elip 2:1 (với phép chiếu này bán trục r/√2 và r/(2√2)); dựng bằng chiếu contour pixel circle, không lấy bán trục r và r/2 sai tỷ lệ. Min-range/pulse/shield/taunt/aura và boulder cùng quy tắc.
- Nền, ô đất, một đường nam và chân tường đều dùng hình học chiếu; dual-grid giữ quyết định terrain trong world. Raster pixel nearest, không dùng texture rotation để giả iso.

Sau renderer, vẽ lại **8 công trình Lúa Mì gồm Ngai**: `wheat_throne`, `wheat_field`, `wheat_windmill`, `wheat_granary`, `wheat_peasant_horde`, `wheat_militia`, `wheat_reapers`, `wheat_scarecrow`; ô open/locked/throne và tường núi. Duyệt từng nhóm trước nối runtime. Vua khác dùng fallback hình học iso + sprite đứng hiện có; lính chính diện dùng tạm, vẽ lại lính ngoài phạm vi. Một atlas world `sprites`, mỗi cạnh ≤ 4096, frame có tên, metadata tường minh, alpha mép 0/255; bóng riêng 128 khi khai báo. Giữ pixelArt/nearest/integer camera zoom; ảnh density 2 hiện tại scale 0,5 là metadata đã có, không tự ép mọi nguồn thành sprite lớn gấp đôi.

## 5. P4 — Trang trí sau iso

Dùng lại `batch-06-wilds/source.png` và nhánh wilds của `tools/slice_art_batches.py` (4 cây, 3 núi/vách, 3 bụi, 3 đá, gốc cây, khúc gỗ). Chủ dự án duyệt **từng vật sau cắt và trong iso**. Lô `batch-06-wilds` đã sinh từ trước nhưng **chưa được duyệt, chưa đăng ký** trong manifest; HANDOFF không ghi lô này; chưa duyệt thì không đưa vào pool runtime. Đăng ký manifest/CREDITS trước nhận asset; không tạo ảnh mới cho cảnh trang trí đợt này.

Vật cao nằm ngoài sân logic [0,768]²; vật thấp không vào bàn [224,544]² hoặc hành lang đường nam; xét cả footprint và chồng hình chiếu để không che lính/HUD. Sông/nước sinh bằng `fieldArt`, không cắt đường/bàn, không collision. Rải bằng seed + salt riêng và pixelHash/Rng cục bộ, không tiêu thụ rng draw/reward/calendar/council/quest, không Math.random, không ghi save. Không thêm entity/spatial obstacle/target mô phỏng. Cùng seed/camera khác vẫn cùng vị trí world.

## 6. Nghiệm thu, rủi ro và câu hỏi mở

Thứ tự cứng **P1 → P2 → P3 (mẫu → duyệt → projection/render → bộ Lúa Mì) → P4**. Nhánh `iso-board-redesign` từ `develop`, PR vào `develop`, không push trực tiếp main/develop. Mỗi pha: lint/typecheck/test/build exit 0 và browser 1280×720 + 375×812 theo §13.4; lưu bằng chứng vào HANDOFF khi thực thi.

Rủi ro chính: migration đảo nhà nhưng mất selection; bỏ sót tốc độ/knockback khi đổi đơn vị làm đợt cuối hết giờ trước tiếp cận; box đông gây separation bật ra; mobile thoi nhỏ và gesture phát command nhầm; tường/đạn dùng lẫn hai hệ toạ độ; density art ở zoom 1/3 không sắc; atlas tràn khi thay toàn bộ art. Test/gate trong plan phải bắt các trường hợp này. P1 ghi hash/ticks/kết quả/benchmark trước–sau có chủ đích; P2/P3/P4 phải giữ nguyên trace simulation P1 với cùng setup/inputs. Không tự ghi giá trị hash hoặc số đo chưa chạy.

**Câu hỏi mở:** Không có câu hỏi thiết kế cần mở lại A–I. Duyệt mẫu iso và từng vật trang trí là cổng art thực thi; các số triển khai ở trên là đề xuất có test/browser gate, không phải yêu cầu chủ dự án chốt lại phạm vi.
