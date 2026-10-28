# Prompt cho Codex: lập plan chi tiết làm lại giao diện (dán nguyên khối)

```text
Bạn là kiến trúc sư/lập kế hoạch cho repo Crowned Kingdoms (Phaser 4 + TypeScript strict + Vite + Vitest). NHIỆM VỤ: viết MỘT file plan chi tiết, KHÔNG viết code sản phẩm, KHÔNG sửa file nào khác. Không chạy node/npm (môi trường của bạn không chạy được). Không đụng `.agents/` và `AGENTS.md`.

## Đọc trước (theo thứ tự)
1. `CLAUDE.md` (luật kiến trúc: tầng, xác định, UI chỉ đọc state và gửi intent qua EventBus, nine-slice từ texture `ui`, `FONT_UI`, mục tiêu cảm ứng >= 44x44, desktop 1280x720 / mobile 375x812, width >= 768 dùng desktop, layout tính trong file thuần có test).
2. `docs/ART_STYLE.md` (phong cách, bảng màu `PALETTE` Hearth 32 cho thế giới, `UI_PALETTE` cho giao diện).
3. `docs/superpowers/specs/2026-10-28-king-select-redesign-design.md` (spec màn chọn vua, ĐÃ có; mở rộng phạm vi ở dưới).
4. `docs/art-review/HANDOFF.md` và `docs/ROADMAP.md`.
5. Code giao diện hiện tại: `src/scenes/{KingSelectScene,MainMenuScene,BattleHudScene,PlanningHudScene,RealmScene,RunEndScene}.ts`, `src/ui/theme.ts`, `src/ui/hud/layout.ts`, `src/ui/kingSelectLayout.ts`, `src/ui/cards/CardView.ts`, `src/ui/modals/*` (nhất là `RewardModal.ts`, `modalLayout.ts`), `src/ui/planning/CalendarStrip.ts`, `src/render/uiArt.ts`, `src/data/uiPalette.ts`, `src/ui/input/shortcuts.ts`.
6. Xem 5 ảnh tham chiếu trong `.superpowers/ui_refs/` (chỉ lấy BỐ CỤC, nhịp và cách đổi màu theo vua; KHÔNG sao chép hình, nhân vật, thẻ, font hay màu y nguyên của game khác):
   - `a-choose-a-king.webp`: màn CHỌN VUA — tiêu đề giữa trên, nút quay lại góc trái trên, carousel ngang thẻ vua dọc (giữa to sáng, hai bên nhỏ dần và hạ thấp, vua khóa xám có "?" và ổ khóa, điều kiện mở khóa), tên vua "King of <danh hiệu đổi màu>" trên thẻ giữa, mũi tên hai bên. Thẻ kiểu bài tây (chữ K + chất ở hai góc, viền loang khói).
   - `b-king-of-spells.webp`, `c-king-of-nothing.webp`: màn chi tiết vua — lưới 3x3 chín thẻ dọc bên trái (tên ở đầu thẻ), thẻ vua lớn bên phải, thanh cấp, hàng cuối PERKS / DIFFICULTY ‹ › / PLAY. Cả màn đổi bảng màu theo vua.
   - `d-battle-hud.webp`: HUD trong trận/lập kế hoạch — góc trái trên: số vàng với biểu tượng; cột biểu tượng tròn (di vật/kỹ năng) bên dưới; giữa trên: dải lịch các năm (nút tròn/hình thoi nối nhau, năm hiện tại sáng) và "YEAR 21" bên dưới; góc phải trên: nút auto, tạm dừng, chạy, nhanh, nhanh hơn; góc trái dưới: tên vua mình + thanh máu có số "44 | 60" màu theo vua; góc phải dưới: tên đội/vua địch + thanh máu xám/đỏ "92 | 118". Rất ít khung nặng, nhiều chữ nổi trên nền thế giới.
   - `e-loot-pick.webp`: chọn phần thưởng sau trận — nền tối mờ, tiêu đề "BATTLE WON" và "PICK YOUR LOOT" giữa trên, ba thẻ dọc cạnh nhau (đầu thẻ: biểu tượng loại + tên; giữa: tranh; dưới: ô mô tả), dòng "REROLL: 10 <vàng>" bên dưới, biểu tượng nhỏ ở đáy; thẻ cùng bảng màu theo vua.

## Phạm vi plan (tất cả đều là thay đổi hành vi giao diện, tiếng Việt, chữ `FONT_UI`)
A. Màn chọn vua + chi tiết vua: đúng spec đã duyệt (carousel, chi tiết 3x3, ĐẶC QUYỀN vô hiệu hóa, ĐỘ KHÓ một mức chừa chỗ Gai 0-5, CHƠI; BỎ thanh Cấp; giữ `RealmData = { seed, kingId }`, ô seed gọn).
B. HUD trong trận và lập kế hoạch (`BattleHudScene`, `PlanningHudScene`, `CalendarStrip`): làm lại bố cục theo ảnh d. Giữ MỌI chức năng hiện có (vàng, lịch năm, tốc độ/tạm dừng/auto, thanh máu hai phe, tooltip, phím tắt) — chỉ đổi bố cục/kiểu; liệt kê rõ mục nào ảnh d có mà game chưa có (ví dụ cột di vật tròn) và mục nào game có mà ảnh d không có (tay bài, ô bàn...), kèm đề xuất giữ ở đâu.
C. Màn chọn phần thưởng (`RewardModal`, `overlay.ts`): thẻ dọc theo ảnh e, tiêu đề, dòng reroll, nền mờ.
D. Thẻ dọc dùng chung: một `CardView` dọc (đầu: biểu tượng loại + tên; tranh; ô mô tả) dùng cho lưới 3x3, phần thưởng, tay bài, kho bài, trợ giúp — liệt kê nơi nào đang dùng thẻ ngang và cách chuyển.
E. Bảng màu theo vua: `KING_THEMES` trong `src/data/uiPalette.ts` áp cho màn A, thanh máu, thẻ, nút trong ván của vua đang chơi.
F. Các màn khác (menu chính, tạm dừng, kết thúc ván, trợ giúp, hội đồng, nhiệm vụ, kho bài): chỉ cần kiểu khung/nút/tiêu đề đồng bộ với A–E; ở mỗi màn nêu mức thay đổi tối thiểu.

## Ràng buộc đã chốt với chủ dự án
- Chân dung vua 96x144 (2:3), đang được vẽ (`docs/art-review/g3e/portraits/`); CHƯA nối vào `src` khi chưa duyệt, nên plan dùng art tạm.
- Thẻ trong lưới 3x3 dùng thẻ dọc MỚI; tranh thẻ dọc cho 94 thẻ là dự án art riêng (plan chỉ ghi phụ thuộc và cách đổi nguồn ảnh, không đổi bố cục khi art về). Plan phải nói rõ art tạm là gì.
- Không có hệ thống cấp vua, Perks, độ khó thật: chỉ chừa chỗ.
- Công trình đang tạm dừng; không vẽ công trình.
- Phần thuần (layout, mô hình carousel, tách tên vua, bảng màu...) làm theo TDD; cảnh Phaser kiểm bằng Playwright qua `window.game`. Mỗi task nhỏ, có file chính xác, test trước, lệnh kiểm, và commit riêng. Cổng cuối mỗi nhóm: `npm run lint && npm run typecheck && npm test && npm run build`.
- Không phá `src/game|data|core` (không import Phaser/UI), xác định (không `Math.random`/`Date.now` ngoài UI), mọi số lượng chơi nằm trong `src/data/*`.

## Kết quả cần nộp
Một file `docs/superpowers/plans/2026-10-28-ui-redesign.md` theo định dạng của `superpowers:writing-plans` (xem các plan mẫu trong `docs/superpowers/plans/`), gồm:
1. Tổng quan kiến trúc và thứ tự nhóm (đề xuất: D thẻ dọc dùng chung -> E bảng màu -> A chọn vua -> C phần thưởng -> B HUD -> F đồng bộ), nêu phụ thuộc và nhóm nào song song được.
2. Với mỗi nhóm: danh sách file tạo/sửa/xóa (đường dẫn thật), hàm/kiểu thuần cần test, các bước TDD bite-size, cách kiểm bằng trình duyệt ở 1280x720 và 375x812, rủi ro.
3. Bảng "ảnh tham chiếu -> thành phần -> file" và danh sách chức năng hiện có phải giữ nguyên.
4. Danh sách CÂU HỎI MỞ cho chủ dự án (chỉ những điều thật sự cần họ quyết, mỗi câu kèm phương án đề xuất).
Viết bằng tiếng Việt, ngắn gọn, đường dẫn dạng `path`. Khi xong, chỉ in đường dẫn file plan và danh sách câu hỏi mở.
```

Chạy (từ gốc repo, ảnh tham chiếu nằm trong `.superpowers/ui_refs/`):

```bash
codex exec --sandbox workspace-write -C "$PWD" -i .superpowers/ui_refs/a-choose-a-king.png -i .superpowers/ui_refs/b-king-of-spells.png -i .superpowers/ui_refs/c-king-of-nothing.png -i .superpowers/ui_refs/d-battle-hud.png -i .superpowers/ui_refs/e-loot-pick.png - < .superpowers/codex-plan-prompt.txt
```

Trước đó tách khối ```text``` ở trên ra `.superpowers/codex-plan-prompt.txt` (đã tạo sẵn). Ảnh `.png` nằm cạnh bản `.webp` trong `.superpowers/ui_refs/` (git-ignored); chạy lệnh từ đúng worktree này.
