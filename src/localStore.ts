import type { CommunityState, DemoApplication, QuestId, StorageStatus } from "./contracts";
import { MAX_APPLICATIONS, QUEST_IDS } from "./contracts";

export const STORAGE_KEY = "kibou-community-fiction:v1";
export const emptyState = (): CommunityState => ({ schema: 1, completed: [], applications: [] });

export function sanitizeState(value: unknown): CommunityState {
  if (!value || typeof value !== "object") return emptyState();
  const raw = value as Record<string, unknown>;
  if (raw.schema !== 1 || !Array.isArray(raw.completed) || !Array.isArray(raw.applications)) return emptyState();
  const completed = [...new Set(raw.completed.filter((id): id is QuestId => QUEST_IDS.includes(id)))];
  const ids = new Set<string>();
  const applications: DemoApplication[] = [];
  const validDay = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  for (const item of raw.applications.slice(0, MAX_APPLICATIONS)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || !/^demo-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(record.id) || ids.has(record.id)
      || record.hostId !== "demo-maple" || !validDay(record.arrival) || !validDay(record.departure)
      || !["submitted", "accepted", "declined"].includes(String(record.status))) continue;
    const nights = (Date.parse(record.departure) - Date.parse(record.arrival)) / 86_400_000;
    if (nights < 1 || nights > 3) continue;
    ids.add(record.id);
    applications.push({ id: record.id, hostId: "demo-maple", arrival: record.arrival, departure: record.departure,
      status: record.status as DemoApplication["status"] });
  }
  // Deliberately project known fictional fields. Never restore identity or free text.
  return { schema: 1, completed, applications };
}

export function createLocalStore(storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">) {
  let state = emptyState();
  let status: StorageStatus = storage ? "saved" : "session";
  let protectedSave = false;
  let expectedRaw: string | null = null;
  let original: string | null = null;
  function load() {
    try {
      const raw = storage?.getItem(STORAGE_KEY) ?? null;
      expectedRaw = raw;
      original = raw;
      if (raw !== null) {
        if (raw.length > 16_384) throw new Error("Unsupported demo save");
        const parsed: unknown = JSON.parse(raw);
        let value = parsed;
        if (parsed && typeof parsed === "object" && "format" in parsed) {
          const envelope = parsed as Record<string, unknown>;
          if (envelope.format !== "community-save-v2" || typeof envelope.revision !== "string"
            || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(envelope.revision)
            || Object.keys(envelope).sort().join(",") !== "format,revision,state") throw new Error("Unsupported demo save");
          value = envelope.state;
        }
        const clean = sanitizeState(value);
        if (!isCompleteSave(value, clean)) throw new Error("Unsupported demo save");
        state = clean;
      } else state = emptyState();
      protectedSave = false;
      original = null;
      status = storage ? "saved" : "session";
    } catch {
      // Keep unreadable data untouched until the user explicitly resets this demo.
      protectedSave = true;
      status = "protected";
    }
  }
  load();
  const sync = () => {
    if (!storage) return;
    try { if (storage.getItem(STORAGE_KEY) !== expectedRaw) status = "conflict"; }
    catch { status = "save-failed"; }
  };
  const checkVersion = () => {
    if (storage) {
      let raw: string | null;
      try { raw = storage.getItem(STORAGE_KEY); }
      catch { status = "save-failed"; throw new Error("Cannot verify the latest save. Export your progress and retry later."); }
      if (raw !== expectedRaw) status = "conflict";
    }
    if (status === "conflict") throw new Error("Another tab changed this save. Export your progress before loading its save.");
  };
  const write = (next: CommunityState) => {
    const raw = JSON.stringify({ format: "community-save-v2", revision: crypto.randomUUID(), state: next });
    storage!.setItem(STORAGE_KEY, raw);
    expectedRaw = raw;
    status = "saved";
  };
  return {
    snapshot: () => structuredClone(state),
    persistent: () => status === "saved",
    storageStatus: () => status,
    sync,
    reload() { load(); return structuredClone(state); },
    exportProgress: () => JSON.stringify(state, null, 2) + "\n",
    exportOriginal: () => original,
    save(next: CommunityState) {
      if (!protectedSave || status === "conflict") checkVersion();
      state = sanitizeState(next);
      if (protectedSave || !storage) return structuredClone(state);
      try {
        write(state);
      } catch { status = "save-failed"; }
      return structuredClone(state);
    },
    reset() {
      checkVersion();
      try { if (storage) write(emptyState()); }
      catch {
        if (!protectedSave) status = "save-failed";
        throw new Error("The demo save could not be reset. Your current progress has not been reset.");
      }
      state = emptyState();
      protectedSave = false;
      original = null;
      status = storage ? "saved" : "session";
      return structuredClone(state);
    },
  };
}

function isCompleteSave(value: unknown, clean: CommunityState): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const raw = value as Record<string, unknown>;
  if (Object.keys(raw).sort().join(",") !== "applications,completed,schema"
    || raw.schema !== 1 || !Array.isArray(raw.completed) || !Array.isArray(raw.applications)) return false;
  if (JSON.stringify(raw.completed) !== JSON.stringify(clean.completed)
    || raw.applications.length !== clean.applications.length) return false;
  return raw.applications.every((item: unknown, index: number) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const record = item as Record<string, unknown>;
    const application = clean.applications[index];
    const keys = ["id", "hostId", "arrival", "departure", "status"] as const;
    return Object.keys(record).length === keys.length
      && keys.every(key => record[key] === application[key]);
  });
}
