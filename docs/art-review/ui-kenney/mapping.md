# Kenney UI frames: proposed mapping (2026-11-09)

The owner picked three Kenney packs to replace the current Pixel UI Pack frames
(`public/assets/ui/kenney-pixel-ui/`, wired in `src/render/uiKit.ts`). The owner asked for
**thinner borders and smaller corners** than the current 48×48 frames (slice 8, border 5).

All three packs are CC0 (page and the `License.txt` in each zip). Evidence:
`docs/licenses/kenney-ui-pack-pixel-adventure/`, `docs/licenses/kenney-fantasy-ui-borders/`,
`docs/licenses/kenney-ui-pack-rpg-expansion/`. Files are unmodified and registered in
`docs/assets.manifest.yml`. Visual overview: `contact-sheet.png` (3× nearest-neighbour).

| Pack | Folder | Files | Notes |
| --- | --- | --- | --- |
| UI Pack - Pixel Adventure 2.0 | `public/assets/ui/kenney-pixel-adventure/{small,large}/` | 80 × 16 px, 40 × 32 px | Real pixel art, alpha 0/255 only, "Thin outline" set. 1 px outline, 1 px chamfered corners. |
| Fantasy UI Borders 1.0 | `public/assets/ui/kenney-fantasy-borders/{panel,border}/` | 64 × 48 px | Pixel art, alpha 0/255, **pure white**: meant to be tinted (`setTint`). `panel` = filled, `border` = outline only. Only the 1× "Default" set copied. |
| UI Pack RPG Expansion | `public/assets/ui/kenney-rpg-expansion/` | 58 | **Not pixel art**: anti-aliased edges (11–14 alpha levels), big sizes (45×49 to 190×49). Edge notches stretch under nine-slice. |

All measurements below are in **source pixels**: `slice` = nine-slice corner size (same on
all four sides, as `UiFrameDef` expects), `border` = distance from the edge to the flat fill
(content inset). They were measured from the pixels (corner dumps), not guessed.

## Recommended mapping (Pixel Adventure, 16×16)

| Frame | File | Size | slice | border | Why / caveat |
| --- | --- | --- | --- | --- | --- |
| panel | `kenney-pixel-adventure/small/tile_0010.png` | 16×16 | 4 | 4 | Brown frame, cream fill: 1 px dark outline + 2 px wood + 1 px inner line. Same warm look as today, about half the corner. |
| tooltip | `kenney-pixel-adventure/small/tile_0012.png` | 16×16 | 4 | 4 | Same frame in grey with a pale-blue fill, so tooltips read apart from panels. Use `tile_0010` if it should match panels. |
| button | `kenney-pixel-adventure/small/tile_0010.png` | 16×16 | 4 | 4 | As today, buttons share the panel art. |
| buttonHover | `kenney-pixel-adventure/small/tile_0010.png`, lighter tint | 16×16 | 4 | 4 | The pack has **no real hover or pressed state**. `tile_0033` (same frame with edge notches) is the other option, but its notches need slice 7, which brings back the thick corners. |
| buttonDown | `kenney-pixel-adventure/small/tile_0011.png` | 16×16 | 3 | 3 | Flat brown, reads as sunken. Needs light text (cream) while pressed. |
| buttonActive | `kenney-fantasy-borders/panel/panel-015.png` tinted gold | 48×48 | 4 | 4 | 2 px line, 2 px gap, then fill. Pixel Adventure has no gold frame. Alternative: `small/tile_0040` (red corner brackets, slice 5, border 3). |
| slot | `kenney-pixel-adventure/small/tile_0013.png` | 16×16 | 3 | 3 | Flat dark grey well. |
| slotHover | `kenney-pixel-adventure/small/tile_0012.png` | 16×16 | 4 | 4 | Lighter inset of the same grey family. |
| slotSelected | `kenney-pixel-adventure/small/tile_0040.png` | 16×16 | 5 | 3 | Grey with red corner brackets; slice 5 keeps the corner rivets (at px 4) out of the stretched middle. Green `tile_0041` / blue `tile_0042` are siblings. |
| bar | `kenney-pixel-adventure/small/tile_0153.png` | 16×16 | 4 | 4 | Blue ribbon middle; rows 0 and 15 are transparent, so it is only good as a horizontal bar. Alternatively keep the generated 8×6 bar: no pack has a small 9-slice bar. |
| card | `kenney-pixel-adventure/small/tile_0058.png` | 16×16 | 6 | 4 | Blue-grey card with light corner marks; slice 6 keeps the rivets at px 5. |
| cardUncommon | `kenney-pixel-adventure/small/tile_0064.png` | 16×16 | 6 | 3 | Same body, green edge (rivets at px 4). |
| cardRare | `kenney-pixel-adventure/small/tile_0065.png` | 16×16 | 6 | 3 | Same body, blue edge. If rare must be gold, use `kenney-fantasy-borders/panel/panel-015.png` tinted gold (slice 4, border 4). |
| cardSelected | `kenney-pixel-adventure/small/tile_0063.png` | 16×16 | 6 | 3 | Same body, red edge (today's selected colour is red too). |

The card family uses slice 6 on all four so the frames can swap without the edge moving;
`border` differs by 1 px (4 vs 3). The 32×32 "large" tiles (`large/tile_0000`–`0003` are the
plain frames) have the **same** 4 px edge and corner as the 16 px ones, only a larger flat
middle, so they bring nothing for nine-slicing; they are kept as candidates only.

## Alternatives measured

| Use | File | Size | slice | border | Notes |
| --- | --- | --- | --- | --- | --- |
| thin outline (selection overlay) | `kenney-fantasy-borders/border/panel-border-015.png` | 48×48 | 2 | 2 | Hollow 2 px line; tint gold/red. The thinnest frame in the three packs. |
| ornate panel | `kenney-fantasy-borders/panel/panel-009.png` | 48×48 | 10 | 6 | 8×8 corner boxes; nicer for big modals, but corners are large again. |
| panel | `kenney-rpg-expansion/panel_beige.png` | 100×100 | 6 | 4 | Rounded 4 px corner, 2 px light rim + 2 px dark line. Rivet notches on the edges stretch into smears. |
| inset panel | `kenney-rpg-expansion/panelInset_beige.png` | 93×94 | 6 | 4 | Torn-edge notches, same problem. |
| button / pressed | `kenney-rpg-expansion/buttonSquare_beige.png` / `buttonSquare_beige_pressed.png` | 45×49 / 45×45 | 8 | 4 | The only real normal + pressed pair. The normal one has a 4 px bottom lip, so slice must be 8 and the two frames differ in height (4 px). |
| bar | `kenney-rpg-expansion/bar{Back,Green,Red,Yellow,Blue}_horizontal{Left,Mid,Right}.png` | 9×18 + 18×18 | (3-piece) | – | Left/mid/right caps, not a nine-slice; needs a 3-piece bar widget. |

## Things to decide / check before wiring

- **RPG Expansion breaks the pixel-art rule** in `CLAUDE.md` (sprite edge alpha 0/255, no AA).
  Using it needs a registered exception like the one the Pixel UI Pack has, or do not use it.
- Fantasy UI Borders are white: the code must tint them (and text colour must suit the tint).
- `uiKit.ts` today assumes **one** size for every kit frame (`UI_KIT_FRAME`, 48×48, slice 8,
  border 5). The mapping above mixes 16×16 and 48×48 and several slice/border values, so the
  kit needs a per-frame `UiFrameDef` table. That is a `src/` change and is left to the code session.
- At the current 16 px source size a 2× or 3× integer scale gives 2–3 screen px lines; check the
  logical-px sizes in `createPanel` callers still clear the 44×44 touch target.
