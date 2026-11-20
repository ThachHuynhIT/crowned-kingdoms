# clock_windup_soldiers — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `clock_windup_soldiers_anim_0..2.png` 65x71 vs 65x61 (pad l/t/r/b (0, 10, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 1.7%, frame 1 5.1%, frame 2 5.4%.
- Verdict: pass. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (sơ bộ, chờ phiên chính xem lại).
- Board: `review.png`; GIF: `clock_windup_soldiers_anim.gif`.
