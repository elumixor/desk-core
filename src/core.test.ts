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
