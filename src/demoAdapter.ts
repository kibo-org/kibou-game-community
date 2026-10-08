import type { CommunityPlatformAdapter, QuestId } from "./contracts";
import { MAX_APPLICATIONS, QUEST_IDS } from "./contracts";
import { createLocalStore } from "./localStore";
import { REPLIES, validateDates } from "./fixtures";

export function createDemoAdapter(storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">): CommunityPlatformAdapter {
  const store = createLocalStore(storage);
  return {
    snapshot: store.snapshot,
    persistent: store.persistent,
    storageStatus: store.storageStatus,
    reset: store.reset,
    completeQuest(quest: QuestId) {
      if (!QUEST_IDS.includes(quest)) throw new Error("Unknown demo quest");
      const state = store.snapshot();
      if (!state.completed.includes(quest)) state.completed.push(quest);
      return store.save(state);
    },
    apply(arrival, departure) {
      if (!validateDates(arrival, departure)) throw new Error("Choose 1-3 nights within the next 30 days.");
      const state = store.snapshot();
      if (state.applications.some(item => item.arrival === arrival && item.departure === departure && item.status !== "declined")) return state;
      if (state.applications.length >= MAX_APPLICATIONS) throw new Error("The local demo has reached its limit. Reset it to start again.");
      if (state.applications.some(item => item.status !== "declined" && item.arrival < departure && item.departure > arrival)) {
        throw new Error("These dates overlap an existing local demo application.");
      }
      state.applications.push({ id: `demo-${crypto.randomUUID()}`, hostId: "demo-maple", arrival, departure, status: "submitted" });
      return store.save(state);
    },
    review(id, status) {
      if (status !== "accepted" && status !== "declined") throw new Error("Unknown demo review");
      const state = store.snapshot();
      const application = state.applications.find(item => item.id === id);
      if (!application) throw new Error("Demo application not found");
      if (application.status === status) return state;
      if (application.status !== "submitted") throw new Error("This demo application has already been reviewed.");
      application.status = status;
      return store.save(state);
    },
    reply(id, prompt) {
      if (!store.snapshot().applications.some(item => item.id === id && item.status === "accepted")) throw new Error("Accept the local demo application before opening the conversation.");
      if (!Object.hasOwn(REPLIES, prompt)) throw new Error("Unknown demo question");
      return REPLIES[prompt];
    },
  };
}
