# Giao việc cho Codex khi không có Claude (20/11/2026)

Bộ này chạy được mà không cần Claude canh. Mọi prompt vẽ ảnh đều dựng từ `docs/ART_STYLE.md` bằng công cụ của repo và
dặn Codex đọc tài liệu đó.

## 1. Vẽ ảnh (tự dừng khi Codex hết hạn mức)

```bash
bash tools/codex-handoff/run-art.sh
```

Lệnh này chạy hai việc theo thứ tự:

- **`anim`:** hoạt ảnh cho 22 nhà, mỗi nhà một lượt Codex. Gồm:
  - 12 nhà chưa vẽ;
  - 9 nhà trước đó chuyển động quá nhỏ, nay vẽ lại với ghi chú `REDRAW`;
  - tháp người khổng lồ đồng hồ, vì lần trước khói bị cắt.

  Mỗi nhà được cắt ở mật độ 2, 4 và 8.
- **`env`:** 12 bảng vật thể theo chủ đề, mỗi bảng 8 vật, tổng 96 vật. Danh sách nằm trong
  `docs/art-review/env/batches_extra.py`: mỗi vua một bộ, cộng thêm bộ mùa thu, bờ ao và đời sống làng. Mỗi bảng được cắt ra sd, hd, uhd.

Chỉ chạy một phần thì ghi tên phần đó, ví dụ:

```bash
bash tools/codex-handoff/run-art.sh env
```

Muốn dừng tay thì tạo file `.superpowers/handoff-STOP`. Nhật ký ghi ở `.superpowers/handoff.log`.

## 2. Đưa ảnh vào game

```bash
python tools/codex-handoff/integrate.py --dry-run
```

```bash
python tools/codex-handoff/integrate.py
```

Script này làm ba việc:

1. Chép vật thể mới vào `public/` và thêm vào `DECOR_CATALOG`.
2. Chép hoạt ảnh nhà vào `public/`. Chỉ lấy nhà vẽ bằng `run-art.sh` và đạt kiểm tra tự động: phần đứng yên lệch tối đa 6%, có khung thay đổi từ 3%, khung cao hơn ảnh gốc tối đa 10 px.
3. Ghi danh mục tài sản.

Sau đó chạy bộ kiểm tra:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

```bash
python -m unittest discover -s tools -p "test_*.py"
```

Chạy xong test Python thì khôi phục hai file prompt mà test ghi đè:

```bash
git checkout -- docs/art-review/g3e/units/golem/prompt.md docs/art-review/g5/grove/grove_spring/prompt.md
```

## 3. Việc code cho Codex (không vẽ ảnh)

Codex không chạy được npm, nên mỗi việc phải kiểm tra lại bằng bộ kiểm tra ở mục 2.

- **Dùng ô cỏ và nền mới mà không lộ ranh giới ô:**

  ```bash
  codex exec --sandbox workspace-write -C "$PWD" - < tools/codex-handoff/code-01-grass-blend.md
  ```

- **Sửa lỗi nút "Xem thử (DEV)" làm hỏng ảnh:**

  ```bash
  codex exec --sandbox workspace-write -C "$PWD" - < tools/codex-handoff/code-02-devjump-fix.md
  ```

## Gom ảnh gốc

```bash
python tools/collect_art_sources.py
```

Lệnh này tạo lại `art-sources/`, chia theo cụm, gồm cả ảnh mới.
