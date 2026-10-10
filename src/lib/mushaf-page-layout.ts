import type { Aya } from "@/lib/quran";

export type MushafPageGroup = {
  suraNo: number;
  suraNameAr: string;
  startsSura: boolean;
  list: Aya[];
};

/**
 * Groups canonical verses for headings only. The returned list holds the
 * identical Aya objects, in original order, with unchanged aya_text.
 * No splitting, normalization, markup conversion or verse renumbering.
 */
export function groupMushafPage(ayat: readonly Aya[]): MushafPageGroup[] {
  const groups: MushafPageGroup[] = [];
  for (const aya of ayat) {
    const previous = groups[groups.length - 1];
    if (previous?.suraNo === aya.sura_no) {
      previous.list.push(aya);
    } else {
      groups.push({
        suraNo: aya.sura_no,
        suraNameAr: aya.sura_name_ar,
        startsSura: aya.aya_no === 1,
        list: [aya],
      });
    }
  }
  return groups;
}

/** Pre-release invariant: every record and codepoint remains identical. */
export function hasExactVerseSequence(source: readonly Aya[], groups: readonly MushafPageGroup[]): boolean {
  const rendered = groups.flatMap((group) => group.list);
  return source.length === rendered.length &&
    source.every((aya, index) => {
      const next = rendered[index];
      return next === aya &&
        next.aya_text === aya.aya_text &&
        next.sura_no === aya.sura_no &&
        next.aya_no === aya.aya_no &&
        next.page === aya.page &&
        next.line_start === aya.line_start &&
        next.line_end === aya.line_end;
    });
}
