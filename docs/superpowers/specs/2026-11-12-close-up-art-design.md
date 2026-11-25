# Close-up art (ảnh cận cảnh) — design

Date: 12/11/2026. Owner requests, in order:
- "ở trên máy chính của tôi vẫn thấy pixel rất mờ" (DPR 1 machine);
- "thẻ bài đã đẹp, nhưng công trình, map, lính vẫn chưa đẹp";
- "đưa hình gốc vào thì sao";
- "làm thử phóng to cận cảnh với Dân Quân" (sample approved);
- "Làm toàn bộ".

## Problem

At the overview zoom a unit is about 19 screen px tall and a building about 45 px wide, although their approved
sources are several hundred px. Nearest-neighbour sampling drops half the art pixels when the art is drawn smaller than
its size, and the desktop camera could only zoom to about 1.3×. Shipping the raw sources is not viable: 829 MB and
about 2 GB of texture memory.

## Decisions (settled with the owner)

1. **Close-up tier.** Every world picture is re-exported from its existing approved source at **8 art px per world
   unit** into `public/assets/art/ai-v1-uhd/`.
   - Same file names as `ai-v1`; each file is exactly 4× its `ai-v1` twin and 2× its `ai-v1-hd` twin.
   - Drawn at scale 0.125, so footprints and feet anchors do not move.
   - No new images are generated.
   - Covered: units (44), buildings with L2/L3, plots, the wall, wilds, farm decor, forest and the portal: 772 files,
     53 MB.
   - Not covered: the ground (terrain textures, grass). The painted field would pass the 4096 px texture limit, so it
     stays at density 4. Atlas icons and effects are HUD-sized and stay HD. `footman` has no pose source and keeps
     its `ai-v1` frames.
2. **Smooth sampling.** Every texture except the UI frames (the `ui` texture and the Kenney kit frames, which keep
   crisp nine-slice edges) uses LINEAR magnification and trilinear mipmaps.
   - WebGL1 (Phaser's context) mipmaps only power-of-two textures, so the `sprites` atlas pages, the world pictures
     drawn whole (wall, wilds, forest, portal) and the painted field are padded to a power of two, keeping their frames.
   - The tiling ground is sampled LINEAR only.
3. **Camera.** On close-up, the realm camera zooms up to **6×**; the overview zoom does not change. World text is
   rasterised for zoom buckets up to 6.
4. **Who gets what.** `chooseArtQuality` picks the tier once at boot:

   | Setting | Desktop (layout ≥ 768 px and a fine pointer) | Elsewhere |
   |---|---|---|
   | 'high' | close-up: 'uhd', smooth, zoom 6 | smooth, art of the display density ('hd' from density 2) |
   | 'balanced' / 'saver' | the earlier pixel look ('hd' from density 2) | same |

   A changed setting applies after a reload; Settings says so ("Ảnh mới sẽ dùng sau khi tải lại trang.").
5. **Offline.** The PWA precache skips `ai-v1-uhd`, which is cached at runtime like `ai-v1-hd`.

## Costs

- Files: +53 MB in the repo and the build.
- Download: only a desktop on 'high' loads the UHD files.
- GPU memory: on close-up the `sprites` atlas is 6 pages of 2048×4096 (about 190 MB, more with mipmaps).

## Code

- `src/render/artQuality.ts`: the tier, smooth and zoom policy (pure, tested).
- `src/render/smoothArt.ts`: GL filtering and power-of-two padding.
- `src/render/imageArt.ts`: `IMAGE_ART_UHD_FILES`, `imageArtLoads(tier)`, `imageArtTexture` returns a scale `factor`.
- `src/render/atlas.ts`: UHD frames, `frameDensityFactor` 0.25, power-of-two pages when smooth.
- `src/scenes/artSession.ts`: device detection; Boot and Settings use it.
- `src/ui/realm/realmLayout.ts`: `realmZoomLimits(…, closeUpMax)`.
- Exporters accept `--density 8`: `make_poses.py`, `iso-board/make_assets.py`, `g5/make_assets.py`,
  `recut_border_key.py`, `neutral-iso/make_assets.py`, `levels/make_levels.py`, `fill_pinholes.py`,
  `wilds/make_wilds.py`, `decor/make_decor.py` and `polish/make_polish_assets.py`.
- Registration: `docs/art-review/hd/register_uhd.py`.
