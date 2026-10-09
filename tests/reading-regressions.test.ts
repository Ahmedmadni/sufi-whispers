import { describe, expect, test } from "bun:test";
import { localDateKey, previousLocalDateKey } from "../src/lib/local-calendar";
import { parseSavedPage, clampPage } from "../src/lib/reading-page";

describe("local calendar rollover", () => {
  test("formats the device-local date", () => {
    expect(localDateKey(new Date(2026, 9, 9, 23, 45))).toBe("2026-10-09");
  });
  test("does not roll over to a UTC day before local midnight", () => {
    expect(localDateKey(new Date(2026, 0, 1, 0, 15))).toBe("2026-01-01");
  });
  test("subtracts a calendar day across a month boundary", () => {
    expect(previousLocalDateKey(new Date(2026, 2, 1, 0, 15))).toBe("2026-02-28");
  });
  test("handles the new year", () => {
    expect(previousLocalDateKey(new Date(2027, 0, 1, 1, 0))).toBe("2026-12-31");
  });
});
describe("PDF reading position", () => {
  test("parses only positive integral pages", () => {
    expect(parseSavedPage("7")).toBe(7);
    expect(parseSavedPage(" 19 ")).toBe(19);
    for (const bad of [null, "", "0", "-4", "3.5", "abc", "Infinity"]) {
      expect(parseSavedPage(bad)).toBe(1);
    }
  });
  test("clamps stale bookmarks to the loaded book", () => {
    expect(clampPage(425, 47)).toBe(47);
    expect(clampPage(0, 47)).toBe(1);
    expect(clampPage(20, 47)).toBe(20);
    expect(clampPage(20, 0)).toBe(1);
  });
});
