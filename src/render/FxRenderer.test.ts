import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { hashWorld } from '../game/battle/hash';
import { BattleWorld, KIND_STRUCTURE, KIND_THRONE, KIND_UNIT } from '../game/battle/world';
import { battleSetup } from '../game/testing/fixtures';
import { BUILDING_FOOT_DY } from './BoardRenderer';
import { FxRenderer } from './FxRenderer';
import { buildingFrame, imageFrameScale } from './atlas';
import { ISO_SPRITE_SCALE, iso } from './isoView';

describe('projectile source rendering', () => {
  for (const kind of [KIND_STRUCTURE, KIND_THRONE, KIND_UNIT]) {
    for (const frameHeight of [32, 198]) {
      it(`resolves dead source kind ${kind}, frame height ${frameHeight}, after pool compaction`, () => {
        const images: { y: number }[] = [];
        const scene = {
          time: { now: 0 },
          textures: { get: () => ({ has: () => true, get: () => ({ height: frameHeight }) }) },
          add: {
            graphics: () => ({ setDepth() { return this; } }),
            image: (_x: number, _y: number, _key: string, name: string) => {
              const image = {
                y: 0, frame: { name },
                setVisible() { return this; },
                setDepth() { return this; },
                setScale() { return this; },
                setOrigin() { return this; },
                setPosition(_x: number, y: number) { this.y = y; return this; },
              };
              images.push(image);
              return image;
            },
          },
        } as unknown as Phaser.Scene;
        const world = new BattleWorld(battleSetup());
        world.count = 2;
        world.x[0] = 300;
        world.y[0] = 300;
        world.x[1] = 400;
        world.y[1] = 400;
        world.kind[0] = kind;
        world.label[0] = 'wheat_throne';
        world.team[0] = kind === KIND_THRONE ? 0 : 1;
        world.alive[0] = 0;
        world.projectileCount = 2;
        const p = world.projectiles;
        p.alive[1] = 1;
        p.sourceId[1] = 0;
        p.targetId[1] = 1;
        p.px[1] = 300;
        p.py[1] = 300;
        const renderer = new FxRenderer(scene);
        const before = hashWorld(world);
        renderer.sync(world, [], 1);
        expect(hashWorld(world)).toBe(before);
        const height = frameHeight * imageFrameScale(buildingFrame('wheat_throne')) * ISO_SPRITE_SCALE;
        const offset = kind === KIND_UNIT ? 6 : 0.8 * height - BUILDING_FOOT_DY;
        expect(images[0]!.y).toBe(Math.round(iso({ x: 300, y: 300 }).y - offset));
        // The same projectile moves to slot zero; source identity and visual height stay intact.
        p.alive[0] = 1;
        p.sourceId[0] = p.sourceId[1]!;
        p.targetId[0] = p.targetId[1]!;
        p.px[0] = p.px[1]!;
        p.py[0] = p.py[1]!;
        world.projectileCount = 1;
        const compacted = hashWorld(world);
        const y = images[0]!.y;
        renderer.sync(world, [], 1);
        expect(images[0]!.y).toBe(y);
        expect(hashWorld(world)).toBe(compacted);
      });
    }
  }
});
