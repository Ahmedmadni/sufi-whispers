import { describe, expect, test } from "bun:test";
import { DHIKR_NAMES } from "../src/data/dhikr";
import {
  exportPersonalBackup, parsePersonalBackup, restorePersonalBackup,
  PERSONAL_BACKUP_FORMAT, PERSONAL_BACKUP_MAX_BYTES,
} from "../src/lib/personal-backup";

class MemoryStorage {
  public data = new Map<string, string>();
  failKey: string | null = null;
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failKey === key) throw new Error("quota");
    this.data.set(key, value);
  }
  removeItem(key: string) { this.data.delete(key); }
}
const validDhikr = () => ({
  activeIndex: 1,
  names: Object.fromEntries(DHIKR_NAMES.map(n => [n.id, {
    count: n.id === "allah" ? 1500 : 0, elapsedMs: 125, startedAt: null, completedAt: null,
  }])),
  daily: { date: "2026-10-15", salawat: 125, istighfar: 55 },
  streak: 3, lastActiveDate: "2026-10-15", totalSessions: 4,
});
function sample() {
  const storage = new MemoryStorage();
  storage.setItem("rihab-dhikr-v1", JSON.stringify(validDhikr()));
  storage.setItem("rihab:printed-mushaf:last-page:v1", "604");
  storage.setItem("rihab:printed-mushaf:bookmarks:v1", JSON.stringify([{ page: 604, createdAt: 1470000000 }]));
  storage.setItem("reader.page.nafahat", "122");
  storage.setItem("rihab-prayer-times-v1", JSON.stringify({ fajr: "05:00", asr: "15:00", maghrib: "18:20" }));
  storage.setItem("rihab-theme", "light");
  storage.setItem("reader.swipeThreshold", "80");
  return storage;
}
describe("offline personal backup and safe restoration", () => {
  test("round trips counts, reading positions and preferences without network or content assets", () => {
    const storage = sample();
    storage.setItem("foreign-secret", "must never export");
    const exported = exportPersonalBackup(storage, new Date("2026-10-15T08:00:00.000Z"));
    const parsed = parsePersonalBackup(exported);
    expect(parsed.format).toBe(PERSONAL_BACKUP_FORMAT);
    expect(parsed.createdAt).toBe("2026-10-15T08:00:00.000Z");
    expect(parsed.data["foreign-secret"]).toBeUndefined();
    expect(parsed.data["reader.page.nafahat"]).toBe("122");
    expect(exported).not.toContain("foreign-secret");
    const target = new MemoryStorage();
    target.setItem("reader.page.ward", "12");
    expect(restorePersonalBackup(exported, target)).toBe(7);
    expect(target.getItem("reader.page.nafahat")).toBe("122");
    expect(target.getItem("reader.page.ward")).toBe("12");
    expect(JSON.parse(target.getItem("rihab-dhikr-v1")!).names.allah.count).toBe(1500);
    expect(target.getItem("rihab-theme")).toBe("light");
  });
  test("rejects unknown keys and malformed Quran/dhikr before writing anything", () => {
    const original = sample();
    const snapshot = JSON.parse(exportPersonalBackup(original));
    const current = new MemoryStorage();
    current.setItem("reader.page.nafahat", "33");
    snapshot.data["api-token"] = "secret";
    expect(() => restorePersonalBackup(JSON.stringify(snapshot), current)).toThrow(/مفاتيح/);
    expect(current.getItem("reader.page.nafahat")).toBe("33");
    delete snapshot.data["api-token"];
    const bad = JSON.parse(snapshot.data["rihab-dhikr-v1"]);
    bad.names.allah.count = 100001;
    snapshot.data["rihab-dhikr-v1"] = JSON.stringify(bad);
    expect(() => restorePersonalBackup(JSON.stringify(snapshot), current)).toThrow(/قيمة الذكر/);
    expect(current.getItem("reader.page.nafahat")).toBe("33");
  });
  test("rejects unsupported versions, duplicate bookmarks, invalid page numbers and oversized data", () => {
    const backup = JSON.parse(exportPersonalBackup(sample()));
    backup.version = 99;
    expect(() => parsePersonalBackup(JSON.stringify(backup))).toThrow(/مدعومة/);
    backup.version = 1;
    backup.data["rihab:printed-mushaf:bookmarks:v1"] = JSON.stringify([
      { page: 1, createdAt: 100 }, { page: 1, createdAt: 101 },
    ]);
    expect(() => parsePersonalBackup(JSON.stringify(backup))).toThrow(/علامة/);
    backup.data["rihab:printed-mushaf:bookmarks:v1"] = "[]";
    backup.data["rihab:printed-mushaf:last-page:v1"] = "605";
    expect(() => parsePersonalBackup(JSON.stringify(backup))).toThrow(/موضع/);
    expect(() => parsePersonalBackup("x".repeat(PERSONAL_BACKUP_MAX_BYTES + 1))).toThrow(/128/);
  });
  test("rolls back prior writes if local storage becomes unavailable", () => {
    const backup = exportPersonalBackup(sample());
    const current = new MemoryStorage();
    current.setItem("rihab-dhikr-v1", JSON.stringify(validDhikr()));
    current.setItem("rihab:printed-mushaf:last-page:v1", "26");
    const previous = [...current.data.entries()];
    current.failKey = "rihab:printed-mushaf:last-page:v1";
    expect(() => restorePersonalBackup(backup, current)).toThrow(/لم تكتمل الاستعادة/);
    expect(current.data.get("rihab-dhikr-v1")).toBe(previous[0][1]);
    expect(current.data.get("rihab:printed-mushaf:last-page:v1")).toBe("26");
    expect(current.data.get("reader.page.nafahat")).toBeUndefined();
  });
});
