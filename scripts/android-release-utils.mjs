/**
 * Release metadata and security preflight for generated Capacitor Android apps.
 * Public non-secret identity lives in config/android-release.json.
 * Never log passwords, keystore contents, or add them to Git.
 */
import { existsSync } from "node:fs";
import { basename } from "node:path";

export function validateReleaseConfig(data) {
  if (!data || typeof data !== "object" ||
      data.appName !== "رحاب الخليلية" ||
      data.applicationId !== "com.rihabalkhaliliyya.app" ||
      typeof data.versionName !== "string" ||
      !/^[1-9]\d*\.[0-9]+\.[0-9]+$/.test(data.versionName) ||
      !Number.isInteger(data.versionCode) ||
      data.versionCode < 1 || data.versionCode > 2100000000 ||
      !data.signing || typeof data.signing !== "object" ||
      data.signing.keystoreFileName !== "rihab-production.jks" ||
      data.signing.keyAlias !== "rihab-production") {
    throw new Error("Invalid Android release identity, version, or approved signing metadata");
  }
  return {
    appName: data.appName,
    applicationId: data.applicationId,
    versionName: data.versionName,
    versionCode: data.versionCode,
    signing: {
      keystoreFileName: data.signing.keystoreFileName,
      keyAlias: data.signing.keyAlias,
    },
  };
}

export function validateReleaseEnvironment(env, fileExists = existsSync, config = {
  signing: { keystoreFileName: "rihab-production.jks", keyAlias: "rihab-production" },
}) {
  const checksum = env.QURAN_EXPECTED_SHA256;
  if (typeof checksum !== "string" || !/^[a-fA-F0-9]{64}$/.test(checksum)) {
    throw new Error("Release requires a verified QURAN_EXPECTED_SHA256 (64 hexadecimal characters)");
  }
  if (env.RELEASE_BUILD !== "1") {
    throw new Error("Refusing Android release unless RELEASE_BUILD=1");
  }
  const keyfile = env.RIHAB_RELEASE_KEYSTORE_FILE;
  if (typeof keyfile !== "string" || !keyfile || !fileExists(keyfile)) {
    throw new Error("Missing Android production signing keystore file");
  }
  if (basename(keyfile) !== config.signing.keystoreFileName) {
    throw new Error("Production keystore filename differs from approved config");
  }
  if (env.RIHAB_RELEASE_KEY_ALIAS !== config.signing.keyAlias) {
    throw new Error("Production signing alias differs from approved config");
  }
  for (const key of ["RIHAB_RELEASE_STORE_PASSWORD", "RIHAB_RELEASE_KEY_PASSWORD"]) {
    if (typeof env[key] !== "string" || !env[key].trim()) {
      throw new Error(`Missing mandatory Android release signing environment variable: ${key}`);
    }
  }
}
