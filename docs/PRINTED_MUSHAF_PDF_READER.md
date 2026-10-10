# Madinah Mushaf — instant printed page reading (V8)

## The user experience (no user downloads or uploads)

From the Quran navigation tab, the reader opens page 1 **immediately**.
The visitor can move between original printed pages, zoom in, search,
view the complete 114-surah index, and save or restore bookmarks.

There are **no Download Mushaf, Upload PDF, Import, Delete cached file,
or local storage permission prompts** in the reader.

One original 957×1368 PNG page is shown at a time, fetched over HTTPS
and cached by the normal browser image cache when possible. The two
adjacent pages are prefetched in the background. Slow/offline network
conditions show a retry control and an existing verified Uthmanic text
reader link; the app does **not** substitute AI-generated Quran text.

## Verification of the original source, not AI reproduction

The approved original `MushafMadinaHafsGreen1441.pdf` is exactly:

- SHA-256: `2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28`
- Original PDF size: 65,008,727 bytes (about 62 MiB)
- 640 PDF pages, with 604 Quran leaves on PDF sheets 4–607
- Each page already stores a 957×1368 PNG raster source image

The publisher refuses an unknown SHA, missing page, wrong page count,
unexpected pixel dimension or unexpected image format. It uses
`fitz.Document.extract_image(xref)`: this **copies the original
embedded PNG bytes**, with no OCR, raster rendering, recompression,
rescaling, textual rewriting or modification of Quran diacritics.
The generated manifest records the SHA256 and byte size for all 604
pages.

Script: `scripts/extract-printed-mushaf-pages.py`
Workflow: `.github/workflows/publish-printed-mushaf.yml`

The verified originals are published to the public **mushaf-pages**
branch in the same project. Example immutable source image path:
`pages/001.png`, `pages/604.png`. The image browser URL is currently:
`https://raw.githubusercontent.com/Ahmedmadni/sufi-whispers/0b944b349fd28295803a0a96fbf2906a14286245/pages/001.png`

The independent original PDF outline maps 114 suras in
`src/data/quran/printed-pdf-pages.ts` (PDF page number = printed page + 3).
The reader's search queries the unchanged Hafs V2 canonical text,
navigating to the original scanned page; no OCR is involved.

## Bundle size and performance

- APK contains *neither* the 65 MB original PDF *nor* all 604 images.
  This avoids increasing install size significantly.
- Images are requested independently. Most regular reading pages are
  approximately 140–170 KiB; special ornate pages may be larger.
  Approximate total of all original PNGs is 91 MiB, **but visitors
  do not retrieve them all**.
- CSS handles zoom and scroll without re-rasterizing PDF or consuming
  PDF.js memory in this reader.
- Browser/Android WebView image cache may retain viewed pages, but
  **full offline reading is not promised** without installing a
  deliberately designed and tested offline-cache module.

## Operational caveat

GitHub raw file serving is a functional interim image origin. For high
traffic and predictable CDN caching, move the *identical original PNG
bytes* and their manifest to GitHub Pages or an owned R2/CDN bucket and
switch the single `PRINTED_PAGE_IMAGE_BASE` constant. Do not replace
the images with newly rendered pages unless they undergo a separate
Quran-content inspection and reference verification.

When a remote page cannot be retrieved, the reader shows an Arabic
retry button and a verified text reading-mode link. No user is asked
to locate a PDF or upload any data.

## Verification gates

1. Publish workflow verifies the original SHA and all 604 image assets.
2. `bun run test` checks 604 unique page URLs, 114 indexed sura starts,
   boundary clamping and adjacent-page prefetch.
3. SSR route smoke must pass: `/quran/printed?page=1`.
4. TypeScript, production build, Quran integrity and Android debug build.
5. Visual/functional tests on Android device: loading over normal/slow
   data connection, zoom and swipe, search result navigation, bookmarks,
   image failure fallback, and resumed page after restart.
