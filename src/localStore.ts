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
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw !== undefined && raw !== null) {
      if (raw.length > 16_384) throw new Error("Unsupported demo save");
      const parsed: unknown = JSON.parse(raw);
      const clean = sanitizeState(parsed);
      if (!isCompleteSave(parsed, clean)) throw new Error("Unsupported demo save");
      state = clean;
    }
  } catch {
    // Keep unreadable data untouched until the user explicitly resets this demo.
    protectedSave = true;
    status = "protected";
  }
  return {
    snapshot: () => structuredClone(state),
    persistent: () => status === "saved",
    storageStatus: () => status,
    save(next: CommunityState) {
      state = sanitizeState(next);
      if (protectedSave || !storage) return structuredClone(state);
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
        status = "saved";
      } catch { status = "save-failed"; }
      return structuredClone(state);
    },
    reset() {
      try { storage?.removeItem(STORAGE_KEY); }
      catch {
        if (!protectedSave) status = "save-failed";
        throw new Error("The demo save could not be deleted. Your current progress has not been reset.");
      }
      state = emptyState();
      protectedSave = false;
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
