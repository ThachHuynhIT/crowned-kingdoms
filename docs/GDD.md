# Crowned Kingdoms — Game Design Document (rút gọn)

> Bản tóm tắt sống của thiết kế. Nguồn chuẩn cho mọi con số, luật và nội dung: [spec tổng](superpowers/specs/2026-10-16-crowned-kingdoms-design.md). Khi một cơ chế thay đổi, sửa spec trước, rồi file này, rồi code.
> Lộ trình: [ROADMAP.md](ROADMAP.md) · Quy chuẩn hình ảnh: [ART_STYLE.md](ART_STYLE.md)

## Elevator pitch

Bạn là vua của một vương quốc nhỏ trên bàn cờ 5×5. Năm đầu có 5 thẻ, mỗi năm sau rút thêm 1 (2 ở năm hội đồng và năm sau boss); chơi hoặc bán thẻ — dựng trại lính, tháp cung, ruộng lúa, gắn bùa, hoặc mua thêm thẻ bằng vàng — tới khi trên tay còn 2 lá, rồi quân mình **tự động đánh** với đạo quân của một vua láng giềng trên cánh đồng quanh vương quốc, tới khi một bên thua (quá 5 phút là thua). Sống qua năm 30 là thắng; hết mạng là thua.

**Thể loại:** roguelite xây vương quốc + tự động đánh · 2D pixel art · fantasy ấm áp, dễ thương (lính chibi, đồng lúa, giao diện gỗ + giấy kem kiểu Stardew Valley) · web-first, PWA. Tên: Crowned Kingdoms (trước đây _Chín Vương Miện_ / _Nine Crowns_); repo và package `crowned-kingdoms`.

## Vòng một năm (spec §3.2)

Đầu năm (thuế, tăng trưởng, rút bài) → **Lập kế hoạch** (xem lịch và trinh sát đạo quân địch, đổi bài, mở ô, chơi đúng 1 thẻ hoặc bỏ lượt) → **Trận** tự động → Sau trận → Thưởng (thắng: chọn 1 trong 3 thẻ) → Chinh phục (thắng một vua ở lần tấn công thứ 3) → Hội đồng (năm 5, 10, 15, 20, 25: chọn 1 sắc lệnh) → Lưu.

## Các hệ thống chính

| Hệ thống                 | Tóm tắt                                                                                                                        | Spec      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Ván                      | 30 năm, 3 mạng, vàng (thuế, thắng trận, chinh phục, bỏ lượt); boss năm 10/20/30                                                | §3        |
| Bàn cờ                   | 5×5, mở sẵn 3×3 giữa, Ngai ở ô 2 (hàng sau, giữa, tựa núi); mở thêm ô bằng vàng/sách phép/sắc lệnh; lân cận trực giao                                    | §4        |
| Thẻ                      | Ngai · Lính · Tháp · Kinh tế/Hỗ trợ · Bùa (cộng dồn) · Sách phép; chơi trùng = lên cấp (tối đa 5); hiệu ứng mô tả bằng dữ liệu | §4–§5     |
| Vua                      | 9 vua: Lúa Mì, Đá Núi, Phép Thuật, Rừng Xanh, Thuỷ Triều, Lò Rèn, Đồng Hồ, Ánh Trăng, Du Mục — mỗi vua 1 Ngai + 9 thẻ + 3 perk | §6        |
| Kẻ địch                  | 6 vua địch mỗi ván theo lịch cố định, Thổ Phỉ, Liên Quân; ngân sách quân tăng 15%/năm; xem trước chính xác từng đợt            | §3.5–§3.6 |
| Trận                     | Mô phỏng deterministic 10 tick/s trên cánh đồng 768 px (ô 64 px, nhìn isometric 2:1, địch vào từ bên phải màn hình); lính sinh từ ô, tháp bắn, địch vào từ mép; một kỹ năng can thiệp       | §8        |
| Sắc lệnh, nhiệm vụ, boss | 18 sắc lệnh, 13 nhiệm vụ, 3 boss                                                                                               | §7        |
| Meta                     | Điểm Vương Miện cuối ván mở vua, perk, thẻ và độ khó Gai 0–5                                                                   | §9.1–§9.2 |
| Lưu                      | IndexedDB: ván giữa các năm + meta                                                                                             | §9.3      |

## Thắng / Thua

- **Thua trận:** Ngai về 0 máu → mất 1 mạng. **Thua ván:** hết mạng.
- **Thắng ván:** sống qua năm 30 (thắng boss 3 = "Vương Miện Vàng"). Ván bắt đầu với **2 mạng** (cân bằng G5).

## Chế độ Vô tận (spec `2026-11-09-endless-mode-design.md`)

- Mở sau ván 30 năm đầu tiên thắng được. Chọn ở trang chi tiết vua ("30 năm" / "Vô tận"); vẫn chọn vua, perk và Gai như thường.
- Bàn 7×7: thêm một vòng 24 ô ngoài, khoá lúc đầu, mua bằng vàng (20 + 2 × số ô đã mua). Ngai giữ chỗ cũ.
- Không có năm cuối: lịch 30 năm lặp lại (boss ở năm 40/50/60…, mạnh dần mỗi chu kỳ 30 năm), ván chỉ hết khi hết mạng. Điểm = số năm sống sót.
- Phúc lành: ở năm 30 và mỗi 5 năm sau, chọn 1 trong 3 phúc lành vĩnh viễn (12 loại: thuế, vàng thắng trận, máu/sát thương/tốc độ lính, tháp, công trình, mạng, lãi, đổi bài, giá ô).
- Biến thể theo thập niên từ năm 31: Tinh nhuệ, Hai lưỡi, Khó mùa, Công thành (đổi mỗi 10 năm).
- Điểm Vương Miện: tính tối đa 60 năm và 3 boss.

## Nguyên tắc kỹ thuật

- **Luật tách khỏi hiển thị.** `src/game` (luật), `src/data` (dữ liệu), `src/core` (hạ tầng thuần) không import Phaser hay `scenes/render/ui/platform/audio`; `src/data` không import `src/game` (ESLint chặn).
- **Deterministic.** Không `Math.random`, `Date.now`, `performance.now`, `Math.hypot/sin/cos/tan/atan2/exp/log/pow` trong `src/game`, `src/core`, `src/data`; ngẫu nhiên đi qua `Rng` + `hashSeed` theo luồng (`'draw'`, `'army'`, …). Cùng `BattleSetup` + cùng lệnh can thiệp → cùng kết quả từng bit.
- **Data-driven.** Mọi con số gameplay ở `src/data/*`.

## Trạng thái

G0 đến G4 xong: "Tiếp tục", "Ván mới" hoặc "Vương Miện" → chọn 1 trong 9 vua (vua mới mở bằng Điểm Vương Miện; chọn tối đa 1 perk đã mở và độ khó Gai 0–5), ván 30 năm (luật 10/11/2026: rút 1 thẻ mỗi năm, chơi hoặc bán tới khi còn 2 thẻ, mua thẻ bằng vàng; trước đó: rút 3 thẻ, chơi hoặc bán 1 thẻ lên bàn 5×5, vàng để đổi bài và mua ô, cấp và Bùa, lịch với sáu vua địch, Liên Quân và cờ hiệu, chinh phục vua sau lần tấn công thứ 3 và nhận thẻ của họ, hội đồng với 18 sắc lệnh, 13 nhiệm vụ, 3 boss, trận tự động + Can Thiệp), lưu ván IndexedDB, headless + bot `random` và `scripted`. Cuối ván tính Điểm Vương Miện, thông thạo và mở khoá (lưu IndexedDB). G5 (đang làm, PR #15): cân bằng chín vua 45–56% với bot greedy, âm thanh và nhạc sinh bằng code, màn Cài đặt, hiệu ứng trận, PWA chơi offline, art isometric và lính bằng ảnh cho cả 9 vua; chế độ Vô tận đang làm giao diện. Xem [ROADMAP.md](ROADMAP.md).
