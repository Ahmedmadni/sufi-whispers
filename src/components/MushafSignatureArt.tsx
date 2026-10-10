/**
 * Rihab Al-Khaliliyya's original signature illumination.
 *
 * All ornament lines are drawn as SVG: no raster screenshots, copied plates,
 * embedded Quran text, external font files or background image requests.
 * Quran verses always live in the accessible DOM outside these drawings.
 */
export function SignatureRosette({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "mushaf-signature-rosette mushaf-signature-rosette--small" : "mushaf-signature-rosette"}
      viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true" focusable="false"
    >
      <circle cx="32" cy="32" r="29" stroke="#e0bb76" strokeWidth="1.3" />
      <circle cx="32" cy="32" r="25.5" stroke="#6da5a1" strokeWidth=".8" />
      <g fill="#be9764" stroke="#efd49b" strokeWidth=".9">
        <path d="M32 7 C41 17 41 23 32 32 C23 23 23 17 32 7Z" />
        <path d="M32 57 C23 47 23 41 32 32 C41 41 41 47 32 57Z" />
        <path d="M7 32 C17 23 23 23 32 32 C23 41 17 41 7 32Z" />
        <path d="M57 32 C47 41 41 41 32 32 C41 23 47 23 57 32Z" />
      </g>
      <g fill="#237568" stroke="#f0d39c" strokeWidth=".8">
        <path d="M14.3 14.3 Q27 16 32 32 Q16 27 14.3 14.3Z" />
        <path d="M49.7 14.3 Q48 27 32 32 Q37 16 49.7 14.3Z" />
        <path d="M49.7 49.7 Q37 48 32 32 Q48 37 49.7 49.7Z" />
        <path d="M14.3 49.7 Q16 37 32 32 Q27 48 14.3 49.7Z" />
      </g>
      <circle cx="32" cy="32" r="9" fill="#123c47" stroke="#f4dca9" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="4.2" fill="#f5d08c" />
      <circle cx="32" cy="32" r="1.4" fill="#75502b" />
    </svg>
  );
}

/**
 * Compact wing / floral arabesque, custom hand-authored Bezier paths.
 * One wing is mirrored to keep the ornament perfectly symmetrical.
 */
export function SignatureFloralWing({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      className={`mushaf-signature-wing${mirrored ? " mushaf-signature-wing--mirrored" : ""}`}
      viewBox="0 0 122 96" xmlns="http://www.w3.org/2000/svg"
      fill="none" preserveAspectRatio="xMidYMid meet"
      aria-hidden="true" focusable="false"
    >
      {/* A small ogival enclosure with two nested scalloped gold contours. */}
      <path
        d="M5 48 C14 33 15 13 36 9 C57 5 67 18 74 24 C88 16 100 23 111 34 L120 48 L111 62 C100 73 88 80 74 72 C67 78 57 91 36 87 C15 83 14 63 5 48Z"
        fill="#153e4b" stroke="#d4aa69" strokeWidth="2"
      />
      <path
        d="M12 48 C23 33 21 20 38 17 C56 14 63 27 74 31 C87 24 99 32 110 48 C99 64 87 72 74 65 C63 69 56 82 38 79 C21 76 23 63 12 48Z"
        fill="#21615e" stroke="#e7ca8c" strokeWidth="1.2"
      />
      {/* Golden arabesque stem and opposing curl tendrils. */}
      <path d="M14 48 C40 48 51 18 73 26 C94 32 89 53 72 49 C60 46 68 35 77 40"
        stroke="#f2d49c" strokeWidth="2.1" strokeLinecap="round"/>
      <path d="M14 48 C40 48 51 78 73 70 C94 64 89 43 72 47"
        stroke="#f2d49c" strokeWidth="2.1" strokeLinecap="round"/>
      <path d="M20 48 C48 48 60 34 89 48 C60 62 48 48 20 48Z"
        fill="#c99862" stroke="#f4dbad" strokeWidth="1.1"/>
      {/* Palmette petals at the upper and lower breaks. */}
      <path d="M41 36 Q27 25 34 15 Q49 17 52 34Z" fill="#88b0a0" stroke="#f1d18d" strokeWidth="1.1"/>
      <path d="M41 60 Q27 71 34 81 Q49 79 52 62Z" fill="#88b0a0" stroke="#f1d18d" strokeWidth="1.1"/>
      <path d="M56 32 Q54 17 69 13 Q81 23 67 37Z" fill="#b88071" stroke="#f1d18d" strokeWidth="1.1"/>
      <path d="M56 64 Q54 79 69 83 Q81 73 67 59Z" fill="#b88071" stroke="#f1d18d" strokeWidth="1.1"/>
      <path d="M88 38 Q93 26 103 31 Q103 44 90 46Z" fill="#f1d195" stroke="#13424b" strokeWidth=".8"/>
      <path d="M88 58 Q93 70 103 65 Q103 52 90 50Z" fill="#f1d195" stroke="#13424b" strokeWidth=".8"/>
      {/* Central rosette / eight point ornament. */}
      <path d="M51 48 L60 43 L65 34 L70 43 L79 48 L70 53 L65 62 L60 53Z"
        fill="#d2a66d" stroke="#fbe4b8" strokeWidth="1.2"/>
      <circle cx="65" cy="48" r="6" fill="#163e4a" stroke="#eed49b" strokeWidth="1.4"/>
      <circle cx="65" cy="48" r="2.6" fill="#e8c487"/>
      {/* The outer tip fades naturally into the central text cartouche. */}
      <path d="M103 48 L119 48" stroke="#efd49b" strokeWidth="1.2"/>
      <path d="M112 43 L117 48 L112 53" stroke="#e2bb75" strokeWidth="1"/>
      <g fill="#f5dcaa">
        <circle cx="24" cy="48" r="2"/><circle cx="37" cy="25" r="1.7"/>
        <circle cx="37" cy="71" r="1.7"/>
      </g>
    </svg>
  );
}
