# moon_altar — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `moon_altar_anim_0..2.png` 56x60 vs 56x60 (pad l/t/r/b (0, 0, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 1.5%, frame 1 1.5%, frame 2 1.5%.
- Verdict: skip: flame change too small. Do not use these frames.
- Board: `review.png`; GIF: `moon_altar_anim.gif`.
