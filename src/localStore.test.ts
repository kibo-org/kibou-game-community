import { describe, expect, it } from "vitest";
import { createLocalStore, emptyState, STORAGE_KEY } from "./localStore";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(STORAGE_KEY, initial);
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("fictional save reliability", () => {
  it.each([
    { label: "malformed JSON", raw: "{broken" },
    { label: "null", raw: "null" },
    { label: "empty", raw: "" },
    { label: "oversized", raw: "x".repeat(16_385) },
    { label: "future schema", raw: JSON.stringify({ schema: 2, completed: [], applications: [] }) },
    { label: "unknown quest", raw: JSON.stringify({ schema: 1, completed: ["unknown"], applications: [] }) },
  ])("keeps unsupported original saves intact: $label", ({ raw }) => {
    const storage = memoryStorage(raw);
    const store = createLocalStore(storage);
    store.save({ ...emptyState(), completed: ["notice"] });
    expect(storage.values.get(STORAGE_KEY)).toBe(raw);
    expect(store.snapshot().completed).toEqual(["notice"]);
    expect(store.storageStatus()).toBe("protected");
    expect(store.persistent()).toBe(false);
  });

  it("unlocks persistence only after an explicit successful reset", () => {
    const storage = memoryStorage("{broken");
    const store = createLocalStore(storage);
    store.reset();
    store.save({ ...emptyState(), completed: ["grow"] });
    expect(JSON.parse(storage.values.get(STORAGE_KEY)!)).toMatchObject({ state: { completed: ["grow"] } });
    expect(store.storageStatus()).toBe("saved");
  });

  it("failed deletion preserves the current state and persisted save", () => {
    const storage = memoryStorage();
    const store = createLocalStore({
      ...storage,
      setItem: (key, value) => {
        if (JSON.parse(value).state.completed.length === 0) throw new Error("blocked");
        storage.setItem(key, value);
      },
    });
    store.save({ ...emptyState(), completed: ["create"] });
    const before = storage.values.get(STORAGE_KEY);
    expect(() => store.reset()).toThrow("could not be reset");
    expect(store.snapshot().completed).toEqual(["create"]);
    expect(storage.values.get(STORAGE_KEY)).toBe(before);
  });

  it("restores healthy saves and recovers from a later write failure", () => {
    const storage = memoryStorage(JSON.stringify({ ...emptyState(), completed: ["notice"] }));
    let denied = true;
    const store = createLocalStore({
      ...storage,
      setItem: (key, value) => {
        if (denied) throw new Error("blocked");
        storage.setItem(key, value);
      },
    });
    expect(store.snapshot().completed).toEqual(["notice"]);
    store.save({ ...emptyState(), completed: ["create"] });
    expect(store.storageStatus()).toBe("save-failed");
    denied = false;
    store.save(store.snapshot());
    expect(store.storageStatus()).toBe("saved");
  });

  it("rejects stale writes and stale resets until the user reloads", () => {
    const storage = memoryStorage();
    const first = createLocalStore(storage), second = createLocalStore(storage);
    first.save({ ...emptyState(), completed: ["notice"] });
    const latest = storage.values.get(STORAGE_KEY);
    expect(() => second.save({ ...emptyState(), completed: ["grow"] })).toThrow("Another tab");
    expect(() => second.reset()).toThrow("Another tab");
    expect(storage.values.get(STORAGE_KEY)).toBe(latest);
    expect(second.storageStatus()).toBe("conflict");
    second.reload();
    expect(second.snapshot().completed).toEqual(["notice"]);
  });

  it("a reset keeps a revision tombstone and cannot resurrect old progress", () => {
    const storage = memoryStorage();
    const first = createLocalStore(storage);
    first.save({ ...emptyState(), completed: ["notice"] });
    const old = createLocalStore(storage);
    first.reset(); old.sync();
    expect(() => old.save(old.snapshot())).toThrow("Another tab");
    expect(createLocalStore(storage).snapshot()).toEqual(emptyState());
    expect(JSON.parse(old.exportProgress()).completed).toEqual(["notice"]);
  });

  it("exports protected raw data separately without writing it", () => {
    const raw = "<untrusted save>";
    const storage = memoryStorage(raw), store = createLocalStore(storage);
    store.save({ ...emptyState(), completed: ["grow"] });
    expect(store.exportOriginal()).toBe(raw);
    expect(JSON.parse(store.exportProgress()).completed).toEqual(["grow"]);
    expect(storage.values.get(STORAGE_KEY)).toBe(raw);
  });

  it("never writes when the current revision cannot be read", () => {
    const storage = memoryStorage(); let blocked = false;
    const store = createLocalStore({ ...storage, getItem: key => {
      if (blocked) throw new Error("read denied");
      return storage.getItem(key);
    } });
    blocked = true;
    expect(() => store.save({ ...emptyState(), completed: ["grow"] })).toThrow("Cannot verify");
    expect(storage.values.size).toBe(0);
  });
});
