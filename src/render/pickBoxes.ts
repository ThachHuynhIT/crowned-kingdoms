import type Phaser from 'phaser';
import type { RunMode } from '../data/rules';
import type { CardId, UnitId } from '../data/types';
import { KIND_UNIT, TEAM_ALLY, type BattleWorld } from '../game/battle/world';
import type { Content } from '../game/cards/registry';
import { THRONE_PLOT } from '../game/run/board';
import { geometryFor } from '../game/run/boardGeometry';
import type { RunState } from '../game/run/state';
import { spriteBox, type OpacityTest, type SpriteBox } from '../ui/info/spritePick';
import { SPRITES_KEY, buildingFrame, imageFrameScale, pickBuildingFrame, unitFrame } from './atlas';
import { BUILDING_FOOT_DY, buildingFoot } from './BoardRenderer';
import { ISO_SPRITE_SCALE, iso } from './isoView';

/**
 * The screen boxes of the sprites the player can click (owner 10/11/2026), computed the way `BoardRenderer` and
 * `UnitRenderer` draw them (frame size × `imageFrameScale` × `ISO_SPRITE_SCALE`, anchored at the feet), so a click on
 * the art picks what is drawn there. Camera (projected) space.
 */

const frameBox = (
  textures: Phaser.Textures.TextureManager,
  frame: string,
  id: number,
  x: number,
  footY: number,
  exact: boolean,
  flipX = false,
): SpriteBox | null => {
  if (!textures.exists(SPRITES_KEY) || !textures.get(SPRITES_KEY).has(frame)) return null;
  const f = textures.getFrame(SPRITES_KEY, frame);
  return spriteBox({
    id,
    x,
    footY,
    frameW: f.realWidth,
    frameH: f.realHeight,
    scale: imageFrameScale(frame) * ISO_SPRITE_SCALE,
    exact,
    frame,
    flipX,
  });
};

/** Every building on the board outside battle (the throne included), id = plot. */
export const boardBuildingBoxes = (
  textures: Phaser.Textures.TextureManager,
  state: RunState,
  content: Content,
  mode: RunMode = 'normal',
): SpriteBox[] => {
  const out: SpriteBox[] = [];
  let throne: CardId | null;
  try {
    throne = content.king(state.kingId).throne.id;
  } catch {
    throne = null;
  }
  for (let p = 0; p < geometryFor(mode).plotCount; p++) {
    const cardId = p === THRONE_PLOT ? throne : (state.plots[p]?.building?.cardId ?? null);
    if (cardId === null) continue;
    const foot = buildingFoot(p, mode);
    const level = p === THRONE_PLOT ? state.throneLevel : (state.plots[p]?.building?.level ?? 1);
    const sprites = textures.get(SPRITES_KEY);
    const frame = pickBuildingFrame(cardId, level, (f) => sprites.has(f));
    const b = frameBox(textures, frame, p, foot.x, foot.y, true);
    if (b) out.push(b);
  }
  return out;
};

/** Every live battle entity, id = entity id: units by their whole box, structures by their opaque pixels. */
export const battleEntityBoxes = (textures: Phaser.Textures.TextureManager, world: BattleWorld): SpriteBox[] => {
  const out: SpriteBox[] = [];
  for (let id = 0; id < world.count; id++) {
    if (world.alive[id] !== 1) continue;
    const label = world.label[id] ?? '';
    if (label === '') continue;
    const unit = world.kind[id] === KIND_UNIT;
    const ally = world.team[id] === TEAM_ALLY;
    const p = iso({ x: world.x[id]!, y: world.y[id]! });
    const foot = unit ? p.y + world.radius[id]! : p.y + BUILDING_FOOT_DY;
    const frame = unit ? unitFrame(label as UnitId, ally ? 'ally' : 'foe', 'idle', 0) : buildingFrame(label as CardId);
    const b = frameBox(textures, frame, id, p.x, foot, !unit, unit && !ally);
    if (b) out.push(b);
  }
  return out;
};

/** Opacity of a `sprites` atlas frame pixel (alpha > 0). */
export const atlasOpacity =
  (textures: Phaser.Textures.TextureManager): OpacityTest =>
  (frame, u, v) =>
    (textures.getPixelAlpha(u, v, SPRITES_KEY, frame) ?? 0) > 0;
