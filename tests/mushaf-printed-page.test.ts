import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { groupMushafPage, hasExactVerseSequence } from "../src/lib/mushaf-page-layout";
import { MushafPrintedPageFrame } from "../src/components/MushafPrintedPageFrame";
import { MushafSurahOpening, openingVerses } from "../src/components/MushafSurahOpening";
import type { Aya } from "../src/lib/quran";

function verse(sura: number, number: number, page: number, text: string): Aya {
  return {
    id: sura * 1000 + number,
    jozz: page === 604 ? 30 : 1,
    sura_no: sura,
    sura_name_ar: sura === 1 ? "الْفَاتِحَة" : sura === 9 ? "التَّوْبَة" : "الْإِخْلَاص",
    sura_name_en: "",
    aya_no: number,
    page,
    line_start: 1,
    line_end: 3,
    aya_text: text,
    aya_text_emlaey: "search only",
  };
}

describe("printed Mushaf — immutable original text", () => {
  test("preserves verse identity, word order, all marks and the line metadata", () => {
    const original = [
      verse(112, 1, 604, "قُلْ هُوَ ٱللَّهُ أَحَدٌ\u00A0\uFC00"),
      verse(112, 2, 604, "ٱللَّهُ ٱلصَّمَدُّ ۞"),
      verse(113, 1, 604, "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ\u00A0\uFC00"),
      verse(114, 1, 604, "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ\u00A0\uFC00"),
    ];
    const snapshot = structuredClone(original);
    const groups = groupMushafPage(original);

    expect(groups.map((g) => g.suraNo)).toEqual([112, 113, 114]);
    expect(groups.map((g) => g.startsSura)).toEqual([true, true, true]);
    expect(hasExactVerseSequence(original, groups)).toBe(true);
    expect(original).toEqual(snapshot);
    expect(groups[0].list[0]).toBe(original[0]);
    expect(groups.flatMap((g) => g.list).map((a) => a.aya_text))
      .toEqual(original.map((a) => a.aya_text));
  });

  test("integrity check rejects duplicate, dropped, moved or replaced verses", () => {
    const source = [
      verse(2, 1, 2, "الٓمّٓ"),
      verse(2, 2, 2, "ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ"),
      verse(2, 3, 2, "ٱلَّذِينَ يُؤْمِنُونَ"),
    ];
    expect(hasExactVerseSequence(source, groupMushafPage(source))).toBe(true);
    const removed = groupMushafPage(source);
    removed[0].list.pop();
    expect(hasExactVerseSequence(source, removed)).toBe(false);
    const replaced = groupMushafPage(source);
    replaced[0].list[1] = { ...replaced[0].list[1], aya_text: "نص مختلف" };
    expect(hasExactVerseSequence(source, replaced)).toBe(false);
    const reordered = groupMushafPage(source);
    reordered[0].list.reverse();
    expect(hasExactVerseSequence(source, reordered)).toBe(false);
  });

  test("the decorated frame surrounds raw Quran text without inserting letters", () => {
    const literal = "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ\u00A0\uFC00";
    const html = renderToStaticMarkup(createElement(MushafPrintedPageFrame, {
      page: 604, suraName: "الْفَلَق", juz: 30,
      children: createElement("span", { "data-testid": "canonical-verse" }, literal),
    }));
    expect(html).toContain('data-testid="printed-mushaf-page"');
    expect(html).toContain("الجزء 30");
    expect(html).toContain("سورة الْفَلَق");
    expect(html).toContain('data-testid="canonical-quran-text"');
    expect(html).toContain(literal);
    expect((html.match(/data-testid="canonical-verse"/g) ?? []).length).toBe(1);
    expect((html.match(/class="mushaf-printed-border /g) ?? []).length).toBe(4);
  });

  test("Al-Fatiha displays its original first verse once; At-Tawbah adds no Basmala", () => {
    const source = [
      verse(1, 1, 1, "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\u00A0\uFC00"),
      verse(1, 2, 1, "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ"),
    ];
    const opening = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 1, suraName: "الفاتحة", firstAyaText: source[0].aya_text,
    }));
    expect(opening).toContain("بِسْمِ ٱللَّهِ");
    expect(opening).toContain("\uFC00");
    expect(openingVerses(1, source, true).map((a) => a.aya_no)).toEqual([2]);
    const tawbah = renderToStaticMarkup(createElement(MushafSurahOpening, {
      suraNo: 9, suraName: "التوبة",
    }));
    expect(tawbah).not.toContain("signature-basmala");
    expect(tawbah).not.toContain("بِسْمِ");
  });
});
