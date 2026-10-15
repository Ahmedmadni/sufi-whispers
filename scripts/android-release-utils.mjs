/**
 * Release metadata and security preflight for generated Capacitor Android apps.
 * Never log secrets or include them in a checked-in Gradle config.
 */
import { existsSync } from "node:fs";

export function validateReleaseConfig(data) {
  if (!data || typeof data !== "object" ||
      data.applicationId !== "com.rihabalkhaliliyya.app" ||
      typeof data.versionName !== "string" ||
      !/^[1-9]\d*\.[0-9]+\.[0-9]+$/.test(data.versionName) ||
      !Number.isInteger(data.versionCode) ||
      data.versionCode < 1 || data.versionCode > 2100000000) {
    throw new Error("Invalid Android release version or application ID");
  }
  return { applicationId: data.applicationId, versionName: data.versionName, versionCode: data.versionCode };
}

export function validateReleaseEnvironment(env, fileExists = existsSync) {
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
  for (const key of ["RIHAB_RELEASE_STORE_PASSWORD", "RIHAB_RELEASE_KEY_ALIAS", "RIHAB_RELEASE_KEY_PASSWORD"]) {
    if (typeof env[key] !== "string" || !env[key].trim()) {
      throw new Error(`Missing mandatory Android release signing environment variable: ${key}`);
    }
  }
}
