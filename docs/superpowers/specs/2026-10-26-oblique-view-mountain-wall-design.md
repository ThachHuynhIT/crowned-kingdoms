# Góc nhìn xéo (3/4) và tường núi sau lưng lâu đài — thiết kế

Ngày: 26/10/2026. Trạng thái: **chờ duyệt** (chưa có plan, chưa có code). Thuộc nhánh G3e, sau E5b.

## 1. Ý định

Thay cảnh nhìn thẳng từ trên xuống bằng **góc nhìn xéo kiểu Stardew Valley / Fire Emblem** (nhìn nghiêng ~3/4: nhà và lính thấy mặt trước, tường và cây có chiều cao). Phía sau lưng lâu đài là **tường núi liền một khối** chắn kín; địch không bao giờ đi vào từ đó. Địch **chỉ tiến từ phía trước (phía dưới màn hình)**, dàn thành đội hình đi tới.

Lý do: ảnh AI đã tạo (lính, nhà) vẽ nhìn nghiêng nên khớp; chiều sâu tự nhiên; bố cục "tựa núi, nhìn ra cửa ải" dễ đọc hơn bốn hướng tấn công.

## 2. Mục tiêu / không mục tiêu

Mục tiêu
- Thế giới logic **giữ nguyên là lưới vuông** (`BATTLE.field` = 384, ô 32 đơn vị, bàn cờ 5×5 tại `boardOrigin` 112). Góc nhìn xéo chỉ là cách **vẽ** (cao hơn, y-sort đã có) cộng thêm **một vật cản mới**: tường núi phía bắc.
- Mọi đợt địch xuất từ mép **S**. Đội hình dàn ngang rồi tiến lên.
- Không ai (lính mình, địch, đạn, hiệu ứng đẩy lùi, boss) đi xuyên hay đứng trong tường núi.
- Có tài liệu asset cho tường núi: dài tùy ý, không giới hạn kích thước, ghép từ đoạn.
- Giữ determinism (§8.12), zoom nguyên, pixel 1:1, neo chân.

Không mục tiêu
- Isometric / ô thoi 2:1, xoay camera, đổi kích thước bàn cờ, đổi luật game ngoài hướng xuất quân.
- Nhìn xéo cho UI HUD. Mobile (E8) làm sau.
- Làm ngay toàn bộ ảnh mới: ảnh AI đi theo từng bộ, bạn duyệt từng ảnh như các batch trước.

## 3. Các quyết định (đã chốt với người dùng ở chat)

1. Kiểu 3/4 kiểu Stardew, không isometric.
2. Tường núi nằm mép trên, chạy hết chiều ngang.
3. Địch chỉ đi từ phía trước (mép S); "dàn binh đi tới".

## 4. Thay đổi logic (`src/game`, `src/data`)

Các lựa chọn của mình (đánh dấu **[mặc định của mình]**, bạn sửa được ở bước duyệt):

- **Hướng xuất quân.** `compose.ts` hiện chọn ngẫu nhiên cạnh từ `N,E,S,W` (1–2 cạnh, `extraEdges` từ cờ vua). Đổi: mọi `edge` = `'S'`. Kiểu `Edge` giữ nguyên để save cũ vẫn giải mã được (`codec.ts` kiểm `edge` thuộc `N|E|S|W`) và boss (`bossEdge`) cũng ra `'S'`. **[mặc định]** Hiệu ứng cờ `extraEdge` (nhiều cạnh tấn công) không còn nghĩa: đổi thành **thêm hàng dàn quân** ở mép S, không đổi số liệu cờ.
- **Đội hình đi tới.** `edgePositions('S', n)` đã dàn ngang theo hàng (`edgeSpan` 0,6, `spawnSpacing` 10, hàng sau lùi `spawnRowGap` 10). Giữ; địch hiện đã tiến thẳng vào mục tiêu gần nhất, nên "đội hình" chính là các hàng này. **[mặc định]** Không thêm hành vi giữ hàng đi cùng nhịp (tránh phình phạm vi); nếu bạn muốn đội hình cứng thì tách thành bước riêng.
- **Tường núi là vật cản cứng.** Thêm `BATTLE.wallY` trong `src/data/battle.ts` (**[mặc định]** 64 đơn vị: giữa mép trên 0 và hàng ô đầu tại 112; chừa 48 đơn vị phía sau hàng ô đầu cho nền). `movement.ts` kẹp mọi đơn vị theo `y ≥ wallY + bán kính` thay vì `y ≥ −fieldClampMargin`. Đạn và hiệu ứng đẩy lùi cũng bị kẹp theo cùng đường. Địch xuất ngoài mép S nên không bị ảnh hưởng.
- **Ai bị chặn:** quân bay cũng bị chặn (núi liền). Không có cổng, không có đường vòng.
- **Spawn mép N còn dùng?** `edgePositions` vẫn hỗ trợ N/E/W cho test cũ và save cũ; không sinh mới.
- **Save.** Quân địch đã lưu trong `RunState.army` có thể mang `edge` cũ (N/E/W). Chấp nhận: trận sẽ xuất ở cạnh đó như trước (hợp lệ, vì mép N nằm ngoài tường: tường chỉ chặn đi vào, không chặn xuất). **Rủi ro:** quân xuất ở N bị kẹp ngay sát tường. **[mặc định]** Khi giải mã, đổi `edge` N/E/W thành S (bản đồ cũ tuy khác hướng nhưng luôn hợp lệ). Không cần tăng `RUN_SAVE_VERSION` vì hình dạng dữ liệu không đổi; có test fixture.
- **Cân bằng.** Địch dồn một hướng làm mô phỏng và kết quả mỗi năm thay đổi; các test hash/golden trong `determinism.test.ts`, `fullRun.test.ts`, `benchmark.test.ts` phải cập nhật có chủ đích. Không đổi ngân sách địch.

## 5. Thay đổi hiển thị (`src/render`, `src/scenes`, `src/ui`)

- **Chiều cao xéo.** Sprite lính/nhà đã neo chân và y-sort; ảnh `ai-v1` (lính, nhà) dùng nguyên. Không đổi camera (vẫn zoom nguyên, không xoay).
- **Tường núi.** Một renderer mới (`MountainWallRenderer` hoặc trong `FieldRenderer`) ghép các đoạn tường dọc mép trên, từ `y = 0` đến `wallY` + phần cao trội lên trên (vách đá cao hơn mép logic, vẽ phía sau, độ sâu thấp hơn mọi sprite). Hai đầu tường nối vào hai bên bằng đá/rừng (đã có 15 vật thể hoang dã).
- **Nền.** Cỏ giữ; thêm dải chân núi (đá vụn, rêu) ở sát tường.
- **Mũi tên báo hướng địch** (`BoardRenderer.setEdgeArrows`): chỉ còn mũi tên phía dưới.
- **Xem trước DEV** và `help.ts` cập nhật: câu "địch từ N/E/S/W" đổi thành "địch tiến từ phía trước".

## 6. Asset

- Tường núi: dài, cao, **không giới hạn kích thước**; làm thành bộ đoạn ghép ngang (tile được) + đầu nối + vài biến thể; chi tiết trong [ASSET_REQUIREMENTS.md §9.1](../../ASSET_REQUIREMENTS.md) và quy ước góc nhìn trong [ART_STYLE.md](../../ART_STYLE.md) (hai phần này đã được cập nhật cùng thiết kế).
- Ảnh phải đi qua kênh duyệt hiện có: Codex tạo từng ảnh, bạn duyệt, rồi mình cắt/ghép và cập nhật `tools/asset-admin/planned.json` và manifest.
- Đồ hiện có (lính, nhà, cỏ, ô bàn cờ, hoang dã) dùng lại được; ô bàn cờ 64×64 vẽ nhìn từ trên có thể cần vẽ lại nhìn nghiêng ở bộ sau, **không chặn** bước này.

## 7. Kiểm thử cần có

- Test đơn vị: mọi `edge` sinh mới là `S`; boss ra `S`; save cũ đổi sang `S`.
- Test mô phỏng: đơn vị bị đẩy lùi/di chuyển/đạn không bao giờ `y < wallY` (cả khi bị knockback sát tường).
- Đối chiếu determinism: cùng seed ra cùng hash, hash mới được ghi lại có lý do.
- Trình duyệt: ảnh chụp 1280×720, tường hiển thị đúng, địch đi từ dưới lên.

## 8. Rủi ro và câu hỏi còn mở

- Kết quả cân bằng khi địch dồn một hướng (khó hơn hay dễ hơn): cần chạy lại bot ngẫu nhiên/kịch bản sau thay đổi.
- Lính mình đứng phía sau hàng ô đầu (y < 112) có chỗ rút lui tối đa 48 đơn vị: **[mặc định]** chấp nhận.
- `wallY = 64` cần xem thực tế với ảnh tường thật rồi chỉnh (số duy nhất trong data).
- Có cần địch *không* bao giờ dừng sát tường khi bị đẩy lùi (kẹt)? Cần test kẹt.

## 9. Việc tiếp theo

1. Bạn duyệt tài liệu này (hoặc sửa các **[mặc định]**).
2. Mình viết plan `docs/superpowers/plans/2026-10-26-oblique-view-mountain-wall.md` (logic có TDD trước, rồi renderer, rồi nối ảnh sau khi bạn duyệt từng ảnh).
