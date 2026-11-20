# forge_smithy — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `forge_smithy_anim_0..2.png` 63x74 vs 63x67 (pad l/t/r/b (0, 7, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 1.3%, frame 1 3.7%, frame 2 2.6%.
- Verdict: pass. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (sơ bộ, chờ phiên chính xem lại).
- Board: `review.png`; GIF: `forge_smithy_anim.gif`.
