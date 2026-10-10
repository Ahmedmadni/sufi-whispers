# Printed Mushaf Page Layout — original text is immutable

## Source of truth

The app displays **only** the canonical `aya_text` string from the existing
KFGQPC Hafs v2.0 dataset. The original JSON, TTF, and the 604 page numbers
were **not edited or regenerated** for this interface.

The generated concept image from the design discussion is a **visual reference
only**. It was not used as a Quran page image, source of verses, transcription,
or data for line breaking. Image generation can introduce Quran text errors;
therefore all Quran glyphs in the app are rendered from the canonical dataset.

## Layout architecture

- `MushafPrintedPageFrame` draws a continuous full-page ornamental border
  (four vector strips and floral corners), a running surah/juz header, a main
  text area, and a framed original page number.
- `MushafSurahOpening` provides a separate illustrated surah banner and an
  original SVG Basmala cartouche.
- `groupMushafPage` groups the **same** verse objects in the **same order**.
  No `aya_text` content is split, normalized, joined or replaced.
- `openingVerses` keeps Al-Fatiha's original first verse **once**, in the
  opening banner; it does not create a second copy in the verse flow.
  At-Tawbah never receives an inserted Basmala.
- Reading by full page and reading by surah share the same visual frame.
- Typeface remains locally bundled **Uthmanic Hafs v2.0** on Android.

## Exact printed line layout — accuracy boundary

The source contains a page number and `line_start` / `line_end` metadata for
each ayah, but does **not** provide every word's page-line position or the
authoritative text/glyph run per printed line. CSS inter-word justification
helps mimic the balanced rhythm, but **does not guarantee the same printed
line breaks, kashida placement, or the exact 15-line Madinah Mushaf facsimile**.

Until an authoritative per-line layout dataset and matching glyph shaping
pipeline are provided and validated, the app must **not** infer or fabricate
line break positions by cutting or adjusting the canonical Quran strings.
Do not use AI-generated page imagery as Quran text.

## Required checks and release gate

1. `bun run test` must pass, including
   `tests/mushaf-printed-page.test.ts` identity/codepoint checks.
2. `bun run typecheck`, `bun run build` and
   `bun run test:integrity` must pass.
3. Android debug APK should compile with the same exact source from `main`.
4. Visually inspect 320, 375, 430, 768 px and tablet landscape at 90%,
   100%, 130% and 145% font scale. Confirm no letters overlap the page frame.
5. Verify original Quran font loaded and reading functions in airplane mode.
6. Compare any future exact line reproduction to an *independently verified
   official copy*, never a generated poster or image.

The new paper border and SVG ornaments are decorative and are excluded from
the accessible Quran reading order.
