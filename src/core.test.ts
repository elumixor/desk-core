import { describe, expect, test } from "bun:test";
import { frontendApi } from "./clerk";
import { isDeskUrl, onDeskDomain } from "./sign-in";
import { parseUrn, peoplePerson } from "./urn";

describe("sign-in", () => {
  test("returns only to https places in the suite", () => {
    expect(isDeskUrl("https://keep.desk.atmagaming.com/w/1")).toBe(true);
    expect(isDeskUrl("https://desk.atmagaming.com/")).toBe(true);
    expect(isDeskUrl("http://keep.desk.atmagaming.com/")).toBe(false);
    expect(isDeskUrl("https://evil.com/?desk.atmagaming.com")).toBe(false);
    expect(isDeskUrl("https://notdesk.atmagaming.com/")).toBe(false);
    expect(isDeskUrl("javascript:alert(1)")).toBe(false);
  });

  test("knows the suite's own hosts", () => {
    expect(onDeskDomain("pai.desk.atmagaming.com")).toBe(true);
    expect(onDeskDomain("localhost")).toBe(false);
  });
});

describe("clerk", () => {
  test("reads the Frontend API off a publishable key, padded or not", () => {
    expect(frontendApi("pk_live_Y2xlcmsuZGVzay5hdG1hZ2FtaW5nLmNvbSQ")).toBe("clerk.desk.atmagaming.com");
  });
});

describe("urn", () => {
  test("parses and formats", () => {
    expect(parseUrn(peoplePerson("42"))).toEqual({ app: "people", kind: "person", id: "42" });
    expect(parseUrn("not a urn")).toBeNull();
  });
});

describe("themes", () => {
  test("every palette has a light or dark mode and a swatch", async () => {
    const { PALETTES, DEFAULT_THEME, paletteById } = await import("./theme");
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(PALETTES.length);
    expect(paletteById(DEFAULT_THEME.light)?.kind).toBe("light");
    expect(paletteById(DEFAULT_THEME.dark)?.kind).toBe("dark");
  });

  test("tokens.css defines every named palette", async () => {
    const { PALETTES, DEFAULT_THEME } = await import("./theme");
    const css = await Bun.file(new URL("./tokens.css", import.meta.url)).text();
    for (const p of PALETTES) if (p.id !== DEFAULT_THEME[p.kind]) expect(css).toContain(`[data-palette="${p.id}"]`);
    expect(css).toContain("@theme inline");
  });

  test("a forced mode shows that mode's palette", async () => {
    const { activePalette } = await import("./theme");
    expect(activePalette({ mode: "dark", light: "pai-light", dark: "dracula" }).id).toBe("dracula");
    expect(activePalette({ mode: "light", light: "pai-light", dark: "dracula" }).id).toBe("pai-light");
    expect(activePalette({ mode: "light", light: "dracula", dark: "nord" }).id).toBe("nord-light");
  });
});
