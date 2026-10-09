import { BASMALA, hasBasmala, type Aya } from "@/lib/quran";

/**
 * A single visual opening for both the page and surah reader.
 * Al-Fatiha's Basmala is the original first verse from the Quran dataset;
 * render it once inside the ornament, never repeat it in the verse flow.
 * At-Tawbah must never receive an additional Basmala.
 */
export function openingVerses(suraNo: number, verses: Aya[], startsSura: boolean): Aya[] {
  if (startsSura && suraNo === 1 && verses[0]?.aya_no === 1) {
    return verses.slice(1);
  }
  return verses;
}

export function MushafSurahOpening({
  suraName,
  suraNo,
  firstAyaText,
}: {
  suraName: string;
  suraNo: number;
  firstAyaText?: string;
}) {
  const basmala =
    suraNo === 1 ? firstAyaText : hasBasmala(suraNo) ? BASMALA : null;

  return (
    <header className="mushaf-surah-opening" aria-label={`بداية سورة ${suraName}`}>
      <div className="mushaf-surah-ribbon">
        <span className="mushaf-surah-ribbon__flourish" aria-hidden="true">۞</span>
        <h2 className="mushaf-surah-ribbon__title">سُورَةُ {suraName}</h2>
        <span className="mushaf-surah-ribbon__flourish" aria-hidden="true">۞</span>
      </div>
      {basmala ? (
        <div className="mushaf-basmala" aria-label="البسملة">
          <span className="mushaf-basmala__corner mushaf-basmala__corner--tl" aria-hidden="true">❖</span>
          <span className="mushaf-basmala__corner mushaf-basmala__corner--tr" aria-hidden="true">❖</span>
          <span className="mushaf-basmala__corner mushaf-basmala__corner--bl" aria-hidden="true">❖</span>
          <span className="mushaf-basmala__corner mushaf-basmala__corner--br" aria-hidden="true">❖</span>
          <span className="mushaf-basmala__text" lang="ar">{basmala}</span>
        </div>
      ) : (
        <div className="mushaf-surah-opening__separator" aria-hidden="true">✦</div>
      )}
    </header>
  );
}
