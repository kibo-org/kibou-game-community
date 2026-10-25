import { createDemoAdapter } from "./demoAdapter";
import { HOST, PLACES, QUESTS, demoDate } from "./fixtures";
import { createVillageScene } from "./scene";
import type { PlaceId, ChatPrompt } from "./contracts";
import { createAction, element, required } from "./ui";
import { createPanelFocus } from "./panelFocus";

// Discard platform handoff hints; never read production tickets, user IDs or sessions.
if (location.search || location.hash) history.replaceState(null, "", location.pathname);
let storage: Storage | undefined;
try { storage = localStorage; } catch { /* Session-only play is still available. */ }
const adapter = createDemoAdapter(storage);
const panel = required("panel"), content = required("panel-content"), title = required("panel-title"), status = required("status");
let hostView = false;
const panelFocus = createPanelFocus({ panel, heading: title, fallback: required("next") });
const say = (message: string) => { status.textContent = message; };
const action = (label: string, run: () => void, primary = false) => createAction(label, run, say, primary);
const close = () => panelFocus.close();
function show(name: string) {
  panelFocus.remember();
  title.textContent = name; content.replaceChildren(); panel.hidden = false;
  panelFocus.focusHeading();
}
function refresh() {
  const state = adapter.snapshot();
  required("progress").textContent = `${state.completed.length} / ${QUESTS.length} village quests`;
  scene.progress(state.completed);
  const messages = {
    saved: "Fictional progress is saved on this device only.",
    session: "Session-only demo: progress will be lost when this page closes.",
    protected: "An unreadable or unsupported demo save is protected. New progress stays in memory. Reset explicitly to remove the old save.",
    "save-failed": "Saving failed. Current progress stays in memory and may be lost when this page closes.",
  };
  required("storage-status").textContent = messages[adapter.storageStatus()];
}
function openPlace(place: PlaceId) {
  if (place === "home") { openHost(); return; }
  show(PLACES.find(item => item.id === place)?.name ?? "Village");
  const quest = QUESTS.find(item => item.place === place);
  if (quest) {
    content.append(element("h3", quest.name), element("p", quest.text));
    const done = adapter.snapshot().completed.includes(quest.id);
    const complete = action(done ? "Completed" : quest.action, () => {
      adapter.completeQuest(quest.id); refresh(); openPlace(place); say("Village quest completed locally.");
    }, true);
    complete.disabled = done; content.append(complete);
  }
  if (place === "board") {
    content.append(element("h3", "Around the village"));
    for (const item of PLACES.filter(item => item.id !== "board")) content.append(action(item.name, () => scene.go(item.id)));
  }
  content.append(action("Next step", next));
}
function next() {
  const quest = QUESTS.find(item => !adapter.snapshot().completed.includes(item.id));
  if (quest) { scene.go(quest.place); return; }
  const pending = adapter.snapshot().applications.find(item => item.status === "submitted");
  if (pending) { hostView = true; openApplications(); say("You are viewing the fictional Host's local review desk."); return; }
  const accepted = adapter.snapshot().applications.find(item => item.status === "accepted");
  if (accepted) { openConversation(accepted.id); return; }
  scene.go("home");
}
function openHost() {
  show(HOST.home);
  content.append(element("h3", HOST.name));
  const tags = element("ul"); tags.className = "tags";
  for (const tag of HOST.tags) tags.append(element("li", tag));
  content.append(tags, element("h3", "House rules"));
  const rules = element("ul"); for (const rule of HOST.rules) rules.append(element("li", rule)); content.append(rules);
  const form = element("form");
  const arrival = element("input"), departure = element("input");
  for (const [input, caption, offset] of [[arrival, "Arrival", 1], [departure, "Departure", 2]] as const) {
    input.type = "date"; input.required = true; input.min = demoDate(1); input.max = demoDate(30); input.value = demoDate(offset);
    const label = element("label", caption); label.append(input); form.append(label);
  }
  const submit = element("button", "Submit local demo application"); submit.type = "submit"; submit.className = "primary"; form.append(submit);
  form.onsubmit = event => {
    event.preventDefault();
    try {
      adapter.apply(arrival.value, departure.value); hostView = false; refresh(); openApplications();
      say("Demo application created locally. Check the storage status. Nothing was sent to a real Host.");
    } catch (error) { say(error instanceof Error ? error.message : "Could not save the local demo application."); }
  };
  content.append(element("h3", "Try a fictional stay"), form);
}
function openApplications() {
  show(hostView ? "Host desk / local simulation" : "My demo applications");
  content.append(action(hostView ? "Switch to student view" : "Try fictional Host view", () => { hostView = !hostView; openApplications(); }));
  const applications = adapter.snapshot().applications;
  if (!applications.length) content.append(element("p", "No local demo applications yet."), action("Visit Maple House", () => scene.go("home")));
  for (const item of applications) {
    const row = element("article"); row.className = "application";
    row.append(element("h3", HOST.home), element("p", `${item.arrival} to ${item.departure}`), element("strong", `Demo status: ${item.status}`));
    if (hostView && item.status === "submitted") {
      row.append(action("Accept in demo", () => { adapter.review(item.id, "accepted"); refresh(); openApplications(); say("Accepted in the local simulation only."); }),
        action("Decline in demo", () => { adapter.review(item.id, "declined"); refresh(); openApplications(); say("Declined in the local simulation only."); }));
    }
    if (item.status === "accepted") row.append(action("Open fictional conversation", () => openConversation(item.id), true));
    content.append(row);
  }
}
function openConversation(id: string) {
  show("Conversation with Maple / fictional");
  const reply = element("p", "Maple (fictional): Welcome to our little maker village."); reply.className = "reply"; reply.setAttribute("aria-live", "polite");
  content.append(reply);
  for (const [prompt, label] of [["quiet", "Ask about quiet time"], ["shared", "Ask about shared spaces"], ["dates", "Ask about demo dates"]] as [ChatPrompt, string][]) {
    content.append(action(label, () => { reply.textContent = adapter.reply(id, prompt); }));
  }
  content.append(action("Back to demo applications", () => { hostView = false; openApplications(); }));
}

let scene: ReturnType<typeof createVillageScene>;
try {
  scene = createVillageScene(required<HTMLCanvasElement>("village"), openPlace);
} catch {
  // Keep the local workflow usable on devices without WebGL support.
  scene = { go: openPlace, progress: () => {}, reset: () => {}, dispose: () => {} };
  say("3D rendering is unavailable. Use village navigation to explore the local demo.");
}
required("close").onclick = close;
required("board").onclick = () => scene.go("board");
required("host").onclick = () => scene.go("home");
required("applications").onclick = () => { hostView = false; openApplications(); };
required("next").onclick = next;
required("reset").onclick = () => {
  if (!confirm("Delete this fictional demo's local save? Your real Game account and saves are not affected.")) return;
  try {
    adapter.reset(); scene.reset(); close(); refresh(); say("Local fictional demo reset.");
  } catch (error) {
    refresh(); say(error instanceof Error ? error.message : "The fictional demo could not be reset.");
  }
};
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !panel.hidden && !event.defaultPrevented && !event.isComposing) {
    event.preventDefault();
    close();
  }
});
window.addEventListener("pagehide", () => scene.dispose(), { once: true });
// Do not retain a disposed canvas when restored from the browser's back-forward cache.
window.addEventListener("pageshow", event => { if (event.persisted) location.reload(); });
refresh();
