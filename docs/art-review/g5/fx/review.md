# FX trận đánh — duyệt G5 (09/11/2026)

Plan `docs/superpowers/plans/2026-11-09-missing-art-assets.md` Task 7 bước 2. Duyệt: Claude theo uỷ quyền của chủ dự án (09/11/2026).

## Mẫu: đá tảng rơi (`boulder`, 16×16)

- **Cách vẽ:** `make_prompts.py boulder`; đính kèm ảnh phong cách Thợ Gặt và icon đá tảng đã duyệt. Cắt bằng `make_assets.py` (cùng cách cắt với icon).
- **Claude kiểm:**
  - Ảnh nguồn đẹp: khối tròn, vết nứt, viền nâu, ánh sáng trên-trái.
  - Thu về đúng cỡ gốc 16×16 (ART_STYLE: không đổi native size), viền 1 px vỡ thành vài điểm rời, vết nứt biến mất. Màu ngả be nên đọc như một quả bóng, không còn là đá.
  - Bản vẽ bằng code (`paintBoulder`) có viền liền và ba tông xám, nên đọc rõ hơn ở cỡ này.
- **Trạng thái:** KHÔNG DUYỆT. Không vẽ tiếp nhóm.

## Quyết định cho cả nhóm FX

FX giữ vẽ bằng code (`src/render/fxArt.ts`), có lý do:

- Cỡ gốc là 4×4 (tia lửa), 8×8 (tám hướng mũi tên, sao choáng) và 16×16 (đá, bóng đá, xung lực, khiên).
- Ở cỡ đó, ảnh thu nhỏ không chứa thêm chi tiết nào so với pixel đặt tay, mà còn mất viền như mẫu trên.
- Mũi tên cần tám hướng vẽ riêng vì sprite không bao giờ xoay; bitmap tay giữ đúng đường chéo 1 px.

Nguồn và prompt của mẫu giữ trong `boulder/` để tra lại. `make_prompts.py` vẫn dùng được nếu sau này FX được tăng cỡ gốc.
