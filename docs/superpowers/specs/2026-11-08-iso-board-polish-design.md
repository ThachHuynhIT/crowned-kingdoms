# Crowned Kingdoms — Hoàn thiện bàn cờ isometric

Ngày chốt yêu cầu: **08/11/2026**. Thực thi theo [plan](../plans/2026-11-08-iso-board-polish.md), trên nhánh `iso-board-redesign`, PR #13 vào `develop`. Bảy quyết định của chủ dự án là ràng buộc; các công thức, toạ độ và thuật toán cụ thể dưới đây là lựa chọn kỹ thuật của người lập plan. Tài liệu này thay phần xung đột của spec 06/11 về zoom, chọn mục tiêu, xuất quân và cảnh; các luật khác giữ nguyên.

## 1. Kết quả cần đạt

Bàn cờ là trọng tâm màn hình; zoom mượt tới 3×, sân có cỏ liền mạch cả ngoài hình vuông 768 px, rừng mới phủ vùng sau vách núi, khoảng giao chiến đọc được, nhà lính có sân lát đá như nhà khác. Địch xuất từ cổng ở cuối đường và đánh lính trước khi phá nhà. Hai ảnh `.superpowers/polish-owner-screenshot.png` và `.superpowers/polish-reference-zoom.png` chỉ là bằng chứng bố cục/zoom/mật độ, không phải nguồn art để sao chép.

Không vẽ lại lính, không làm G4/G5, không thay ngân sách/chỉ số quân/tốc độ/nhịp đợt/caps/hard limit, không thêm lưu camera, không tạo ảnh trong phiên viết tài liệu. Chỉ đo tác động cân bằng, không tự bù số.

## 2. Q1 — Đánh lính trước

`targeting.ts:foeTarget` hiện trộn lính và nhà trong `enemyAggro=96`; siege bỏ lính và dùng `siegeAggro=192`. Thay bằng thứ tự:

1. Cuồng Nộ toàn trận từ tick 600: Ngai còn sống, nếu không thì −1; giữ ưu tiên cao hơn taunt như `retarget` hiện tại.
2. Ngoài Cuồng Nộ: công trình Khiêu khích trong bán kính, gần nhất theo khoảng cách tâm, hoà id nhỏ, như cũ.
3. Lính TEAM_ALLY còn sống mà `canHit` cho phép, **trên toàn chiến trường**, gần nhất theo khoảng cách mép, hoà id nhỏ. Không yêu cầu đã nằm trong tầm đánh hoặc aggro: quân đi tới để đánh. Siege và cả ba boss theo cùng luật.
4. Không có lính hợp lệ: công trình/Ngai trong bán kính aggro cũ (96 thường, 192 siege), gần nhất theo khoảng cách mép; không có thì Ngai còn sống, nếu không −1.

`canHit` là khả năng đánh loại mục tiêu, không phải `inRange`. Cận chiến không đánh được lính bay (`range < 24`) bỏ qua nó và tiến đánh nhà; cung đánh được thì đuổi theo. Không thêm pathfinding hoặc suy diễn “không đánh được” từ khoảng cách xa; mô phỏng hiện không có bản đồ reachability. Giữ steering, minRange và nhịp chọn lại 5 tick. Mục tiêu chết hoặc trở thành không đánh được phải chọn lại ngay; nhà đang bị nhắm đổi sang lính mới ở lần retarget định kỳ kế tiếp, chậm nhất 5 tick.

Kỹ năng riêng cũng không được trở thành ngoại lệ thứ ba: `bosses.ts:mudThrow` của Ông Kẹ hoãn lần Ném Bùn nếu còn lính boss có thể đánh; không tích trữ để bắn bù, lần sau theo lịch tuổi boss cũ. Khi không còn lính hợp lệ, vẫn chọn tháp DMG cao nhất trong 160, hoà plot như cũ. Chỉ mục tiêu chính (`foeTarget`), bước nhảy chain (`chainFrom`) và Ném Bùn chọn nạn nhân mới theo luật lính trước. Chain chọn địch gần nhất chưa trúng trong bán kính nhảy, hoà id nhỏ; khi còn lính hợp lệ và không có ngoại lệ taunt/rage thì chỉ nhảy sang lính, không có lính chưa trúng trong bán kính thì dừng. Splash/cleave/cone giữ nguyên sát thương vùng: splash qua `foesNear`, cleave lấy địch khác trong tầm, cone lọc vùng quạt; công trình trong vùng vẫn trúng sát thương kèm dù còn lính, không thêm bộ lọc lính vào các đường này; đạn đã phóng và DOT đã áp không bị xoá ngược. Taunt/rage cho phép đánh nhà và sát thương lan như cũ. Không sửa kỹ năng của phe ta.

Ảnh hưởng đã xác định: Gã Hộ Pháp `ogre` và Ông Kẹ `boss_bog_ogre` có siege; Nữ Hoàng Ong và Vua Không Ngai cùng đổi mục tiêu chính, cleave của Ông Kẹ/Vua Không Ngai cần kiểm. Hạ Cánh làm thay đổi khả năng bị đánh của Ong; ếch/ong/Bóng Gương và lính sinh khi chết vẫn dùng luật chung. Cuồng Vương theo HP của Vua Không Ngai chỉ buff speed/interval, **không** đồng nghĩa rage toàn trận. `stone_wall` giữ taunt; thẻ ra lính, lính bay, hồi sinh, charge, ramp theo mục tiêu, kéo/đẩy và tháp có thể đổi hiệu quả vì thời gian bị đánh/tiếp cận thay đổi. Không đổi dữ liệu thẻ hoặc số kỹ năng để bù.

## 3. Q2 — Cổng và xuất quân thật

Khai báo `ENEMY_PORTAL` ở `src/data/battle.ts`: tâm chân **(384,792)** = `(FIELD/2, FIELD+spawnOutside)`, hướng ra bắc world. Tâm bàn (384,384), mép nam bàn y=544; đường kéo dài x=384 tới y=792. Texture `fieldArt.ts` chỉ phủ tới y=768: Q2 chấp nhận đường dừng ở 768, hình cổng tạm che chỗ hở 768→792; Q4 vẽ nối đoạn này trên lớp nền cỏ chunk tới chân cổng. Phép chiếu `project({384,792})={408,588}` so tâm bàn `{0,384}`: cổng lệch phải 408 và xuống 204 ở zoom 1, khớp ô vuông đỏ. Không đặt ở mép đông world chỉ vì ảnh nằm bên phải.

Chọn **đội hình nhỏ tại miệng cổng, không hàng đợi theo tick** để giữ nguyên tick đợt, điều kiện kết thúc và tuổi boss. Hàm mới `portalPositions(count)` trả count điểm, k theo thứ tự spawn: `s=k%25`, cột `s%5`, hàng `floor(s/5)`; `x=384+(cột−2)*12`, `y=792−hàng*6`. Miệng cổng là vùng x=[360,408], y=[768,792]. Vòng thứ hai dùng lại slot; separation hiện tại tỏa quân sau khi xuất, như nguyên tắc cho phép chen của khu tập kết. Chấp nhận chồng thân ban đầu, không bỏ quân vì thiếu chỗ. Cổng có vùng sáng trên đất 96×48 projected px và khung đứng tối đa 96×112 ở zoom 1 (metadata native được xác nhận sau duyệt); không biến footprint hình ảnh thành collision.

`spawnWave` dùng helper này cho S, raiders đi cùng đường đó; N/E/W giữ helper legacy cho fixture, không mở lại trong gameplay. Boss S sinh đúng tâm cổng (slot 0 riêng cho boss), cùng tick cấu hình, sau/ trước wave theo thứ tự step hiện hữu, không reorder id. `spawnBossSummons`, deathSpawn, summonOnKill giữ vị trí tại boss/nạn nhân/công trình. `composeArmy` giữ số lượng và `WAVES.spawnTick=[0,120,240]`.

`formationRows` còn trong setup để tương thích nhưng không đổi vị trí S; extraEdge/năm muộn không còn trải rộng hàng ở S. Đây là hệ quả chủ đích của thay hàng dài bằng cổng, cần báo cáo tác động cờ Đột Kích, không đổi save/nhịp để tái tạo lợi thế cũ. `spawnMaxY` phải dùng vị trí S mới, tối thiểu vẫn 832. Giữ ENEMY_CAP=120, playerUnitCap=160, bossSummonCap=40, entityCap=512, projectileCap=400, hardLimitTick=900. Không thêm queue/BattleWorld state hay RunState mới.

Q2 có hình cổng tạm bằng code, vẽ được khi thiếu art; không thêm tương tác hoặc máu. Q5 chỉ thay hình. Đường vẽ và vùng ngắm trận kéo tới cổng: `worldAtView` cho phép battle input tới y=832 nhưng không nới vùng đặt thẻ (chỉ 25 ô). Can thiệp tại cổng dùng luật bán kính hiện có.

## 4. Q3 — Zoom liên tục và vùng HUD

Chọn mục tiêu **65%** chiều ngang: nằm giữa khoảng 60–70%, chừa rừng hai bên. Board ở zoom 1 rộng 640, cao 320. Đặt `overviewZoom(screen,phase)` trong model bố cục thuần, dùng chung cho `battleZoom`, `planningZoom`, `realmCamera` và giới hạn min trong cameraModel; không gọi vòng `planningLayout → planningZoom → planningLayout`.

Desktop planning: vùng bàn y=[104, handTop−16], handTop lấy từ handRow hiện có; với 3 thẻ cao 176 thì handTop=height−186. Battle: y=[104,height−72]. `fit=min(0.65*width/640, usableHeight/320,3)`. Hai cột scout/decree phải chuyển thành nút nếu giao board bbox cộng lề 16; không chỉ xét `width>=1200`. Khi 4 thẻ đổi chiều cao, tính lại usableHeight thực tế.

Mobile: min **33/32=1.03125** ở cả hai pha. Lý do: thoi 128z×64z chứa được ô vuông trục màn hình cạnh `128z/3`; z=33/32 cho đúng 44×44. Dùng riêng chiều cao AABB=64z là không đủ chứng minh vùng chạm. Planning giữ board top 180; hàng nút Bộ bài/Đổi/Bán dịch y=508→530, vùng bàn y=[180,514] cao 334 chứa board cao 330. Tay bài 3 thẻ vẫn y=640 tại 812 px; ✓/✕ 48 px ở hàng trên bàn. Mobile không thể vừa 65% ngang đồng thời giữ vùng chạm: ưu tiên chạm và pan, không bóp zoom xuống 0.38. Màn quá thấp không đủ chiều cao ưu tiên touch min, cho pan qua vùng HUD an toàn; không hứa fit trong mọi chiều cao.

| Viewport (3 thẻ) | Min planning | Board W×H | % ngang | Min battle |
|---|---:|---:|---:|---:|
| 1280×720 | min(1.3,414/320)=**1.29375** | 828×414 | 64.6875% | **1.3** (832×416) |
| 375×812 | **1.03125** | 660×330 | 176%, pan ngang | **1.03125** |
| 2000×994 | **2.03125** | 1300×650 | 65% | **2.03125** |
| 1920×1080 | **1.95** | 1248×624 | 65% | **1.95** |

Wheel: `next=zoom*(1−clamp(dy,−100,100)*0.001)`, mỗi sự kiện tối đa ±10%, không floor. Pinch: `next=startZoom*sqrt(nowDistanceSq/startDistanceSq)`, neo theo world dưới midpoint lúc bắt đầu và midpoint hiện tại (kể cả midpoint dịch khi zoom chạm giới hạn). Distance 0/NaN bỏ qua. Clamp [overviewZoom,3]. Zoom tới min không tự reset tâm; không thêm nút/HUD hay hành động reset mới cho người chơi. Camera về tổng quan chỉ ở các chỗ đã có: mở ván, resize khi đang ở tổng quan và chuyển pha từ overview cũ sang overview pha mới theo luật dưới đây. Giữ điểm neo khi chưa chạm clamp pan; tại biên ưu tiên biên và chấp nhận lệch neo. Resize tổng quan tính lại min; zoom khác giữ tâm và clamp zoom nếu min mới cao hơn.

`CENTRE_BOUNDS` vẫn giữ tâm phía nam vách; không dùng việc cấm pan để che vùng X. Camera bounds có đủ vùng cổng; nền phải phủ toàn viewport hợp lệ. Mọi frame ease planning→battle đi qua `applyView` và phát `realm:view`, tránh HUD dùng view cũ như đường tween trực tiếp hiện nay. Giữ camera người dùng nếu đang zoom/pan thủ công; chỉ chuyển overview cũ tới overview pha mới. Zoom không vào RunState/save.

Ngoại lệ được chủ dự án chốt thay integer zoom **chỉ cho camera thế giới**. Giữ `pixelArt:true`, nearest, no AA/blur; world/logic float giữ nguyên. Snap vị trí chân renderer ở bước cuối; snap dịch camera trong screen space về pixel màn hình, không round scroll world độc lập gây bước nhảy z px. Hàm `snapView` lượng tử translation `t=(1−z)*screen/2−z*scroll` về số nguyên rồi giải lại scroll; HUD nhận đúng view đã áp. Pan tích luỹ ở view float chưa snap để delta nhỏ không mất; chỉ snap bản render, không feed ngược để tích sai. Nearest ở zoom lẻ có nhịp pixel rộng/hẹp không đều là đánh đổi chấp nhận, không hứa pixel nguyên hoàn hảo; kiểm không rung khi camera đứng yên và pan không có drift. Input inverse dùng view hiển thị, không inverse hai lần, không round world trước `unproject`.

## 5. Q4 — Cỏ liền, sân thoáng, sân nhà lính

`FieldRenderer` hiện dùng TileSprite cỏ thẳng dưới field đã `squareToIso`; `IsoWallRenderer` còn phủ polygon grassDark lên hậu cảnh (cả art và fallback). Cần dùng cùng phép lấy mẫu cỏ theo world và cùng phase tile cho sân/tràn sân, không chỉ đổi màu nền. Mở rộng cỏ ra miền world x,y=[−4096,4864], sinh theo chunk chỉ khi cần và tái dùng; phủ mọi góc viewport tại min/pan hợp lệ. Cỏ không tạo texture đơn khổng lồ; mỗi chunk art tối đa 1024×1024, cũng không làm atlas vượt 4096. Không đổi river/pond thành collision. Giữ texture nước/cát seamless từ `GROUND_TEXTURE_FILES`.

`FIELD_DECOR.combatClear={x0:256,x1:512,y0:544,y1:832}`: vùng giữa nam bàn và cổng, không có **bất kỳ footprint** decor nào chạm (kể cả cây bên ngoài có bán kính chạm vào). `portalClear={x0:328,x1:440,y0:736,y1:848}` giữ trống hình cổng và chỗ quân tỏa. Low decor chỉ dải rìa sân: x≤192 hoặc x≥576, không lấn board/road/water, giảm count 26→12 (attempts 600 giữ). Thực hiện exclusion bằng footprint radius, không chỉ tâm; scene cỏ không tính decor. Sông/hồ giữ nguyên ở Q4, nếu ảnh kiểm còn che quân do nước thì ghi nhận, không tự đổi luật.

Bỏ graphics/draw deploy patches trong `BoardRenderer` và tài nguyên phụ thuộc chỉ dùng để vẽ nó. Giữ nguyên `DEPLOY_BOX={−24,+24,+18,+30}`, `deploymentPosition`, homeX/Y, spawn/respawn, màu built stone paving của mọi nhà. Không xoá box khỏi data vì bỏ dải nâu.

## 6. Q5 — Rừng mới và art cổng

Hậu cảnh là vùng bắc world y<176; nền cỏ chung, không polygon phẳng grassDark che lên. Thêm layer nền rừng sau tường: chân cây ở mặt plateau hiển thị (chiếu rồi nâng y theo chiều cao vách tại vị trí), clipping về phía sau đỉnh vách; không đưa cao độ này vào mô phỏng. Giữ tường đè chân rừng, rừng không đè nhà/quân phía trước. Dùng `pixelHash`, salt riêng 6811, asset sort id, không run RNG. Miền rừng x=[−2048,2816], y=[−3072,152], lưới 64, jitter tối đa 16, tỷ lệ ô có vật 0.72 (trong số đó 90% thông, 10% đá), cull theo viewport/chunk; gần đỉnh vách chừa 24 world px: sau jitter loại điểm có `y+radius>152`, không chỉ kiểm tâm trước jitter. Đây là mật độ kỹ thuật để có rừng dày, không rải thêm vào combatClear. Không bắt buộc thêm tường đá; vách hiện có đủ ranh giới.

Bộ tối thiểu mới: `forest_pine_a`, `forest_pine_b`, `forest_rock`, `enemy_portal`. Một mẫu thông và một mẫu cổng, duyệt **riêng từng loại** rồi mới sản xuất biến thể thông/đá và hoàn thiện cổng. Chưa có duyệt giữ code cổng, không nối art chưa duyệt. Mỗi lần tạo ảnh đọc ART_STYLE Quy tắc vẽ/Góc nhìn isometric/Hiển thị/Texture mặt đất; prompt tự bảo Codex đọc tài liệu; đính `harvester-house-front-approved.png` (style) + `iso-building-approved.png`/`iso-plot-open-approved.png` phù hợp và mẫu cùng loại sau khi có. Không dùng góc chính diện của nhà Thợ Gặt làm góc rừng/cổng.

Thêm mode `polish-samples` và `polish-forest` vào `make_prompts.py`, lấy nguyên khối prompt iso của ART_STYLE, test qua `tools/test_art_prompts.py`. Mỗi mode sample chỉ sinh đúng asset chỉ định, không runner cả bộ. Log prompt, refs, nguồn, bản native, quyết định duyệt dưới `docs/art-review/iso-board/polish/`; cutter kế thừa kỹ thuật từ `make_assets.py`, `wilds/make_wilds.py`, texture giữ pipeline `terrain/make_textures.py`. Không tái sinh texture nếu không cần.

Asset đã duyệt/kiểm alpha, size, anchor rồi đăng ký manifest/CREDITS **trước runtime**: cây/đá category `doodad`, cổng cảnh không công trình gameplay cũng `doodad`, origin custom, projection iso_2_1, anchor feet, native/final theo metadata thực. Frame `doodad_forest_pine_a`, `doodad_forest_pine_b`, `doodad_forest_rock`, `doodad_enemy_portal` trong atlas `sprites`; dùng frame name. Không dồn cổng vào DECOR random. Cây mới dùng hậu cảnh, bộ DECOR_APPROVED hiện tại vẫn dùng rìa sân, không mặc nhiên duyệt asset mới qua `map(catalog)`.

## 7. Bảng thay đổi và ràng buộc

| Hằng/quy tắc | Cũ → mới |
|---|---|
| Camera | 1/2/3 nguyên → [min theo §4,3] liên tục; ZOOM_MAX 3→3 |
| Pinch | 1.25/0.8 thành ±1 bậc → tỉ lệ khoảng cách; wheel ±1 → tối đa ±10%/event |
| Aggro | 96/192 → **giữ số**, chỉ dùng cho fallback công trình |
| S spawn | ngang 0.6×768, spacing20, y792+row20 → miệng cổng §3; legacy hằng giữ cho N/E/W |
| Low decor | 26→12; thêm combatClear/portalClear §5 |
| Mobile nút y | 508→530; PLANNING_ZOOM 1→33/32 |
| Save | RunState v5→v5, envelope1→1; không migration vì không đổi state |

Giữ phân lớp game/data/core không Phaser/render/ui/scenes/platform/audio, data không game; mọi gameplay number ở data. Trận không Rng, không hàm thời gian/ngẫu nhiên/lượng giác/pow bị cấm; sort id, tick10/s, không để Map/Set chọn kết quả. Mô phỏng vuông, chiếu tại render/input. Sprite feet (0.5,1), y-sort theo chân, không rotate, alpha cạnh0/255, bóng riêng128 có khai báo; atlas sprites ≤4096/cạnh. HUD không zoom, FONT_UI, createPanel/createButton, mục tiêu chạm≥44. Reload giữa trận dựng từ0; save chỉ sau command thành công ngoài trận và vào/ra trận, không mỗi tick/speed/intervene/zoom/pan. Chỉ bump save khi state thật đổi, có migrator+fixture. Git không push main/develop, không tự merge.

## 8. Nghiệm thu, đo và rủi ro

Giữ thứ tự Q1→Q2→Q3→Q4→Q5 để tách tác động targeting và spawn trước khi đổi hình. Cuối mỗi Q chạy lint/typecheck/test/build và browser 1280×720,375×812,2000×994 (thêm1920×1080 kiểm fit). Q1/Q2 ghi trace/hash thực trước–sau từng pha, benchmark ms/tick cùng máy/cấu hình, fullRun random/scripted cùng 3 vua×100 seed với RULES_FULL: win rate, năm kết thúc trung bình, HP Ngai kết trận, boss kills, ticks/capped. Không dùng số lịch sử HANDOFF làm baseline hiện tại, không điền kết quả trước chạy. Hash thay chỉ khi giải thích được tick lệch đầu; không tăng ngưỡng benchmark 2ms để che regression.

Rủi ro lớn: tụ quân tại cổng tăng va chạm/CPU và splash; ưu tiên toàn sân tăng thời gian đuổi lính, giảm công dụng siege; hoãn mud và ưu tiên lính ở bước nhảy chain đổi độ khó boss, còn splash/cleave/cone giữ sát thương kèm lên nhà như cũ; zoom lẻ làm pixel không đều; fit bàn lớn che panel; plateau che sai tường; chunk gây seam hoặc leak sau restart. Các rủi ro này phải có test/ảnh thật trong plan. Nếu số đo xấu, báo chủ dự án và đề xuất riêng, không tự chỉnh cân bằng. Không coi bản Q5 hoàn thành khi art còn chờ duyệt.

## Câu hỏi mở

Không có quyết định gameplay/bố cục nào còn bỏ ngỏ. Hình mẫu cổng và rừng cần duyệt ở gate Q5; đó là duyệt sản phẩm cụ thể, không mở lại bảy quyết định đã chốt. Số đo hash/benchmark/cân bằng và metadata native cuối cùng chỉ được điền sau thực thi/duyệt thực tế.
