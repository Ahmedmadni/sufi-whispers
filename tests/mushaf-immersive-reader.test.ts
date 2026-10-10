import { describe, expect, test } from "bun:test";
import {
  clampReaderZoom, distanceBetweenTouches, exactPageText, exactVerseText,
  originalVersesOnPage, pinchReaderZoom, rtlPageFromSwipe,
} from "../src/lib/mushaf-reader-controls";
import type { Aya } from "../src/lib/quran";

const makeAya = (page: number, no: number, value: string): Aya => ({
  id: page * 100 + no, jozz: 30, page, sura_no: 112,
  sura_name_en: "Al-Ikhlas", sura_name_ar: "الإخلاص",
  aya_no: no, line_start: 1, line_end: 2,
  aya_text: value, aya_text_emlaey: "index only",
});

describe("Mushaf full-screen Arabic navigation", () => {
  test("swipe RIGHT / Arabic book turning advances, swipe left returns", () => {
    expect(rtlPageFromSwipe(20, 135, 6)).toBe(21);
    expect(rtlPageFromSwipe(20, -135, 6)).toBe(19);
    expect(rtlPageFromSwipe(1, -100, 0)).toBe(1);
    expect(rtlPageFromSwipe(604, 100, 0)).toBe(604);
    expect(rtlPageFromSwipe(20, 20, 0)).toBe(20);
    expect(rtlPageFromSwipe(20, 115, 205)).toBe(20);
  });

  test("two-finger pinch dynamically zooms and clamps safely", () => {
    const a = { clientX: 20, clientY: 50 };
    const b = { clientX: 120, clientY: 50 };
    expect(distanceBetweenTouches(a, b)).toBe(100);
    expect(pinchReaderZoom(1, 100, 150)).toBe(1.5);
    expect(pinchReaderZoom(2, 100, 70)).toBe(1.4);
    expect(pinchReaderZoom(1, 100, 1000)).toBe(3.5);
    expect(pinchReaderZoom(1, 100, 5)).toBe(1);
    expect(pinchReaderZoom(1, 0, 150)).toBe(1);
    expect(clampReaderZoom(Infinity)).toBe(1);
  });
});

describe("Copying original Uthmanic Quran (full tashkeel)", () => {
  const aya1 = makeAya(604, 1, "قُلۡ هُوَ ٱللَّهُ أَحَدٌ\u00a0\ufc00");
  const aya2 = makeAya(604, 2, "ٱللَّهُ ٱلصَّمَدُ\u00a0\ufc01");
  const aya3 = makeAya(603, 3, "مِن شَرِّ مَا خَلَقَ");
  const source = [aya3, aya1, aya2];

  test("copy one verse character-for-character including vowel marks and verse symbols", () => {
    const text = exactVerseText(aya1);
    expect(text).toBe(aya1.aya_text);
    expect(text).toContain("ٱللَّهُ");
    expect(text).toContain("\u00a0\ufc00");
    expect(text).not.toContain(aya1.aya_text_emlaey);
    expect([...text]).toEqual([...aya1.aya_text]);
  });

  test("copy a page without changing a single canonical Aya string", () => {
    const sourceCopy = structuredClone(source);
    const pageAyat = originalVersesOnPage(source, 604);
    expect(pageAyat).toEqual([aya1, aya2]);
    expect(pageAyat[0]).toBe(aya1);
    expect(pageAyat[1]).toBe(aya2);
    expect(exactPageText(source, 604)).toBe(aya1.aya_text + "\n" + aya2.aya_text);
    expect(source).toEqual(sourceCopy);
    expect(exactPageText(source, 2)).toBe("");
  });
});
