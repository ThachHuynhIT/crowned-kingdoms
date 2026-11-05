import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { BATTLE } from '../data/battle';
import { CONTENT } from '../game/cards/registry';
import { BoardRenderer } from './BoardRenderer';

/** Just enough Graphics/Image to build the renderer and see which arrows it draws. */
class FakeGraphics {
  triangles: { fill: number[]; stroke: number[] }[] = [];
  destroyed = false;
  setDepth(): this {
    return this;
  }
  clear(): this {
    this.triangles = [];
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
  fillRect(): this {
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
  setDepth(): this {
    return this;
  }
  destroy(): void {}
}

const make = () => {
  const graphics: FakeGraphics[] = [];
  const scene = {
    add: {
      image: () => new FakeImage(),
      graphics: () => {
        const g = new FakeGraphics();
        graphics.push(g);
        return g;
      },
    },
  } as unknown as Phaser.Scene;
  const board = new BoardRenderer(scene, CONTENT);
  // graphics created in order: highlights, arrows, marks
  return { board, arrows: graphics[1]! };
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
