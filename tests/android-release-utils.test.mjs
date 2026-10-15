import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateReleaseConfig, validateReleaseEnvironment } from "../scripts/android-release-utils.mjs";

const metadata = JSON.parse(readFileSync(new URL("../config/android-release.json", import.meta.url), "utf8"));
const complete = {
  RELEASE_BUILD: "1",
  QURAN_EXPECTED_SHA256: "a".repeat(64),
  RIHAB_RELEASE_KEYSTORE_FILE: "/private/test-release.jks",
  RIHAB_RELEASE_STORE_PASSWORD: "secret-value",
  RIHAB_RELEASE_KEY_ALIAS: "production",
  RIHAB_RELEASE_KEY_PASSWORD: "secret-value",
};

describe("production Android release gates", () => {
  it("keeps stable application ID and valid monotonic version information", () => {
    assert.equal(validateReleaseConfig(metadata).applicationId, "com.rihabalkhaliliyya.app");
    assert.throws(() => validateReleaseConfig({ ...metadata, versionCode: 0 }), /Invalid/);
    assert.throws(() => validateReleaseConfig({ ...metadata, applicationId: "com.example.changed" }), /Invalid/);
  });
  it("refuses unsigned or debug-signed release builds", () => {
    assert.throws(() => validateReleaseEnvironment({}, () => false), /QURAN/);
    assert.throws(() => validateReleaseEnvironment({ ...complete, RELEASE_BUILD: "0" }, () => true), /RELEASE_BUILD/);
    assert.throws(() => validateReleaseEnvironment(complete, () => false), /keystore/);
    assert.throws(() => validateReleaseEnvironment({ ...complete, RIHAB_RELEASE_KEY_PASSWORD: "" }, () => true), /RIHAB_RELEASE_KEY_PASSWORD/);
  });
  it("requires a Quran checksum and actual signing credentials", () => {
    assert.throws(() => validateReleaseEnvironment({ ...complete, QURAN_EXPECTED_SHA256: "abc" }, () => true), /QURAN/);
    assert.doesNotThrow(() => validateReleaseEnvironment(complete, () => true));
  });
  it("release Gradle config never stores secrets or a debug key path", () => {
    const file = readFileSync(new URL("../scripts/android-release-signing.gradle", import.meta.url), "utf8");
    assert.match(file, /System\.getenv\('RIHAB_RELEASE_KEYSTORE_FILE'\)/);
    assert.match(file, /signingConfig signingConfigs\.rihabProduction/);
    assert.doesNotMatch(file, /debug\.keystore|storePassword\s+['"][^'"]+['"]/);
  });
});
