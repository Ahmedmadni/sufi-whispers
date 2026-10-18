import { describe, expect, test } from "bun:test";
import { reminderItems, requestedWirdPage, WIRD_REMINDER_KEY } from "../src/lib/wird-reminders";
import { readFileSync } from "node:fs";
describe("Opt-in Android ward reminder integrity", () => {
  test("exactly two local daily notifications link to source-verified ward pages", () => {
    const rows = reminderItems();
    expect(rows.map(item => [item.schedule.on.hour, item.schedule.on.minute, item.extra.wird]))
      .toEqual([[9,0,4], [21,0,22]]);
    expect(rows.every(x => x.isExactNotification === false && x.actionTypeId === "RIHAB_WIRD_OPEN")).toBe(true);
    expect(WIRD_REMINDER_KEY).toContain("wird-reminders");
  });
  test("rejects other books or fabricated page targets on both Android hash and web URL", () => {
    expect(requestedWirdPage("ward", { hash: "#/books/ward?wird=4", search: "" })).toBe(4);
    expect(requestedWirdPage("ward", { hash: "#/books/ward?wird=22", search: "" })).toBe(22);
    expect(requestedWirdPage("ward", { hash: "", search: "?wird=22" })).toBe(22);
    expect(requestedWirdPage("ward", { hash: "#/books/ward?wird=666", search: "" })).toBeNull();
    expect(requestedWirdPage("sirah", { hash: "#/books/sirah?wird=4", search: "" })).toBeNull();
  });
  test("no unrelated sensitive Android permissions or exact-alarm privileges", () => {
    const script = readFileSync("scripts/android-dev.mjs", "utf8");
    expect(script).toContain("tools:node=\"remove\"");
    expect(script).toContain("NOTIFICATIONS_VERSION");
    const audit = readFileSync("scripts/audit-android-apk.py", "utf8");
    expect(audit).toContain("ALLOWED_PERMISSIONS");
    expect(audit).toContain('"android.permission.SCHEDULE_EXACT_ALARM"');
  });
});
