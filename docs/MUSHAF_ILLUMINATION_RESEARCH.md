# Authentic Mushaf Illumination — Research / Implementation

## Issue
The original Basmala treatment was a modern CSS panel with rounded
corners and four ❖ marks. It did not resemble printed Quran illumination.

## Visual sources used as *references*, not copied artwork
1. King Fahd Glorious Qur'an Printing Complex — official information
   about its carefully typeset Madinah Mushaf and Quran publishing:
   https://qurancomplex.gov.sa/en/kfgqpc/kfq-structure/
2. Illuminated Surah al-Fatiha from a reproduced Mushaf al-Madinah
   page, showing painted vegetal scrolls and multi-layer opening borders:
   https://www.mp3quran.net/mushaf2/2.jpg
3. Ornate Surah al-Baqarah opening with a shaped surah medallion,
   gold / blue borders and a separate calligraphic Basmala:
   https://ummah.su/quran/medinskiy-muskhaf/002
4. Metropolitan Museum of Art — historical Qur'an manuscripts with
   blue / gold illuminated surah openings and floral/foliate details:
   https://www.metmuseum.org/art/collection/search/456964
   https://www.metmuseum.org/art/collection/search/453650
5. Metropolitan Museum on traditional manuscript illumination:
   use of lapis/blue, gold, botanical arabesques and palmettes:
   https://www.metmuseum.org/art/collection/search/455039

## Resulting design rules
- **Tazhib-inspired** ornament, not an imitation of a generic gold card.
- Cobalt/lapis-blue and deep teal floral endcaps; gold outlines and flowers.
- Text placed in a dedicated high-contrast, accessible central cartouche.
- Separate surah-title panel, resembling a compact illuminated headpiece.
- Responsive ornamentation; minimum text width on narrow phones and no
  image-based lettering. Quran words remain actual Unicode text and can
  be enlarged or selected.
- The source references are not redistributed; all vectors are newly
  authored inside `src/components/MushafSurahOpening.tsx`.
- Existing Al-Fatiha first verse remains exactly once; no additional
  Basmala in At-Tawbah. Regression tests enforce both.

## Verification checklist
- Compare on 320, 375, 430, 768 and 1024 px viewports.
- Check normal/default and 145% font scale and day/night modes.
- Open al-Fatiha (page 1), al-Baqarah (page 2), at-Tawbah (beginning)
  and al-Ikhlas, both by page and by surah.
- Use Arabic screen reader, make sure decorative SVG does not enter
  the reading sequence and Basmala text remains selectable.
- Test on Android WebView with airplane mode enabled.
- Verify that no screenshot/PNG from outside sources is bundled.

This design is a manuscript-inspired visual element, not an official
King Fahd Complex-certified page replica. Faithful official page
layout would need the complete QPC page-specific font/glyph pipeline
and source-level verification.


## Compact calligraphy refinement — V4

The on-device reference showed an over-tall approximately 266-pixel Basmala
frame and considerable vertical whitespace. This stage preserves the same
original floral SVG and Quran font, but changes its presentation:

- Surah cartouche: minimum approximately 41px instead of 61px at normal scale.
- Frame: dynamic height with ~7px gold divider bands (previously 15px).
- Botanical side wings: ~71–82px on mobile/desktop at normal scale, rather
  than sizing themselves from the 150×190 viewBox to over 160px.
- Center panel: minimum approximately 74–76px (previously ~117px).
- Quran calligraphy: use the embedded KFGQPC Hafs Uthmanic font with explicit
  OpenType ligature/mark positioning, shorter ~1.42–1.45 line height and
  wider usable line length. Preload the original font on Android and web.
- Al-Fatiha's source first verse ends with U+00A0 + U+FC00; the original
  codepoints remain in the rendered text, but the verse marker gets a
  dedicated, unobtrusive spot rather than sitting in the middle of the
  horizontal Basmala line. The stored Quran data is never mutated.
- Increased font scale may naturally grow the center panel to avoid cropping;
  the frame is compact *by default*, not hard-clamped at the cost of legibility.

Validate screenshot comparisons at 320/360/390/430px, 768px and desktop,
and at 100%, 130% and 145% reading scales. Verify the official Uthmanic font
rather than any fallback is actually loaded on devices before evaluating its
visual appearance.

Do not claim that font alone recreates the precisely line-set printed Madinah
Mushaf: page line breaks and typesetting remain application-specific.
