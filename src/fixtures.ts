import type { PlaceId, QuestId, ChatPrompt } from "./contracts";

// Entirely fictional content, not a renamed production Host/member record.
export const HOST = {
  id: "demo-maple" as const,
  name: "Maple, the village maker",
  home: "Maple House",
  tags: ["Quiet evenings", "Shared creative space", "Early morning walks"],
  rules: ["Quiet time starts at 21:00.", "The workshop is shared.", "This is a fictional home, not a real stay offer."],
};
export const PLACES: { id: PlaceId; name: string; x: number; y: number; color: string; quest?: QuestId }[] = [
  { id: "board", name: "Noticeboard", x: 0.24, y: 0.68, color: "#ed6a49", quest: "notice" },
  { id: "garden", name: "Garden", x: 0.24, y: 0.28, color: "#47a873", quest: "grow" },
  { id: "studio", name: "Studio", x: 0.73, y: 0.28, color: "#497bbb", quest: "create" },
  { id: "home", name: "Maple House", x: 0.73, y: 0.68, color: "#e5bb44" },
];
export const QUESTS: { id: QuestId; place: PlaceId; name: string; text: string; action: string }[] = [
  { id: "notice", place: "board", name: "Meet the village", text: "A fictional village built for curious makers. Maple is looking for a new neighbor to help create a room.", action: "Read the village note" },
  { id: "grow", place: "garden", name: "Plant something new", text: "Choose a seed of an idea. Today, we are growing a tiny community garden.", action: "Plant a seed" },
  { id: "create", place: "studio", name: "Make your mark", text: "The studio is open. Add a new room, write a quest, or imagine your own character.", action: "Finish a room sketch" },
];
export const REPLIES: Record<ChatPrompt, string> = {
  quiet: "Maple (fictional): I keep evenings quiet after 21:00. You can decide whether that suits your routine.",
  shared: "Maple (fictional): We share the workshop and tidy our tools after creating. There is a separate quiet corner.",
  dates: "Maple (fictional): The dates on your local demo application are saved on this device only. Nothing has been sent to a real Host.",
};

export function demoDate(offset: number, today = new Date()): string {
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset));
  return date.toISOString().slice(0, 10);
}

export function validateDates(arrival: string, departure: string, today = new Date()): boolean {
  const day = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
  if (!day(arrival) || !day(departure)) return false;
  const nights = (Date.parse(departure) - Date.parse(arrival)) / 86_400_000;
  return arrival >= demoDate(1, today) && departure <= demoDate(30, today) && nights >= 1 && nights <= 3;
}
