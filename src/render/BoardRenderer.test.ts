import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { BATTLE } from '../data/battle';
import { CONTENT } from '../game/cards/registry';
import { DEPLOY_BOX } from '../data/boardGeometry';
import { plotCenter, structureFoot } from '../game/battle/world';
import { THRONE_PLOT } from '../game/run/board';
import { runState, withBuilding } from '../game/testing/fixtures';
import { ISO, project, unproject } from '../core/iso';
import { BUILDING_FOOT_DY, BoardRenderer } from './BoardRenderer';
import { isoQuad } from './isoView';

/** Just enough Graphics/Image to build the renderer and see which arrows it draws. */
class FakeGraphics {
  triangles: { fill: number[]; stroke: number[] }[] = [];
  rects: number[][] = [];
  destroyed = false;
  setDepth(): this {
    return this;
  }
  clear(): this {
    this.triangles = [];
    this.rects = [];
    this.polys = [];
    return this;
  }
  fillStyle(): this {
    return this;
  }
  lineStyle(): this {
    return this;
  }
  fillTriangle(...p: number[]): this {
    this.triangles.push({ fill: p, stroke: [] });
    return this;
  }
  strokeTriangle(...p: number[]): this {
    this.triangles[this.triangles.length - 1]!.stroke = p;
    return this;
  }
  /** Filled polygons (isometric shapes are paths). */
  polys: { x: number; y: number }[][] = [];
  private current: { x: number; y: number }[] = [];
  beginPath(): this {
    this.current = [];
    return this;
  }
  moveTo(x: number, y: number): this {
    this.current.push({ x, y });
    return this;
  }
  lineTo(x: number, y: number): this {
    this.current.push({ x, y });
    return this;
  }
  closePath(): this {
    return this;
  }
  fillPath(): this {
    this.polys.push(this.current);
    return this;
  }
  strokePath(): this {
    return this;
  }
  fillRect(...r: number[]): this {
    this.rects.push(r);
    return this;
  }
  strokeRect(): this {
    return this;
  }
  destroy(): void {
    this.destroyed = true;
  }
}
class FakeImage {
  x: number;
  y: number;
  scale = 1;
  depth = 0;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  setDepth(d: number): this {
    this.depth = d;
    return this;
  }
  setOrigin(): this {
    return this;
  }
  setScale(s: number): this {
    this.scale = s;
    return this;
  }
  /** Plot frames in the atlas are diamonds; the fake one is the 64×32 diamond of 32 px plot art. */
  frame = { width: 64, height: 32 };
  setFrame(): this {
    return this;
  }
  setVisible(): this {
    return this;
  }
  destroy(): void {}
}

class FakeText {
  private data = new Map<string, unknown>();
  setStroke(): this {
    return this;
  }
  setOrigin(): this {
    return this;
  }
  setDepth(): this {
    return this;
  }
  setText(): this {
    return this;
  }
  setPosition(): this {
    return this;
  }
  setVisible(): this {
    return this;
  }
  setData(k: string, v: unknown): this {
    this.data.set(k, v);
    return this;
  }
  getData(k: string): unknown {
    return this.data.get(k);
  }
  destroy(): void {}
}

const make = () => {
  const graphics: FakeGraphics[] = [];
  const images: FakeImage[] = [];
  const scene = {
    add: {
      image: (x: number, y: number) => {
        const img = new FakeImage(x, y);
        images.push(img);
        return img;
      },
      text: () => new FakeText(),
      graphics: () => {
        const g = new FakeGraphics();
        graphics.push(g);
        return g;
      },
    },
  } as unknown as Phaser.Scene;
  const board = new BoardRenderer(scene, CONTENT);
  // graphics created in order: highlights, arrows, marks, deploy boxes
  return { board, arrows: graphics[1]!, boxes: graphics[3]!, images };
};

describe('southern edge arrow', () => {
  it('draws exactly one arrow, just past the middle of the board south edge, pointing back at it', () => {
    const { board, arrows } = make();
    board.setEdgeArrows(['N', 'E', 'S', 'W', 'S']);
    expect(arrows.triangles).toHaveLength(1);
    const [x1, y1, x2, y2, tipX, tipY] = arrows.triangles[0]!.fill as [number, number, number, number, number, number];
    const mid = BATTLE.boardOrigin + (BATTLE.plot * 5) / 2;
    const south = BATTLE.boardOrigin + BATTLE.plot * 5;
    // the tip is a few world px south of the south edge's midpoint, through the projection
    const edgeMid = project({ x: mid, y: south });
    const tipWorld = unproject({ x: tipX, y: tipY });
    expect(tipWorld.x).toBeCloseTo(mid, 6);
    expect(tipWorld.y).toBeGreaterThan(south);
    expect(Math.abs(tipX - edgeMid.x) + Math.abs(tipY - edgeMid.y)).toBeLessThan(16);
    // the base is down-left of the tip (towards the road), so the arrow points up-right at the board
    expect((x1 + x2) / 2).toBeLessThan(tipX);
    expect((y1 + y2) / 2).toBeGreaterThan(tipY);
  });

  it('legacy N/E/W alone still show only the south arrow; an empty list clears it', () => {
    const { board, arrows } = make();
    board.setEdgeArrows(['N', 'W']);
    expect(arrows.triangles).toHaveLength(1);
    board.setEdgeArrows([]);
    expect(arrows.triangles).toHaveLength(0);
  });
});

describe('64 px plots (spec 06/11/2026)', () => {
  it('scales every plot to its 128×64 diamond and stands buildings on their projected feet', () => {
    const { board, images } = make();
    const s = withBuilding(runState(), 7, 'wheat_militia', 1);
    board.render(s);
    const plots = images.slice(0, 25);
    for (const p of plots) expect(p.scale * p.frame.width).toBe(ISO.plotW);
    const f7 = project(structureFoot(7));
    const militia = images.find((img) => img.x === f7.x && img.y === f7.y + BUILDING_FOOT_DY);
    expect(militia, 'militia sprite at the projected structure foot').toBeDefined();
    expect(militia!.scale).toBe(2); // generated 32 px art drawn 2× on the isometric board
    const throne = images.find((img) => img.x === project(structureFoot(THRONE_PLOT)).x);
    expect(throne, 'throne sprite on the back row').toBeDefined();
  });

  it('draws a dirt deploy box only on plots whose building raises troops', () => {
    const { board, boxes } = make();
    board.render(withBuilding(withBuilding(runState(), 7, 'wheat_militia', 1), 8, 'wheat_scarecrow', 1));
    const c = plotCenter(7);
    const box = isoQuad(c.x + DEPLOY_BOX.x0, c.y + DEPLOY_BOX.y0, DEPLOY_BOX.x1 - DEPLOY_BOX.x0, DEPLOY_BOX.y1 - DEPLOY_BOX.y0);
    expect(boxes.polys).toEqual([box]); // only the militia's strip, as a projected quad
    const c8 = plotCenter(8);
    expect(boxes.polys.some((q) => q[0]!.x === project({ x: c8.x + DEPLOY_BOX.x0, y: c8.y + DEPLOY_BOX.y0 }).x)).toBe(false);
  });
});
