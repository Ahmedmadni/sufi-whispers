import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const publisher = read(".github/workflows/publish-signed-android-v1.0.17.yml");

describe("Android 1.0.17 release publisher synchronization", () => {
  test("waits for exact-source-SHA quality gates instead of racing Android Debug", () => {
    expect(publisher).toContain("for attempt in $(seq 1 40); do");
    expect(publisher).toContain("sleep 30");
    expect(publisher).toContain("qa_passed=false");
    expect(publisher).toContain("qa_passed=true");
    expect(publisher).toContain('for required in "Quality checks" "Web Preview Smoke" "Android Debug APK"');
    expect(publisher).toContain('test "$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main" --jq \'.object.sha\')" = "$SOURCE_SHA"');
    expect(publisher).toContain('head_sha == $sha');
    expect(publisher).toContain('.status == "completed" and .conclusion == "success"');
  });

  test("does not publish on failed checks, stale SHA, missing checks or timeout", () => {
    expect(publisher).toContain('echo "BLOCKED: main advanced during QA wait; cannot publish stale APK."');
    expect(publisher).toContain('echo "BLOCKED: $required completed without success on $SOURCE_SHA"');
    expect(publisher).toContain('echo "BLOCKED: timed out waiting for all required exact-SHA quality gates."');
    expect(publisher).toContain('if [ "$qa_passed" != true ]; then');
    expect(publisher).toContain('if [ "$all_passed" = true ]; then');
    expect(publisher).toContain('(.name == "signed-release" and .conclusion == "success"');
    expect(publisher).toContain("Verify release signature, identity and bundled content");
    expect(publisher).toContain("Enforce release APK security flags and minimal permissions");
  });

  test("every publisher-only edit triggers a matching debug and signed build on main", () => {
    const path = '".github/workflows/publish-signed-android-v1.0.17.yml"';
    const debug = read(".github/workflows/android-debug.yml");
    const signed = read(".github/workflows/android-release.yml");
    expect(debug.split(path).length - 1).toBe(2);
    expect(signed.split(path).length - 1).toBe(1);
    expect(read(".github/workflows/preview-smoke.yml")).not.toContain("paths:");
    expect(publisher).toContain('RELEASE_TAG: v1.0.17-android-rc1');
    expect(publisher).toContain("Immutable release already exists; leaving original assets unchanged.");
  });

  test("release metadata stays compatible with the already installed 1.0.16", () => {
    const meta = JSON.parse(read("config/android-release.json"));
    expect(meta).toMatchObject({
      applicationId: "com.rihabalkhaliliyya.app",
      versionName: "1.0.17",
      versionCode: 18,
      signing: { keyAlias: "rihab-production" },
    });
    expect(read("scripts/android-orientation.mjs")).toContain('export const ANDROID_ORIENTATION = "fullUser"');
    expect(read("scripts/audit-android-apk.py")).toContain("has_full_user_orientation");
  });
});
