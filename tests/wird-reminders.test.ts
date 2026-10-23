import { describe, expect, test } from "bun:test";
import { reminderItems, scheduleWirdTest, wirdTestReminder, replaceWirdSchedule, requestedWirdPage, WIRD_REMINDER_KEY, validateWirdTimes, readWirdTimes, WIRD_TIMES_KEY } from "../src/lib/wird-reminders";
import { readFileSync } from "node:fs";
describe("Opt-in Android ward reminder integrity", () => {
  test("exactly two local daily notifications link to source-verified ward pages", () => {
    const rows = reminderItems();
    expect(rows.map(item => [item.schedule.on.hour, item.schedule.on.minute, item.extra.wird]))
      .toEqual([[9,0,4], [21,0,22]]);
    expect(rows.every(x => x.isExactNotification === false && x.actionTypeId === "RIHAB_WIRD_OPEN")).toBe(true);
    expect(WIRD_REMINDER_KEY).toContain("wird-reminders");
  });
  test("user can select independent HH:mm reminder times including midnight", () => {
    expect(reminderItems({first:"06:45",second:"23:05"}).map(x => x.schedule.on))
      .toEqual([{hour:6,minute:45},{hour:23,minute:5}]);
    expect(readWirdTimes({getItem:()=>JSON.stringify({first:"06:45",second:"23:05"})})).toEqual({first:"06:45",second:"23:05"});
    expect(WIRD_TIMES_KEY).toContain("wird-reminder-times");
    expect(() => validateWirdTimes({first:"25:99",second:"12:00"})).toThrow();
    expect(() => validateWirdTimes({first:"foo",second:"21:00"})).toThrow();
    expect(readWirdTimes({getItem:()=>"{invalid"})).toEqual({first:"09:00",second:"21:00"});
    expect(readFileSync("src/lib/personal-backup.ts","utf8")).toContain("validateWirdTimes(json(raw, key))");
  });
  test("rejects other books or fabricated page targets on both Android hash and web URL", () => {
    expect(requestedWirdPage("ward", { hash: "#/books/ward?wird=4", search: "" })).toBe(4);
    expect(requestedWirdPage("ward", { hash: "#/books/ward?wird=22", search: "" })).toBe(22);
    expect(requestedWirdPage("ward", { hash: "", search: "?wird=22" })).toBe(22);
    expect(requestedWirdPage("ward", { hash: "#/books/ward?wird=666", search: "" })).toBeNull();
    expect(requestedWirdPage("sirah", { hash: "#/books/sirah?wird=4", search: "" })).toBeNull();
  });
  test("valid schedule replacement cancels exactly two IDs and verifies both pending", async () => {
    let pending: Array<{ id: number }> = [];
    let cancellations = 0;
    const native = {
      cancel: async () => { cancellations++; pending = []; },
      schedule: async ({ notifications }: { notifications: Array<{ id: number }> }) => { pending = notifications.map(({ id }) => ({ id })); },
      getPending: async () => ({ notifications: pending }),
    };
    await replaceWirdSchedule(native, { first: "06:40", second: "19:20" });
    expect(cancellations).toBe(1);
    expect(pending.map(n => n.id)).toEqual([904,922]);
  });
  test("failed Android scheduling restores previous reminders instead of losing both", async () => {
    let pending: Array<{ id: number }> = [{ id: 904 }, { id: 922 }];
    let attempts = 0;
    const native = {
      cancel: async () => { pending = []; },
      schedule: async ({ notifications }: { notifications: Array<{ id: number; schedule: { on: { hour: number } } }> }) => {
        attempts++;
        if (notifications[0].schedule.on.hour === 6) throw new Error("device refused reschedule");
        pending = notifications.map(({ id }) => ({ id }));
      },
      getPending: async () => ({ notifications: pending }),
    };
    await expect(replaceWirdSchedule(native, { first: "06:00", second: "19:00" },
      { first: "09:00", second: "21:00" })).rejects.toThrow("device refused reschedule");
    expect(pending.map(n => n.id)).toEqual([904,922]);
    expect(attempts).toBe(2);
  });
  test("partial Android registration is detected and previous notifications are restored", async () => {
    let pending: Array<{ id: number }> = [];
    const native = {
      cancel: async () => { pending = []; },
      schedule: async ({ notifications }: { notifications: Array<{ id: number; schedule: { on: { hour: number } } }> }) => {
        pending = notifications[0].schedule.on.hour === 5 ? [{ id: 904 }] : notifications.map(({ id }) => ({ id }));
      },
      getPending: async () => ({ notifications: pending }),
    };
    await expect(replaceWirdSchedule(native, { first: "05:15", second: "19:00" },
      { first: "09:00", second: "21:00" })).rejects.toThrow(/لم يؤكد/);
    expect(pending.map(n => n.id)).toEqual([904,922]);
  });
  test("invalid clock data does not cancel existing notifications", async () => {
    let cancelled = false;
    const native = {
      cancel: async () => { cancelled = true; },
      schedule: async () => {},
      getPending: async () => ({ notifications: [] }),
    };
    await expect(replaceWirdSchedule(native, { first: "99:59", second: "21:00" })).rejects.toThrow();
    expect(cancelled).toBe(false);
  });
  test("diagnostic notifications are inexact, one-time and distinct from the daily IDs", () => {
    const now = new Date("2026-10-23T12:00:00.000Z");
    const first = wirdTestReminder(4, now);
    const second = wirdTestReminder(22, now);
    expect([first.id, second.id]).toEqual([923, 924]);
    expect(first.schedule.at.toISOString()).toBe("2026-10-23T12:00:30.000Z");
    expect(second.schedule.at.toISOString()).toBe("2026-10-23T12:00:30.000Z");
    expect([first.extra.wird, second.extra.wird]).toEqual([4, 22]);
    expect([first, second].every(x => x.isExactNotification === false && x.actionTypeId === "RIHAB_WIRD_OPEN")).toBe(true);
    expect(reminderItems().map(x => x.id)).toEqual([904, 922]);
  });
  test("test notifications only replace their own diagnostic IDs", async () => {
    const pending: Array<{ id: number }> = [{id:904},{id:922}];
    const cancelled: number[] = [];
    const native = {
      cancel: async ({notifications}: {notifications: Array<{id:number}>}) => {
        cancelled.push(...notifications.map(x=>x.id));
        for(const item of notifications) {
          const index = pending.findIndex(p=>p.id===item.id);
          if(index>=0) pending.splice(index,1);
        }
      },
      schedule: async ({notifications}: {notifications: Array<{id:number}>}) => {
        pending.push(...notifications.map(({id})=>({id})));
      },
      getPending: async () => ({notifications:pending}),
    };
    await scheduleWirdTest(native,4,new Date("2026-10-23T12:00:00.000Z"));
    await scheduleWirdTest(native,22,new Date("2026-10-23T12:00:00.000Z"));
    expect(cancelled).toEqual([923,924]);
    expect(pending.map(x=>x.id).sort()).toEqual([904,922,923,924]);
  });
  test("unconfirmed diagnostic scheduling is reported without touching the daily alarms", async () => {
    const cancelled: number[] = [];
    const native = {
      cancel: async ({notifications}: {notifications: Array<{id:number}>}) => { cancelled.push(...notifications.map(x=>x.id)); },
      schedule: async () => {},
      getPending: async () => ({notifications:[{id:904},{id:922}]}),
    };
    await expect(scheduleWirdTest(native,4)).rejects.toThrow(/لم يؤكد Android/);
    expect(cancelled).toEqual([923]);
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
