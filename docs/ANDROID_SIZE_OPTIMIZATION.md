# Android Phase 32 — Reduce APK without losing offline reading

## Scope

The 7 scanned books displayed by `OfflineBookPages` in the Android
Capacitor app already consist of **1040 verified, locally bundled WebP pages**.
The PDF originals are required as *build inputs* for rendering and as recovery
archives, but Android does not use those 7 PDF payloads for viewing pages.

- `mobile/.public/mobile-assets/*.pdf`: all 7 originals retained for future
  regeneration and full cloud backup; checksums are preserved.
- `dist-mobile/mobile-assets/*.pdf`: **only those 7 rendered original PDFs**
  are removed after a complete build passes its first integrity check.
- `dist-mobile/book.pdf`: primary "جامع النفحات" stays in the APK for PDF.js.
- `dist-mobile/offline-books/`: every one of the 1040 local reading pages remains.
- `dist-mobile/printed-mushaf/`: all 604 lossless, pixel-verified Quran pages remain.
- `dist-mobile/mobile-assets/hafsData_v2-0.json` and `uthmanic_hafs_v20.ttf`: untouched.
- Web/SSR builds: no changes to sources, PDF downloads or reading behavior.

Both complete and optimized bundles are checked with
`scripts/verify-mobile-bundle.mjs` before shipping. The optimization script
verifies every original SHA-256 in both staging and output, checks all rendered
page hashes, and refuses to delete anything until the entire set passes. The
result manifest explicitly records the seven omitted files, preserving
provenance and preventing accidental removal of unrelated assets.

## Expected savings

Seven original PDF sizes from metadata: approximately **46 MB before APK ZIP
compression**. This is a *source-payload* estimate, not a measured APK saving.
The exact APK byte difference must come from new GitHub Actions output.

## Explicit limitation

The Android seven-book reader displays the fully offline rendered pages,
but no longer carries spare, unmodified PDF binaries for these seven books.
If an **export original PDF** feature is later added to Android, it must read
those originals from separate, authorized downloads or offer a special
`full sources` package. The website's original PDFs and the cloud recovery
archive continue to retain them.

Do not use lossy recompression of the Quran pages to chase smaller sizes.
Do not move the mandatory Quran/book reading corpus into on-demand downloads
without explicit product approval, because the promised offline behavior
would otherwise regress.
