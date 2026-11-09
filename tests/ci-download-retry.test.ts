import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("Phase 1 release and transient download safeguards", () => {
  test("Android debug prepares offline content once and retries only Gradle download errors", () => {
    const workflow = readFileSync(".github/workflows/android-debug.yml", "utf8");
    expect(workflow).toContain("bun run mobile:android:setup");
    expect(workflow).toContain("./gradlew --no-daemon assembleDebug");
    expect(workflow).toContain("for attempt in 1 2 3");
    expect(workflow).toContain("HTTP response code:");
    expect(workflow).toContain("Gradle failed for a non-transient reason");
    expect(workflow).toContain("~/.gradle/wrapper/dists");
    expect(workflow).not.toContain("bun run mobile:android:apk");
  });

  test("Windows isolates and caches pinned Electron without retrying packaging failures", () => {
    const workflow = readFileSync(".github/workflows/windows-desktop.yml", "utf8");
    expect(workflow).toContain("rihab-electron-39.0.0");
    expect(workflow).toContain("ELECTRON_CACHE:");
    expect(workflow).toContain("npm-install-attempt-$attempt.log");
    expect(workflow).toContain("HTTPError: Response code");
    expect(workflow).toContain("retry limit reached");
    expect(workflow).toContain("npm run package:win");
  });

  test("obsolete 1.0.13 Android publisher cannot republish old-tag binaries on future main pushes", () => {
    const workflow = readFileSync(".github/workflows/publish-signed-android-v1.0.13.yml", "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("false &&");
    expect(workflow).not.toContain("types: [completed]");
    expect(workflow).toContain("v1.0.13-android-rc1");
  });
});
