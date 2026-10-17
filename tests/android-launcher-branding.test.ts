import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

describe("Phase 35 official Android launcher icon", () => {
  test("real logo is the existing official web icon and is a 512x512 PNG", () => {
    const original = readFileSync("public/icon-512.png");
    expect(original.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(original.readUInt32BE(16)).toBe(512);
    expect(original.readUInt32BE(20)).toBe(512);
    const webmanifest = read("public/manifest.webmanifest");
    expect(webmanifest).toContain('"/icon-512.png"');
    const logoAsset = readFileSync("src/assets/rihab-logo-clean.png");
    expect(logoAsset.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  test("source-controlled icon conversion runs after Capacitor sync, before both APK and AAB", () => {
    const script = read("scripts/android-dev.mjs");
    const point = script.indexOf('run("bunx", ["cap", "sync", "android"]);');
    const icons = script.indexOf('run("python", ["scripts/prepare-android-launcher-icons.py"]);');
    const gradle = script.indexOf('run(gradle, ["assembleRelease", "bundleRelease"]');
    expect(point).toBeGreaterThan(0);
    expect(icons).toBeGreaterThan(point);
    expect(gradle).toBeGreaterThan(icons);
    expect(script.indexOf('run(gradle, ["assembleDebug"]')).toBeGreaterThan(icons);
    const assets = read("scripts/prepare-android-launcher-icons.py");
    expect(assets).toContain('SOURCE = ROOT / "public" / "icon-512.png"');
    for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
      expect(assets).toContain('"' + density + '"');
    }
    for (const resource of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png",
      "mipmap-anydpi-v26", "rihab_launcher_background.xml"]) {
      expect(assets).toContain(resource);
    }
    expect(assets).toContain("Image.Resampling.LANCZOS");
    expect(assets).toContain("BG = (15, 44, 34, 255)");
  });

  test("both debug and signed Release verify icons in compiled APK", () => {
    const verifier = read("scripts/verify-android-launcher-icons.py");
    expect(verifier).toContain("parsed.tobytes() != generated.tobytes()");
    expect(verifier).toContain('zipfile.ZipFile(apk_path)');
    for (const workflow of [".github/workflows/android-debug.yml", ".github/workflows/android-release.yml"]) {
      const yaml = read(workflow);
      expect(yaml).toContain("verify-android-launcher-icons.py");
    }
  });
});
