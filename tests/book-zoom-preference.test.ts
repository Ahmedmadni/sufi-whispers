import { describe, expect, test } from "bun:test";
import { BOOK_ZOOM_KEY, readBookZoom } from "../src/lib/book-zoom-preference";

describe("saved book page size", () => {
  test("reads the saved page size used when reopening a book", () => {
    const storage = { getItem: (key: string) => key === BOOK_ZOOM_KEY ? "1.25" : null };
    expect(readBookZoom(storage)).toBe(1.25);
  });
  test("uses full-page fit when no size is saved", () => {
    expect(readBookZoom({ getItem: () => null })).toBe(1);
  });
});