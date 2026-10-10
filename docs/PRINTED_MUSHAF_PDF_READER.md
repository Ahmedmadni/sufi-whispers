# Printed Madinah Mushaf PDF reader (1441H green)

## Source and Quran integrity

The user supplied **MushafMadinaHafsGreen1441.pdf**, published as the
Madinah Mushaf (Hafs, medium-quality green edition, 1441H).

- Local original PDF file size: **65,008,727 bytes** (~62 MiB).
- SHA-256: `2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28`.
- Total **640 PDF sheets**.
- PDF page **4** is Quran page **1** (al-Fatiha).
- PDF page **607** is Quran page **604** (final Quran page).
- The original PDF has **114 sura outline/bookmark destinations**; all
  match the app's existing independently sourced sura start pages at
  the exact offset `PDF page = Mushaf page + 3`.
- `src/data/quran/printed-pdf-pages.ts` stores the independent PDF
  outline mapping so tests can catch index drift.

**Do not use OCR, AI transcription, reflow or image recreation** to
render the Quran text. This reader displays the exact PDF page as a
rasterized canvas from PDF.js; search uses the separate original
`hafsData_v2-0.json` lookup and links to printed page numbers.
Original Quran text, tashkeel, images and page layout are unchanged.

## Loading, offline behavior and bundle size

For this phase the PDF itself is **NOT** committed to GitHub or packaged
inside Android. This avoids increasing every APK by 62 MB.

Users may:
1. Tap **Download Mushaf** to fetch the identified medium-quality PDF
   from its original Internet Archive mirror, hash-verify it and store
   it in browser/Android WebView IndexedDB for offline use.
2. If the download is blocked by CORS/network conditions, follow the
   direct source link in a browser, then **Import PDF** once from the
   device; same SHA-256 validation applies.
3. Delete the locally stored PDF from the interface, independently of
   browser-stored reading bookmarks.

The exact public mirror URL:
https://archive.org/download/MushafMadinaHafsGreen1441/MushafMadinaHafsGreen1441.pdf

The historical item description:
https://archive.org/details/MushafMadinaHafsGreen1441

**If the mirrored PDF's SHA-256 differs from the uploaded reference,
the app refuses to display it.** Manual import of the original attached
file is the fallback. Actual browser CORS, Android storage quota and
device runtime behavior require device verification.

Only one PDF page is rendered at a time using the already installed
`react-pdf` / `pdfjs-dist` worker and the locally packaged font/CMap
resources. Zoom redraws the current page, not the entire 640-page file.
The scanned PDF has no selectable text; text search uses the app's
unchanged Uthmanic dataset, not OCR.

## UI

- `/quran/printed?page=...` — dedicated printed Quran reader with:
  - 114 sura index, search/filter, jumping to exact PDF page.
  - Multiple bookmarks (on-device localStorage, page number and timestamp).
  - Quran text search from the already verified dataset (results jump to
    their **printed page**, not a guessed pixel highlight in the image).
  - Last-read page, direct page number jump, arrows and zoom controls.
  - One-click download and SHA256-verified manual import into IndexedDB.
  - Reader entry on Quran index and on traditional text-page reader.
- `/quran` and `/quran/page/...` remain available as the flexible
  text-based reading mode; they do not rewrite or replace PDF content.

## Required checks

- `bun run test` includes PDF/page index tests for all **114 suras**.
- `bun run typecheck`, `bun run build`, `bun run test:integrity`.
- Android debug APK via `.github/workflows/android-debug.yml`.
- On-device smoke tests: offline PDF after import, reopen stored PDF,
  navigate 1, 50, 187, 604, search, save/delete bookmarks, accessibility
  labels, zoom, low-storage warning and PDF import/download fallback.
- Actual one-click mirror availability cannot be established without
  testing the public host in an Android WebView environment.
