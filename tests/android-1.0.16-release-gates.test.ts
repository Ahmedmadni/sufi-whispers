import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const read = (file: string) => readFileSync(file, "utf8");
const meta = JSON.parse(read("config/android-release.json"));
const exactPoster = readFileSync("src/assets/rihab-approved-full-mobile-poster.webp");
const sha256 = createHash("sha256").update(exactPoster).digest("hex");
const expected = "3987f7f4fe27eaf9c68f677c91c09526f5f9854fbab252d402b413bc75b87598";

describe("Android 1.0.16 release quality gates", () => {
  test("app updates in place, never changes package/signing identity", () => {
    expect(meta).toEqual({
      appName: "رحاب الخليلية",
      applicationId: "com.rihabalkhaliliyya.app",
      versionName: "1.0.16",
      versionCode: 17,
      signing: {
        keystoreFileName: "rihab-production.jks",
        keyAlias: "rihab-production",
      },
    });
    const config = read("scripts/android-dev.mjs");
    expect(config).toContain("config/android-release.json");
    const signed = read(".github/workflows/android-release.yml");
    expect(signed).toContain("python scripts/verify-android-release.py");
    expect(signed).toContain("apksigner");
    expect(signed).toContain("93aa5aba07800c1b8da3aac64b5c789f2c2b632a8aa6cd026a27ae1f47bcd145");
    expect(signed).toContain("release signing certificate changed since 1.0.14");
    expect(signed).toContain("jarsigner");
    expect(signed).toContain("Verify release signature, identity and bundled content");
    expect(signed).toContain("Enforce release APK security flags and minimal permissions");
  });
  test("the exact owner-corrected Sheikh image cannot regress silently on Android", () => {
    expect(exactPoster.length).toBe(1431622);
    expect(sha256).toBe(expected);
    expect(exactPoster.subarray(12, 16).toString()).toBe("VP8L");
    const hero = read("src/components/HomeHero.tsx");
    expect(hero).toContain('import approvedSceneImage from "@/assets/rihab-approved-full-mobile-poster.webp"');
    expect(hero).toContain('src={approvedSceneImage}');
    expect(hero).not.toContain("hero-approved-kha-correction");
    const bundle = read("scripts/verify-mobile-bundle.mjs");
    const release = read("scripts/verify-android-release.py");
    expect(bundle).toContain(expected);
    expect(bundle).toContain("exactly one full Sheikh poster");
    expect(bundle).toContain("outdated or corrupted approved Sheikh poster");
    expect(release).toContain(expected);
    expect(release).toContain("Expected exactly one approved Sheikh poster");
    expect(release).toContain("Approved Sheikh poster dimensions mismatch");
    expect(release).toContain("owner-approved corrected Sheikh poster");
    const css = read("src/rihab-identity.css");
    expect(css).toContain("aspect-ratio: 941 / 1672;");
    expect(css).toContain("object-fit: contain;");
  });
  test("Android app embeds the same routes, bottom nav and books while remaining offline", () => {
    const mobile = read("mobile/main.tsx");
    expect(mobile).toContain('import { getRouter } from "../src/router"');
    expect(mobile).toContain('import "../src/rihab-identity.css"');
    expect(mobile).toContain('import "../src/printed-mushaf.css"');
    const vite = read("vite.mobile.config.ts");
    expect(vite).toContain('routesDirectory: resolve("src/routes")');
    const bundle = read("scripts/verify-mobile-bundle.mjs");
    expect(bundle).toContain("Verified all 604 offline Mushaf pages");
    expect(bundle).toContain("Verified all seven offline books");
    expect(bundle).toContain("Verified both original Wird audio recordings");
    expect(bundle).toContain("Verified all premium Arabic fonts");
    const audio = read("src/components/WirdAudioPlayer.tsx");
    expect(audio).toContain("preload=\"metadata\"");
    expect(audio).toContain("onLoadedMetadata");
    const bookmarks = read("src/components/BookReaderLayout.tsx");
    expect(bookmarks).toContain("createPortal(content, document.body)");
    const cards = read("src/components/VerseCardDialog.tsx");
    expect(cards).toContain("navigator.canShare");
    expect(cards).toContain("toast.info(isAndroid");
  });
  test("web smoke must run on every release source SHA, even for Android-only changes", () => {
    const preview = read(".github/workflows/preview-smoke.yml");
    const publisher = read(".github/workflows/publish-signed-android-v1.0.16.yml");
    expect(preview).toContain("Web Preview Smoke");
    expect(preview).toContain("push:");
    expect(preview).toContain("pull_request:");
    expect(preview).toContain("branches: [main]");
    expect(preview).not.toContain("paths:");
    expect(publisher).toContain('for required in "Quality checks" "Web Preview Smoke" "Android Debug APK"');
  });
  test("new publisher refuses an old build, missing QA, bad signing or version regression", () => {
    const publisher = read(".github/workflows/publish-signed-android-v1.0.16.yml");
    expect(publisher).toContain("v1.0.16-android-rc1");
    expect(publisher).toContain('test "$(jq -r \'.versionCode\' <<<"$metadata")" = "17"');
    expect(publisher).toContain("Quality checks");
    expect(publisher).toContain("Web Preview Smoke");
    expect(publisher).toContain("Android Debug APK");
    expect(publisher).toContain("BLOCKED: $required");
    expect(publisher).toContain("Never publish an outdated build");
    expect(publisher).toContain("Verify release signature, identity and bundled content");
    expect(publisher).toContain("Enforce release APK security flags and minimal permissions");
    expect(publisher).toContain("python scripts/verify-android-release.py");
    expect(publisher).toContain("Rihab-Al-Khaliliyya-1.0.16.apk");
    expect(publisher).toContain("Rihab-Al-Khaliliyya-1.0.16.aab");
    expect(publisher).toContain("Immutable release already exists; leaving original assets unchanged.");
    expect(publisher).not.toContain("Rihab-Al-Khaliliyya-1.0.14.apk");
  });
});
