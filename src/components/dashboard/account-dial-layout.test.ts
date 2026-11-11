import { describe, expect, it } from "vitest";
import { getAccountDialLayout } from "./account-dial-layout";
describe("account dial placement", () => {
  it.each([
    { origin: { x: 144, y: 660 }, viewport: { width: 1440, height: 720 } },
    { origin: { x: 40, y: 660 }, viewport: { width: 1440, height: 720 } },
    { origin: { x: 145, y: 660 }, viewport: { width: 390, height: 720 } },
    { origin: { x: 40, y: 200 }, viewport: { width: 320, height: 240 } },
    { origin: { x: 1380, y: 40 }, viewport: { width: 1440, height: 720 } },
  ])(
    "keeps every action and its hover ring in view: %j",
    ({ origin, viewport }) => {
      const layout = getAccountDialLayout(origin, viewport, 5);
      for (const point of layout.points) {
        expect(layout.origin.x + point.x - 28).toBeGreaterThanOrEqual(11.9);
        expect(layout.origin.y + point.y - 28).toBeGreaterThanOrEqual(11.9);
        expect(layout.origin.x + point.x + 28).toBeLessThanOrEqual(
          viewport.width - 11.9,
        );
        expect(layout.origin.y + point.y + 28).toBeLessThanOrEqual(
          viewport.height - 11.9,
        );
      }
      for (let i = 1; i < layout.points.length; i++)
        expect(
          Math.hypot(
            layout.points[i].x - layout.points[i - 1].x,
            layout.points[i].y - layout.points[i - 1].y,
          ),
        ).toBeGreaterThan(56);
    },
  );
  it("preserves the original radius and curve instead of stretching the menu", () => {
    const layout = getAccountDialLayout(
      { x: 144, y: 660 },
      { width: 1440, height: 720 },
      5,
    );
    for (const point of layout.points)
      expect(Math.hypot(point.x, point.y)).toBeCloseTo(88);
    expect(layout.points[0].x).toBeCloseTo(
      Math.cos((-140 * Math.PI) / 180) * 88,
    );
    expect(layout.points[4].y).toBeCloseTo(44);
  });
});
