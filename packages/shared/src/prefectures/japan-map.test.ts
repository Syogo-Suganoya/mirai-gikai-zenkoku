import { describe, expect, it } from "vitest";
import {
  JAPAN_MAP_SHAPES,
  JAPAN_MAP_VIEWBOX,
  OKINAWA_CODE,
  transformSvgPath,
} from "./japan-map";

/** 地図データのパス（m と z だけ・相対指定）の頂点を求める */
function pathPoints(path: string): [number, number][] {
  const tokens = path.match(/[a-zA-Z]|-?\d*\.?\d+/g) ?? [];
  const points: [number, number][] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let moving = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "m" || token === "M") {
      moving = true;
      continue;
    }
    if (token === "z" || token === "Z") {
      x = startX;
      y = startY;
      continue;
    }
    x += Number(token);
    y += Number(tokens[++i]);
    if (moving) {
      startX = x;
      startY = y;
      moving = false;
    }
    points.push([x, y]);
  }
  return points;
}

const [, , width, height] = JAPAN_MAP_VIEWBOX.split(" ").map(Number);
const okinawa = JAPAN_MAP_SHAPES.find((s) => s.code === OKINAWA_CODE);
const others = JAPAN_MAP_SHAPES.filter((s) => s.code !== OKINAWA_CODE);

describe("JAPAN_MAP_SHAPES", () => {
  it("47都道府県すべての形がそろっている", () => {
    expect(JAPAN_MAP_SHAPES).toHaveLength(47);
    expect(new Set(JAPAN_MAP_SHAPES.map((s) => s.code)).size).toBe(47);
    expect(JAPAN_MAP_SHAPES.find((s) => s.code === "23")?.name).toBe("愛知県");
    expect(okinawa?.name).toBe("沖縄県");
  });

  it("すべての形が表示範囲（viewBox）に収まる", () => {
    for (const shape of JAPAN_MAP_SHAPES) {
      for (const [x, y] of pathPoints(shape.path)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(width);
        expect(y).toBeLessThanOrEqual(height);
      }
    }
  });

  it("沖縄県は左上の区切り線（横 214・縦 166）の内側、ほかは外側にある", () => {
    for (const [x, y] of pathPoints(okinawa?.path ?? "")) {
      expect(x).toBeLessThan(214);
      expect(y).toBeLessThan(166);
    }
    for (const shape of others) {
      for (const [x, y] of pathPoints(shape.path)) {
        expect(x > 214 || y > 166).toBe(true);
      }
    }
  });
});

describe("transformSvgPath", () => {
  it("平行移動だけなら先頭の座標だけがずれる", () => {
    expect(transformSvgPath("m 10,20 1,2 z m 3,4 z", { dx: 5, dy: -15 })).toBe(
      "m 15,5 1,2 z m 3,4 z"
    );
  });

  it("拡大すると数値がすべて scale 倍になり、そのあと先頭が移動する", () => {
    expect(
      transformSvgPath("m 10,20 1,-2 z m 3,4 z", { scale: 1.5, dx: 1, dy: 2 })
    ).toBe("m 16,32 1.5,-3 z m 4.5,6 z");
  });

  it("先頭が移動でない・途中に絶対指定があるパスはエラー", () => {
    expect(() => transformSvgPath("l 1,2", {})).toThrow();
    expect(() => transformSvgPath("m 1,2 L 3,4", {})).toThrow();
  });
});
