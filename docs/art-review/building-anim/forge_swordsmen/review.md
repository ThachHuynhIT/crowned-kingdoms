# forge_swordsmen — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `forge_swordsmen_anim_0..2.png` 76x57 vs 76x57 (pad l/t/r/b (0, 0, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 1.3%, frame 1 2.1%, frame 2 1.5%.
- Verdict: skip: almost nothing changes (window glint lost). Do not use these frames.
- Board: `review.png`; GIF: `forge_swordsmen_anim.gif`.
