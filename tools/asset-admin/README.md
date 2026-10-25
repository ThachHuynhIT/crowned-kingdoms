# Asset admin — kế hoạch và hướng dẫn

Công cụ độc lập, HTML/CSS/ES module; không phụ thuộc Phaser, thư viện hay build.
Đặc tả: yêu cầu người dùng trong phiên làm việc ngày 2026-10-26.

## Cấu trúc và kế hoạch thực hiện

- [x] `serve.mjs`: phục vụ gốc repo tại loopback, MIME, no-store, kiểm tra traversal và realpath để chặn symlink ra ngoài.
- [x] `common.js`: đọc/kiểm tra manifest, cache ảnh, placeholder ảnh lỗi, vẽ pixel, tab và tải tệp.
- [x] `index.html`, `admin.js`, `admin.css`: danh mục động, tìm kiếm, xem ảnh, animation riêng từng thẻ; chỉ chạy thẻ trong viewport và khi tab trình duyệt hiện.
- [x] `map.html`, `map.js`: tọa độ pixel ảnh, tile snap, y-sort, chọn/kéo nhóm, 100 bước lịch sử, fill chữ nhật, scatter seed, localStorage, nhập/xuất JSON và PNG.
- [x] Chỉ thêm script `admin` trong package.json; không commit.
- [x] Đọc lại mã và kiểm tra diff/phạm vi thay đổi.
- [ ] Chạy trên Node 24 và thử giao diện trong trình duyệt: môi trường viết mã không có node/npm trong PATH.

## Chạy

Tại gốc repo: `npm run admin`.

Mở http://localhost:5180/tools/asset-admin/index.html hoặc theo liên kết Dựng bản đồ.
Đổi cổng trong PowerShell: `$env:PORT=5181; npm run admin`.
Server chỉ lắng nghe 127.0.0.1, phục vụ gốc repo để ảnh `/public/...` hoạt động.
Không cần cài thêm package hoặc chạy build.

`manifest.json` là dữ liệu đầu vào do quy trình asset khác sinh. Khi bắt đầu chưa có
manifest nên đã tạo mẫu rỗng; trong lúc thực hiện manifest thật đã xuất hiện từ quy
trình khác. Công cụ chỉ đọc dữ liệu này, không ghi manifest qua trình duyệt.
Không có asset giả hay ảnh được tải từ mạng.

## Cách dùng bản đồ

Chọn asset rồi kéo vào canvas, hoặc chọn công cụ Đặt asset và click. Tick nhiều
object/lính để tạo nhóm rải; nhập N và seed rồi dùng công cụ Rải ngẫu nhiên kéo
vùng chữ nhật. Lấp đầy ô cũng dùng vùng chữ nhật; chọn một tile trước khi kéo.

Ở chế độ Chọn, kéo trên vùng trống để chọn nhiều; Shift click thêm/bớt lựa chọn.
Kéo một mục trong nhóm để di chuyển cả nhóm. Nhóm có tile dùng độ dời chung khớp
lưới tile; nhóm object/lính dùng Shift để snap độ dời 8 px. Tile trùng vị trí được
thay thế. Chọn mục rồi dùng Lật ngang, Phe, Đưa lên/xuống (chỉ đổi thứ tự cùng y).

Space + kéo để cuộn; Ctrl+Z/Y hoàn tác/làm lại, Ctrl+D nhân bản, Delete xoá,
Esc bỏ chọn. Phím tắt không chiếm thao tác nhập trong ô văn bản.
Đổi kích thước bản đồ giữ các mục bên ngoài vùng mới để có thể khôi phục lại.
PNG xuất đúng kích thước pixel ảnh, có màu nền hiện tại, không có lưới/viền chọn;
lính dùng frame idle đầu tiên. Ảnh lỗi được thay bằng khung Thiếu ảnh.

Bản lưu đặt tên trong localStorage của origin (đổi cổng sẽ dùng kho riêng).
Lưu lại cùng tên thay thế bản lưu đó. Xoá bản lưu chỉ tác động bản lưu được chọn;
Xoá hết tác động bản đồ đang mở và có thể hoàn tác.
JSON có id lạ, tọa độ sai hoặc tile lệch lưới bị từ chối kèm thông báo; trạng thái
hiện tại được giữ nguyên. Không ghi tệp bản đồ lên server.

## Kiểm tra cần chạy trên máy có Node

1. `npm run admin`: mở cả hai trang; kiểm tra MIME/no-store, ảnh trong public,
   đường dẫn không tồn tại, `/%2e%2e/package.json`, symlink ra ngoài repo.
2. Với manifest thật: thử mọi tab/hash, tìm tags/group, zoom, nền, ảnh thiếu;
   animation hai thẻ độc lập, phe/flip/patrol, cuộn thẻ khuất và ẩn tab trình duyệt.
3. Tile 32/64 px, object/unit: kéo thả, snap, kéo nhóm, thay tile, y-sort cùng chân,
   đổi phe, 100 thao tác rồi undo/redo, Ctrl+D, pan tại zoom 1–4.
4. Tô vùng, rải cùng seed/vùng/N, lưu/tải/xoá, JSON round-trip, JSON hỏng/id lạ,
   localStorage bị chặn hoặc đầy, PNG không lưới và kích thước đúng.
5. Xem bố cục tại 1280×720 và 1920×1080.
6. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Đã thử gọi cả bốn lệnh kiểm tra: đều không chạy vì không tìm thấy npm.
`git diff --check` chạy được và không báo lỗi. Chưa xác nhận cú pháp bằng Node,
chưa chạy server hay xác nhận thao tác thực tế trong trình duyệt.
