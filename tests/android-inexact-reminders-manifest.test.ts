import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { enforceInexactAndroidReminders } from "../scripts/android-manifest-permissions.mjs";
import { enableAdaptiveAndroidOrientation } from "../scripts/android-orientation.mjs";

const header = '<manifest xmlns:android="http://schemas.android.com/apk/res/android">';
const main = '<application><activity android:name=".MainActivity" /></application></manifest>';
const exact = '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />';
const plugin = '<uses-permission-sdk-23 android:name="android.permission.USE_EXACT_ALARM" />';

describe("Capacitor native manifest: inexact reminders and rotation are enforced together", () => {
  test("removes explicit plugin permissions before adding merge-time removal rules", () => {
    const doc = header + exact + plugin + main;
    const patch = enforceInexactAndroidReminders(doc);
    expect(patch).toContain('xmlns:tools="http://schemas.android.com/tools"');
    expect(patch).not.toContain(exact);
    expect(patch).not.toContain(plugin);
    expect((patch.match(/android.permission.SCHEDULE_EXACT_ALARM/g) ?? []).length).toBe(1);
    expect((patch.match(/android.permission.USE_EXACT_ALARM/g) ?? []).length).toBe(1);
    expect((patch.match(/tools:node="remove"/g) ?? []).length).toBe(2);
  });

  test("is idempotent after repeated Capacitor sync and preserves opted-in reminders", () => {
    const doc = header +
      '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />' +
      '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />' +
      main;
    const once = enforceInexactAndroidReminders(doc);
    const twice = enforceInexactAndroidReminders(once);
    expect(twice).toBe(once);
    expect(twice).toContain('android.permission.POST_NOTIFICATIONS');
    expect(twice).toContain('android.permission.RECEIVE_BOOT_COMPLETED');
    expect((twice.match(/tools:node="remove"/g) ?? []).length).toBe(2);
    expect(enableAdaptiveAndroidOrientation(twice)).toContain('android:screenOrientation="fullUser"');
  });

  test("cannot silently skip when plugin already wrote the blocked permission", () => {
    const doc = header + exact + main;
    const patched = enforceInexactAndroidReminders(doc);
    expect(patched).not.toContain(exact);
    expect(patched).toContain('android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove"');
    const entry = readFileSync("scripts/android-dev.mjs", "utf8");
    expect(entry).toMatch(/\nmanifest = enforceInexactAndroidReminders\(manifest\);\n/);
    expect(entry).toMatch(/\nmanifest = enableAdaptiveAndroidOrientation\(manifest\);\n/);
    expect(entry).not.toContain("if (!manifest.includes('android.permission.SCHEDULE_EXACT_ALARM'))");
  });

  test("refuses malformed manifests", () => {
    expect(() => enforceInexactAndroidReminders("")).toThrow();
    expect(() => enforceInexactAndroidReminders("<application/>")).toThrow();
  });
});
