# wheat_windmill — building animation sample (20/11/2026)

- Codex: 2 calls. r1 `prompt-r1.md`; r2 `prompt-r2.md` (stricter, plus `guide-r2.png`: target sail arms on the tilted circle for 30° / 60°).
- Cut: `make_anim.py cut wheat_windmill -r1|-r2` → 47×65: shipped 39×61 plus pad l/t/r 4/4/4 (in-plane turned sails reach ~3 px past the base box). Current `wheat_windmill_anim_*.png` = r2.
- Changed pixels inside the mask (>40): r1 drift 1.1%, frame 1 22.5%, frame 2 33.1%; r2 drift 2.9%, frame 1 31.2%, frame 2 31.9%. The tower, cap, door and sacks stay put (diff is on the sails); large % because the sails are ~30% of the picture.
- Problem: in both rounds the 60° frame is drawn as an upright frontal "+" cross instead of the sails turned in the slanted plane, so the loop 0→30→60 does not read as one rotation (r2's 30° frame does follow the guide). r2 also used shift -40 which put the thatch's left edge on the panel border (tool now uses -15; not re-run).
- Verdict: vẽ lại / approach does not hold for rotation through Codex as-is. Options: 2-frame loop 0°/45° (the "+" that Codex draws naturally is the 45° step of a 4-sail X), or build the turned sails in code from the base (cut the sail layer, rotate in the tilted plane, Codex only repaints the thatch behind).

- 20/11/2026: Claude review: rejected and DROPPED; the windmill stays static. The frames in this folder are not for use.
