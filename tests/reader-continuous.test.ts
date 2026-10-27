import { describe, expect, test } from "bun:test";
import {
  createContinuousLayout,
  continuousWindow,
  pageAtContinuousOffset,
  persistReaderMode,
  preserveContinuousScroll,
  readerModeKey,
  storedReaderMode,
} from "../src/lib/reader-continuous";

describe("continuous book reader geometry", () => {
  test("creates stable page starts and removes the trailing gap", () => {
    const layout = createContinuousLayout(3, 200, () => 1.5, 10);
    expect(layout.pageCount).toBe(3);
    expect(layout.heights).toEqual([300, 300, 300]);
    expect(layout.starts).toEqual([0, 310, 620, 920]);
    expect(layout.totalHeight).toBe(920);
  });

  test("maps offsets to the correct source page at boundaries", () => {
    const layout = createContinuousLayout(3, 200, () => 1, 10);
    expect(pageAtContinuousOffset(layout, -10)).toBe(1);
    expect(pageAtContinuousOffset(layout, 0)).toBe(1);
    expect(pageAtContinuousOffset(layout, 209)).toBe(1);
    expect(pageAtContinuousOffset(layout, 210)).toBe(2);
    expect(pageAtContinuousOffset(layout, 420)).toBe(3);
    expect(pageAtContinuousOffset(layout, Number.NaN)).toBe(1);
  });

  test("keeps the rendered window bounded and includes overscan", () => {
    const layout = createContinuousLayout(500, 300, () => 1.4, 12);
    const window = continuousWindow(layout, layout.starts[249], 600, 1);
    expect(window.current).toBe(250);
    expect(window.first).toBeGreaterThanOrEqual(1);
    expect(window.last).toBeLessThanOrEqual(500);
    expect(window.rendered).toBe(window.last - window.first + 1);
    expect(window.rendered).toBeLessThan(10);
  });

  test("preserves the same relative reading position when page geometry changes", () => {
    const oldLayout = createContinuousLayout(4, 200, () => 1, 10);
    const nextLayout = createContinuousLayout(4, 400, () => 1.5, 10);
    const oldOffset = oldLayout.starts[1] + oldLayout.heights[1] * 0.4;
    const nextOffset = preserveContinuousScroll(oldLayout, nextLayout, oldOffset);
    expect(pageAtContinuousOffset(nextLayout, nextOffset)).toBe(2);
    expect(nextOffset).toBe(nextLayout.starts[1] + nextLayout.heights[1] * 0.4);
  });

  test("defaults safely to continuous mode and persists an explicit mode", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    expect(storedReaderMode("book-a", storage)).toBe("continuous");
    persistReaderMode("book-a", "paged", storage);
    expect(values.get(readerModeKey("book-a"))).toBe("paged");
    expect(storedReaderMode("book-a", storage)).toBe("continuous");
    persistReaderMode("book-a", "continuous", storage);
    expect(storedReaderMode("book-a", storage)).toBe("continuous");
  });

  test("rejects invalid page counts without allocating a giant layout", () => {
    expect(createContinuousLayout(0, 300, () => 1).pageCount).toBe(0);
    expect(createContinuousLayout(10001, 300, () => 1).totalHeight).toBe(0);
  });
});
