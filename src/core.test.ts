import { describe, expect, test } from "bun:test";
import { frontendApi } from "./clerk";
import { isDskUrl, onDskDomain } from "./sign-in";
import { parseUrn, pplPerson } from "./urn";

describe("sign-in", () => {
  test("returns only to https places in the suite", () => {
    expect(isDskUrl("https://kip.dsk.atmagaming.com/w/1")).toBe(true);
    expect(isDskUrl("https://dsk.atmagaming.com/")).toBe(true);
    expect(isDskUrl("http://kip.dsk.atmagaming.com/")).toBe(false);
    expect(isDskUrl("https://evil.com/?dsk.atmagaming.com")).toBe(false);
    expect(isDskUrl("https://notdsk.atmagaming.com/")).toBe(false);
    expect(isDskUrl("javascript:alert(1)")).toBe(false);
  });

  test("knows the suite's own hosts", () => {
    expect(onDskDomain("pai.dsk.atmagaming.com")).toBe(true);
    expect(onDskDomain("localhost")).toBe(false);
  });
});

describe("clerk", () => {
  test("reads the Frontend API off a publishable key, padded or not", () => {
    expect(frontendApi("pk_live_Y2xlcmsuZHNrLmF0bWFnYW1pbmcuY29tJA")).toBe("clerk.dsk.atmagaming.com");
  });
});

describe("urn", () => {
  test("parses and formats", () => {
    expect(parseUrn(pplPerson("42"))).toEqual({ app: "ppl", kind: "person", id: "42" });
    expect(parseUrn("not a urn")).toBeNull();
  });
});
