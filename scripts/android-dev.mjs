/**
 * Repeatable Android project setup / debug APK build for Capacitor 8.
 *
 * Usage:
 *   bun run mobile:android:setup  - generate/sync Android project
 *   bun run mobile:android:apk    - generate, sync and assemble debug APK
 *
 * Never creates a release signature or publishes a build.
 */
import { existsSync, readFileSync } from "node:fs";
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
if (!hasPinnedCapacitor()) {
  console.log(`Installing exact Capacitor ${CAPACITOR_VERSION} versions for the Android build...`);
  run("bun", ["add", "--exact", `@capacitor/core@${CAPACITOR_VERSION}`, `@capacitor/android@${CAPACITOR_VERSION}`]);
  run("bun", ["add", "-d", "--exact", `@capacitor/cli@${CAPACITOR_VERSION}`]);
}
run("bun", ["run", "mobile:build"]);
if (!existsSync(resolve("dist-mobile/index.html"))) {
  throw new Error("Static Android web bundle is missing");
}
if (!existsSync(resolve("android/app/build.gradle"))) {
  run("bunx", ["cap", "add", "android"]);
}
run("bunx", ["cap", "sync", "android"]);
if (buildDebugApk) {
  const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  run(gradle, ["assembleDebug"], resolve("android"));
  const apk = resolve("android/app/build/outputs/apk/debug/app-debug.apk");
  if (!existsSync(apk)) throw new Error("Gradle succeeded but expected debug APK is missing");
  console.log(`Android debug APK created at ${apk}`);
} else {
  console.log("Android project is prepared; open the android/ directory in Android Studio.");
}
