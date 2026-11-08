# Bàn giao — bàn cờ isometric (cập nhật 07/11/2026)

Nhánh `iso-board-redesign`, PR #13 vào `develop` (chưa merge). Spec `docs/superpowers/specs/2026-11-06-iso-board-redesign-design.md`, plan `docs/superpowers/plans/2026-11-06-iso-board-redesign.md` (P1–P4 đã làm). Phần bàn giao 29/10 bên dưới vẫn đúng cho những gì không nói lại ở đây, trừ các số bàn cờ cũ (ô 32, sân 384, Ngai ở ô 12).

## Đã xong theo pha
- **P1 luật:** Ngai ở ô 2, save 4 → 5 (migrator hoán vị nhà 12↔2, save 3 chạy 3→4→5); ô 64 px, sân 768, tốc độ và đạn ×2 để giữ số ô/tick; khu tập kết trước cửa (`DEPLOY_BOX`); chỉ lính mình đi xuyên nhà mình; tầm công trình +50%; một con đường phía nam.
- **P2 camera:** zoom nguyên 1–3× (bánh xe, chụm hai ngón), kéo để pan; HUD nhận camera qua sự kiện `realm:view`.
- **P3 isometric:** chiếu 2:1 lật gương (địch vào từ bên phải màn hình), mọi input qua `unproject`; bộ art isometric Lúa Mì đã duyệt (8 công trình, ô mở/đã xây/khoá/Ngai, vách núi) trong `public/assets/art/ai-v1/iso/`. Nhà giữa ô, cửa bên phải, lính đứng trước cửa, ô đã xây lát đá.
- **P4 cảnh:** sông từ mép tây xuống mép nam và một hồ ở góc đông, bờ cát liền một dải; nước và cát có texture liền mạch (`iso/terrain/`); 15 vật hoang dã đã duyệt (`iso/wilds/`), rải theo seed riêng, không dùng RNG của ván, không vào trận.

## Bằng chứng nghiệm thu (07/11/2026)
- Cổng `npm run lint && npm run typecheck && npm test && npm run build`: xanh (158 file, 1992 test); `python tools/test_art_prompts.py`: 41 test pass.
- Benchmark `stepBattle`: 0,364 ms/tick (chuẩn), 0,461 ms/tick (G2); test determinism (hash mọi tick, boss năm 10/20/30, sáu vua) đều pass.
- Trình duyệt (dev server): 1280×720 — khởi động lại ván 3 lần (texture sân cũ được dọn, chỉ còn sân của ván hiện tại), zoom 2× rồi pan ra 4 mép, đặt Đội Thợ Gặt rồi vào trận: địch vào từ bên phải theo con đường, đi qua vùng có trang trí; 375×812 — bàn, HUD và tay bài hiển thị đúng. Không có lỗi console.

## Đợt hoàn thiện 08/11 (plan `docs/superpowers/plans/2026-11-08-iso-board-polish.md`)
- **Q1 xong phần code (08/11):** địch (cả boss, quân công thành) đánh hết lính phe mình nó đánh được rồi mới nhắm công trình/Ngai; giữ Khiêu khích và Cuồng Nộ. Chain của địch và Ném Bùn theo cùng luật; splash/cleave/cone vẫn trúng nhà như cũ. Số đo trước–sau: `docs/art-review/iso-board/polish/logic-report.md`.
- **Q1 kiểm trình duyệt (09/11):** trận thường seed 4: còn lính thì mọi địch nhắm lính, lính chết hết (tick 341) mới chuyển sang nhà; không lỗi console. Trận boss chỉ kiểm bằng test (`bogOgre.test.ts`, `targeting.test.ts`).
- **Q2 xong (09/11):** cổng dịch chuyển `ENEMY_PORTAL` (384, 792) ở cuối con đường; mọi quân địch mép nam (đợt, raiders, boss) ra từ đội hình 5×5 trước miệng cổng (`portalPositions`), boss ở tâm cổng; triệu hồi giữ chỗ sinh cũ. Cổng vẽ tạm bằng code (`portalArt.ts`, `EnemyPortalRenderer`) cho tới khi art được duyệt (Q5). Ngắm Can Thiệp được tới cổng (y ≤ 832). Đường vẽ dừng ở mép sân 768; cổng che đoạn tới 792 (Q4 nối tiếp). Trên điện thoại cổng nằm ngoài khung ở zoom hiện tại, phải kéo bản đồ (Q3 làm lại camera). Số đo: `logic-report.md`.
- **Q3 xong (09/11):** zoom tự do từ mức tổng quan (`overviewZoom`: bàn 65% chiều ngang desktop, ví dụ 1,29375 ở 1280×720 lập kế hoạch, 1,3 trong trận, 2,03125 ở 2000×994; 33/32 trên điện thoại) tới 3×; lăn chuột ±10%/nấc, chụm hai ngón theo tỉ lệ, kéo bản đồ ở mọi mức; camera vẽ qua `snapView` (dịch về pixel nguyên). Góc người chơi tự chỉnh được giữ qua đặt thẻ/mua ô/vào trận; nếu đang ở tổng quan thì trượt sang tổng quan pha mới. Ở 1280 px hai cột trinh sát/sắc lệnh thành nút (bàn to hơn); hộp gợi ý cách chơi nằm ở góc trống trên-trái của bàn. Luật zoom nguyên trong CLAUDE.md/AGENTS.md/ART_STYLE đã sửa theo quyết định 08/11. Kiểm trình duyệt 1280×720 và 375×812, không lỗi console; chưa thử cảm ứng thật.
- **Q4 xong (09/11):** nền cỏ quanh sân là một ô cỏ isometric lặp tuần hoàn (`groundArt.ts`) từ cùng ảnh cỏ và cùng lưới 16 px với sân, nên không thấy đường nối ở mép sân; bỏ mảng xanh đậm phẳng sau vách núi (giờ là cỏ, chờ rừng Q5). Vùng chiến trường `combatClear` và quanh cổng `portalClear` không có vật trang trí; vật thấp chỉ ở hai rìa sân (x ≤ 192 hoặc ≥ 576), tối đa 12. Bỏ dải đất nâu trước nhà lính (luật khu tập kết giữ nguyên). Đường nối từ mép sân 768 tới chân cổng (`paintRoadTail`). Khác plan: không dùng chunk lớn mà dùng một TileSprite tuần hoàn (nhẹ bộ nhớ, cùng kết quả).
- **Q5 (09/11):** chủ dự án duyệt mẫu cổng và cây thông v2 ("Duyệt cả hai"); đã publish `iso/polish/enemy_portal.png` + `forest_pine_a.png`, đăng ký manifest + CREDITS, bật `PORTAL_APPROVED` và `FOREST_APPROVED = ['forest_pine_a']` (cổng code vẫn là dự phòng khi PNG không tải). `forest_pine_b` và `forest_rock` vẽ bằng `make_prompts.py polish-forest-set` (đính kèm cây thông đã duyệt), chủ dự án duyệt 09/11, đã publish, đăng ký và bật (`FOREST_APPROVED` đủ ba vật). Q1–Q5 xong; còn chờ chủ dự án merge PR #13.
- **Lỗi bot có sẵn:** bot random/scripted có thể chơi Giao Ước Nguyệt Thực khi còn 1 mạng (lệnh bị từ chối `lastLife`); bộ đo ghi các ván đó là crashed.

## Còn lại / ghi nhận
- Đã sửa 08/11: pan về góc tây bắc từng lộ một vùng xanh đậm trống phía trên vách núi. Nay tâm màn hình luôn nằm trên sân, phía nam vách núi (`clampView`, `CENTRE_BOUNDS`); bốn góc trống của hình chữ nhật bao bản đồ không còn tới được.
- Lính vẫn vẽ nhìn thẳng (chưa có art isometric); các vua khác ngoài Lúa Mì dùng ô chung được nắn thành hình thoi và art cũ.
- Bộ art Lúa Mì góc 45° cũ không còn dùng nhưng vẫn nằm trong repo.
- Lỗi đổi kích thước NineSlice trong `theme.ts` (ghi từ 06/11) chưa sửa, ngoài phạm vi PR này.
- Trên điện thoại ở zoom 1, hai góc trái/phải của bàn nằm ngoài màn hình (bàn rộng 640 px); người chơi kéo để xem (sửa sau review 07/11: kéo-pan chạy cả ở zoom 1, và mua ô/đổi bài/bỏ bài không còn đưa camera về chỗ cũ).

# Bàn giao phiên làm việc — art, cảnh 45° và giao diện mới (cập nhật 29/10/2026)

Nhánh `g3e-ux-and-art`, PR #12 vào `develop` (chưa merge). Đọc theo thứ tự: `CLAUDE.md` → `docs/ART_STYLE.md` (**mục "Góc nhìn" là khung BẮT BUỘC cho mọi lần tạo ảnh**) → tài liệu này.

## Đã xong
- **Logic (T1–T4, commit `4448090`…`2f6d0cb`):** địch và boss chỉ xuất từ mép S, hàng dàn quân thay cho cờ `extraEdge`, tường núi chặn mọi đơn vị phía bắc `BATTLE.wallY` (88), save cũ có mép N/E/W đổi thành S khi giải mã. Đo cân bằng 600 ca: scripted thắng 12,3% (trước 0,3%), vượt ngưỡng plan nhưng **người dùng đã chấp nhận**; báo cáo ở `docs/art-review/oblique-wall/logic-report.md`.
- **Tường núi vào game:** `src/render/{MountainWallRenderer,mountainWallAssets,mountainWallModel,mountainWallArt}.ts`, 32 ảnh trong `public/assets/art/ai-v1/mountain-wall/`, catalog `docs/art-review/oblique-wall/catalog.json`, công cụ `tools/slice_mountain_wall.py`. Còn lại: click tay chưa nhắm được hàng địch sâu phía nam (`screenToWorld` trả null khi y > 384).
- **Trang quản trị asset:** `npm run admin` → http://localhost:5180/admin (có danh sách 733 mục chưa có từ `tools/asset-admin/planned.json`, sinh bằng `tools/build_planned_assets.py`).
- **Phong cách ảnh đã chốt:** Stardew 2.5D, camera nhìn xuống **45°**, mái và mặt tiền cao ngang nhau, không thấy tường bên, tháp/cối xay phải thấy nóc; mẫu đã duyệt `docs/art-review/style-references/harvester-house-front-approved.png`.

## Giao diện làm lại (plan `docs/superpowers/plans/2026-10-28-ui-redesign.md`, đã duyệt từng task)
Spec: `docs/superpowers/specs/2026-10-28-king-select-redesign-design.md`. Đã xong và đã push:
- **D thẻ dọc dùng chung:** `ui/cards/{cardLayout,cardImage,CardView}.ts`; tranh thẻ ngang 32×24 vẫn là art tạm (`VERTICAL_CARD_ART` rỗng). Kích thước: tay 120×176 (PC) / 108×162, kho và trợ giúp 96×144, hội đồng 100×150.
- **E màu theo vua:** `KING_THEMES` + `LOCKED_THEME` (`data/uiPalette.ts`), frame `panel/button*/card*/bar@<vua>` trong texture `ui`, `skinFrame`, `createPanel/createButton/CardView` nhận skin.
- **A chọn vua:** carousel + chi tiết (`ui/kingSelect/*`, `scenes/KingSelectScene.ts`), phím ←/→, thẻ kiểu bài tây (`render/kingCardArt.ts`), 9 chân dung native 96×144 (bản A, `public/assets/art/ai-v1/portraits/`, `tools/prepare_king_portraits.py`), Đặc quyền vô hiệu hóa, độ khó một mức, **không có thanh Cấp**.
- **C phần thưởng:** `RewardModal` mới (tiêu đề theo loại, thẻ dọc, "ĐỔI THƯỞNG — Sắp có" vô hiệu hóa — Q1), nền tối 75%, Nhận gửi đúng một `pickOffer`.
- **B HUD:** lập kế hoạch (dải lịch giữa + nhãn năm, hai hàng trạng thái) và trận (`HealthBarView`, máu Ngai trái dưới, **tổng máu quân địch đang hiện diện phải dưới — Q2**, tốc độ phải trên, phím L mở lịch trong trận).
- **F đồng bộ:** modal lịch/kho/hội đồng/nhiệm vụ, màn kết thúc ván, HUD lập kế hoạch đổi màu theo vua; ô chọn hội đồng 44 px; chữ nhiệm vụ dài tự thu nhỏ. Menu chính và Trợ giúp để trung tính.

### Bằng chứng nghiệm thu (29/10/2026)
- Cổng `npm run lint && npm run typecheck && npm test && npm run build`: xanh (149 file, 1918 test); `python -m unittest discover -s tools -p "test_*.py"` trong `tools/`: 39 test pass.
- Trình duyệt (dev server, 1280×720 và 375×812): chuỗi thật không dựng trạng thái giả — chọn vua Đá bằng phím (→, Enter, Enter) → ván mới đúng `{seed, kingId}` → đặt thẻ → Ra trận ×3 → thắng → bảng tổng kết (đã hạ 5, +3 vàng) → Tiếp tục → màn phần thưởng thật "CHIẾN THẮNG / CHỌN PHẦN THƯỞNG" → chọn thẻ bằng chuột thật, bấm Nhận hai lần → năm 2, bộ bài chỉ tăng đúng 1 thẻ. Không có lỗi console. Ảnh chụp: `.superpowers/` (git-ignored).
- Đã sửa trong lúc nghiệm thu: ba nút Bán/Đổi/Bộ bài mất skin khi đổi bố cục (được dựng lại); nay `createActionButtons` truyền skin.

### Chưa kiểm hoặc còn lại (ghi trung thực)
- Chưa chạy bằng tay: trận boss (thanh boss chỉ kiểm bằng test bố cục), Can Thiệp thả đá thật, mở Trợ giúp giữa trận rồi khôi phục tốc độ, xem thông tin quân đã chết, hội đồng và nhiệm vụ với skin mới, màn kết thúc ván với skin, reload giữa chừng (planning/battle/phần thưởng), nhấn giữ 400 ms và vuốt bằng cảm ứng thật, thiếu một PNG chân dung (đã kiểm: rơi về chân dung vuông tạm).
- Bảng trinh sát, thông báo nhiệm vụ và ô lịch trong HUD vẫn màu kem (tự dựng khung riêng).
- Thanh nối giữa ô lịch rất mảnh (khe 4 px trên PC).
- Lỗi sẵn có (không phải regression): click tay chưa nhắm được hàng địch sâu phía nam (`screenToWorld` trả null khi y > 384).
- Art tạm còn lại: tranh thẻ ngang 32×24 trong khung thẻ dọc (94 tranh thẻ dọc là dự án art riêng); khi vẽ xong chỉ thêm vào `VERTICAL_CARD_ART`.
- Nhóm F tối thiểu đã làm xong; mức đồng bộ sâu hơn (trinh sát, quest notice, Trợ giúp theo vua) chưa làm.

## Tư thế lính Lúa Mì (05–06/11/2026, đã duyệt và đã vào game)
- **Dân quân, thợ gặt, nông binh** có đủ 6 tư thế (đứng ×2, đi ×2, đánh ×2), phe ta và phe địch. Đi và đánh quay ¾ sang phải; game lật ngang khi sang trái.
- Quy trình: `python docs/art-review/g3e/units/make_prompts.py --poses <lính>` → `bash .superpowers/up.sh` (Codex vẽ một bảng 3×2, đính kèm ảnh tham chiếu + mẫu đứng của chính lính đó) → `python docs/art-review/g3e/units/make_poses.py --export <lính>` (bản 4 px/đơn vị để duyệt trong `<lính>/poses/`, bản 2 px/đơn vị có viền 1 px vẽ lại vào `public/assets/art/ai-v1/`).
- Thợ gặt thu nhỏ cùng mật độ với dân quân (chủ dự án chọn 06/11) — `FACTOR_OVERRIDE` trong `make_poses.py`.
- `IMAGE_UNITS` (`src/render/imageArt.ts`): `militia`, `reaper`, `peasant`, `footman`. Bộ `spearman_*` cũ không còn được nạp (file và mục manifest vẫn giữ).
- Đã kiểm trong trình duyệt (1280×720, trận thật năm 1, phóng camera để xem pixel): dân quân phe ta đi/đánh đúng khung, scale 0,5, neo chân; thợ gặt và nông binh chỉ kiểm bằng sprite gỡ lỗi từ atlas vì trận năm 1 không có chúng. Không lỗi console.
- Còn lại: ở mật độ 2 px/đơn vị mặt lính hơi nhòe so với bản duyệt 4 px; lính sinh bằng code (cướp, yêu tinh…) vẫn lệch phong cách bên cạnh lính ảnh.

## Lính vua Đá (06/11/2026, đã duyệt và đã vào game)
- **Người Đá, Thợ Mỏ, Đá Vụn, Lính Ném Đá**: mẫu đứng → 6 tư thế → vào `IMAGE_UNITS`. Mọi việc làm trên nhánh duy nhất `g3e-ux-and-art` (chủ dự án yêu cầu: không nhánh phụ, không PR khác).
- Lính mới (sau bộ Lúa Mì) có chiều cao trong game `HEIGHT` trong `make_prompts.py` (so với dân quân 51 px: Người Đá 76, Thợ Mỏ 58, Lính Ném Đá 50, Đá Vụn 34); prompt mẫu đứng đính kèm mẫu dân quân đã duyệt (`UNIT_REFERENCE`); bảng tư thế vẽ theo khối pixel vừa chiều cao đó. Xem mẫu đứng đúng cỡ: `make_poses.py --sample <lính...>`.
- Đổi màu phe địch bắt cả xanh ngọc sáng (chữ khắc phát sáng của Người Đá).
- Đã kiểm trong trình duyệt (vua Đá, trận thật năm 1): Người Đá phe ta đi đúng khung, scale 0,5; Thợ Mỏ, Đá Vụn, Lính Ném Đá (ta/địch) kiểm bằng sprite gỡ lỗi từ atlas. Không lỗi console.
- Ghi chú: Đá Vụn trông như Người Đá thu nhỏ (chủ dự án đã duyệt); Codex vẽ Đá Vụn to hơn yêu cầu nên thu nhỏ nhiều hơn (1/12,5), hơi mất chi tiết.

## Đang chờ người dùng duyệt (chưa vào game, chưa đăng ký)
- **Tranh thẻ dọc (94 thẻ):** chủ dự án chốt cỡ native **96×72** (4:3, 29/10/2026). Công cụ `docs/art-review/g3e/cards/make_prompts.py` (danh mục `cards.json` từ registry; thẻ công trình dùng nguyên khối mẫu của `ART_STYLE.md`; `VISUAL` cho gợi ý hình ảnh từng thẻ), cổng `tools/test_art_prompts.py`. Đang thử 2 mẫu Lúa Mì (`wheat_scarecrow`, `wheat_harvest_festival`); mục "Tranh thẻ" của `ART_STYLE.md` chỉ thêm khi chủ dự án duyệt phong cách. **Khi nối vào game:** tranh 96×72 vừa thẻ ≥ 100 px rộng ở scale 1, nhưng vùng tranh của thẻ nhỏ (84–96 px, lưới 3×3 và kho bài) chỉ rộng 76–88 px: phải chỉnh `cardLayout`/`fitArt` hoặc cỡ thẻ trước khi thêm vào `VERTICAL_CARD_ART`.
- Công trình Lúa Mì thử: Kho Thóc, Cối Xay Gió (`docs/art-review/g3e/buildings/wheat/`). Các bản bị loại nằm trong `_rejected_*` và `_superseded_*`.
- Chân dung 9 vua đã duyệt và đã vào game (xem trên); mẫu vuông cũ ở `_rejected_square/`, bản Lúa Mì dùng rơm ở `_rejected_wheat_straw/`. Phong cách ở `ART_STYLE.md` mục "Chân dung vua".

## Phạm vi PR #12 từ 06/11/2026: TRỌN BỘ asset vua Lúa Mì
Chủ dự án đổi kế hoạch (06/11/2026): PR #12 (`g3e-ux-and-art`, nhánh duy nhất) phải có **toàn bộ asset P0 của vua Lúa Mì** đã duyệt và đã nối vào game. Các vua khác làm sau (lính vua Đá đã làm xong trước khi đổi kế hoạch, giữ nguyên). Danh sách đối chiếu `tools/asset-admin/planned.json` (49 mục có "wheat") với những gì đã có.

| Nhóm | Asset | Trạng thái |
|---|---|---|
| Chân dung | Vua Lúa Mì | ✅ đã duyệt, đã vào game |
| Màu giao diện | `KING_THEMES.wheat` (khung, nút, thẻ, thanh) | ✅ đã vào game |
| Tường núi | đoạn tường + biển theo vua | ✅ đã vào game |
| Lính | Dân Quân, Thợ Gặt, Nông Binh × 6 tư thế × 2 phe | ✅ đã duyệt, đã vào game |
| Tranh thẻ (96×72) | 10 thẻ: Ngai, Ruộng Lúa, Bùa Phân Bón, Cối Xay Gió, Lễ Hội Mùa Màng, Kho Thóc, Khởi Nghĩa Nông Dân, Dân Quân, Đội Thợ Gặt, Bù Nhìn Gác | ✅ đã vào game 06/11: `docs/art-review/g3e/cards/make_assets.py wheat` thu về 96×72 và bản 48×36 (`public/assets/art/ai-v1/cards/`); `VERTICAL_CARD_ART` + `pickCardImage` chọn bản lớn nhất vừa ô tranh ở scale 1 (tay bài 96×72, kho bài/lưới nhỏ 48×36), không co giãn lẻ. Kiểm trình duyệt: tay bài 3 thẻ 96×72, kho bài 7 thẻ 48×36. Lưu ý: tranh thẻ vẽ trước bộ công trình 06/11 nên vài công trình khác màu mái so với trên bàn cờ (Cối Xay Gió, Kho Thóc) |
| Ô bàn cờ | ô khoá / ô mở / bệ Ngai skin Lúa Mì (`public/assets/art/ai-v1/plots/wheat_*.png`) | ✅ đã vào game 06/11: `IMAGE_PLOTS` + `kingPlotFrame` (vua chưa có skin giữ ô chung). Kiểm trình duyệt: bàn cờ Lúa Mì 16 ô khoá, 8 ô mở, 1 bệ Ngai skin mới ở scale 0,5; vua Đá vẫn ô chung |
| Công trình (64 px, góc 45°) | Ruộng Lúa, Kho Thóc, Cối Xay Gió, Khởi Nghĩa Nông Dân, Dân Quân (nhà), Đội Thợ Gặt, Bù Nhìn Gác, Ngai Bó Lúa | ✅ đã duyệt 06/11, đã vào game (`IMAGE_BUILDINGS`; Kho Thóc và Cối Xay Gió vẽ lại, bản cũ ở `buildings/wheat/_rejected_2026-11-06/`; `cottage` cũ không còn được nạp). Kiểm trình duyệt: Ruộng Lúa và Ngai trong ván thật, 6 cái kia bằng sprite gỡ lỗi trên bàn cờ |
| Biểu tượng | Huy hiệu Vua Lúa Mì (`icon_king_wheat`) | ✅ đã vào game 06/11: khiên + bó lúa, 32 px và 16 px (`docs/art-review/g3e/icons/make_assets.py`), thay ô màu của vua Lúa Mì trên lịch (dải lịch và bảng lịch, cả năm Liên Quân) qua `src/ui/realm/kingBadge.ts`; vua khác giữ ô màu. Chỉ hiện khi vua Lúa Mì là địch (người chơi vua khác). **Chưa xem bằng trình duyệt** (cửa sổ ứng dụng không hiển thị nên vòng game không chạy); kiểm bằng test + typecheck, ảnh thiếu thì rơi về ô màu |

Ngoài P0 (P2, không bắt buộc cho PR này): kiến trúc cấp 2/3 và hoạt ảnh của 7 công trình + Ngai, hoạt ảnh mở rộng của 3 lính, trang trí Xe Lúa (`wild_wheat_cart`). Dùng chung mọi vua, đã duyệt nhưng chưa nối: nền đất 27 ô, 15 vật hoang dã.

**Vua Lúa Mì đã đủ asset P0 (06/11/2026).** Việc tiếp theo (PR sau): vua Đá (công trình, tranh thẻ, ô bàn cờ — lính đã xong), vua Phép Thuật, lính trung lập và Thổ Phỉ (lệch phong cách rõ nhất trong mọi ván), nối nền đất và vật hoang dã chung, biểu tượng UI chung (12 mẫu chờ duyệt).

Lỗi sẵn có phát hiện 06/11 (không do thay đổi art): dừng `MainMenu` rồi đổi cỡ cửa sổ → `Uncaught TypeError: Cannot read properties of undefined (reading 'resize')` từ listener `scale.on('resize')` trong `src/ui/theme.ts` (khoảng dòng 322) trên một NineSlice đã bị huỷ.

Công cụ công trình: `python docs/art-review/g3e/buildings/make_prompts.py wheat [id ...]`, rồi `python docs/art-review/g3e/buildings/make_assets.py wheat` (tách nền, thu nhỏ 64 px, bảng duyệt `wheat/sheet.png`).

Việc G3e khác (giữ nguyên): biểu tượng UI chung (12 mẫu chờ duyệt), tranh thẻ 5 vua khác, kiểm cảm ứng thật trên mobile.

## Quy tắc đã thống nhất với người dùng
- Duyệt từng nhóm nhỏ; thử một mẫu trước khi vẽ cả nhóm; mọi prompt lấy từ `docs/ART_STYLE.md` kèm ảnh tham chiếu (`tools/test_art_prompts.py` chặn khi thiếu).
- Chưa nối ảnh mới vào `src` khi người dùng chưa duyệt; ảnh bị loại cất vào thư mục `_rejected_*`.
- PR chỉ vào `develop`; không đụng `.agents/` và `AGENTS.md`; Codex không chạy được node nên phải tự kiểm lại kết quả của nó.

## Bàn cờ isometric — cổng mẫu P3 (06/11/2026)

PR #13 (nhánh `iso-board-redesign`) đã xong P1 (ô 64 px, Ngai hàng sau, khu tập kết, một đường) và P2 (zoom 1×–3×, kéo bản đồ). Với P3:

- ART_STYLE có thêm mục "Isometric (trục đo 2.5D) cho sprite thế giới" và khối "Prompt isometric dùng lại". Tranh thẻ vẫn theo khối chính diện 45°.
- Ba mẫu ở `docs/art-review/iso-board/` (nhà Thợ Gặt bản 3, ô trống bản 2, ô lát đá bản 2) **đã được chủ dự án duyệt ngày 06/11/2026** và đã chép vào `style-references/`. Bước tiếp theo là phép chiếu và renderer isometric (Task 9–10), rồi vẽ lại bộ Lúa Mì (Task 11).

### Phép chiếu và vẽ isometric (Task 9–10, 06/11/2026)

- `src/core/iso.ts` là phép chiếu duy nhất: ô 64 px hiện thành thoi 128×64 ở zoom 1, đúng tỉ lệ chủ dự án chọn. Mô phỏng trận không đổi.
- Camera và bố cục làm việc trong không gian đã chiếu. Mọi thao tác chuyển từ màn hình về thế giới (thả thẻ, bấm, ngắm đá) đều qua `unproject`.
- **Đã chuyển sang isometric:** nền sân (`squareToIso`, lấy mẫu điểm gần nhất), ô đất, ô sáng khi chọn, dải tập kết lính, nhà, lính, đạn, hiệu ứng, vòng tầm (elip) và mũi tên con đường.
- **Đang dùng bản tạm:**
  - Tường núi vẽ bằng code (`IsoWallRenderer`) cho tới khi có art tường isometric.
  - Ô đất và nhà vẫn là art vuông/chính diện cũ, được biến hình hoặc dựng thẳng. Bộ art Lúa Mì isometric là Task 11.
  - Ô đã xây (sân lát đá) chưa có trong game, chờ art ở Task 11.
- **Đã kiểm trong trình duyệt** (cửa sổ phiên đang ẩn nên phải tự đẩy vòng lặp game): ở 1024×768 bàn thoi, ngai ở hàng sau, con đường đi từ góc dưới trái, trận chạy đúng, console không lỗi. Ở 375×812 bàn rộng hơn màn hình nên kéo được.

### Bộ Lúa Mì isometric trong game (Task 11, 06/11/2026)

- **Đã duyệt (chủ dự án):** 7 công trình mới, ô khoá, ô Ngai, cùng mẫu tường (độ dốc sửa lúc sản xuất). Nguồn và ghi chú ở `docs/art-review/iso-board/wheat/`.
- **Cắt sprite:** `docs/art-review/iso-board/make_assets.py` ghi ra `public/assets/art/ai-v1/iso/`:
  - 8 nhà (kể cả Ngai) thu cùng một tỉ lệ, nhà Thợ Gặt rộng 64 px;
  - 4 ô (trống, đã xây, khoá, Ngai) rộng 128 px, tâm hình thoi đặt ở hàng giữa ảnh;
  - đoạn vách núi được nắn chân từ dốc 0,388 về đúng 0,5 bằng cách dịch từng cột, rộng 480 px.
- **Đã nối vào game:**
  - `IMAGE_BUILDINGS` và `IMAGE_PLOTS` trỏ sang bộ isometric;
  - ô có nhà hiện thành sân lát đá (trạng thái `built`, có bản vẽ bằng code dự phòng);
  - `IsoWallRenderer` xếp các đoạn vách nối tiếp dọc mép bắc.
- **Đăng ký:** 13 mục `*_iso` trong `assets.manifest.yml` và một dòng trong CREDITS.
- **Bộ 45° cũ:** ảnh và mục manifest cũ của bộ Lúa Mì 45° vẫn nằm trong repo nhưng game không còn dùng (tranh thẻ vẫn dùng ảnh 45° riêng của chúng).
- **Đã kiểm trong trình duyệt** (tự đẩy vòng lặp game) ở zoom 1× và 2×.
- **Chưa làm:**
  - Lính vẫn vẽ nhìn chính diện;
  - các vua khác vẫn dùng ô vuông biến hình và nhà vẽ bằng code;
  - Ruộng Lúa trên sân lát đá trông nhỏ, vì thu theo chân nhà.
