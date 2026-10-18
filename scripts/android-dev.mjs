/**
 * Repeatable Android project setup / debug APK build for Capacitor 8.
 *
 * Usage:
 *   bun run mobile:android:setup  - generate/sync Android project
 *   bun run mobile:android:apk    - generate, sync and assemble debug APK
 *   bun run mobile:android:release - signed APK/AAB; requires secrets and Quran checksum
 *
 * No workflow publishes artifacts to the public app store automatically.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { validateReleaseConfig, validateReleaseEnvironment } from "./android-release-utils.mjs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function run(command, args, cwd = process.cwd()) {
  console.log(`> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd, stdio: "inherit", shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
// Last successfully built on GitHub Actions 2026-10-11 with 8.5.3.
// Pin exact versions: a newly published 8.x must not silently change APK builds.
export const CAPACITOR_VERSION = "8.5.3";
function hasPinnedCapacitor() {
  const json = JSON.parse(readFileSync("package.json", "utf8"));
  const exact = (value) => value === CAPACITOR_VERSION;
  return exact(json.dependencies?.["@capacitor/core"]) &&
    exact(json.dependencies?.["@capacitor/android"]) &&
    exact(json.devDependencies?.["@capacitor/cli"]);
}
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 22) throw new Error("Capacitor 8 requires Node 22 or newer");
const buildDebugApk = process.argv.includes("--apk");
const buildRelease = process.argv.includes("--release");
if (buildDebugApk && buildRelease) throw new Error("Choose either --apk (debug) or --release (signed), not both.");
if (buildRelease) {
  const meta = validateReleaseConfig(JSON.parse(readFileSync("config/android-release.json", "utf8")));
  const capConfig = JSON.parse(readFileSync("capacitor.config.json", "utf8"));
  if (capConfig.appId !== meta.applicationId || capConfig.appName !== meta.appName) {
    throw new Error("Capacitor app identity/name differs from approved Android release configuration");
  }
  validateReleaseEnvironment(process.env, undefined, meta);
  console.log(`Release preflight passed for ${meta.applicationId} ${meta.versionName} (${meta.versionCode}); credentials are not logged.`);
}
if (!hasPinnedCapacitor()) {
  console.log(`Installing exact Capacitor ${CAPACITOR_VERSION} versions for the Android build...`);
  run("bun", ["add", "--exact", `@capacitor/core@${CAPACITOR_VERSION}`, `@capacitor/android@${CAPACITOR_VERSION}`]);
  run("bun", ["add", "-d", "--exact", `@capacitor/cli@${CAPACITOR_VERSION}`]);
}
// Pin the native local-reminder plugin only for Android; desktop/browser builds
// remain offline-safe and do not request notification permissions.
const NOTIFICATIONS_VERSION = "8.3.1";
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.dependencies?.["@capacitor/local-notifications"] !== NOTIFICATIONS_VERSION) {
  run("bun", ["add", "--exact", `@capacitor/local-notifications@${NOTIFICATIONS_VERSION}`]);
}
run("bun", ["run", "mobile:build"]);
if (!existsSync(resolve("dist-mobile/index.html"))) {
  throw new Error("Static Android web bundle is missing");
}
if (!existsSync(resolve("android/app/build.gradle"))) {
  run("bunx", ["cap", "add", "android"]);
}
// A generated release configuration must never make later local Debug builds
// depend on private signing secrets. Strip our marker before non-release sync.
const nativeGradle = resolve("android/app/build.gradle");
const productionApply = "apply from: rootProject.file('../scripts/android-release-signing.gradle')";
const productionBlock = `\n// Inject production signing after Capacitor generation. No credentials stored.\n${productionApply}\n`;
if (!buildRelease && existsSync(nativeGradle)) {
  const previous = readFileSync(nativeGradle, "utf8");
  if (previous.includes(productionBlock)) {
    writeFileSync(nativeGradle, previous.replace(productionBlock, ""));
  }
}
run("bunx", ["cap", "sync", "android"]);
// The plugin declares exact alarm access, which is restricted by Play policy.
// Remove it from the final merged manifest and use intentionally INEXACT daily
// notifications. POST_NOTIFICATIONS, WAKE_LOCK, BOOT_COMPLETED stay as needed.
const manifestFile = resolve("android/app/src/main/AndroidManifest.xml");
let manifest = readFileSync(manifestFile, "utf8");
if (!manifest.includes('android.permission.SCHEDULE_EXACT_ALARM')) {
  manifest = manifest.replace(/<manifest\b([^>]*)>/, (full, attrs) =>
    `<manifest${attrs.includes("xmlns:tools") ? attrs : attrs + ' xmlns:tools="http://schemas.android.com/tools"'}>\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove" />`);
}
writeFileSync(manifestFile, manifest);
// Capacitor generates temporary Android resources; apply the official Rihab
// logo after every sync, before ANY Gradle debug/release compilation.
// Must not depend on manually generated resources from a local computer.
run("python", ["scripts/prepare-android-launcher-icons.py"]);
if (buildRelease) {
  const buildGradle = resolve("android/app/build.gradle");
  const applying = "apply from: rootProject.file('../scripts/android-release-signing.gradle')";
  const content = readFileSync(buildGradle, "utf8");
  if (!content.includes(applying)) {
    appendFileSync(buildGradle, `\n// Inject production signing after Capacitor generation. No credentials stored.\n${applying}\n`);
  }
  const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  run(gradle, ["assembleRelease", "bundleRelease"], resolve("android"));
  for (const file of [
    "android/app/build/outputs/apk/release/app-release.apk",
    "android/app/build/outputs/bundle/release/app-release.aab",
  ]) {
    if (!existsSync(resolve(file))) throw new Error(`Android release output missing: ${file}`);
  }
  console.log("Signed APK and AAB assembled; verify signing and package integrity before distribution.");
} else if (buildDebugApk) {
  const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  run(gradle, ["assembleDebug"], resolve("android"));
  const apk = resolve("android/app/build/outputs/apk/debug/app-debug.apk");
  if (!existsSync(apk)) throw new Error("Gradle succeeded but expected debug APK is missing");
  console.log(`Android debug APK created at ${apk}`);
} else {
  console.log("Android project is prepared; open the android/ directory in Android Studio.");
}
