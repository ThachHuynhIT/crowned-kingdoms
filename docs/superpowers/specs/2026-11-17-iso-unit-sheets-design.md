# Lính vẽ theo hướng chéo trong trận (17/11/2026)

Chủ dự án giao toàn quyền ("Làm ở đây", 17/11/2026) sau khi duyệt bộ bảng iso của 35 lính (`docs/art-review/units-iso/`).

## Mục tiêu
- Trong trận, lính quay mặt theo hướng chéo của bàn cờ iso thay cho dáng nhìn thẳng.
- Mỗi lính có 3 khung đứng, 4 khung đi và 4 khung đánh.
- Khung đánh khớp với nhịp đánh của mô phỏng, ở mọi tốc độ trận.
- Không đổi luật chơi, mô phỏng hay tính tất định: chỉ đổi phần vẽ.

## Ảnh
- **Lệnh xuất:** `docs/art-review/units-iso/make_review.py --export [--density 4|8] <unit> ...`.
- **Một dải mỗi tổ hợp:** mỗi lính, mỗi phe (ally, foe) và mỗi hướng (SE, NW) có một dải 11 ô bằng nhau, xếp theo thứ tự đứng 0–2, đi 3–6, đánh 7–10.
- **Nơi lưu:** dải nằm ở `public/assets/art/<ai-v1|ai-v1-hd|ai-v1-uhd>/iso-units/<unit>[_foe]_<se|nw>.png`.
- **Mật độ 2:** đúng bằng các khung đã duyệt trong `frames-rows/` (đã kiểm từng điểm ảnh).
- **Mật độ 4 và 8:** cắt thẳng từ ảnh nguồn, đặt trên khung đúng m lần khung mật độ 2 (`place_twin`), nên giữ nguyên chân đứng và kích thước.
- **Phe địch:** dải foe dùng cùng cách đổi màu xanh sang đỏ (`make_poses.foe`).
- **Wraith, moon_reaper:** cắt bằng khoá màu chặt quanh #FF00FF.
- **Vì sao dùng dải:** một dải thay cho 11 file, nên mỗi tầng có 140 file thay vì 1540 (tốc độ tải bị giới hạn bởi số yêu cầu).
- **Ảnh nhìn thẳng cũ:** với lính iso, chỉ còn tải pose 0 (dùng cho hình ở HUD như bảng do thám và ô chọn). Các pose 1–5 vẫn nằm trên đĩa nhưng không tải.
- **Danh mục tài sản:** chạy `units-iso/register.py`, rồi `hd/register_hd.py iso-units` và `hd/register_uhd.py`.

## Vẽ
- **Danh sách:** `ISO_UNITS` và `isoUnitFile` nằm trong `src/render/imageArt.ts`.
- **Atlas:** `withImageArtFrom` cắt dải thành các khung `unitiso_<unit>_<team>_<dir><i>` (`stripCell`). Bước dựng atlas vẽ đúng phần ảnh của từng ô.
- **Khung chỉ có khi tải được:** không có bản vẽ bằng code thay thế. Lính nào thiếu dải thì tiếp tục dùng ảnh nhìn thẳng như trước.
- **Hướng (`isoFacing`):**
  - Theo hướng di chuyển trên màn hình; khi đứng yên thì quay về phía mục tiêu.
  - Đi xuống màn hình dùng bảng SE, đi lên dùng bảng NW. Trái hay phải theo dấu của trục ngang.
  - Lật ngang SE ra SW, lật NW ra NE.
  - Một trục chỉ đổi khi chuyển động theo trục đó lớn hơn ít nhất 25% chuyển động theo trục kia, để hình không nháy.
  - Lúc xuất hiện: quân ta nhìn SE, quân địch nhìn NW.
- **Khung (`isoPoseCell`):**
  - **Đánh**, tính theo tick của mô phỏng:
    - Trong tick cuối trước một đòn chắc chắn ra tay (cooldown 1, đứng yên, có mục tiêu còn sống, không bị choáng): khung sẵn sàng, rồi khung vung.
    - Từ đòn đánh tới 1,2 tick sau: khung chém.
    - Tới 2 tick: khung thu về.
  - **Đi:** 16 khung/giây (4 khung).
  - **Đứng:** 9 khung/giây (3 khung).
  - Mỗi vòng dài bằng vòng 2 khung cũ.

## Giới hạn đã biết
- **Tầng UHD:**
  - tải nền thêm khoảng 54 MB (bớt khoảng 20 MB vì không còn tải các pose cũ);
  - atlas thêm khoảng 2 trang 4096².
- **Lính chưa có bảng iso:** cướp, trùm, ếch, ong, footman vẫn dùng ảnh nhìn thẳng.
- **Lỗi nhỏ của ảnh** đã ghi trong commit `c96df2b`.
