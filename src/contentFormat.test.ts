import { describe, expect, it } from "vitest";
import { parseCommunityContent } from "./contentFormat";

const pack = () => ({ schema: 1, fictional: true,
  places: [{ id: "garden", name: "Imaginary garden", x: 0.2, y: 0.3, color: "#47a873", quest: "grow" }],
  quests: [{ id: "grow", place: "garden", name: "Plant", text: "Imagine a seed.", action: "Plant a seed" }] });

describe("portable fictional content v1", () => {
  it("accepts and independently projects a fictional map and narrative", () => {
    const input = pack(); const parsed = parseCommunityContent(input);
    expect(parsed).toEqual(input); expect(parsed.places).not.toBe(input.places);
  });
  it.each(["hostId", "roles", "apiUrl", "script", "bookingRequired"])("rejects authority field %s", field => {
    expect(() => parseCommunityContent({ ...pack(), [field]: "unexpected" })).toThrow();
  });
  it("rejects duplicates, dangling references, non-fiction and external text", () => {
    const input = pack();
    expect(() => parseCommunityContent({ ...input, places: [...input.places, ...input.places] })).toThrow();
    expect(() => parseCommunityContent({ ...input, quests: [] })).toThrow();
    expect(() => parseCommunityContent({ ...input, fictional: false })).toThrow();
    input.quests[0].text = "https://example.invalid";
    expect(() => parseCommunityContent(input)).toThrow();
  });
});
