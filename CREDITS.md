# Credits

## Code & tools

- [Phaser](https://phaser.io) — MIT
- Phaser 4 agent skills in `.claude/skills/` — from [phaserjs/phaser](https://github.com/phaserjs/phaser), MIT (see `.claude/skills/PHASER-LICENSE.md`)

## Art & audio

Most art is procedurally generated placeholder art (`src/render/*Art.ts`).

- UI frames (panel, tooltip, button, card): [Pixel UI Pack](https://kenney.nl/assets/pixel-ui-pack) by Kenney — CC0 (credit not required, given with thanks). Unmodified; see `docs/licenses/kenney-pixel-ui-pack/`.
- Candidate UI frames (`public/assets/ui/kenney-pixel-adventure/`): [UI Pack - Pixel Adventure](https://kenney.nl/assets/ui-pack-pixel-adventure) by Kenney — CC0 (credit not required, given with thanks). Unmodified; see `docs/licenses/kenney-ui-pack-pixel-adventure/`.
- Candidate UI borders (`public/assets/ui/kenney-fantasy-borders/`): [Fantasy UI Borders](https://kenney.nl/assets/fantasy-ui-borders) by Kenney — CC0 (credit not required, given with thanks). Unmodified; see `docs/licenses/kenney-fantasy-ui-borders/`.
- Candidate UI panels, buttons and bars (`public/assets/ui/kenney-rpg-expansion/`): [UI Pack (RPG Expansion)](https://kenney.nl/assets/ui-pack-rpg-expansion) by Kenney — CC0 (credit not required, given with thanks). Unmodified; see `docs/licenses/kenney-ui-pack-rpg-expansion/`.
- Spearman, thatched cottage and grass tiles (`public/assets/art/ai-v1/`): images generated with OpenAI imagegen and supplied by the project owner, sliced and recoloured in-repo (`docs/art-review/g3e/ai-v1/`, prompt recorded there). Custom, not third-party.
- Mountain wall segments with a sea backdrop per king (`public/assets/art/ai-v1/mountain-wall/`): images generated with OpenAI imagegen via Codex for the project owner, box-downscaled in-repo (`docs/art-review/oblique-wall/`). Custom, not third-party.
- Wheat militia, reaper, peasant and Stone golem, miner, rubble, slinger animation poses (`public/assets/art/ai-v1/{militia,reaper,peasant,golem,miner,rubble,slinger}_*.png`): images generated with OpenAI imagegen via Codex for the project owner, reduced, outlined and recoloured in-repo (`docs/art-review/g3e/units/make_poses.py`, prompts in `docs/art-review/g3e/units/`). Custom, not third-party.
- Wheat king buildings and throne (`public/assets/art/ai-v1/wheat_*.png`): images generated with OpenAI imagegen via Codex for the project owner, background removed and reduced to 64 px in-repo (`docs/art-review/g3e/buildings/make_assets.py`, prompts in `docs/art-review/g3e/buildings/wheat/`). Custom, not third-party.
- Wheat king plots (`public/assets/art/ai-v1/plots/wheat_*.png`): images generated with OpenAI imagegen via Codex for the project owner, cut in-repo by `tools/slice_art_batches.py` (`docs/art-review/g3e/batch-03-plots-wheat-stone/`). Custom, not third-party.
- Wheat king card illustrations (`public/assets/art/ai-v1/cards/`): images generated with OpenAI imagegen via Codex for the project owner, box-reduced to 96×72 and 48×36 in-repo (`docs/art-review/g3e/cards/make_assets.py`, prompts in `docs/art-review/g3e/cards/`). Custom, not third-party.
- Wheat king badge (`public/assets/art/ai-v1/icons/icon_king_wheat*.png`): image generated with OpenAI imagegen via Codex for the project owner, keyed and reduced to 32 and 16 px in-repo (`docs/art-review/g3e/icons/make_assets.py`). Custom, not third-party.
- Isometric Wheat king buildings, plots and the mountain cliff (`public/assets/art/ai-v1/iso/`): images generated with OpenAI imagegen via Codex for the project owner, keyed, reduced and (cliff) column-sheared to 2:1 in-repo (`docs/art-review/iso-board/make_assets.py`, prompts in `docs/art-review/iso-board/`). Custom, not third-party.
- Seamless river water, sand bank, dirt road and flower meadow textures (`public/assets/art/ai-v1/iso/terrain/`): images generated with OpenAI imagegen via Codex for the project owner, box-reduced in-repo (`docs/art-review/iso-board/terrain/make_textures.py`, prompts beside the sources). Custom, not third-party.
- Wild decorations: trees, rocks, bushes, cliff, stump, log (`public/assets/art/ai-v1/iso/wilds/`): one sheet generated with OpenAI imagegen via Codex for the project owner (`docs/art-review/g3e/batch-06-wilds/`), cut, keyed and reduced in-repo (`docs/art-review/iso-board/wilds/make_wilds.py`). Custom, not third-party.
- Main-menu dusk sky and parallax strips, far mountains and countryside (`public/assets/art/ai-v1/menu/`): images generated with OpenAI imagegen via Codex for the project owner, keyed and box-reduced in-repo (`docs/art-review/g5/menu/make_assets.py`, prompts beside the sources). Custom, not third-party.
- King-select card backgrounds for the nine kings (`public/assets/art/ai-v1/king-cards/`): images generated with OpenAI imagegen via Codex for the project owner, keyed and box-reduced to 66×96 in-repo (`docs/art-review/g5/king-cards/make_assets.py`, prompts beside the sources). Custom, not third-party.
- Battle effects: boulder, pulse, ward bubble, stun stars, hit spark, eight arrows (`public/assets/art/ai-v1/fx/`): images generated with OpenAI imagegen via Codex for the project owner, keyed and box-reduced in-repo (`docs/art-review/g5/fx/make_assets.py`, prompts beside the sources). Custom, not third-party.
- PWA icons (`public/icons/crown-*.png`): generated in code from the favicon's 8x8 crown (`tools/icons.ts`, `tools/pwa.ts`). Custom, not third-party.
- Isometric sets of the six new kings (Forest, Tide, Forge, Clock, Moon, Nomad: thrones, building cards, plots) (`public/assets/art/ai-v1/iso/<cardId>.png`, `iso/plots/<king>_*.png`): images generated with OpenAI imagegen via Codex for the project owner, keyed and box-reduced at the Wheat set scale in-repo (`docs/art-review/g5/make_assets.py`, prompts in `docs/art-review/g5/`). Custom, not third-party.
- Isometric neutral buildings: barracks, archer tower, well, mercenary camp (`public/assets/art/ai-v1/iso-neutral/`): images generated with OpenAI imagegen via Codex for the project owner, keyed and box-reduced at the Wheat set scale in-repo (`docs/art-review/neutral-iso/make_assets.py`, prompts beside the sources). Custom, not third-party.
- Isometric enemy portal and the forest (pines, mossy rock) behind the cliff (`public/assets/art/ai-v1/iso/polish/`): images generated with OpenAI imagegen via Codex for the project owner, keyed and box-reduced in-repo (`docs/art-review/iso-board/polish/make_polish_assets.py`, prompts beside the sources). Custom, not third-party.
- King portraits (`public/assets/art/ai-v1/portraits/`): images generated with OpenAI imagegen via Codex for the project owner, box-downscaled and palette-snapped in-repo (`tools/prepare_king_portraits.py`, `docs/art-review/g3e/portraits/`). Custom, not third-party.
- HiDPI twins of the unit poses, isometric buildings (all levels) and plots (`public/assets/art/ai-v1-hd/`): the same project-owner images as their `ai-v1` twins above, re-exported in-repo at twice the pixel density by the same scripts with `--density 4` (`docs/art-review/hd/register_hd.py` lists them). Custom, not third-party.

Add every third-party asset here with its author, source URL and license (CC0 / CC-BY …) when it is imported.
