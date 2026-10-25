# Crowned Kingdoms — Quy chuẩn sản xuất và duyệt asset

Ngày bắt đầu: 23/10/2026. Quy trình do người dùng yêu cầu: làm từng bộ, mỗi bộ phải được người dùng duyệt trước khi làm bộ tiếp theo.

## 1. Phạm vi và nguồn chuẩn

- Tuân theo [ART_STYLE.md](ART_STYLE.md), [ASSET_LICENSES.md](ASSET_LICENSES.md) và hợp đồng frame trong `src/render/atlas.ts`.
- Dùng [ASSET_INVENTORY.md](ASSET_INVENTORY.md) làm danh mục công việc, kiểm lại registry trên nhánh tích hợp trước khi thay hình. Checkout hiện tại còn dùng art G1; không suy ra nội dung develop từ checkout này.
- Không thay gameplay, kích thước ô, camera hoặc tốc độ animation chỉ để khớp một hình mới.
- Bản quy chuẩn này là hướng dẫn sản xuất. Các lựa chọn mỹ thuật đầu tiên là đề xuất của người làm, được chốt qua ảnh duyệt.

## 2. Quy trình bắt buộc cho từng bộ

1. **Định nghĩa bộ:** ghi batch ID, CardId/UnitId, danh sách đầu ra, kích thước và nơi sử dụng.
2. **Tạo ảnh nguồn:** một chủ thể hoặc một loại asset trong mỗi bộ đầu; lưu prompt, nguồn gốc và phiên bản. Ảnh chưa duyệt nằm ngoài thư mục asset runtime.
3. **Duyệt hình:** hiển thị ảnh cho người dùng. Chỉ khi người dùng đồng ý mới xử lý và tích hợp phiên bản đó. Yêu cầu chỉnh sửa giữ cùng batch, tăng version.
4. **Tách bằng script:** crop theo tọa độ được ghi trong JSON; xuất từng PNG riêng, giữ alpha. Không gọi việc xóa nền hoặc vẽ thêm nội dung là crop. Nếu cần sửa hình, dùng imagegen; script chỉ làm thao tác kỹ thuật đã được yêu cầu.
5. **Chuẩn hóa:** fit vào canvas gốc đúng tỷ lệ; lượng tử hóa về palette phù hợp, kiểm alpha và sửa pixel ở kích thước thật. Không coi thu nhỏ tự động là hoàn tất mỹ thuật.
6. **Tạo preview kỹ thuật:** ảnh nguồn, ảnh đã tách, sprite ở 1× và phóng nguyên lần, tranh thẻ nếu có, ảnh trong game. Ghi rõ mọi khác biệt nhìn thấy so với ảnh đã duyệt.
7. **Tích hợp:** giữ tên frame cũ; chỉ override các frame được duyệt, giữ fallback procedural cho phần còn lại. Không thay cả atlas khiến quân/công trình khác biến mất.
8. **Kiểm và duyệt trong game:** chạy kiểm tra phù hợp, xem desktop và mobile, trình bày kết quả. Đợi người dùng chấp nhận kết quả bộ hiện tại rồi mới tạo ảnh bộ tiếp theo.

Luồng trạng thái: `draft → awaiting-art-approval → art-approved → extracted → integrated-preview → accepted`. Không tự chuyển sang approved/accepted dựa trên thời gian chờ hoặc không có phản hồi. Duyệt hình nguồn không đồng nghĩa đã nghiệm thu bản sprite thu nhỏ.

## 3. Ngôn ngữ hình ảnh

- Fantasy ấm áp, thân thiện; vương quốc nhỏ, lính chibi, gỗ và đá có cảm giác thủ công.
- Vật liệu và vai trò rõ bằng silhouette trước, chi tiết sau. Công trình Dân Quân khác Trại Lính và Thợ Gặt ngay cả khi bỏ màu.
- Góc nhìn phù hợp sân top-down hiện tại: nhìn thấy mái và mặt trước, không góc isometric hình thoi hoặc phối cảnh quá sâu. Các công trình cùng bộ dùng cùng góc máy.
- Ánh sáng trên-trái; bóng xuống phải; viền nâu/mận ấm. Không ánh sáng nhiều hướng hoặc bóng đổ dài che ô bên cạnh.
- Bản concept có thể chi tiết, nhưng sprite cuối cần cụm pixel rõ, không anti-aliasing/gradient mượt, không họa tiết nhiễu. Không cam kết giữ mọi chi tiết concept trong 32×40 px.
- Từ G3e không giới hạn RGB; mép alpha 0/255, bóng khai báo alpha 128, không anti-aliasing, mật độ 2 px ảnh/đơn vị thế giới (xem `ART_STYLE.md`).
- Phân biệt phe theo hệ màu/viền đang dùng; không tự biến mọi phe thành xanh chỉ vì ảnh concept trước có áo xanh.
- Không chữ, watermark, tên asset hoặc giao diện giả được vẽ vào hình nguồn. Chữ UI do game dựng.

## 4. Kích thước đầu ra

| Loại         | Canvas runtime           | Ghi chú                                                              |
| ------------ | ------------------------ | -------------------------------------------------------------------- |
| Terrain      | 16×16                    | Cần kiểm mask/đường nối; không dùng ảnh phong cảnh làm tileset       |
| Ô bàn cờ     | 32×32                    | open/locked/throne                                                   |
| Công trình   | 32×40                    | Chân giữa ở đáy; không kèm nền ô vuông riêng                         |
| Ngai         | 32×48                    | Giữ silhouette và điểm neo                                           |
| Quân nhỏ/cao | 16×16 hoặc 16×24         | Theo UnitDef thực tế                                                 |
| Quân lớn     | 24×24 hoặc 24×32         | Theo UnitDef thực tế                                                 |
| Boss         | 48×48                    | Theo spec và dữ liệu khi đã triển khai                               |
| Tranh thẻ    | 32×24                    | Bố cục lại nếu crop làm mất chủ thể                                  |
| Chân dung    | Theo code nhánh tích hợp | Tài liệu cũ ghi 32×32; G2 có thể dùng kích thước khác, phải xác minh |
| Icon         | 16×16                    | Đọc được trên nền UI thực tế                                         |

PNG RGBA, nền trong suốt với sprite rời; không đổ nền trắng/checkerboard vào ảnh. Crop/fit không kéo giãn sai tỷ lệ. Neo công trình/quân ở chân `(0.5, 1)`, y-sort; không xoay, có thể lật ngang theo quy chuẩn game. Hiển thị bằng nearest-neighbour và zoom nguyên.

## 5. Hợp đồng script và đóng gói

- Ảnh nguồn bất biến; mọi kết quả xuất ra thư mục mới theo batch/version. Không ghi đè bản người dùng đã duyệt.
- JSON tách ghi `source`, kích thước nguồn, các mục `{id, crop: [x,y,w,h], nativeSize: [w,h], anchor, output}` và phiên bản cấu hình.
- Script kiểm crop nằm trong ảnh, ID không trùng, kích thước dương, output không thoát thư mục được chỉ định; lỗi phải dừng, không âm thầm cắt sai.
- Lưu riêng PNG crop, PNG native, preview contact sheet và báo cáo kích thước/palette/alpha. Các pixel lạc palette được báo trước khi tích hợp.
- Tên frame giữ nguyên: `building_<CardId>`, `card_art_<CardId>`, `unit_<UnitId>_<team>_<anim><n>`, `icon_<id>`, `fx_<id>`.
- Unit animation không lấy một tư thế rồi dịch chuyển ảnh để giả đã có animation hoàn thiện. Mỗi trạng thái được duyệt theo bộ và khớp chân giữa các frame.
- Chỉ tạo script phù hợp ảnh thực tế đã duyệt; không viết bộ pipeline chung lớn trước khi xác minh batch đầu.
- Lưu source/preview tại `docs/art-review/<batch>/<version>/` trong giai đoạn duyệt. Asset được nhận mới xuất vào `public/assets/`; tên file cuối theo cấu trúc của nhánh tích hợp.

## 6. Nghiệm thu

- [ ] Đúng batch, phiên bản và sự duyệt của người dùng.
- [ ] Subject đúng nội dung game; không mất mái, vũ khí, chân hoặc bộ phận quan trọng.
- [ ] Native size đúng; alpha sạch; đúng palette; không scale lẻ/anti-aliasing ở bản cuối.
- [ ] Đọc được ở 1× và trên nền game; không bị chi tiết nền cạnh tranh.
- [ ] Điểm neo, độ cao, bóng và y-sort không che sai ô.
- [ ] Frame ID đúng, phần procedural chưa thay vẫn hoạt động.
- [ ] Manifest/credits ghi đúng nguồn gốc; ảnh tự gen ghi là custom/AI-assisted theo provenance thực tế, không gắn nhãn CC0 của pack khác.
- [ ] Kiểm build/typecheck/lint/test theo yêu cầu repo khi có thay code; browser 1280×720 và 375×812 khi tích hợp.
- [ ] Người dùng đã xem kết quả trong game và chấp nhận trước khi sang bộ sau.

## 7. Bộ 001 — Nhà Dân Quân Lúa Mì

Trạng thái ban đầu: `draft`.

- Nội dung hiện có: CardId `wheat_militia`; không nhầm với UnitId `militia`.
- Đầu ra sau duyệt: `building_wheat_militia` 32×40 và `card_art_wheat_militia` 32×24. Không tạo quân/animation trong bộ này.
- Brief đề xuất: nhà tập hợp dân quân nhỏ, mái ngói đất nung, tường kem/gỗ, giá giáo và khiên, biểu tượng bó lúa không chữ; điểm nhấn vàng lúa. Công trình đơn lẻ, nền trong suốt, không kèm sân vườn lớn.
- Ảnh nguồn chi tiết dùng duyệt tạo hình; bản native và ảnh trong game sẽ được trình lại sau khi tách/chuẩn hóa.
- Chưa tạo bộ 002 cho tới khi bộ 001 được nghiệm thu.
