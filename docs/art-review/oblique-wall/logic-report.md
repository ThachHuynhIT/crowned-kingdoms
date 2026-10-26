# Báo cáo logic T1–T4: địch chỉ từ phía trước + tường núi

Ngày 26/10/2026. Plan: `docs/superpowers/plans/2026-10-26-oblique-view-mountain-wall.md`.

## Cách đo
- Harness: `src/game/sim/obliqueBalance.test.ts` (`VITE_WALL_BALANCE_SEEDS=100`), 3 vua (wheat, stone, arcane) × seed 1..100 × 2 bot (random, scripted) = 600 ca, luật `RULES_FULL`, chạy `runHeadless` thật.
- Trước: commit `d4cc658` (worktree tạm) → `before.log`. Sau: commit T3 + thay đổi fixture T4 → `after.log`. Cùng máy.
- So sánh: `python tools/compare_wall_balance.py before.log after.log` (kết quả trong `compare.txt`).

## Kết quả
| Bot | Thắng trước → sau | Median năm kết thúc | Bot lỗi lệnh |
|---|---|---|---|
| random | 0,0% → 0,0% | 12,5 → 10,0 (−2,5) | 0 → 0 |
| scripted | 0,3% → 11,3% (**+11,0 điểm**) | 20 → 22 (+2) | 1 → 3 |

Scripted theo vua: arcane 0 → 14%, stone 1 → 18% (**+17 điểm**), wheat 0 → 2%.

## Cổng của plan
Ngưỡng: ≤ 10 điểm tổng mỗi bot, ≤ 15 điểm mỗi vua/bot, median năm ±3.
**Vượt hai ngưỡng**: scripted tổng +11,0 (ngưỡng 10) và scripted/stone +17 (ngưỡng 15). Theo plan, dừng và để người dùng duyệt thay đổi cân bằng; không tự đổi ngân sách hay ngưỡng.

## Giải thích sơ bộ (chưa kiểm chứng)
Địch dồn về một hướng nên tháp và quân phe mình tập trung hỏa lực dễ hơn, dẫn tới scripted bot thắng nhiều hơn. Random bot chết sớm hơn một chút (median năm 12,5 → 10) vì từ năm 10 địch có thêm hàng dàn quân.

## Lỗi có sẵn của bot
Một số ca bot đánh lệnh `play` bất hợp pháp (`lastLife`), có cả ở trước và sau; harness ghi `crashed: true`, tính là thua, loại khỏi median năm.

## Đổi fixture test
- `determinism.test.ts`: SETUP cả hai đợt từ mép S; điểm can thiệp (192, 100) → (192, 290) để tảng đá thực sự trúng kỵ lợn ở tick 36 (assert `knocked > 0` đã có sẵn, vẫn pass).
- `benchmark.test.ts`: stress chính 120 địch từ S (trước: 30 × bốn mép); trần 2 ms/tick vẫn pass.
- Không có bảng hash cố định để cập nhật.

## Đo lại sau khi đổi wallY 64 → 88 (26/10/2026)
`after_wally88.log` (cùng harness, 600 ca, seed 1..100). So với baseline trước T1:

| Bot | Thắng trước → sau | Median năm |
|---|---|---|
| random | 0,0% → 0,0% | 12,5 → 10,0 |
| scripted | 0,3% → 12,3% (+12,0 điểm) | 20 → 22 |

Scripted theo vua: arcane 14%, stone 21% (+20), wheat 2%. So với lần đo `wallY` 64: scripted tổng +1,0 điểm, stone +3, các số khác đứng yên, số lần bot lỗi lệnh vẫn 3. Người dùng đã chấp nhận mức lệch của lần đo trước; `wallY` 88 chỉ thêm khoảng 1 điểm, không đổi kết luận. Cổng (10 điểm tổng, 15 mỗi vua) vẫn vượt như trước.
