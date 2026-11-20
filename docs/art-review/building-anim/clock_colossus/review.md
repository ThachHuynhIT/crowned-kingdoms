# clock_colossus — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `clock_colossus_anim_0..2.png` 67x75 vs 67x65 (pad l/t/r/b (0, 10, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 0.8%, frame 1 6.4%, frame 2 4.2%.
- Verdict: pass; smoke reaches the 10 px top-pad limit and is cut flat. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (sơ bộ, chờ phiên chính xem lại).
- Board: `review.png`; GIF: `clock_colossus_anim.gif`.
