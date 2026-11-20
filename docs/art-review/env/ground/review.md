# Ground detail (env/ground): review, 20/11/2026

Owner (20/11/2026): the ground around the board is too bare; draw as many images as possible, he prunes later.
Script: `docs/art-review/env/make_ground.py` (`prompts` / `cut`). It imports the prompt builders of
`docs/art-review/g3e/buildings/make_prompts.py`, so every prompt comes from `docs/ART_STYLE.md` ("Prompt texture mặt
đất dùng lại" for tiles and textures, "Prompt isometric dùng lại" for decals) and tells Codex to read that document.
Attached to every call: `harvester-house-front-approved.png`, plus `iso-plot-open-approved.png` and
`iso-plot-built-approved.png` (tiles, textures), `iso-building-approved.png` (decals) and, for grass tiles, the current
game grass (`ref-grass-existing.png` = `ai-v1-hd/grass_0.png` blown up 16x).
Prompts: `<id>/prompt.md`, `_sheets/<sheet>/prompt.md`. Sources: `source.png` next to them (replaced drawings kept as
`source-prev-r2.png`).

Status: preliminary review by Claude (subagent). The decals are a new kind of asset: the first sheet (`sheet_dirt`)
was drawn and reviewed alone before the others, with the main session's brief asking for 40+ decals in this batch.
Nothing is wired into the game; the owner and the main session prune.

## What was made (397 entries in `catalog.json`)

| Kind | Count | Sizes | Review sheet |
|---|---|---|---|
| Grass tile (seamless, 16 world px) | 18 (9 kinds x 2 drawings) | sd 32, hd 64 | `review-tiles.png` (3x3 each, old grass_0..2 first), `review-tiles-mix.png` (old and new mixed at random) |
| Texture (seamless, 64 world px) | 28 (14 kinds x 2 drawings) | sd 128, hd 256 | `review-textures.png` (3x3 each) |
| Decal (flat, 2:1 iso, alpha 0/255) | 351 (39 sheets of 9) | sd/hd/uhd = source / 4, 2, 1 | `review-sheet_<sheet>.png` (sd x2 on the game grass) |

- Tiles: source drawn on a 64x64 art-pixel grid, box-reduced 16x (hd); sd keeps one real pixel of each 2x2 block
  (the detail pixel when there is one, otherwise the pixel closest to the block mean), so the 32 px tile stays crisp
  like the old ones. Mean colour moved onto the old grass mean (114, 138, 54): fully for clover, mown, tiny flowers,
  mossy, autumn; half-way for lush, dry, shade, sparse.
- Textures: same cut as `make_textures.py` (8x / 4x box reduce of a 1024 source).
- Decals: one 341 px cell per decal; background = black connected to the cell border; small enclosed dark pockets are
  kept as detail, big ones (> 1500 source px, e.g. inside a salt ring) are background. `radius` = sd width / 2.83 (a
  flat circle of radius r projects to a 2.83 r wide ellipse). `touchesCell: true` = the drawing reached the cell edge
  and may be clipped.
- Seams: the step across the wrap edge is at or below the step inside the tile for every tile and texture (values in
  `catalog.json` `seam` = [wrap, inner] at hd); no visible seam in the 3x3 sheets.

## Redrawn once

- `tex_gravel`: the first one was orange earth, not gravel; now grey-beige pebbles.
- `tex_moss`: the first one was mustard yellow; now green.
- `grass_dry`: the first one was even noise with no tuft shapes; now clear tufts like the old grass.
- `sheet_tracks`: `decal_cart_tracks_b` was a deep trench with walls; now thin flat ruts.

## Notes for pruning (not redrawn: Codex quota reached 99%)

- `decal_rune_circle` touches its cell edge (may be clipped); `decal_clover_b_3`, `decal_clover_c_3`,
  `decal_edge_dirt_b_3`, `decal_edge_dirt_c_3` too.
- `decal_rune_circle_3` has letter-like glyphs (K, B) on its rim.
- `grass_lush`, `grass_lush_2` are noticeably more lime than the old grass; `tex_meadow_2` and the moss decals lean
  yellow-green.
- `grass_mown`, `grass_shade_2` are very flat (by request), `grass_tinyflowers` has only a few single-pixel flowers.
- `decal_moss_stone*`, `decal_old_well_cover*` show a little thickness at the edge.
- The tilled-soil textures have straight horizontal furrows: laid in iso they will run along one diagonal.
