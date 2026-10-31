# ai-v1 — spearman, cottage, grass

`source-sheet.webp` is an image generated with OpenAI imagegen (via Codex) for this project and supplied by the
project owner. Prompt (from the Codex session, `wheat-prototype-v1`): warm medieval fantasy pixel sheet, six wheat
militia poses, cream tunic, blue belt, leather cap, spear, straw-roof farmhouse and three grass samples, upper-left
lighting, transparent background.

`make_assets.py` slices it into `public/assets/art/ai-v1/*.png` (7 px source blocks → 1 art px, alpha 0/255, poses
padded onto one feet-aligned canvas, red-sash foe recolour, cottage shrunk to 64 px wide). Density in game: 2 art px
per world unit (`src/render/imageArt.ts`).

An earlier Codex integration of the same sheet (16×16, Hearth-32 mapped, `wheatPrototype.*`) existed only in the main
checkout on the old G1 `main`; this set replaces it and that code is not part of the branch.
