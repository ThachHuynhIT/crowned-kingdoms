# Quy tắc asset lính theo hướng đi mới — spec (chưa tạo ảnh)

Ngày: 12/11/2026 (chạy đêm, chủ dự án yêu cầu: "hướng đi của lính đã đổi, viết lại quy tắc và spec cho asset để tạo
ảnh mới sau. Chỉ viết spec, không tự tạo ảnh."). Tài liệu này **chưa được duyệt**. Trước khi tạo bất kỳ ảnh nào vẫn
phải theo đúng `docs/ART_STYLE.md`: đọc "Quy tắc vẽ" và "Góc nhìn", đính kèm ảnh tham chiếu đã duyệt, dựng prompt từ
khối mẫu, và **vẽ thử MỘT lính trước, chờ chủ dự án duyệt**.

## 1. Hiện trạng (đọc từ code ngày 12/11/2026)

- **Thế giới vẽ isometric 2:1** (`src/core/iso.ts`), lật gương để địch vào từ **bên phải** màn hình.
  - Cổng địch `ENEMY_PORTAL` ở cuối đường, góc dưới-phải.
  - Tường núi ở trên-trái.
  - Cửa nhà ở mặt tường bên phải, nhìn ra đường.
- **Đường đi trên màn hình:** lính đi theo lưới vuông của mô phỏng, nên khi vẽ ra hướng đi thực tế là các **đường chéo 2:1**:
  - địch từ dưới-phải đi lên-trái về phía nhà và Ngai;
  - lính ta ra cửa (xuống-phải) rồi đi chéo đón địch.
- **Ảnh lính hiện tại** (`ai-v1`, `ai-v1-hd`, `ai-v1-uhd`):
  - 6 tư thế cắt từ `docs/art-review/g3e/units/<unit>/poses-source.png`: idle0 idle1 walk0 walk1 attack0 attack1;
  - vẽ **gần chính diện** (ART_STYLE: "Lính chính diện hiện tại dùng tạm");
  - một bộ duy nhất. `UnitRenderer` chỉ **lật ngang** theo hướng đi ngang (`facingLeft`): phe ta mặc định nhìn phải, phe địch nhìn trái.
  - Không xoay sprite.
- **Kích thước:** lính thường cao khoảng 34–35 px ở mật độ 2 (ví dụ Dân Quân 48×35), boss lớn hơn.
  - Mật độ 4 và 8 là bản xuất lại đúng 2× và 4×.
  - Chân neo ở giữa đáy `(0.5, 1)`, mọi tư thế trên cùng một canvas, tâm đầu cùng một cột.

**Vấn đề:** lính nhìn thẳng ra người chơi trong khi đi chéo lên-trái hoặc xuống-phải. Chỉ lật ngang thì không cho
cảm giác "đang đi về phía mục tiêu", nhất là khi địch tiến lên-trái mà mặt vẫn hướng về người xem.

## 2. Quy tắc mới đề xuất

### 2.1 Góc nhìn
- **Camera:** cùng camera isometric 2:1 với công trình, nhìn từ trên xuống khoảng 30°, thấy đỉnh đầu, vai và mặt trên của khiên, mũ.
- **Hai hướng gốc, vẽ riêng:**
  1. **Xuống-phải (SE):** mặt và ngực hướng xuống-phải, thấy 3/4 mặt. Dùng khi đi xuống-phải; lật ngang thành **xuống-trái (SW)**.
  2. **Lên-trái (NW):** lưng và gáy hướng về người xem, thấy 3/4 lưng. Dùng khi đi lên-trái; lật ngang thành **lên-phải (NE)**.
- **Hai hướng là đủ:** lật ngang cho đủ 4 hướng chéo, khớp quy tắc "không xoay sprite, chỉ lật ngang". Không vẽ 8 hướng.
- **Ánh sáng:** từ trên-trái như công trình; mặt quay về tây-nam sáng hơn.

### 2.2 Bộ khung hình mỗi lính
- **12 tư thế:** 6 cho mỗi hướng gốc, cùng thứ tự `idle0 idle1 walk0 walk1 attack0 attack1`.
  - Tờ nguồn đề xuất: `poses-source-se.png` và `poses-source-nw.png`, lưới 3×2 trên nền magenta phẳng, như hiện nay.
- **Tên file runtime** (đề xuất, cần sửa `IMAGE_UNITS` và `unitPoseFile`):
  - `<unit>_se_<i>.png`, `<unit>_nw_<i>.png`, và bản địch `<unit>_foe_se_<i>.png`, `<unit>_foe_nw_<i>.png`.
  - Bộ cũ `<unit>_<i>.png` giữ làm dự phòng cho tới khi bộ mới được duyệt.
- **Phe địch:** đổi màu từ bản phe ta bằng `foe()` trong `make_poses.py` (vùng màu đội xanh → đỏ), không vẽ riêng.

### 2.3 Kích thước, canvas và neo
- **Chiều cao đứng:** giữ đúng chiều cao world hiện tại của từng lính (`reference_height` × `UNIT_SCALE` trong `make_poses.py`), để va chạm và cân bằng trận không đổi.
- **Một canvas chung cho cả 12 tư thế của một lính** (cả hai hướng): chân ở hàng đáy, tâm thân trên cùng một cột. Như vậy khi đổi hướng, lính không nhảy chỗ.
- **Mật độ:** xuất 2, 4 và 8 art px mỗi đơn vị world bằng `--density`, mỗi bản đúng 2× và 4× bản mật độ 2 (`tools/test_art_hd_density.py` kiểm).
- **Alpha:** chỉ 0 hoặc 255. Viền tối theo màu vật liệu, như ART_STYLE.
- **Chiều rộng:** vũ khí dài (giáo, cung) được phép vượt chiều rộng thân, nhưng canvas phải chứa trọn. Không cắt vũ khí.

### 2.4 Chọn hướng trong game (khi có ảnh mới)
- **Theo vector vận tốc trên màn hình** (sau `project`), không theo trục lưới:
  - đi lên (`dy < 0`) dùng bộ NW, ngược lại dùng bộ SE;
  - lật ngang khi thành phần ngang ngược hướng gốc của bộ đó.
- **Đứng yên và đánh:** quay về mục tiêu đang đánh. Không có mục tiêu thì giữ hướng cuối cùng.
- **Không làm ảnh hưởng tất định:** chỉ đọc vị trí đã mô phỏng để vẽ; mô phỏng không đổi.

### 2.5 Prompt (khi được phép tạo ảnh)
- Lấy khối "Prompt isometric dùng lại" của ART_STYLE qua `docs/art-review/g3e/buildings/make_prompts.py`, không viết tay. Thêm:
  - "single chibi soldier, isometric 2:1 camera from above, three-quarter view facing down-right (south-east)";
  - và một bản "facing up-left (north-west), back three-quarter view";
  - "3×2 sheet: idle, idle, walk, walk, attack, attack; same scale in every cell; flat magenta background".
- **Đính kèm:** ảnh nhà Thợ Gặt đã duyệt, ảnh `iso-building-approved.png`, và tờ tư thế hiện tại của chính lính đó (giữ trang phục, màu, vũ khí).

## 3. Cổng duyệt
1. **Vẽ thử MỘT lính** (đề xuất: Dân Quân, vì là lính phổ biến nhất) ở cả hai hướng. Đặt cạnh bản hiện tại trên bàn cờ trong một ảnh so sánh ở `docs/art-review/units-iso/militia/`. **Chủ dự án duyệt.**
2. **Duyệt rồi mới làm theo nhóm**, mỗi nhóm duyệt trước khi nối vào game: lính của Lúa Mì; lính các vua khác; địch thường; boss.
3. **Ghi nguồn và prompt** vào `docs/art-review/units-iso/<unit>/`. Đăng ký `docs/assets.manifest.yml` và `CREDITS.md` trước khi commit.

## 4. Câu hỏi chờ chủ dự án
- Có cần hướng thứ ba nhìn thẳng (chính diện) cho lúc đứng chờ trong pha lập kế hoạch không? Đề xuất: không, dùng SE.
- Boss rất to (Ông Kẹ Đầm Lầy, Vua Không Ngai): có cần đủ hai hướng không, hay chỉ SE? Đề xuất: đủ hai hướng cho đồng bộ.
- Lính đặc biệt (nhện, sói, rồng sắt): giữ chung quy tắc hai hướng, tư thế đánh có thể là lao tới thay vì vung vũ khí.
