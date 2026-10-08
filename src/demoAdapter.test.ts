import { describe, expect, it } from "vitest";
import { createDemoAdapter } from "./demoAdapter";
import { demoDate } from "./fixtures";
import { STORAGE_KEY, sanitizeState } from "./localStore";

function memoryStorage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

describe("isolated community adapter", () => {
  it("uses only the community namespace, not real game sessions", () => {
    const storage = memoryStorage(); storage.values.set("game-session", "PRIVATE-FIXTURE-NOT-A-TOKEN");
    const adapter = createDemoAdapter(storage); adapter.completeQuest("notice"); adapter.reset();
    expect(storage.getItem("game-session")).toBe("PRIVATE-FIXTURE-NOT-A-TOKEN");
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toMatchObject({ state: { completed: [], applications: [] } });
  });
  it("deduplicates identical applications and blocks overlap", () => {
    const adapter = createDemoAdapter();
    adapter.apply(demoDate(1), demoDate(3)); adapter.apply(demoDate(1), demoDate(3));
    expect(adapter.snapshot().applications).toHaveLength(1);
    expect(() => adapter.apply(demoDate(2), demoDate(4))).toThrow("overlap");
  });
  it("keeps review final and conversations local", () => {
    const adapter = createDemoAdapter(); const state = adapter.apply(demoDate(1), demoDate(2));
    const id = state.applications[0].id;
    expect(() => adapter.reply(id, "quiet")).toThrow("Accept");
    adapter.review(id, "accepted"); adapter.review(id, "accepted");
    expect(() => adapter.review(id, "declined")).toThrow("already");
    expect(adapter.reply(id, "quiet")).toContain("fictional");
  });
  it("never restores identity or free-text fields", () => {
    const result = sanitizeState({ schema: 1, completed: ["notice"], applications: [], email: "synthetic@example.invalid", access_token: "synthetic", name: "Synthetic" });
    expect(Object.keys(result).sort()).toEqual(["applications", "completed", "schema"]);
  });
  it("remains playable when local persistence is unavailable", () => {
    const adapter = createDemoAdapter({ getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } });
    adapter.completeQuest("create"); expect(adapter.snapshot().completed).toContain("create"); expect(adapter.persistent()).toBe(false);
  });
});
