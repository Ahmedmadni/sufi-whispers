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
