# رحاب الخليلية — مسار Android

## Boundaries

The production web app currently uses TanStack Start + Cloudflare SSR.
Do **not** point Capacitor directly at its server-side build output.
Keep the web deployment intact while creating a separate client-only
mobile entry/build and verifying deep links, local routing, and asset URLs.

## Phase 1 — web reliability (in progress)

- Restore Quran reading by exact saved page.
- Local calendar day for dhikr counters; guard disabled storage.
- Make PDF.js worker, CMaps and standard fonts load from packaged assets.
- Clamp stored PDF page numbers after document metadata loads.
- Add automated regression tests and a quality workflow.

## Phase 2 — self-contained data (blocking mobile offline release)

The repository contains Lovable `.asset.json` descriptors whose URLs
begin with `/__l5e/assets-v1/`; they are **not** the underlying JSON,
font or PDF binary files. A static Android bundle cannot use those
descriptors as local files.

Actions:
1. Export the original Quran Hafs v2.0 dataset and authentic Quran font
   and compare their checksums with the authoritative source.
2. Export all catalog PDF files from the current Lovable asset store.
3. Bundle Quran text and fonts with the mobile distribution.
4. Give the book catalog a versioned mapping of local and downloadable
   resources; validate download integrity and content licenses.
5. Test airplane-mode startup, Quran search and every saved/downloaded book.

Never reconstruct the official Quran text by guessing or editing the
displayed Uthmanic field.

## Phase 3 — Android shell

Once the app has a client-only Vite build with a known `webDir`:
- Add matching versions of `@capacitor/core`, `@capacitor/cli` and
  `@capacitor/android` and update `bun.lock`.
- Agree on the production Android `applicationId` (reverse domain ID).
- Create `capacitor.config.ts` pointing to the **mobile static output**,
  never the SSR output.
- Run `cap add android` and `cap sync android`.
- Configure launcher icons, splash, safe areas, keyboard/back navigation,
  offline storage, Android permissions and app signing.
- Validate debug APK and signed release AAB on a real Android device.

## Verification gates

- No regressions in the production website.
- `bun run test`, `bun run typecheck`, `bun run build` pass in CI.
- All 604 Quran pages and sura navigation function correctly.
- Quran data validation from `scripts/validate-quran.ts` succeeds.
- Both portrait and landscape reading and background/foreground lifecycle
  behave safely (avoid lost progress).
- Saved Quran reading position and PDF settings survive a restart.
- Device in airplane mode can read bundled Quran and downloaded PDFs.
- Signed APK/AAB builds and installs without a remote SSR dependency.
