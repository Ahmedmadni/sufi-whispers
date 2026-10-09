import { BASMALA, hasBasmala, type Aya } from "@/lib/quran";

/**
 * Illumination (tazhib) inspired by printed Madinah Mushaf openings and
 * historical Quran cartouches. Original geometric/floral vectors, not a
 * screenshot or a reproduction of a publisher's printed plate.
 */
function ArabesqueWing({ flipped = false }: { flipped?: boolean }) {
  return (
    <svg
      className={`mushaf-illumination-wing${flipped ? " mushaf-illumination-wing--flipped" : ""}`}
      viewBox="0 0 150 190" role="presentation" aria-hidden="true" focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 95 Q2 77 16 64 Q28 56 29 36 Q31 18 53 13 Q72 10 84 27 Q94 43 110 42 Q131 40 139 63 Q145 82 132 95 Q145 108 139 128 Q131 150 110 148 Q93 148 84 164 Q70 184 53 177 Q32 171 29 152 Q27 134 16 125 Q2 113 8 95Z"
        fill="#133b52" stroke="#b8924e" strokeWidth="5"/>
      <path d="M18 95 Q13 77 28 63 Q41 49 40 37 Q47 21 61 29 Q78 36 85 52 Q111 48 123 69 Q137 84 121 95 Q137 108 123 121 Q111 142 85 138 Q78 155 61 161 Q47 169 40 153 Q41 139 28 127 Q13 112 18 95Z"
        fill="#164d59" stroke="#ebc984" strokeWidth="1.8"/>
      <path d="M23 95 C50 57 81 79 103 51 C84 87 51 86 23 95 C50 104 81 111 103 139 C84 103 51 104 23 95Z"
        fill="#d3ac65" stroke="#f3dba4" strokeWidth="1"/>
      <path d="M38 95 C58 80 83 76 104 95 C83 114 58 110 38 95Z"
        fill="#215b72" stroke="#f1d698" strokeWidth="1.7"/>
      <path d="M66 95 C83 63 105 65 109 83 C116 101 97 116 87 102 C78 90 91 82 98 89"
        fill="none" stroke="#e8c788" strokeWidth="3" strokeLinecap="round"/>
      <path d="M65 95 C84 127 105 125 109 107" fill="none" stroke="#e8c788" strokeWidth="2.4"/>
      <path d="M38 85 C13 66 26 48 47 53 C65 58 67 77 54 79 C44 81 41 73 44 67"
        fill="none" stroke="#e8c788" strokeWidth="2.4"/>
      <path d="M38 105 C13 125 26 143 47 137 C65 132 67 113 54 111 C44 109 41 117 44 123"
        fill="none" stroke="#e8c788" strokeWidth="2.4"/>
      <path d="M54 41 Q48 24 63 14 Q80 31 68 46 Q63 51 54 41Z" fill="#a96c5b" stroke="#f6dbad" strokeWidth="1.5"/>
      <path d="M54 149 Q48 166 63 176 Q80 159 68 144 Q63 139 54 149Z" fill="#a96c5b" stroke="#f6dbad" strokeWidth="1.5"/>
      <path d="M90 35 Q93 16 109 19 Q119 31 108 42Z" fill="#2b7982" stroke="#f2c677" strokeWidth="1.5"/>
      <path d="M90 155 Q93 174 109 171 Q119 159 108 148Z" fill="#2b7982" stroke="#f2c677" strokeWidth="1.5"/>
      <path d="M17 95 Q36 79 48 95 Q36 111 17 95Z" fill="#9d6680" stroke="#f6dcaa" strokeWidth="1"/>
      <circle cx="66" cy="95" r="10" fill="#af7553" stroke="#f8e2b8" strokeWidth="1.7"/>
      <circle cx="66" cy="95" r="4.5" fill="#f6d58a"/>
      <g fill="#f4d994" stroke="#17394a" strokeWidth="1">
        <path d="M65 53 l5 7 -5 7 -5 -7z"/>
        <path d="M65 123 l5 7 -5 7 -5 -7z"/>
        <path d="M108 86 l6 9 -6 9 -6 -9z"/>
        <circle cx="44" cy="34" r="4"/><circle cx="44" cy="156" r="4"/>
      </g>
      <g fill="#80a9a6">
        <ellipse cx="29" cy="71" rx="6" ry="2.5" transform="rotate(-39 29 71)"/>
        <ellipse cx="29" cy="119" rx="6" ry="2.5" transform="rotate(39 29 119)"/>
        <ellipse cx="83" cy="42" rx="5" ry="2.2" transform="rotate(35 83 42)"/>
        <ellipse cx="83" cy="148" rx="5" ry="2.2" transform="rotate(-35 83 148)"/>
      </g>
      <path d="M123 95 L150 95 M137 84 Q143 95 137 106" stroke="#e7c789" strokeWidth="2" fill="none"/>
      <circle cx="143" cy="95" r="3" fill="#e7c789"/>
    </svg>
  );
}

/** Keep the original Al-Fatiha first verse exactly once in the central frame. */
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

  return (
    <header className="mushaf-surah-opening mushaf-surah-opening--illuminated" aria-label={`بداية سورة ${suraName}`}>
      <div className="mushaf-surah-cartouche">
        <div className="mushaf-surah-cartouche__ornament" aria-hidden="true">۞</div>
        <h2 className="mushaf-surah-cartouche__title">سُورَةُ {suraName}</h2>
        <div className="mushaf-surah-cartouche__ornament" aria-hidden="true">۞</div>
      </div>
      {basmala ? (
        <div className="mushaf-basmala mushaf-basmala--illuminated" aria-label="البسملة">
          <div className="mushaf-basmala__border mushaf-basmala__border--top" aria-hidden="true" />
          <div className="mushaf-basmala__interior">
            <ArabesqueWing />
            <div className="mushaf-basmala__cartouche">
              <span className="mushaf-basmala__text" lang="ar">{basmala}</span>
            </div>
            <ArabesqueWing flipped />
          </div>
          <div className="mushaf-basmala__border mushaf-basmala__border--bottom" aria-hidden="true" />
        </div>
      ) : (
        <div className="mushaf-surah-opening__separator" aria-hidden="true">✦</div>
      )}
    </header>
  );
}
