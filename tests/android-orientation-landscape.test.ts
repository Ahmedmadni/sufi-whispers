import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  ANDROID_ORIENTATION, enableAdaptiveAndroidOrientation,
} from "../scripts/android-orientation.mjs";

const read = (p: string) => readFileSync(p, "utf8");
const mainActivity = '<activity android:name=".MainActivity" android:configChanges="orientation|screenSize" android:exported="true">';
const pluginActivity = '<activity android:name="com.example.OtherActivity" android:screenOrientation="portrait">';

describe("Android 1.0.16 portrait AND landscape on phone and tablet", () => {
  test("fullUser honors auto-rotation and allows all four physical directions", () => {
    expect(ANDROID_ORIENTATION).toBe("fullUser");
    const source = '<manifest><application>' + mainActivity + pluginActivity + '</application></manifest>';
    const output = enableAdaptiveAndroidOrientation(source);
    expect(output).toContain('android:name=".MainActivity"');
    expect(output).toContain('android:screenOrientation="fullUser"');
    expect(output).toContain(pluginActivity);
    expect(output.match(/android:screenOrientation="fullUser"/g)?.length).toBe(1);
    expect(output).not.toContain('android:screenOrientation="landscape"');
    expect(output).not.toContain('android:screenOrientation="sensorLandscape"');
  });

  test("replaces a stale portrait lock on MainActivity without touching a plugin", () => {
    const source = '<manifest><application>' +
      mainActivity.replace(' android:exported=', ' android:screenOrientation="portrait" android:exported=') +
      pluginActivity + '</application></manifest>';
    const output = enableAdaptiveAndroidOrientation(source);
    expect(output).not.toContain('android:name=".MainActivity" android:configChanges="orientation|screenSize" android:screenOrientation="portrait"');
    expect(output).toContain('android:screenOrientation="fullUser"');
    expect(output).toContain(pluginActivity);
  });

  test("fails safely if Capacitor's AndroidManifest.xml structure changes", () => {
    expect(() => enableAdaptiveAndroidOrientation("")).toThrow();
    expect(() => enableAdaptiveAndroidOrientation("<manifest><application/></manifest>")).toThrow("exactly one MainActivity");
    expect(() => enableAdaptiveAndroidOrientation('<manifest>' + mainActivity + mainActivity + '</manifest>')).toThrow("exactly one MainActivity");
  });

  test("orientation patch is applied after cap sync for debug AND signed release", () => {
    const script = read("scripts/android-dev.mjs");
    const sync = script.indexOf('run("bunx", ["cap", "sync", "android"])');
    const orientation = script.indexOf("manifest = enableAdaptiveAndroidOrientation(manifest)");
    const write = script.indexOf("writeFileSync(manifestFile, manifest)", orientation);
    expect(sync).toBeGreaterThan(0);
    expect(orientation).toBeGreaterThan(sync);
    expect(write).toBeGreaterThan(orientation);
    expect(script.indexOf('run(gradle, ["assembleRelease", "bundleRelease"]')).toBeGreaterThan(orientation);
    expect(script.indexOf('run(gradle, ["assembleDebug"]')).toBeGreaterThan(orientation);
    const audit = read("scripts/audit-android-apk.py");
    expect(audit).toContain("has_full_user_orientation(xmltree)");
    expect(audit).toContain('int(metadata["versionCode"]) >= 17');
    expect(audit).toContain("fullUserOrientation");
  });

  test("landscape is scoped to Android UI and never mutates the web or Quran image assets", () => {
    const mobile = read("mobile/main.tsx");
    const css = read("src/rihab-identity.css");
    const hero = read("src/components/HomeHero.tsx");
    expect(mobile).toContain('document.documentElement.classList.add("rihab-android")');
    expect(css).toContain("@media (orientation: landscape) and (min-width: 540px)");
    expect(css).toContain("@media (orientation: landscape) and (max-height: 680px)");
    expect(css).toContain("@media (orientation: landscape) and (min-width: 1024px)");
    expect(css).toContain("@media (orientation: portrait) and (min-width: 641px)");
    expect(css).toContain(".rihab-android .hero-landscape-caption");
    expect(css).toContain(".rihab-android .hero-sequence--approved-mobile .hero-approved-scene");
    expect(css).toContain("object-fit: contain !important;");
    expect(css).toContain("env(safe-area-inset-bottom, 0px)");
    expect(css).toContain("--wird-reader-toolbar-gap: 8px");
    expect(hero).toContain("تحت لواء فضيلة العارف بالله");
    expect(hero).toContain("سيدي الشيخ صالح أحمد الشافعي");
    expect(hero).toContain("محمد محمد أبو خليل");
    expect(hero).toContain('src={approvedSceneImage}');
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(read("src/styles.css")).toContain('--font-uthmani: "UthmanicHafs"');
  });

  test("new release preserves signing identity and is strictly newer than 1.0.15", () => {
    const metadata = JSON.parse(read("config/android-release.json"));
    expect(metadata.versionName).toBe("1.0.16");
    expect(metadata.versionCode).toBe(17);
    expect(metadata.applicationId).toBe("com.rihabalkhaliliyya.app");
    expect(metadata.signing.keyAlias).toBe("rihab-production");
    expect(read(".github/workflows/publish-signed-android-v1.0.16.yml")).toContain("v1.0.16-android-rc1");
  });
});
