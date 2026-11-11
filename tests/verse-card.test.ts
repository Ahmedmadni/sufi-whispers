import { describe, expect, test } from "bun:test";
import { parseVerses, versesToText, VERSE_CARD_MAX_LINES } from "../src/lib/verse-card";

describe("verse card couplets", () => {
  test("splits صدر and عجز on a bar, keeping right-to-left order", () => {
    expect(parseVerses("أتاني زماني بما أرتضي | فبالله يا دهر لا تنقضي")).toEqual([
      { right: "أتاني زماني بما أرتضي", left: "فبالله يا دهر لا تنقضي" },
    ]);
  });
  test("pairs consecutive lines when no separator is used", () => {
    expect(parseVerses("الشطر الأول\nالشطر الثاني\nالشطر الثالث\nالشطر الرابع")).toEqual([
      { right: "الشطر الأول", left: "الشطر الثاني" },
      { right: "الشطر الثالث", left: "الشطر الرابع" },
    ]);
  });
  test("keeps a refrain line on its own when other lines are split", () => {
    expect(parseVerses("صدر | عجز\nالله .. الله")).toEqual([
      { right: "صدر", left: "عجز" },
      { right: "الله .. الله" },
    ]);
  });
  test("limits a card to eight verses", () => {
    const many = Array.from({ length: 12 }, (_, i) => `صدر ${i} | عجز ${i}`).join("\n");
    expect(parseVerses(many)).toHaveLength(8);
    expect(VERSE_CARD_MAX_LINES).toBe(8);
  });
  test("copied text ends with the book and page", () => {
    expect(versesToText([{ right: "صدر", left: "عجز" }], "جامع النفحات · صفحة 12")).toBe("صدر    عجز\n\n— جامع النفحات · صفحة 12");
  });
});
