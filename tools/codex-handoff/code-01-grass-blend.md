Read `AGENTS.md` and `docs/ART_STYLE.md` first. Repo: Crowned Kingdoms (Phaser 4 + TypeScript strict). Work on the current branch; do NOT commit; you cannot run npm/node in this sandbox, so keep changes small and type-safe and say exactly what to test.

Task: use the new grass tiles and ground textures drawn on 20/11/2026 without the checkerboard look.

Facts:
- The field ground is painted in code: `src/render/fieldArt.ts`, `src/render/groundArt.ts`, `src/render/atlas.ts` (`grassArt`, `groundTextures`), grass tiles `GRASS_FILES` in `src/render/imageArt.ts` (3 tiles), seamless textures `GROUND_TEXTURE_FILES` (water, sand, path, flowers).
- New art, runtime-ready, NOT yet in `public/`: `docs/art-review/env/ground/<id>/runtime/{sd,hd}/<id>.png`, listed in `docs/art-review/env/ground/catalog.json` (`kind: tile` = 18 grass tiles 32/64 px, `kind: texture` = 28 seamless textures 128/256 px: dirt, tilled, gravel, moss, meadow, leaves, mud, forest_floor, dry_grass, clover, sandy_dirt, heather, cobble_worn, grass_dirt, each x2). Review sheets: `docs/art-review/env/ground/review-tiles-mix.png` shows that mixing tiles at random per cell gives visible tile seams.

What to build:
1. Pick grass variants by a smooth low-frequency noise (the repo has `src/core/noise`) so neighbouring cells share a variant and variants change in soft regions, never per cell at random; keep the 3 shipped tiles as the base everywhere, and use new tiles only as large soft regions.
2. Add a few new terrain kinds (e.g. meadow, moss, dirt, leaves) as soft patches in the field and the ground around it, through the same terrain/texture path that water/sand/path/flowers use (same seamless-texture fill), placed by seeded noise, never on the board, the road or the river.
3. Copy the chosen files into `public/assets/art/ai-v1/iso/terrain/` and `public/assets/art/ai-v1-hd/iso/terrain/` (and grass tiles beside `grass_*.png`), add them to the lists in `imageArt.ts`, and register each file in `docs/assets.manifest.yml` (copy the format of the existing `terrain_*` / `grass_*` entries; source = the `source.png` in the same folder).
4. Determinism: decoration/terrain art must use seeded hashing only (`pixelHash`, never Math.random), and must never touch the run RNG or the battle.
5. Update or add vitest tests next to the files you change (pure functions only), e.g. that the variant choice is deterministic per seed and spatially smooth.

Finish with a short report: files changed, what to check in the browser, anything unsure.
