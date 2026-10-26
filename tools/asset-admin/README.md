# Asset admin — TypeScript + DOM thuần

Công cụ độc lập với game/Phaser, không dùng React/TSX hay thư viện runtime mới.
Vite hiện có chỉ biên dịch TypeScript lúc phát triển; không cần build công cụ.

## Chạy

Từ gốc repo: `npm run admin`.

Vite dùng riêng `tools/asset-admin/vite.config.ts`, cổng 5180 (`strictPort`), tự mở
http://localhost:5180/tools/asset-admin/index.html. Trang dựng bản đồ ở
http://localhost:5180/tools/asset-admin/map.html.

Đổi cổng nếu cần: `npm run admin -- --port 5181`.
`root` là gốc repo, `publicDir: false`: URL ảnh `/public/assets/art/ai-v1/...`
trong manifest vẫn giữ nguyên. Không dùng cấu hình Vite/build của game.
Server và cơ chế kiểm đường dẫn nay do Vite quản lý; `serve.mjs` đã được bỏ.

## Cấu trúc

- `src/types.ts`: Manifest/Category/Item/UnitFrames, MapFile/MapItem và guard JSON.
- `src/common.ts`: helper DOM kiểm thiếu/sai loại, context canvas, đọc/chuẩn hoá
  manifest, cache ảnh, placeholder lỗi, vẽ pixel, tab, lọc nhóm và tải tệp.
- `src/admin.ts`: danh mục, tìm kiếm, lọc, chi tiết và animation riêng từng thẻ.
- `src/map.ts`: dựng bản đồ, lịch sử, lưu cục bộ và nhập/xuất.
- `index.html`, `map.html`: nạp trực tiếp entry `.ts` qua Vite.
- `admin.css`, `manifest.json`: giao diện và dữ liệu ảnh hiện có, giữ nguyên.
- `vite.config.ts`, `tsconfig.json`: cấu hình riêng; TypeScript strict, noEmit,
  kế thừa cả noUncheckedIndexedAccess/noUnused từ cấu hình repo.

Không còn `admin.js`, `common.js`, `map.js` hoặc `serve.mjs`.
ESLint hiện tại dùng cấu hình TypeScript recommended toàn repo, không bỏ qua
`tools/`; không nới luật. `npm run typecheck` kiểm game trước rồi công cụ bằng
`tsc --noEmit -p tools/asset-admin/tsconfig.json`.

`manifest.json` do `python tools/slice_art_batches.py` sinh; trình duyệt chỉ đọc.
Dữ liệu đọc từ manifest, localStorage và file nhập bắt đầu bằng `unknown`.
Guard kiểm schema trước khi dùng; map còn kiểm id asset và snap. Không dùng
`any`, type assertion hoặc non-null assertion để bỏ qua kiểm tra.

## Hành vi giữ nguyên

Kho asset có tab danh mục/Tất cả, bộ lọc group kết hợp tìm kiếm, zoom nguyên,
đổi nền, lưới 32 đơn vị thế giới, khung chi tiết và kích thước ảnh÷2.
Lính giữ canvas tối thiểu 112×50 px ảnh, Ta/Địch, Đứng/Đi/Đánh 6/6/10 fps,
tốc độ, lật, đi qua lại, đánh liên tục và dừng; chỉ animate thẻ trong viewport,
dừng RAF khi tab ẩn.

Bản đồ dùng tọa độ px ảnh; ô bản đồ 64 px ảnh = 32 đơn vị thế giới. Plot snap
64 px; terrain 32 px vẫn giữ lưới con 32 px để lát kín như bản trước. Object/lính
neo giữa-đáy, y-sort theo chân; lên/xuống chỉ đổi thứ tự cùng y.

Chọn asset rồi kéo thả hoặc dùng công cụ Đặt. Chọn mục để kéo nhóm, xoá,
nhân bản, lật và đổi phe. Shift thêm/bớt lựa chọn; nhóm có tile di chuyển theo
độ dời chung khớp lưới; nhóm object/lính dùng Shift snap 8 px ảnh. Tile trùng vị trí
được thay thế. Kéo vùng trống để rubber-band, hoặc Alt+kéo khi nền tile phủ kín.
Tô vùng dùng tile đã chọn; rải ngẫu nhiên dùng các object/lính được tick và N/seed.

Space+kéo để cuộn; Esc huỷ kéo/bỏ chọn; Delete xoá; Ctrl+D nhân bản;
Ctrl+Z/Y (hoặc Ctrl+Shift+Z) undo/redo, giữ 100 bước lịch sử.
Phím tắt không chiếm nhập liệu. Resize giữ mục ngoài vùng mới để khôi phục.

Tạo bàn cờ 5×5 thay bản đồ hiện tại, có undo: Ngai giữa, 4 ô mở và 20 ô khoá.
Rải rừng bao quanh dùng vùng trống X/Y/rộng/cao theo ô; vật cao đặt trước và
thiên về mép trên, xen đá nhỏ/bụi. Cả khung ảnh tránh vùng trống, mép canvas và
object/lính sẵn có; thiếu chỗ rải ít hơn N. Cùng manifest/trạng thái đầu/vùng/N/seed
cho cùng kết quả; RNG mulberry32 và thứ tự lấy số ngẫu nhiên giữ nguyên.

Lưu theo tên trong localStorage của origin; cùng tên ghi đè. Đổi cổng sẽ dùng
kho lưu khác. Có tải/xoá bản lưu, xoá hết bản đồ hiện tại và undo.
JSON giữ đúng `{version:1, cols, rows, cell:64, items:[{id,x,y,flip,team}]}`;
JSON hỏng/id lạ/tile lệch lưới bị từ chối, giữ trạng thái hiện tại.
PNG dùng snapshot nội dung/kích thước/nền lúc bấm; frame idle đầu của lính,
nearest sampling, không lưới/viền chọn. Ảnh lỗi có placeholder; ảnh chờ quá 5 giây
báo lỗi để thử lại. Không ghi bản đồ lên server.

## Kiểm tra và phần chưa kiểm chứng

Lượt chuyển TypeScript chỉ đọc mã, đối chiếu tĩnh và tự mô phỏng luồng sự kiện.
Không chạy node/npm/npx, typecheck/lint/build hay trình duyệt trong môi trường này.
Không coi báo cáo subagent là bằng chứng đã chạy.

Claude cần chạy `npm run typecheck`, `npm run lint`, `npm run admin`, sau đó thử:

1. Cả hai entry `.ts`, đường dẫn ảnh `/public/...`, tab/hash sai hoặc rỗng,
   tìm kiếm kết hợp group rồi đổi tab, manifest rỗng/ảnh lỗi.
2. Zoom/nền/lưới/chi tiết, hai thẻ lính độc lập, FPS, dừng/lật/phe/patrol;
   cuộn thẻ ra ngoài viewport và ẩn/hiện tab.
3. Kéo thả, snap 32/64, anchor/y-sort, kéo nhóm, thay tile, rubber-band/Alt,
   tô vùng, seed và Ctrl+D; undo/redo qua 100 thao tác, Esc/blur/ẩn tab khi kéo.
4. Preview theo từng vua, undo/redo, rải rừng cùng seed từ cùng trạng thái;
   vùng trống phủ canvas/sát mép, không đủ chỗ và N lớn.
5. LocalStorage bị chặn/đầy/hỏng; lưu/tải/xoá; JSON round-trip, JSON hỏng,
   id lạ/tọa độ sai; kiểm thông báo guard JSON vì dữ liệu lỗi có thể bị từ chối sớm.
6. PNG đúng kích thước và không làm mờ, xuất khi ảnh đang tải hoặc đang sửa bản đồ;
   bố cục 1280×720/1920×1080 và console không lỗi.

Cần xác nhận đường dẫn root Windows và chính sách truy cập tệp của Vite thực tế;
không dùng kết quả rà server cũ để khẳng định bảo mật server mới.
