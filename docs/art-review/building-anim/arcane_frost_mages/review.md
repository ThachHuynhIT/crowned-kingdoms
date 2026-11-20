# arcane_frost_mages — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `arcane_frost_mages_anim_0..2.png` 55x76 vs 55x76 (pad l/t/r/b (0, 0, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 1.3%, frame 1 1.6%, frame 2 2.0%.
- Verdict: skip: r1: only the crystal tip changes in frame 2; a stricter r2 prompt is written but was not run (quota). Do not use these frames.
- Board: `review.png`; GIF: `arcane_frost_mages_anim.gif`.
