import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

describe("Wird audio release version and immutable media identity", () => {
  test("both original recordings are in repository with exact source digests", () => {
    for (const [file, bytes, sha] of [
      ["hizb-1.mp3", 9357687, "92f50015584fe52add33cc919e4371785957e9bacb54131597294b4a61a095c1"],
      ["hizb-2.mp3", 11343344, "e973da3691fd34f60f7047028c646226d9c205245ae7c5a819f6469a40b5abaf"],
    ] as const) {
      const path = "public/audio/wird/" + file;
      expect(statSync(path).size).toBe(bytes);
      expect(createHash("sha256").update(readFileSync(path)).digest("hex")).toBe(sha);
    }
  });
  test("upgrade uses version code 9 and distinct 1.0.8 Windows package", () => {
    const android = JSON.parse(readFileSync("config/android-release.json", "utf8"));
    const desktop = JSON.parse(readFileSync("desktop/package.json", "utf8"));
    expect(android.applicationId).toBe("com.rihabalkhaliliyya.app");
    expect(android.versionName).toBe("1.0.9");
    expect(android.versionCode).toBe(10);
    expect(desktop.version).toBe("1.0.9");
  });
  test("release verifiers inspect both tracks inside APK/AAB and desktop files", () => {
    const source = readFileSync("scripts/verify-android-release.py", "utf8");
    const split = readFileSync("scripts/split-android-apk.py", "utf8");
    const desktop = readFileSync("desktop/scripts/verify-bundle.cjs", "utf8");
    expect(source).toContain("verify_wird_audio_archive(archive, prefix)");
    expect(split).toContain('verify_wird_audio_archive(archive, "assets/public/")');
    expect(desktop).toContain("Incorrect offline audio byte length");
    expect(desktop).toContain("Wird audio digest mismatch");
  });
  test("old immutable release stays untouched, new publisher checks signed SHA", () => {
    const archived = readFileSync(".github/workflows/publish-signed-android-v1.0.7.yml", "utf8");
    const previous = readFileSync(".github/workflows/publish-signed-android-v1.0.8.yml", "utf8");
    const next = readFileSync(".github/workflows/publish-signed-android-v1.0.9.yml", "utf8");
    const windows = readFileSync(".github/workflows/windows-desktop.yml", "utf8");
    expect(archived).toContain("workflow_dispatch");
    expect(previous).toContain("workflow_dispatch");
    expect(previous).toContain("false &&");
    expect(next).toContain("v1.0.9-android-rc1");
    expect(next).toContain("python scripts/verify-android-release.py");
    expect(next).toContain(".versionCode' <<<\"$config\")\" = \"10\"");
    expect(windows).toContain("v1.0.9-windows-rc1");
    expect(windows).toContain("Rihab-Al-Khaliliyya-Windows-Setup-1.0.9-x64.exe");
  });
});
