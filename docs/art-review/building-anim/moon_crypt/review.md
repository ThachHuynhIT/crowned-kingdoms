# moon_crypt — building animation (20/11/2026)

- Codex calls: 1. Prompt `prompt.md` (ART_STYLE "Prompt isometric dùng lại" block via `make_anim.py prompt`), attachments in `attachments.txt`.
- Frames: density 2 `moon_crypt_anim_0..2.png` 37x41 vs 37x41 (pad l/t/r/b (0, 0, 0, 0), feet anchor kept), `hd/` x2, `uhd/` x4; frame 0 = shipped picture + pad.
- Changed pixels in the mask (>40 or alpha): Codex copy of frame 0 0.8%, frame 1 0.9%, frame 2 2.3%.
- Verdict: skip: only 2 pixels change. Do not use these frames.
- Board: `review.png`; GIF: `moon_crypt_anim.gif`.
