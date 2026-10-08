export type PlaceId = "board" | "garden" | "studio" | "home";
export const QUEST_IDS = ["notice", "grow", "create"] as const;
export const MAX_APPLICATIONS = 12;
export type QuestId = typeof QUEST_IDS[number];
export type ApplicationStatus = "submitted" | "accepted" | "declined";
export type ChatPrompt = "quiet" | "shared" | "dates";
export type StorageStatus = "saved" | "session" | "protected" | "save-failed";
export type DemoApplication = {
  id: string;
  hostId: "demo-maple";
  arrival: string;
  departure: string;
  status: ApplicationStatus;
};
export type CommunityState = {
  schema: 1;
  completed: QuestId[];
  applications: DemoApplication[];
};
export type CommunityPlatformAdapter = {
  snapshot(): CommunityState;
  completeQuest(quest: QuestId): CommunityState;
  apply(arrival: string, departure: string): CommunityState;
  review(id: string, status: "accepted" | "declined"): CommunityState;
  reply(id: string, prompt: ChatPrompt): string;
  reset(): CommunityState;
  persistent(): boolean;
  storageStatus(): StorageStatus;
};
