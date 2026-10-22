import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("Personal-backup reminder restoration", () => {
  test("reschedules native alarms after restoring reminder times", () => {
    const source = readFileSync("src/routes/settings.tsx", "utf8");
    expect(source).toContain("async function importData()");
    expect(source).toContain("const previousTimes = readWirdTimes()");
    expect(source).toContain("candidate.data[WIRD_TIMES_KEY] !== undefined");
    expect(source).toContain("await replaceWirdSchedule(native, readWirdTimes(), previousTimes)");
  });
  test("failed reschedule preserves earlier schedule and explains partial restore", () => {
    const source = readFileSync("src/routes/settings.tsx", "utf8");
    expect(source).toContain("localStorage.setItem(WIRD_TIMES_KEY, JSON.stringify(previousTimes))");
    expect(source).toContain("استُعيدت بقية البيانات، لكن تعذّر تحديث إشعارات الورد");
  });
});
