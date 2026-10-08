import { createAction, element } from "./ui";

export type GardenSeed = "sunflower" | "mint";
export type GardenState = { stage: "empty" | "planted" | "complete"; seed: GardenSeed | null };
export type GardenAction = { type: "plant"; seed: GardenSeed } | { type: "water" };

export function advanceGarden(state: GardenState, action: GardenAction): GardenState {
  if (state.stage === "complete") return state;
  if (action.type === "plant") {
    if (state.stage !== "empty" || !["sunflower", "mint"].includes(action.seed)) {
      throw new Error("Choose one demo seed before planting.");
    }
    return { stage: "planted", seed: action.seed };
  }
  if (action.type !== "water" || state.stage !== "planted" || !state.seed) {
    throw new Error("Plant a demo seed before watering.");
  }
  return { ...state, stage: "complete" };
}

export function createGardenQuest(
  completed: boolean,
  finish: () => void,
  reportError: (message: string) => void,
): HTMLElement {
  const section = element("section");
  section.className = "garden-quest";
  section.append(element("h3", "A seed for our little garden / 小さな庭にひと粒の種"));
  section.append(element("p", "Plant a fictional seed, then give it water. Only the finished quest is saved; leaving before watering restarts this little activity."));
  section.append(element("p", "架空の種をまいて、水をあげよう。保存されるのは完了した記録だけです。途中で庭を離れると、種選びから再開します。"));
  const controls = element("div");
  const status = element("p");
  status.setAttribute("aria-live", "polite");
  let state: GardenState = { stage: completed ? "complete" : "empty", seed: null };
  const render = () => {
    controls.replaceChildren();
    if (state.stage === "complete") {
      status.textContent = "A tiny sprout is ready for tomorrow. Completed locally. / 小さな芽が顔を出したよ。この端末で完了！";
      status.tabIndex = -1;
      if (section.isConnected) status.focus({ preventScroll: true });
      return;
    }
    if (state.stage === "empty") {
      status.textContent = "Step 1: choose and plant a seed. / 1：種を選んでまこう。";
      const label = element("label", "Demo seed / 架空の種");
      const select = element("select");
      for (const [value, name] of [["sunflower", "Sunflower / ひまわり"], ["mint", "Mint / ミント"]] as const) {
        const option = element("option", name); option.value = value; select.append(option);
      }
      label.append(select);
      controls.append(label, createAction("Plant / 種をまく", () => {
        const seed = select.value;
        if (seed !== "sunflower" && seed !== "mint") throw new Error("Choose a demo seed.");
        state = advanceGarden(state, { type: "plant", seed });
        render();
      }, reportError, true));
    } else {
      status.textContent = state.seed === "sunflower"
        ? "Sunflower planted. Step 2: give it water. / ひまわりの種をまいたよ。2：水をあげよう。"
        : "Mint planted. Step 2: give it water. / ミントの種をまいたよ。2：水をあげよう。";
      controls.append(createAction("Water / 水をあげる", () => {
        const next = advanceGarden(state, { type: "water" });
        finish();
        state = next;
        render();
      }, reportError, true));
    }
    controls.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  };
  section.append(status, controls);
  render();
  return section;
}
