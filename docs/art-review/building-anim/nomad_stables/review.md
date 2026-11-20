# nomad_stables — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `nomad_stables_anim_0..2.png` 71x64 vs 71x64 (pad l/t/r/b (0, 0, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 3.8%, frame 1 6.1%, frame 2 3.1%.
- Verdict: pass (subtle). Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026 (sơ bộ, chờ phiên chính xem lại).
- Board: `review.png`; GIF: `nomad_stables_anim.gif`.
