# Báo cáo chạy đêm — 12/11/2026 (02:00 →)

Nhánh `feature/close-up-art` (PR #22, chưa merge). Đêm nay không push, không merge, không tạo PR, không dùng Codex.
Plan: `docs/plans/2026-11-12-night-plan.md`.

## Tóm tắt buổi sáng
- **Đã sửa lỗi Thương nhân "mất 1 thẻ"** (commit `365bc30`).
  - Nguyên nhân: thẻ mua được đặt lên đầu chồng rút. Từ khi mỗi năm chỉ rút 1 lá, lá rút năm sau chính là thẻ vừa mua, nên trả 3 vàng mà tay không có thêm lá nào.
  - Giờ thẻ mua vào thẳng tay, giống "Mua thẻ".
- **Mở game nhanh hơn** (commit `03305be`): từ lúc tải xong ảnh tới lúc vào menu, máy tính giảm từ 1032 ms xuống khoảng 620 ms, điện thoại từ 403 ms xuống khoảng 290 ms. Khung hình vốn đã nhẹ (khoảng 1 ms mỗi khung kể cả trận lớn), nên không đụng tới.
- **Cài đặt trên màn ngang thấp** (commit `ecb00be`): ở 960×540, 844×390 và 667×375, bảng Cài đặt bị cắt mất tiêu đề và nút Đóng. Giờ màn thấp có bảng hai cột, nút Đóng nằm cạnh tiêu đề.
- **Điện thoại chỉ chơi ngang** (commit `2edb562`): cầm dọc thì hiện "Xoay ngang điện thoại để chơi" và game tạm dừng; trình duyệt cho phép thì khoá màn ngang.
- **Còn lớn nhất trên điện thoại ngang:** khi lập kế hoạch, lá bài trên tay và HUD che gần hết bàn cờ (ảnh `.superpowers/night-shots/sheet-land-realm.png`). Cần một bố cục HUD riêng cho màn ngang thấp; mình chưa làm vì là thiết kế lớn (xem đề xuất 3).
- **Bộ lọc Trợ giúp thành dropdown** (commit `aec1152`), **chữ xanh/đỏ đủ tương phản** (commit `9c149a5`), **Trợ giúp cập nhật** theo bản sửa thương nhân (commit `6a7f73f`), **spec asset lính theo hướng đi chéo** (commit `6adfebc`, chỉ là tài liệu, chưa tạo ảnh).
- **Cần bạn quyết:** thẻ thưởng, thẻ chinh phục và thẻ thưởng nhiệm vụ vẫn theo luật cũ (đặt lên đầu chồng rút, thay cho lá rút của năm), vì đó là thiết kế có test. Xem mục "Đề xuất chờ duyệt".

## Phase 1: chọn, mua, bỏ qua thẻ — XONG
- **Tái hiện lỗi:**
  - Test mới `src/game/run/merchantDeck.test.ts` chạy 3 ván 30 năm bằng bot greedy.
  - Sau mỗi lệnh, test kiểm tay + chồng rút + chồng bỏ đúng bằng bộ bài, và mỗi lần mua ở thương nhân thì bộ bài tăng 1.
  - Luật lõi luôn giữ bộ bài đúng. Lỗi nằm ở chỗ đặt thẻ, như phần nguyên nhân ở trên.
- **Sửa:** `pickOffer` trong `src/game/run/commands.ts`: thẻ mua ở thương nhân vào tay. Test `merchant.test.ts` đã cập nhật.
- **Rà thêm:**
  - Bỏ qua thương nhân: miễn phí, đúng.
  - Bỏ qua thẻ thưởng: +vàng, đúng.
  - Chỉ số sai (−1, 3, 0,5): bị từ chối, đúng.
  - Không đủ vàng: bị từ chối, đúng.
  - Mua thẻ trong pha lập kế hoạch: vào tay, đúng.
- **Baseline:** `endlessCompatibility.test.ts` được ghi lại vì ván đổi theo bản sửa (ghi chú trong file).
- **Gate:** lint, typecheck, 3077 test và build đều qua.

## Phase 2: hiệu năng — XONG
Đo bằng Playwright trên server dev (`npx vite --port 5177`), Chromium headless, 2 lần mỗi số.

| Số đo | Trước | Sau |
|---|---|---|
| Tải xong ảnh → menu, máy tính 1280×720 "Cao" (UHD) | 1032 ms | 608–639 ms |
| Tải xong ảnh → menu, điện thoại 844×390 DPR 3 | 403 ms | 277–308 ms |
| Tải ảnh (vào game → tải xong), máy tính | 2,4–3,7 s | không đổi (do tải 772 file UHD) |
| Thời gian xử lý mỗi khung, lập kế hoạch, máy tính | 0,78 ms (p95 1,1) | không đổi |
| Thời gian xử lý mỗi khung, lập kế hoạch, điện thoại | 1,0 ms (p95 1,5) | không đổi |
| Thời gian xử lý mỗi khung, trận năm 30, máy tính | 1,05 ms (p95 1,6) | không đổi |

- **Cách đo khung hình:** từ sự kiện `prestep` tới `postrender` của Phaser. FPS của trình duyệt headless bị khoá theo vsync (khoảng 6,7 ms), nên không dùng được để so.
- **Tìm ra chỗ chậm** (đo tạm trong code, đã gỡ): đọc lại điểm ảnh của 772 ảnh UHD mất khoảng 605 ms, chép từng điểm vào trang atlas khoảng 170 ms, và làm mượt (mipmap) mất 135–330 ms, kể cả cho các ảnh chỉ dùng để dựng atlas.
- **Sửa** (commit `03305be`):
  - các khung ảnh được vẽ thẳng vào trang atlas bằng `drawImage`, không đọc lại điểm ảnh;
  - bỏ tạo mipmap cho các texture chỉ dùng để chép vào atlas.
- **Ảnh kiểm tra sau khi sửa:** `.superpowers/night-perf-after.png`, giống bản trước.
- **Chưa làm:** giảm thời gian tải 772 file UHD (53 MB). Muốn giảm phải gộp file hoặc tải dần khi phóng to, là thay đổi lớn. Đã ghi vào đề xuất.

## Phase 3: bố cục nút và chữ — XONG MỘT PHẦN
- **Đã chụp** mọi màn (Menu, Chọn vua, Vương Miện, Cài đặt, Trợ giúp, Lưu ván, Bàn cờ) ở 1280×720, 960×540, 844×390 và 667×375. Ảnh và bảng ghép trong `.superpowers/night-shots/` (`sheet-<màn>.png`).
- **Lỗi tìm được và đã sửa:** bảng Cài đặt cao 696 px bị cắt ở mọi màn thấp hơn 712 px, mất nút Đóng.
  - Sửa: bảng hai cột cao 372 px khi màn cao dưới 712 và rộng từ 640 (`src/ui/settings/settingsLayout.ts`).
  - Test bố cục cho 6 cỡ màn ngang: không chồng nút, nút ≥ 48 px, nằm trong màn.
  - Ảnh sau khi sửa: `.superpowers/night-shots/sheet-after-Settings.png`.
  - Ở 1280×720 bảng không đổi.
- **Không thấy lỗi** ở Vương Miện, Trợ giúp, Chọn vua (có cuộn; chữ dài trên thẻ trợ giúp được cắt bằng "…", đúng ý thiết kế).
- **Test chậm** (`stress.test.ts`, `headless.test.ts`, `spriteAtlas.test.ts`) chỉ quá giờ khi server dev và trình duyệt chạy cùng lúc. Mình tắt server trước mỗi lần chạy gate, và rút test bộ bài mới xuống 1 ván (khoảng 1 giây).

## Phase 4: điện thoại màn ngang — XONG MỘT PHẦN
- **Khoá màn ngang và lớp phủ dọc** (`src/platform/orientation.ts`, có test):
  - thiết bị chỉ có cảm ứng mà cầm dọc → lớp phủ "Xoay ngang điện thoại để chơi" và vòng lặp game ngủ;
  - xoay ngang → game chạy lại;
  - mỗi lần chạm thì thử `screen.orientation.lock('landscape')` (đa số trình duyệt chỉ cho khi toàn màn hình);
  - máy tính (có chuột) không bao giờ bị chặn.
  - Ảnh: `.superpowers/night-shots/orient-portrait.png`.
- **Vùng an toàn:** đã có sẵn (`index.html` đặt `#game` theo `env(safe-area-inset-*)`).
- **Đã chụp** 667×375, 844×390, 915×412, 932×430 và 1024×768 (`sheet-land-menu.png`, `sheet-land-realm.png`):
  - menu ổn ở mọi cỡ;
  - **bàn cờ khi lập kế hoạch thì không dùng được ở màn ngang điện thoại:** lá bài cao 288 px cùng hàng nút che gần hết, chỉ thấy một dải bàn cờ. 1024×768 ổn.
- **Hiệu năng điện thoại:** đo ở 844×390 DPR 3 (giả lập): khoảng 1 ms mỗi khung. Mật độ vẫn theo cài đặt "Độ nét" có sẵn (Vừa = tối đa 2, Thấp = 1); mình không đổi mặc định.

## Phase 5: dropdown — XONG
- **Đã đổi:** bốn bộ lọc thẻ trong Trợ giúp (Vua 11 lựa chọn, Loại 8, Hiếm 4, Cấp 5) trước phải bấm vòng; giờ bấm là mở danh sách ngay dưới nút.
  - Ô cao 44 px, xếp thêm cột khi màn thấp; lựa chọn hiện tại được viền vàng; bấm ra ngoài thì đóng.
  - Code: `src/ui/dropdownLayout.ts` và `filterChoices`/`setFilterValue` trong `src/ui/help/helpView.ts`, đều có test; `src/ui/help/HelpModal.ts`.
  - Ảnh: `.superpowers/night-shots/dropdown-phone844-open.png`, `dropdown-pc-picked.png`.
- **Không đổi, kèm lý do:**
  - Các nút Bật/Tắt trong Cài đặt (Rung màn hình, Hiệu ứng trận, Số sát thương): chỉ có 2 giá trị, bấm để đổi là cách gọn nhất.
  - "Độ nét": 3 giá trị và đổi ảnh cần tải lại trang, bấm vòng vẫn rõ ràng.

## Phase 6: màu sắc và tương phản — XONG
- **Đo bằng công thức WCAG** (`src/ui/contrast.ts`, có test):
  - chữ chính trên giấy kem đạt 11,7:1;
  - nền tối và giấy của mọi vua đều ≥ 4,5:1.
- **Không đạt:**
  - chữ xanh `good` trên kem chỉ 2,5:1 (các chữ "Đã mở", "Mở khoá", giá thẻ thương nhân);
  - chữ đỏ `bad` trên kem đậm 3,1:1.
- **Sửa** (commit `9c149a5`): hai màu chữ mới `goodText` 0x2b6418 (5,4:1) và `badText` 0x8c1f16 (6,9:1 trên kem). Thanh máu và viền vẫn dùng `good`/`bad` cũ, nên nhìn chung bảng màu không đổi.
- **Chưa đo:** chữ trắng hoặc vàng nằm trực tiếp trên bàn cờ (tên vua, "Địch: …"). Các chữ này có bóng đổ, nhưng độ tương phản phụ thuộc nền cỏ.

## Phase 8: hướng dẫn — XONG MỘT PHẦN
- Trợ giúp "Thương nhân" ghi đúng luật mới (thẻ mua vào thẳng tay). "Thẻ thưởng" thêm câu: thẻ chọn được là lá rút đầu năm sau. Có test.
- Chưa rà trang admin (`tools/asset-admin`).

## Phase 9: quy tắc asset lính — XONG (chỉ spec)
- `docs/superpowers/specs/2026-11-12-unit-asset-rules-design.md`:
  - camera isometric 2:1;
  - hai hướng gốc vẽ riêng (xuống-phải 3/4 mặt, lên-trái 3/4 lưng), lật ngang ra đủ 4 hướng chéo;
  - 12 tư thế mỗi lính trên một canvas chung, chân neo giữa đáy, xuất ở 3 mật độ 2/4/8;
  - tên file đề xuất, cách chọn hướng trong game, khung prompt;
  - cổng duyệt: vẽ thử một lính Dân Quân trước.
- ART_STYLE dẫn tới spec này. **Chưa tạo ảnh nào.**

## Quyết định kèm lý do
- **Chỉ sửa thương nhân, không sửa thẻ thưởng:**
  - Test `commands.test.ts` ghi rõ thẻ thưởng là lá rút của năm sau (tay năm sau có đúng 1 lá, chính là thẻ thưởng).
  - Đổi cả thẻ thưởng là đổi luật và cân bằng, cần chủ dự án duyệt.
  - Thương nhân thì khác: người chơi trả vàng, nên phải được thêm lá, giống "Mua thẻ".

## Đề xuất chờ duyệt
1. **Thẻ thưởng, thẻ chinh phục, thẻ thưởng nhiệm vụ vào thẳng tay** như thương nhân. Hiện tại chúng thay cho lá rút của năm sau, nên người chơi có thể thấy cũng "mất" một lá rút. Đổi thì cần đo lại cân bằng.

2. **Tải ảnh UHD dần:** chỉ tải bộ mật độ 8 khi người chơi phóng to lần đầu, hoặc gộp 772 file thành vài tấm atlas sẵn lúc build. Như vậy máy tính vào game nhanh thêm 1–2 giây.

3. **HUD lập kế hoạch cho điện thoại ngang** (màn cao 375–430 px):
   - lá bài thu nhỏ thành một hàng thấp (khoảng 96–120 px), bấm vào mới mở to;
   - các nút Mua thẻ, Đổi bài, Bán bài, Bộ bài gom thành một cột bên phải;
   - lịch năm và thanh trên gọn lại một dòng.
   Đây là thiết kế giao diện mới nên cần bạn duyệt hướng trước. Hiện trạng ở `.superpowers/night-shots/sheet-land-realm.png`.

## Việc còn dở và bước tiếp theo
- Phase 2 trở đi: xem plan.
