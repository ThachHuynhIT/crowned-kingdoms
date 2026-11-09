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

## Lần hai: vẽ ở mật độ ảnh (09/11/2026)

- **Cách làm:** FX ảnh vẽ ở 2 px ảnh cho mỗi px thế giới, như lính và công trình. Đá tảng 32×32 hiện đúng bằng đá tảng 16×16 vẽ bằng code, nên không đổi cỡ hiển thị.
  - Xung lực, khiên, sao choáng và tia lửa vốn được vẽ ở tỉ lệ 1 (nửa độ phân giải của lính), nên bản ảnh hiện to gấp đôi bản code. Như vậy hợp với lính đã to 1,3 lần: khiên 16 px cũ nhỏ hơn một người lính 34 px.
- **Đá tảng:** cắt lại từ ảnh nguồn cũ ở 32 px; viền và vết nứt giữ được. ĐÃ DUYỆT.
- **Xung lực:** sao tám cánh vàng, lõi trắng. ĐÃ DUYỆT.
- **Khiên:** lòng bị tô kín xanh nhạt, sẽ che lính. `make_assets.py` khoét lòng trong suốt, chỉ giữ vành 3 px và vệt sáng. ĐÃ DUYỆT sau khi khoét.
- **Sao choáng:** ba sao vàng xếp hình vòng cung. ĐÃ DUYỆT.
- **Tia lửa:** tia bốn cánh 8×8. ĐÃ DUYỆT.
- **Vẫn vẽ bằng code:** tám hướng mũi tên (sprite không bao giờ xoay; bitmap tay giữ đúng đường chéo 1 px) và bóng của đá tảng (hình elip mờ, alpha 128 đã khai báo).
- Bảng tổng hợp: `sheet.png`. Nối vào game qua `IMAGE_FX` (`src/render/imageArt.ts`).

## Mũi tên (09/11/2026)

- **Cách vẽ:** một bảng 3×3, mỗi ô một hướng, Codex vẽ riêng từng hướng (không xoay ảnh), ô giữa để trống. `make_arrows.py` cắt từng ô về 16×16, alpha 0/255.
- **Claude kiểm:** cán gỗ, mũi sắt xám, lông đuôi đỏ trắng, viền tối 1 px; cùng độ dài ở cả tám hướng; ở 16 px vẫn đọc rõ hướng. ĐÃ DUYỆT.
- Ảnh hiện ở tỉ lệ 1 như các FX khác, nên to gấp đôi mũi tên 8 px cũ, hợp với lính to hơn.
- Bóng mờ dưới đá tảng vẫn vẽ bằng code: hình elip trong mờ alpha 128 đã khai báo, ảnh không thêm gì.
