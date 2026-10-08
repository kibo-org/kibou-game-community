import { describe, expect, it } from "vitest";
import { welcomeReply } from "./npcWelcome";
import { NPC_WELCOME } from "./fixtures";

describe("fictional welcome copy", () => {
  it("offers only English and Japanese predefined replies", () => {
    expect(Object.keys(NPC_WELCOME)).toEqual(["en", "ja"]);
    for (const language of ["en", "ja"] as const) {
      expect(Object.keys(NPC_WELCOME[language])).toEqual(["greeting", "village", "help"]);
      for (const prompt of ["greeting", "village", "help"] as const) {
        expect(welcomeReply(language, prompt)).toBe(NPC_WELCOME[language][prompt]);
      }
    }
  });
  it("clearly describes the fictional, local-only boundary", () => {
    expect(welcomeReply("en", "greeting")).toContain("Nothing here is sent to a real person");
    expect(welcomeReply("ja", "greeting")).toContain("実在の人に送られることはありません");
  });
});
