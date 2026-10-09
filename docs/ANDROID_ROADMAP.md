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

## Implemented mobile SPA staging

- `mobile/index.html`, `mobile/main.tsx`, and `vite.mobile.config.ts` produce
  a standalone client-only React Router bundle to `dist-mobile/`.
- `capacitor.config.json` includes the proposed Android application ID
  `com.rihabalkhaliliyya.app`. Freeze the ID before publishing to Play.
- `bun run mobile:prepare` copies public resources then downloads the Quran,
  authentic Quran font, and library PDFs referenced by Lovable asset descriptors
  to `mobile/.public/mobile-assets`; checks sizes, Quran dataset structure,
  and writes SHA-256 entries to `manifest.json`.
- `bun run mobile:build` creates the static client bundle. This requires the
  source assets to be reachable from the Lovable public site, or validated local
  staging files already present; it must fail instead of shipping a broken app.
- Web SSR routes and Cloudflare configuration remain unchanged.

## To generate the native Android project

On a machine with Node 22+, Bun, the Android SDK and Java installed:

```sh
bun install
bun add @capacitor/core@^8 @capacitor/android@^8
bun add -d @capacitor/cli@^8
bun run mobile:build
bunx cap add android
bunx cap sync android
bunx cap open android
```

Commit the lockfile and generated `android/` source after CLI generation.
This step has NOT yet been run by the maintainer tools, and no APK/AAB
was generated or device-tested.

If Lovable blocks unauthenticated asset downloads, export the original
assets to `mobile/.public/mobile-assets` rather than disabling integrity
checks. Verify the SHA-256 of the Quran source separately against an
authentic publisher copy before public release.
