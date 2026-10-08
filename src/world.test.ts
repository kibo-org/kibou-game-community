import { describe, expect, it } from "vitest";
import { worldPoint } from "./world";
import { PLACES } from "./fixtures";

describe("fictional 3D coordinates", () => {
  it("maps the village center to the ground origin", () => {
    const center = worldPoint(0.5, 0.5);
    expect([center.x, center.y, center.z]).toEqual([0, 0, 0]);
  });
  it("keeps fictional destinations inside the procedural ground", () => {
    for (const place of PLACES) {
      const point = worldPoint(place.x, place.y);
      expect(Math.abs(point.x)).toBeLessThan(7);
      expect(Math.abs(point.z)).toBeLessThan(7);
      expect(point.y).toBe(0);
    }
  });
});
