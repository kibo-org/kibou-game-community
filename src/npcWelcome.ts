import { NPC_WELCOME } from "./fixtures";
import { element } from "./ui";

export type WelcomeLanguage = keyof typeof NPC_WELCOME;
export type WelcomePrompt = keyof typeof NPC_WELCOME.en;

export function welcomeReply(language: WelcomeLanguage, prompt: WelcomePrompt): string {
  return NPC_WELCOME[language][prompt];
}

export function createNpcWelcome(): HTMLElement {
  const section = element("section");
  section.className = "npc-welcome";
  const label = element("label", "Conversation language / 会話の言語");
  const language = element("select");
  for (const [value, name] of [["en", "English"], ["ja", "日本語"]] as const) {
    const option = element("option", name);
    option.value = value;
    language.append(option);
  }
  language.value = document.documentElement.lang.startsWith("ja") ? "ja" : "en";
  label.append(language);
  const reply = element("p");
  reply.className = "reply";
  reply.setAttribute("aria-live", "polite");
  let prompt: WelcomePrompt = "greeting";
  const refresh = () => {
    const locale = language.value === "ja" ? "ja" : "en";
    reply.lang = locale;
    reply.textContent = welcomeReply(locale, prompt);
  };
  language.onchange = refresh;
  section.append(element("h3", "Village welcome / 村のあいさつ"), label, reply);
  for (const [choice, caption] of [
    ["greeting", "Say hello / あいさつ"],
    ["village", "Where can I go? / どこに行こう？"],
    ["help", "What can I make? / 何を作ろう？"],
  ] as const) {
    const button = element("button", caption);
    button.type = "button";
    button.onclick = () => { prompt = choice; refresh(); };
    section.append(button);
  }
  refresh();
  return section;
}
