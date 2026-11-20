Read `AGENTS.md` first. Repo: Crowned Kingdoms (Phaser 4 + TypeScript strict). Work on the current branch; do NOT commit; you cannot run npm/node in this sandbox, so keep the change small and say exactly how to verify.

Bug (DEV only): on the main menu, wait until the close-up art stream has finished (about 10 s), then click "Xem thử (DEV)" and a year button. The realm shows only grass; the console says `TypeError: Cannot read properties of null (reading 'resolution')` in `TexturerImage.run`, and ~700 images (forest pictures `imgart-iso/polish/*`, wild objects) hold a texture object that is no longer the one registered under their key. Starting a run normally (New run → King select → Play) and "Tiếp tục" both work.

Where to look:
- `src/dev/registerPreview.ts` (`stopAll()` then `game.scene.start(SCENES.realm, { preview })` in the same tick),
- `src/scenes/ArtStreamScene.ts` (`ensureSceneSprites`: swaps the streamed art in only when no other scene is active, paused or sleeping),
- `src/render/artStream.ts` (`applyStreamedArt` removes the `sprites` atlas, ground, road tail and the superseded start-up textures),
- the scenes that draw the forest and wilds (`ForestRenderer`, `DecorationRenderer`) and `src/render/smoothArt.ts`.

Likely cause to confirm: during the dev jump the menu is still "stopping" when Realm.create runs, so the swap happens (or a texture is replaced) while images built from the old textures are still alive. Fix it at the root (e.g. the dev jump goes through the same transition as a normal start, or the swap is deferred until no scene can hold old textures, or images are built after the swap). Do not break the normal paths. Add a vitest test for any pure logic you change (`src/render/artStream.test.ts` exists).

Finish with a short report: root cause, the fix, how to verify in the browser.
