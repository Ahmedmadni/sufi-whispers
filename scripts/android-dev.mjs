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
function hasCapacitor8() {
  const json = JSON.parse(readFileSync("package.json", "utf8"));
  const major8 = (version) => typeof version === "string" && /^(?:\^|~)?8(?:\.|$)/.test(version);
  return major8(json.dependencies?.["@capacitor/core"]) &&
    major8(json.dependencies?.["@capacitor/android"]) &&
    major8(json.devDependencies?.["@capacitor/cli"]);
}
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 22) throw new Error("Capacitor 8 requires Node 22 or newer");
const buildDebugApk = process.argv.includes("--apk");
if (!hasCapacitor8()) {
  console.log("Installing the aligned Capacitor 8 packages and updating bun.lock...");
  run("bun", ["add", "@capacitor/core@^8", "@capacitor/android@^8"]);
  run("bun", ["add", "-d", "@capacitor/cli@^8"]);
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
