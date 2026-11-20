# neutral_barracks — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `neutral_barracks_anim_0..2.png` 62x66 vs 62x56 (pad l/t/r/b (0, 10, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 1.5%, frame 1 2.8%, frame 2 3.2%.
- Verdict: pass. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (sơ bộ, chờ phiên chính xem lại).
- Board: `review.png`; GIF: `neutral_barracks_anim.gif`.
