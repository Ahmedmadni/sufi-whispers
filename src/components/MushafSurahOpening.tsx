import { BASMALA, hasBasmala, type Aya } from "@/lib/quran";
import { SignatureFloralWing, SignatureRosette } from "@/components/MushafSignatureArt";

/**
 * A signature, illustrated opening commissioned for Rihab Al-Khaliliyya.
 * SVG decorations are separate from the real Quran glyphs; no artwork
 * contains painted or altered sacred text.
 */
export function openingVerses(suraNo: number, verses: Aya[], startsSura: boolean): Aya[] {
  if (startsSura && suraNo === 1 && verses[0]?.aya_no === 1) {
    return verses.slice(1);
  }
  return verses;
}

export function MushafSurahOpening({
  suraName, suraNo, firstAyaText,
}: {
  suraName: string;
  suraNo: number;
  firstAyaText?: string;
}) {
  const basmala =
    suraNo === 1 ? firstAyaText : hasBasmala(suraNo) ? BASMALA : null;

  // Hafs al-Fatiha first verse ends with a nonbreaking space + U+FC00.
  // Visually place that exact marker beside the verse, never omit it or
  // change any codepoint of the canonical source Quran dataset.
  const marker = suraNo === 1 && basmala?.endsWith("\u00A0\uFC00")
    ? "\u00A0\uFC00"
    : null;
  const openingText = marker ? basmala!.slice(0, -2) : basmala;

  return (
    <header className="mushaf-signature-opening" aria-label={`بداية سورة ${suraName}`}>
      <div className="mushaf-signature-title" data-testid="signature-surah-title">
        <SignatureRosette small />
        <h2 className="mushaf-signature-title__text">سُورَةُ {suraName}</h2>
        <SignatureRosette small />
      </div>
      {basmala ? (
        <div className="mushaf-signature-frame" aria-label="البسملة" data-testid="signature-basmala">
          <div className="mushaf-signature-frame__side">
            <SignatureFloralWing />
          </div>
          <div className="mushaf-signature-frame__center">
            <span className="mushaf-signature-frame__text" lang="ar">{openingText}</span>
            {marker && (
              <span className="mushaf-signature-frame__ayah-mark" lang="ar" aria-label="نهاية الآية الأولى">{marker}</span>
            )}
          </div>
          <div className="mushaf-signature-frame__side">
            <SignatureFloralWing mirrored />
          </div>
        </div>
      ) : (
        <div className="mushaf-signature-separator" aria-hidden="true">
          <SignatureRosette small />
        </div>
      )}
    </header>
  );
}
