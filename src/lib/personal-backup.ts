/**
 * Offline, schema-validated personal backup. No Quran, book PDFs, source images
 * or arbitrary browser storage keys are exported or restored.
 */
import { books } from "@/data/books";
import { DHIKR_NAMES, NAME_TARGET } from "@/data/dhikr";
import { validatePrayerTimes } from "@/lib/wird-times";
import { validateWirdTimes, WIRD_TIMES_KEY } from "@/lib/wird-reminders";
import { readerModeKey } from "@/lib/reader-continuous";

export const PERSONAL_BACKUP_FORMAT = "rihab-khaliliyya-personal-data";
export const PERSONAL_BACKUP_VERSION = 1;
export const PERSONAL_BACKUP_MAX_BYTES = 128 * 1024;
const CORE_KEYS = [
  "rihab-dhikr-v1",
  "quran:last-position",
  "rihab:printed-mushaf:bookmarks:v1",
  "rihab:printed-mushaf:last-page:v1",
  "rihab-prayer-times-v1",
  WIRD_TIMES_KEY,
  "rihab:dhikr:tap-sound:v1",
  "rihab-font-scale",
  "rihab-theme",
  "reader.swipeThreshold",
] as const;
export const PERSONAL_BACKUP_KEYS = [
  ...CORE_KEYS,
  ...books.map((book) => `reader.page.${book.id}`),
  ...books.map((book) => readerModeKey(book.id)),
] as const;
const SAFE_KEYS = new Set<string>(PERSONAL_BACKUP_KEYS);
export type PersonalBackup = {
  format: typeof PERSONAL_BACKUP_FORMAT;
  version: typeof PERSONAL_BACKUP_VERSION;
  createdAt: string;
  data: Record<string, string>;
};
type StorageShape = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type AnyRecord = Record<string, unknown>;

function object(value: unknown, name: string): AnyRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`بيانات ${name} غير صحيحة.`);
  }
  return value as AnyRecord;
}
function json(value: string, key: string): unknown {
  try { return JSON.parse(value) as unknown; }
  catch { throw new Error(`تعذر قراءة بيانات ${key}.`); }
}
function natural(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= max;
}
function nullableTime(v: unknown): boolean {
  return v === null || natural(v, 1e14);
}
function dateString(v: unknown): boolean {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
function validDhikr(raw: string): void {
  const data = object(json(raw, "الذكر"), "الذكر");
  if (!natural(data.activeIndex, DHIKR_NAMES.length - 1) ||
      !natural(data.streak, 10000000) ||
      !natural(data.totalSessions, 100000000) ||
      !(data.lastActiveDate === null || dateString(data.lastActiveDate))) {
    throw new Error("النسخة تحتوي على حالة ذكر غير صالحة.");
  }
  const daily = object(data.daily, "عدادات اليوم");
  if (!dateString(daily.date) || !natural(daily.salawat, 1e12) || !natural(daily.istighfar, 1e12)) {
    throw new Error("عدادات الأوراد اليومية غير صالحة.");
  }
  const names = object(data.names, "الأسماء");
  if (Object.keys(names).some(k => !DHIKR_NAMES.some(n => n.id === k))) {
    throw new Error("تحتوي نسخة الأذكار على أسماء غير معروفة.");
  }
  for (const name of DHIKR_NAMES) {
    const value = object(names[name.id], name.name);
    if (!natural(value.count, NAME_TARGET) || !natural(value.elapsedMs, 1e14) ||
        !nullableTime(value.startedAt) || !nullableTime(value.completedAt)) {
      throw new Error(`قيمة الذكر غير صالحة: ${name.name}`);
    }
  }
}
function validateEntry(key: string, raw: string): void {
  if (key === "rihab-dhikr-v1") return validDhikr(raw);
  if (key === WIRD_TIMES_KEY) {
    validateWirdTimes(json(raw, key));
    return;
  }
  if (key === "rihab-prayer-times-v1") {
    validatePrayerTimes(json(raw, key));
    return;
  }
  if (key === "rihab-theme") {
    if (raw !== "dark" && raw !== "light") throw new Error("قيمة الوضع الليلي/النهاري غير صالحة.");
    return;
  }
  if (key === "rihab-font-scale") {
    if (!["100", "115", "130", "145"].includes(raw)) throw new Error("حجم الخط غير صالح.");
    return;
  }
  if (key === "rihab:dhikr:tap-sound:v1") {
    if (!["on", "off"].includes(raw)) throw new Error("تفضيل صوت الذكر غير صالح.");
    return;
  }
  if (key === "reader.swipeThreshold") {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 30 || n > 200) throw new Error("حساسية التقليب غير صالحة.");
    return;
  }
  if (key.startsWith("reader.mode.")) {
    if (raw !== "paged" && raw !== "continuous") throw new Error("وضع عرض الكتاب غير صالح.");
    return;
  }
  if (key.startsWith("reader.page.") || key === "rihab:printed-mushaf:last-page:v1") {
    if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw)) ||
        Number(raw) > (key === "rihab:printed-mushaf:last-page:v1" ? 604 : 5000)) {
      throw new Error("موضع القراءة غير صالح.");
    }
    return;
  }
  if (key === "rihab:printed-mushaf:bookmarks:v1") {
    const marks = json(raw, key);
    if (!Array.isArray(marks) || marks.length > 604) throw new Error("علامات المصحف غير صالحة.");
    const unique = new Set<number>();
    for (const mark of marks) {
      const row = object(mark, "العلامة");
      if (!natural(row.page, 604) || row.page === 0 || !natural(row.createdAt, 1e14) ||
          unique.has(row.page)) throw new Error("علامة مصحف غير صالحة.");
      unique.add(row.page);
    }
    return;
  }
  if (key === "quran:last-position") {
    const position = object(json(raw, key), "موضع المصحف");
    if (!natural(position.suraNo, 114) || position.suraNo === 0 ||
        !natural(position.ayaNo, 300) || position.ayaNo === 0 ||
        !natural(position.page, 604) || position.page === 0 ||
        typeof position.suraNameAr !== "string" || position.suraNameAr.length > 150 ||
        !natural(position.at, 1e14)) throw new Error("موضع المصحف النصي غير صالح.");
    return;
  }
  throw new Error(`مفتاح غير مدعوم: ${key}`);
}
export function parsePersonalBackup(source: string): PersonalBackup {
  if (new TextEncoder().encode(source).byteLength > PERSONAL_BACKUP_MAX_BYTES) {
    throw new Error("حجم ملف النسخة أكبر من الحد المسموح (128 كيلوبايت).");
  }
  const raw = object(json(source, "النسخة الاحتياطية"), "النسخة الاحتياطية");
  if (raw.format !== PERSONAL_BACKUP_FORMAT || raw.version !== PERSONAL_BACKUP_VERSION ||
      typeof raw.createdAt !== "string" || !Number.isFinite(Date.parse(raw.createdAt))) {
    throw new Error("صيغة النسخة الاحتياطية غير مدعومة أو ناقصة.");
  }
  const values = object(raw.data, "البيانات");
  if (Object.keys(values).length > SAFE_KEYS.size) throw new Error("النسخة تحتوي على بيانات إضافية غير معروفة.");
  const data: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [key, value] of Object.entries(values)) {
    if (!SAFE_KEYS.has(key) || typeof value !== "string") {
      throw new Error("النسخة تحتوي على مفاتيح غير مدعومة.");
    }
    validateEntry(key, value);
    data[key] = value;
  }
  return { format: PERSONAL_BACKUP_FORMAT, version: PERSONAL_BACKUP_VERSION, createdAt: raw.createdAt, data };
}

export function exportPersonalBackup(storage: StorageShape, now = new Date()): string {
  const data: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const key of PERSONAL_BACKUP_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) {
      validateEntry(key, value);
      data[key] = value;
    }
  }
  const result: PersonalBackup = {
    format: PERSONAL_BACKUP_FORMAT,
    version: PERSONAL_BACKUP_VERSION,
    createdAt: now.toISOString(),
    data,
  };
  const serialized = JSON.stringify(result, null, 2);
  if (new TextEncoder().encode(serialized).byteLength > PERSONAL_BACKUP_MAX_BYTES) {
    throw new Error("البيانات المحفوظة تتجاوز الحد المسموح.");
  }
  return serialized;
}

/** Validate EVERYTHING before the first write, then roll back on storage errors. */
export function restorePersonalBackup(source: string, storage: StorageShape): number {
  const backup = parsePersonalBackup(source);
  const changes = Object.entries(backup.data);
  const before = new Map<string, string | null>();
  for (const [key] of changes) before.set(key, storage.getItem(key));
  const touched: string[] = [];
  try {
    for (const [key, value] of changes) {
      // Add before write; even a storage backend that writes then throws rolls back.
      touched.push(key);
      storage.setItem(key, value);
    }
  } catch {
    for (const key of touched.reverse()) {
      try {
        const previous = before.get(key);
        if (previous === null || previous === undefined) storage.removeItem(key);
        else storage.setItem(key, previous);
      } catch { /* storage itself is broken; never claim restoration success */ }
    }
    throw new Error("فشل الحفظ في مساحة التطبيق؛ تمت محاولة إعادة البيانات السابقة. لم تكتمل الاستعادة.");
  }
  return changes.length;
}
