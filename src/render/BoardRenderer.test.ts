import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { BATTLE } from '../data/battle';
import { CONTENT } from '../game/cards/registry';
import { DEPLOY_BOX } from '../data/boardGeometry';
import { plotCenter, structureFoot } from '../game/battle/world';
import { THRONE_PLOT } from '../game/run/board';
import { runState, withBuilding } from '../game/testing/fixtures';
import { BUILDING_FOOT_DY, BoardRenderer, PLOT_ART_PX } from './BoardRenderer';

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
  it('draws exactly one arrow, on the south side, whatever edges are passed', () => {
    const { board, arrows } = make();
    board.setEdgeArrows(['N', 'E', 'S', 'W', 'S']);
    expect(arrows.triangles).toHaveLength(1);
    const [x1, y1, x2, y2, tipX, tipY] = arrows.triangles[0]!.fill as [number, number, number, number, number, number];
    const mid = BATTLE.boardOrigin + (BATTLE.plot * 5) / 2;
    const boardBottom = BATTLE.boardOrigin + BATTLE.plot * 5;
    expect(tipX).toBe(mid);
    expect(tipY).toBeGreaterThan(boardBottom);
    expect(y1).toBeGreaterThan(tipY); // the base is further south than the tip: it points up at the board
    expect(y2).toBe(y1);
    expect((x1 + x2) / 2).toBe(mid);
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
  it('scales every plot to fill its 64 px cell and stands buildings on the shifted foot', () => {
    const { board, images } = make();
    const s = withBuilding(runState(), 7, 'wheat_militia', 1);
    board.render(s);
    const plots = images.slice(0, 25);
    for (const p of plots) expect(p.scale * PLOT_ART_PX).toBe(BATTLE.plot);
    const militia = images.find((img) => img.x === structureFoot(7).x && img.y === structureFoot(7).y + BUILDING_FOOT_DY);
    expect(militia, 'militia sprite at the structure foot').toBeDefined();
    const throne = images.find((img) => img.x === structureFoot(THRONE_PLOT).x);
    expect(throne, 'throne sprite on the back row').toBeDefined();
  });

  it('draws a dirt deploy box only on plots whose building raises troops', () => {
    const { board, boxes } = make();
    board.render(withBuilding(withBuilding(runState(), 7, 'wheat_militia', 1), 8, 'wheat_scarecrow', 1));
    const c = plotCenter(7);
    const box = [c.x + DEPLOY_BOX.x0, c.y + DEPLOY_BOX.y0, DEPLOY_BOX.x1 - DEPLOY_BOX.x0, DEPLOY_BOX.y1 - DEPLOY_BOX.y0];
    expect(boxes.rects).toContainEqual(box);
    const c8 = plotCenter(8);
    expect(boxes.rects.some((r) => r[0] === c8.x + DEPLOY_BOX.x0)).toBe(false);
  });
});
