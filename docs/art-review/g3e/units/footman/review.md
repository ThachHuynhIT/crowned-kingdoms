# footman (Lính Bộ, trung lập) — front-view sample and pose sheet (20/11/2026)

Until now the footman only had ai-v1 frames cut from `docs/art-review/g3e/batch-01-barracks/source.png` (no pose
source). Redrawn the same way as every other unit, keeping its identity from that old sheet (grey ridged kettle helmet,
blue scarf-cape and tabard flap, cream tunic, brown belt/bracers/boots, short steel sword, round wooden shield with an
iron rim and boss).

| Step | Prompt | Attached | Output | Codex runs |
|---|---|---|---|---|
| Standing sample | `prompt.md` (`make_prompts.py footman`) | harvester-house reference, approved militia `source.png`, old barracks sheet | `source.png`, `preview.png` (39x52) | 1 |
| Pose sheet | `poses-prompt.md` (`make_prompts.py --poses footman`) | harvester-house reference, `source.png` | `poses-source.png`, cut by `make_poses.py footman` into `poses/` (78x71 at 4 px, scale 1/6.15) | 1 |

`make_prompts.py` changes: `UNITS`, `HEIGHT` (52: 52 x 1.3 / 2 = 34 px, the shipped size), `ATTACK`, `STRIKE` entries
for footman, plus `IDENTITY_REFERENCE` (footman only: the old sheet is attached to the standing sample as a third image).
Every other unit's prompt is byte-identical; `tools/test_art_prompts.py` passes (52 tests).

Review (`poses/sheet.png`): same character in all six cells, chibi proportions like the militia, helmet/scarf/sword/
shield match the old frames, idle breathing, walk turned right, wind-up sword raised, strike lunge to the right; the foe
recolour only touches the scarf and tabard. Claude duyệt theo uỷ quyền của chủ dự án 09/11/2026.
Not exported (`--export` not run): nothing written to `public/`.
