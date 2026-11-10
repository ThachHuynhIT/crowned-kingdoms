# Lộ trình — Crowned Kingdoms

Game là **roguelite xây vương quốc + tự động đánh**. Toàn bộ thiết kế nằm trong [spec tổng](superpowers/specs/2026-10-16-crowned-kingdoms-design.md), chia thành 6 dự án con G0–G5; mỗi dự án con có plan riêng trong `docs/superpowers/plans/`. Lịch sử colony sim (Phase 0–1) vẫn còn trong git (nhánh `phase1-core-loop` được lưu trữ, không merge).

Điều kiện chung của mọi việc: `npm run lint && npm run typecheck && npm test && npm run build` exit 0, cộng `python -m unittest discover -s tools -p "test_*.py"` khi đụng tới công cụ art.

## Trạng thái (09/11/2026)

**G0 ✔ · G1 ✔ · G2 ✔ · G3 ✔ · G4 ✔ · G5 ✔ · Vô tận ✔ · Làm lại chiến trường ✔**: tất cả đã merge vào `develop` (PR #12–#16). `main` chưa nhận bản phát hành nào từ các PR này; phát hành là một PR `develop` → `main`, chỉ làm khi chủ dự án đồng ý.

Chơi được trong trình duyệt:
- Ván 30 năm với 9 vua, mỗi vua có Ngai, bị động và 3 perk.
- Nội dung ván: hội đồng, nhiệm vụ, 3 boss, chinh phục 6 vua địch.
- Chế độ Vô tận trên bàn 7×7.
- Meta: Điểm Vương Miện, thông thạo, mở khoá, độ khó Gai 0–5.
- Lưu ván và tải lại: lưu tự động và nhiều bản lưu có tên.
- Âm thanh sinh bằng code, màn Cài đặt, PWA chơi offline.
- Art bằng ảnh cho cả 9 vua.
- Cân bằng: 45,0–55,4% thắng mỗi vua, chênh lệch 10,4 điểm (bot `greedy`, 500 ván/vua, Gai 0).

## Việc tiếp theo: phản hồi của chủ dự án, chỉ trên PC (09/11/2026)

Tất cả là cảm nhận trên PC (desktop ≥ 768 px). Bố cục điện thoại giữ nguyên cho tới khi chủ dự án bảo làm (xem "Để sau"). Mỗi việc đổi hành vi đi theo quy trình: brainstorming → spec + plan → TDD → kiểm trình duyệt.

**Chọn vua**
1. ✔ Các vua trượt mượt sang trái/phải khi bấm ‹ › (0,24 giây).
2. ✔ Thẻ vua nhỏ còn khoảng 1/2 trên PC (giữa ×3 = 198×288, hai bên ×2), vẽ ở tỉ lệ nguyên; chân dung thêm bản 144×216 để nét ở ×3.
3. ✔ Màn sau khi chọn vua: cả khối nằm giữa màn theo hai chiều, 9 lá 116×180 xếp 5 + 4.

**Âm thanh:** ✔ to bằng 1/4 mức gốc (10/11/2026). **Đạn công trình:** ✔ bay ra từ khoảng 80% chiều cao công trình.

**Thẻ bài và lượt chơi**
4. ✔ Tranh gần kín bề ngang thẻ; trên PC lá bài to hơn: bài trên tay 148×208 (tranh 128×96 mới, thu nhỏ từ ảnh gốc đã duyệt), Bộ bài 116×180, phần thưởng 212×280 (tranh ×2). Bàn cờ ở pha chuẩn bị nhỏ đi một chút (zoom 1,29 → 1,19) để nhường chỗ cho tay bài.
5. ✔ (thay bằng luật 10/11/2026, spec `2026-11-10-draw-one-and-shop-design.md`) Năm 1 có 5 lá, mỗi năm sau rút 1 lá (2 ở năm 5, 10, 11, 15, 20, 21, 25), bài cũ giữ lại; chơi hoặc bán tới khi còn 2 lá thì trận tự bắt đầu (năm 30: 0 lá); Mua thẻ bằng vàng (5, 8, 11…); save v8.

**Bàn cờ và camera**
6. Cây và đá trang trí bên ngoài bàn cờ: bỏ viền (✔ 10/11/2026, việc 15), rải dày hơn cho map sinh động.
7. ✔ Zoom (10/11/2026: zoom out xa hơn 60%, zoom in tối đa = mức xa nhất cũ, kéo ngang hẹp 40%):
   - zoom out nhỏ nhất rộng thêm 30–40%;
   - zoom in tối đa bằng mức zoom out lớn nhất hiện nay;
   - vùng kéo sang trái/phải hẹp lại 40%.

**Trận**
8. ✔ Công trình chỉ hiện thanh máu khi đã bị đánh.
9. ✔ Trận không thắng vì hết giờ; Cuồng Nộ từ 60 giây, mỗi 60 giây +20% sát thương địch; quá 5 phút là thua. **Cân bằng chưa đạt**: `docs/balance/2026-11-10-draw-one-balance.md` (27–83% mỗi vua, độ khó dồn vào boss năm 20).
10. Can thiệp của mỗi vua có hiệu ứng và hình dạng riêng (hiện cả 9 vua chung đá tảng). Art theo `docs/ART_STYLE.md`, vẽ thử một mẫu trước.

**Cân bằng**
11. Vua Phép Thuật yếu vì không có lính cận chiến chịu đòn: xem lại thẻ và luật của vua này, rồi chạy lại `npm run balance`. (Đo nhanh 10/11: Phép Thuật 57%, giờ không còn là vua yếu nhất; yếu nhất là Thuỷ Triều, Lúa Mì, Ánh Trăng.)
12. Tham khảo wiki 9 Kings (thẻ, cấp, sự kiện, vua, perk, Merchant, cấu trúc một ván) để rà luật và cân bằng. Ranh giới: chỉ lấy ý tưởng cơ chế chung của thể loại, ví dụ:
    - vua thuần phép vẫn cần một lớp chịu đòn;
    - nhịp sự kiện trong ván;
    - một người bán hàng thỉnh thoảng xuất hiện.

    Không chép tên, thẻ, chỉ số, văn bản hay hình của game đó. Ghi chép tóm tắt bằng lời của mình vào `docs/research/`.

    ✔ Đã làm từ ý "người bán hàng": **Thương nhân** (spec `2026-11-10-merchant-design.md`): sau trận năm 6, 12, 18, 24 (Vô tận: mỗi 6 năm) bày 3 thẻ, mỗi thẻ 3 vàng, mua tối đa 1 hoặc bỏ qua; save v9. Số năm và giá chờ chủ dự án duyệt.

**Phản hồi 10/11/2026 (PC)**
13. ✔ Bấm nhà chính xác ở mọi mức zoom: bấm vào hình nhà (không chỉ ô đất hình thoi) là mở bảng thông tin, nhà đứng trước được ưu tiên (`src/ui/info/spritePick.ts`, `src/render/pickBoxes.ts`).
14. ✔ Bấm lính địch trong trận mở bảng thông tin như lính ta: bấm trúng cả hình lính, không chỉ vòng va chạm dưới chân.
15. ✔ Bỏ viền sẫm của cây, đá, bụi trang trí (`tools/strip_decor_outline.py`, ảnh gốc giữ ở `docs/art-review/decor-outline/originals/`).
16. ✔ Âm thanh nhỏ còn 1/3 (`MASTER_OUTPUT` 0,25 → 0,083); tiếng đánh, bắn, va chạm trong trận nhỏ thêm một nửa (`BATTLE_HIT_GAIN`).
22. ✔ Âm thanh hiện đại, êm hơn, nhỏ thêm một nửa (`MASTER_OUTPUT` 0,25/6 ≈ 0,042): bỏ sóng vuông, tiếng sine/triangle + nhiễu lọc, có nén và lọc thấp ở master, vang nhẹ, mỗi lần đánh lệch cao độ chút ít, giới hạn số tiếng trong trận; nhạc chậm và êm hơn (`src/data/sfx.ts`, `src/data/music.ts`, `src/audio/`).

**Asset còn thiếu (10/11/2026, Codex vẽ, Claude duyệt theo uỷ quyền; xem `/admin` và `/admin/fx`)**
17. ✔ Kho asset `/admin` liệt kê mọi PNG của game (`python tools/build_game_assets.py`); trang `/admin/fx` xem hiệu ứng vẽ bằng code.
18. ✔ P0 đạn (14) và VFX (20) vẽ bằng code (`src/render/codeFx.ts`, `src/render/fx/`), đã gắn vào trận: mỗi lính/công trình bắn đạn riêng (`src/render/projectileFx.ts`), trúng đòn, lính tan, công trình sụp, đá tảng nổ, hồi sinh, vòng lửa Cuồng Nộ. Trạng thái (choáng, vô hiệu, bỏng, độc, chậm) lặp trên lính/công trình đang bị; bàn cờ: đặt, dời, nâng cấp công trình (`src/render/fxCues.ts`).
19. ✔ P0 icon (27): chỉ số, trạng thái, hành động (`docs/art-review/g3e/icons/review-2026-11-10.md`); hiện ở đầu dòng hộp thông tin.
20. ✔ P2 đồ trang trí sân (10): thùng, rơm, biển, xe lúa rải trong sân; rào và cổng chỉ ở kho asset.
21. Kiến trúc cấp 2/3 (dừng theo chủ dự án 10/11): 55/74 công trình và Ngai đã vào game; còn Ánh Trăng, Du Mục, trung lập (`docs/art-review/levels/review.md`). Còn lại (P2): hoạt ảnh công trình và Ngai, bộ frame lính mở rộng (42), mặt nạ nền dual-grid (76), nền menu và màn thắng/thua (6), ảnh phát hành (5).

## Để sau: điện thoại (chỉ làm khi chủ dự án bảo)

- Tải trang và vào map trên điện thoại quá lâu: cần tối ưu (gói atlas, nạp art theo vua, cache PWA).
- Đo FPS trên điện thoại thật (bản dev có `?fps`, cấu hình `dev-lan` ở cổng 5174).
- Kéo thả thẻ chưa thử bằng cảm ứng trên máy thật.
- Áp các thay đổi PC ở trên vào bố cục 375×812.

## Chủ dự án cần quyết

- ✔ Thẻ vua khoá hiện tên và hình, phủ lớp xám có ổ khoá (chủ dự án 10/11/2026).
- Khi nào phát hành `develop` → `main`.

## Giới hạn và lỗi nhỏ đã biết

- Boss to không lách qua được khe giữa hai công trình sát nhau, phải đi vòng (spec `2026-11-09-battle-field-rework-design.md`).
- Bóng đá tảng vẫn vẽ bằng code; FX còn lại và trời menu đã là ảnh.
- Còn hoãn từ G2, chưa kiểm lại:
  - tooltip Tim Núi chưa tính cấp;
  - khiên yếu có thể ghi đè khiên mạnh;
  - choáng/làm chậm kéo dài N−1 tick;
  - chinh phục ở năm cuối của luật rút gọn (`RULES_G2`) không cho thẻ;
  - luồng RNG lịch không lưu sau `pickEnemyKings`;
  - bot `random` dùng hành động G2 dưới luật G1.

## Lịch sử

| G | Tên | Kết quả |
| --- | --- | --- |
| G0 | Nền UI & dọn dẹp | Xoá colony sim; hạ tầng trong `src/core`; khung UI, `layout.ts`, `ContentBox`/`Tooltip`; ESLint deterministic |
| G1 | Lõi chơi được | `RunState` + lệnh, vòng năm, trận, can thiệp, Vua Lúa Mì; headless + bot `random` |
| G2 | Chiều sâu | Cấp, bùa, lân cận, vàng, đổi bài, mua ô; 3 vua; chọn vua, Bộ bài, lịch, chinh phục (plan `2026-10-20-g2-depth.md`) |
| G3 | Ván đầy đủ | 30 năm, Liên Quân, hội đồng, sắc lệnh, nhiệm vụ, 3 boss, 54 thẻ chinh phục, lưu ván IndexedDB (plan `2026-10-22-g3-full-run.md`); G3e làm lại giao diện và art Lúa Mì (PR #12) |
| Iso | Bàn cờ isometric | Ngai ở ô 2, ô 64 px, góc nhìn 2:1, zoom/pan tự do (PR #13, spec `2026-11-06-iso-board-redesign-design.md`) |
| G4 | 9 vua và meta | 27 perk, thẻ trung lập meta, Điểm Vương Miện, thông thạo, mở khoá, Gai (PR #14, plan `2026-11-09-g4-kings-and-meta.md`) |
| G5 | Cân bằng và hoàn thiện | Bot `greedy` + `npm run balance`; âm thanh, juice, Cài đặt, PWA; art ảnh cho 9 vua, 102 thẻ (PR #15, plan `2026-11-09-g5-balance-polish.md`, nghiệm thu `docs/balance/2026-11-09-g5-acceptance.md`) |
| Vô tận | Chế độ Vô tận | Bàn 7×7, phúc lành, sống qua năm 30 (PR #15, plan `2026-11-09-endless-mode.md`) |
| Chiến trường | Làm lại chiến trường | Công trình chặn đường, đội hình, tầm tháp ×3, cổng xa hơn, nhiều bản lưu, khung Kenney Pixel Adventure (PR #16, spec `2026-11-09-battle-field-rework-design.md`, cân bằng `docs/balance/2026-11-09-battle-rework-balance.md`) |

Chi tiết từng bước và bằng chứng kiểm thử nằm trong plan và báo cáo tương ứng; art còn theo dõi ở `docs/art-review/`.

## Kiểm thử mỗi việc

- Vitest cho dữ liệu, luật và trận (spec §13.1–13.3).
- Trình duyệt: chụp màn hình các scene mới ở 1280×720 (và 375×812 khi làm phần điện thoại); không chữ đè/tràn, vùng chạm ≥ 44 px, console không lỗi (spec §13.4).
