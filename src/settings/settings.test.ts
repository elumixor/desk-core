import { describe, expect, test } from "bun:test";
import { isSettingsShortcut, matchSections } from "./sections";

const key = (over: Partial<KeyboardEvent>) =>
  ({
    code: "Comma",
    key: "<",
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...over,
  }) as KeyboardEvent;

describe("settings", () => {
  test("matches a section by its name or its words", () => {
    const sections = [
      { id: "members", label: "Members", keywords: "invite people role" },
      { id: "keys", label: "Your keys", keywords: "token mcp" },
    ];
    expect(matchSections(sections, "").map((s) => s.id)).toEqual(["members", "keys"]);
    expect(matchSections(sections, " MCP ").map((s) => s.id)).toEqual(["keys"]);
    expect(matchSections(sections, "member").map((s) => s.id)).toEqual(["members"]);
    expect(matchSections(sections, "nothing")).toEqual([]);
  });

  test("opens on ⌘⇧, or Ctrl+Shift+, only", () => {
    expect(isSettingsShortcut(key({ metaKey: true, shiftKey: true }))).toBe(true);
    expect(isSettingsShortcut(key({ ctrlKey: true, shiftKey: true }))).toBe(true);
    expect(isSettingsShortcut(key({ metaKey: true }))).toBe(false);
    expect(isSettingsShortcut(key({ metaKey: true, shiftKey: true, altKey: true }))).toBe(false);
    expect(isSettingsShortcut(key({ shiftKey: true, code: "Period", key: ">", metaKey: true }))).toBe(false);
  });
});
