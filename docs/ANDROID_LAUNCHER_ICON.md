# Phase 35 — Official association Android launcher icon

The source-of-truth is the existing **official association logo** at
`public/icon-512.png` (same logo already used in the website/PWA). It must
not be replaced with a stock Android/Capacitor splash icon.

## Build behavior

`scripts/android-dev.mjs` regenerates or re-syncs the native Capacitor 8
project, then calls `python scripts/prepare-android-launcher-icons.py`
*after every sync*, and only then starts Gradle.

This deterministic Pillow renderer creates:
- Square/round legacy `ic_launcher.png`/`ic_launcher_round.png` for
  mdpi through xxxhdpi (48, 72, 96, 144, 192 pixels).
- Transparent adaptive foreground `ic_launcher_foreground.png` at
  108, 162, 216, 324 and 432 pixels.
- `mipmap-anydpi-v26/ic_launcher.xml` and
  `ic_launcher_round.xml` that use the same original logo foreground,
  with a deep emerald backing `#0F2C22`.
- The artwork is letter-for-letter and pixel-for-pixel based on the
  existing logo; it is only scaled and backed by an emerald/gold accent.
  No new text is drawn. Every element of the original logo is kept
  inside the adaptive icon's visible mask-safe region.

Both Android Debug and manual signed Release workflows run
`scripts/verify-android-launcher-icons.py` after Gradle compiles the APK,
checking image pixels and APK resources. CI fails if the default
Capacitor artwork, a corrupted icon or missing adaptive XML is detected.

The website's existing PWA icons and manifest are unchanged. No Quran or
PDF page bytes are modified by this workflow, and native icon assets are
only a few kilobytes compared with the >200MB offline library.

## Device acceptance

After installing the newly built APK, check the app in the Samsung/Android
launcher and recent-apps overview:
- Main screen icon shows the official green-dome/gold association logo,
  not the default Capacitor lightning bolt or generic Android icon.
- Icon remains legible under circular and squircle launcher masks.
- The in-app Arabic branding and book content are unchanged.
- If Android keeps an old cached icon, restart the launcher or reinstall
  **only after exporting in-app user data**. Avoid uninstalling an
  existing app with unbacked-up reading/dhikr preferences.

**Important:** CI compilation and resource checks do not constitute a
hands-on Android launcher/home-screen inspection. A user-device test is
still needed. Debug APK is not a publicly signed production Release.
