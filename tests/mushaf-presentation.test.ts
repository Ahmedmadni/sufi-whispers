import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { MushafSurahOpening, openingVerses } from "../src/components/MushafSurahOpening";
import type { Aya } from "../src/lib/quran";

const verse = (aya_no: number, aya_text: string): Aya =>
  ({ aya_no, aya_text, sura_no: 1 } as Aya);

describe("printed Quran surah opening", () => {
  test("moves the original Al-Fatiha first verse into the ornament exactly once", () => {
    const verses = [verse(1, "بسم الله اختبار"), verse(2, "الْحَمْدُ لِلَّهِ")];
    const remaining = openingVerses(1, verses, true);
    expect(remaining.map((a) => a.aya_no)).toEqual([2]);
    expect(verses).toHaveLength(2); // source never mutated
    const html = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 1, suraName: "الفاتحة", firstAyaText: verses[0].aya_text,
    }));
    expect(html).toContain("بسم الله اختبار");
    expect(html).toContain("mushaf-basmala");
    expect(html).toContain("mushaf-basmala__cartouche");
    expect((html.match(/mushaf-illumination-wing/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain("mushaf-basmala__corner");
    expect((html.match(/بسم الله اختبار/g) || []).length).toBe(1);
  });

  test("never injects a basmala into At-Tawbah", () => {
    const html = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 9, suraName: "التوبة",
    }));
    expect(html).toContain("التوبة");
    expect(html).not.toContain("mushaf-basmala");
    expect(html).not.toContain("بِسْمِ");
  });

  test("adds a single decorative basmala for other suras without removing their verses", () => {
    const first = verse(1, "قُلْ هُوَ اللَّهُ أَحَدٌ");
    const html = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 112, suraName: "الإخلاص",
    }));
    expect(html).toContain("mushaf-basmala");
    expect(html).toContain("بِسْمِ");
    expect(openingVerses(112, [first], true)).toEqual([first]);
    expect(openingVerses(1, [first], false)).toEqual([first]);
  });
});
