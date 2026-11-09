# Làm lại chiến trường: công trình chặn đường, đội hình, tầm bắn, cổng, nhiều bản lưu, UI Kenney (09/11/2026)

Theo lưu ý của chủ dự án ngày 09/11/2026. Nhánh `battle-field-rework` (tách từ `g5-balance-polish`).

## 1. Địch phá hết công trình rồi mới đánh Ngai

- Hết lính phe mình đánh được, địch nhắm **công trình phe mình gần nhất ở bất kỳ đâu** (không còn giới hạn `enemyAggro`/`siegeAggro`). Ngai chỉ là mục tiêu khi không còn công trình nào sống.
- Khiêu khích (taunt) giữ nguyên ưu tiên cao nhất.
- **Cuồng Nộ** (từ `rageTick`): địch vẫn phải phá hết công trình, nhưng bỏ qua lính phe mình (như cũ) và gây **thêm `rageStructureDmgPct` sát thương lên công trình** (mặc định +100%), cộng với tốc độ +50% như cũ.

## 2. Tầm bắn công trình ×3

- Tầm đòn bắn của mọi công trình loại `tower` có `attack` nhân `towerRangeMult = 3`, gồm cả phần cộng theo cấp (`TOWER_RANGE`).
- Không đổi: bán kính xung (pulse), khiên, hồi máu, khiêu khích, đẩy lùi, và tầm của lính.

## 3. Kích thước lính

- Nhóm khổng lồ (Rồng Sắt, Colossus, Treant, Golem, Ogre) cao khoảng 2 lần lính thường; Gấu, Construct, Moon Reaper khoảng 1,6 lần; ba boss cao hơn nữa để vẫn to nhất. Đổi `HEIGHT` trong `docs/art-review/g3e/units/make_prompts.py`, cắt lại tư thế từ ảnh nguồn đã duyệt (không vẽ lại).
- Chỉ đổi hình: bán kính va chạm giữ nguyên (không nới hitbox để chữa art).

## 4. Công trình chặn đường, đi vòng, đội hình, giới hạn đi xa

- **Mỗi công trình đứng trên ô đất riêng và không chiếm cả ô.** Khối chặn là hình vuông quanh tâm ô, cạnh `structureFootprint` (mặc định 40 px trên ô 64 px); phần đất còn lại của ô đi được.
- **Không ai đi xuyên công trình**, cả phe mình lẫn địch (bỏ `passTeam`). Bay vẫn đi qua.
- **Tìm đường:** lưới 16 px trên cả sân, ô bị công trình chiếm là vật cản. Mỗi lính đi theo bước kế tiếp của đường BFS (8 hướng, không cắt góc) tới mục tiêu; tính lại khi đổi mục tiêu hoặc mỗi `retargetTicks`. Deterministic: thứ tự hướng cố định, không dùng `Map`/`Set` để quyết định.
- **Đội hình sau trận / khi rảnh:** lính rảnh không về cửa nhà mà về một ô trong **đội hình trước bàn cờ** (dải đất ngay phía nam mép bàn cờ). Cận chiến (tầm < `meleeMaxRange`) đứng hàng trước (phía nam), bắn xa đứng hàng sau; trong mỗi nhóm xếp theo id.
- **Giới hạn đi xa:** lính phe mình không đi ra ngoài vùng bàn cờ nới thêm `allyLeashPlots = 4` ô mỗi phía; mục tiêu ngoài vùng đó bị bỏ qua.

## 5. Cổng dịch chuyển xa hơn 1,5 lần

- Khoảng cách từ mép nam bàn cờ tới cổng nhân 1,5. Sân nới về phía nam cho vừa; đường, camera, trang trí và đoạn đường ra cổng theo kích thước mới.

## 6. Nhiều bản lưu

- Kho `run` lưu nhiều ô, khoá là id ô; mỗi ô có tên, thời điểm lưu, vua, năm. Ô tự động lưu (`auto`) luôn có; người chơi lưu thêm vào ô có tên.
- Bản lưu cũ (khoá `current`) chuyển thành ô tự động lưu khi mở.
- Màn danh sách bản lưu: tải, đổi tên, xoá. Tất cả trên máy (IndexedDB), ngày giờ chỉ đọc ở `src/platform`.

## 7. Giao diện theo bộ Kenney

Thay bộ Pixel UI Pack bằng ba bộ CC0 của Kenney do chủ dự án chọn: UI Pack - Pixel Adventure (khung, nút), Fantasy UI Borders (viền panel), UI Pack - RPG Expansion (thanh, ô). Đăng ký license, manifest, CREDITS trước khi commit; giữ `uiFrameDef` là nguồn kích thước duy nhất.

## Cân bằng

Mục 1, 2, 4 làm người chơi mạnh lên. Sau khi xong, chạy lại `npm run balance` và chỉnh dữ liệu để bot greedy Gai 0 thắng 35–65% mỗi vua, chênh lệch ≤ 15 điểm.

## Giới hạn đã biết (soát lỗi 09/11/2026)

- **Boss to chen giữa hai nhà:** khe giữa hai khối chặn kề nhau rộng 28 px. Một boss bán kính ≥ 14 không lọt qua khe đó, nên có thể tì vào tường nhà khi đuổi một lính phe mình nằm sâu trong bàn cờ. Luật "đánh công trình gần nhất" và Cuồng Nộ giới hạn tác hại; tìm đường thật (nhiều vật cản một lúc) để sau.
- **Tầm đánh cận chiến tính theo hình tròn, khối chặn là hình vuông:** một lính cận chiến tới gần góc nhà dừng ở khoảng cách tròn, rồi bị đẩy ra khỏi hình vuông, nên mất vài tick đánh cho tới khi trượt về giữa cạnh. Chỉ ảnh hưởng cân bằng; muốn sửa thì dùng khoảng cách mép theo hình vuông cho công trình.
