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
    expect(html).toContain('data-testid="signature-basmala"');
    expect(html).toContain("mushaf-signature-frame__center");
    expect(html).toContain("mushaf-signature-frame__text");
    expect((html.match(/<svg/g) || []).length).toBe(4);
    expect((html.match(/mushaf-signature-wing/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain("mushaf-basmala__corner");
    expect((html.match(/بسم الله اختبار/g) || []).length).toBe(1);
  });

  test("keeps the exact original Hafs verse marker but positions it apart from Al-Fatiha Basmala", () => {
    const original = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ\u00A0\uFC00";
    const markup = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 1, suraName: "الفاتحة", firstAyaText: original,
    }));
    expect(markup).toContain("mushaf-signature-frame__ayah-mark");
    expect(markup).toContain("\uFC00");
    expect(markup).toContain("بِسۡمِ");
    expect((markup.match(/\uFC00/g) || []).length).toBe(1);
    const textWithoutMarkup = markup.replace(/<[^>]*>/g, "");
    expect(textWithoutMarkup).toContain(original);
    expect(openingVerses(1, [{ aya_no: 1, aya_text: original } as Aya], true)).toEqual([]);
  });

  test("never injects a basmala into At-Tawbah", () => {
    const html = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 9, suraName: "التوبة",
    }));
    expect(html).toContain("التوبة");
    expect(html).not.toContain("mushaf-signature-frame");
    expect(html).not.toContain("بِسْمِ");
  });

  test("original signature artwork remains decoration, not Quran text", () => {
    const html = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 2, suraName: "البقرة",
    }));
    expect(html).toContain('data-testid="signature-surah-title"');
    expect(html).toContain("mushaf-signature-rosette");
    expect(html).toContain("mushaf-signature-wing--mirrored");
    expect(html).toContain('aria-hidden="true"');
    expect((html.match(/mushaf-signature-frame__text/g) || []).length).toBe(1);
  });

  test("adds a single decorative basmala for other suras without removing their verses", () => {
    const first = verse(1, "قُلْ هُوَ اللَّهُ أَحَدٌ");
    const html = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 112, suraName: "الإخلاص",
    }));
    expect(html).toContain("mushaf-signature-frame");
    expect(html).toContain("بِسْمِ");
    expect(openingVerses(112, [first], true)).toEqual([first]);
    expect(openingVerses(1, [first], false)).toEqual([first]);
  });
});
