import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateReleaseConfig, validateReleaseEnvironment } from "../scripts/android-release-utils.mjs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const meta = validateReleaseConfig(JSON.parse(read("../config/android-release.json")));
const cap = JSON.parse(read("../capacitor.config.json"));

describe("approved non-secret Android signing identity", () => {
  it("uses the same Arabic app name and package in Capacitor and release", () => {
    assert.equal(meta.appName, "رحاب الخليلية");
    assert.equal(meta.appName, cap.appName);
    assert.equal(meta.applicationId, cap.appId);
    assert.equal(meta.signing.keystoreFileName, "rihab-production.jks");
    assert.equal(meta.signing.keyAlias, "rihab-production");
  });
  it("never permits a changed alias or keystore filename", () => {
    const defaults = {
      RELEASE_BUILD: "1",
      QURAN_EXPECTED_SHA256: "f".repeat(64),
      RIHAB_RELEASE_KEYSTORE_FILE: "/temporary/rihab-production.jks",
      RIHAB_RELEASE_KEY_ALIAS: "rihab-production",
      RIHAB_RELEASE_STORE_PASSWORD: "dummy",
      RIHAB_RELEASE_KEY_PASSWORD: "dummy",
    };
    assert.doesNotThrow(() => validateReleaseEnvironment(defaults, () => true, meta));
    assert.throws(
      () => validateReleaseEnvironment({ ...defaults, RIHAB_RELEASE_KEY_ALIAS: "unapproved" }, () => true, meta),
      /alias/,
    );
    assert.throws(
      () => validateReleaseEnvironment({ ...defaults, RIHAB_RELEASE_KEYSTORE_FILE: "/temporary/unknown.jks" }, () => true, meta),
      /filename/,
    );
  });
  it("excludes all private key file types from Git", () => {
    const gitignore = read("../.gitignore");
    for (const extension of ["*.jks", "*.keystore", "*.p12", "*.pfx"]) {
      assert.ok(gitignore.includes(extension), extension);
    }
  });
  it("automates public alias and never stores a signing password in config", () => {
    const workflow = read("../.github/workflows/android-release.yml");
    assert.match(workflow, /RIHAB_RELEASE_KEY_ALIAS: rihab-production/);
    assert.doesNotMatch(workflow, /secrets\.ANDROID_RELEASE_KEY_ALIAS/);
    const config = read("../config/android-release.json");
    assert.doesNotMatch(config, /password|secret|base64|privateKey/i);
  });
  it("keeps signing key on the owner PC, not under the project", () => {
    const powershell = read("../scripts/prepare-rihab-signing.ps1");
    assert.match(powershell, /RihabKeys/);
    assert.match(powershell, /Eclipse Adoptium/);
    assert.match(powershell, /Test-Path -LiteralPath \$KeyFile/);
    assert.doesNotMatch(powershell, /-storepass\s+\S+|-keypass\s+\S+/i);
  });
});
