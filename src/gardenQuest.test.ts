import { describe, expect, it } from "vitest";
import { advanceGarden } from "./gardenQuest";
import { createDemoAdapter } from "./demoAdapter";

describe("seed-and-water quest", () => {
  it("requires planting before watering", () => {
    expect(() => advanceGarden({ stage: "empty", seed: null }, { type: "water" })).toThrow("Plant");
  });
  it.each(["sunflower", "mint"] as const)("completes two distinct steps for %s", seed => {
    const initial = { stage: "empty" as const, seed: null };
    const planted = advanceGarden(initial, { type: "plant", seed });
    expect(initial.stage).toBe("empty");
    expect(planted).toEqual({ stage: "planted", seed });
    const complete = advanceGarden(planted, { type: "water" });
    expect(complete).toEqual({ stage: "complete", seed });
    expect(advanceGarden(complete, { type: "water" })).toBe(complete);
  });
  it("keeps the existing bounded completion schema", () => {
    const adapter = createDemoAdapter();
    adapter.completeQuest("grow"); adapter.completeQuest("grow");
    expect(adapter.snapshot().completed).toEqual(["grow"]);
    expect(Object.keys(adapter.snapshot()).sort()).toEqual(["applications", "completed", "schema"]);
  });
});
