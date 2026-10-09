import type { Aya } from "./quran";

export type ValidationReport = {
  ok: boolean;
  records: number;
  surahs: number;
  lastPage: number;
  errors: string[];
  warnings: string[];
};

/**
 * Integrity validation for the official KFGQPC dataset.
 * All expected values are derived from the file itself — nothing external.
 */
export function validateQuranDataset(data: unknown): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(data)) {
    return { ok: false, records: 0, surahs: 0, lastPage: 0, errors: ["الملف ليس مصفوفة JSON صالحة"], warnings };
  }
  const rows = data as Aya[];

  const ids = new Set<number>();
  const pairs = new Set<string>();
  const suraOrder: number[] = [];
  const ayaCursor = new Map<number, number>();
  let lastPage = 0;
  let prevPage = 0;
  const uniquePages = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const where = `السجل #${i + 1}`;

    for (const f of ["id", "jozz", "page", "sura_no", "aya_no"] as const) {
      if (typeof r?.[f] !== "number" || !Number.isFinite(r[f])) errors.push(`${where}: الحقل ${f} مفقود أو غير رقمي`);
    }
    for (const f of ["sura_name_ar", "sura_name_en", "aya_text", "aya_text_emlaey"] as const) {
      if (typeof r?.[f] !== "string" || r[f].trim() === "") errors.push(`${where}: الحقل ${f} فارغ أو مفقود`);
    }
    if (errors.length > 50) break;

    if (ids.has(r.id)) errors.push(`${where}: معرّف مكرر id=${r.id}`);
    ids.add(r.id);

    const key = `${r.sura_no}:${r.aya_no}`;
    if (pairs.has(key)) errors.push(`${where}: تكرار سورة/آية ${key}`);
    pairs.add(key);

    if (r.sura_no < 1 || r.sura_no > 114) errors.push(`${where}: رقم سورة غير صالح ${r.sura_no}`);
    if (r.aya_no < 1) errors.push(`${where}: رقم آية غير صالح ${r.aya_no}`);
    if (r.page < 1) errors.push(`${where}: رقم صفحة غير صالح ${r.page}`);
    if (r.page < prevPage) errors.push(`${where}: تسلسل الصفحات غير تصاعدي (${prevPage} ← ${r.page})`);
    prevPage = r.page;
    lastPage = Math.max(lastPage, r.page);
    uniquePages.add(r.page);

    if (suraOrder[suraOrder.length - 1] !== r.sura_no) {
      if (suraOrder.includes(r.sura_no)) errors.push(`${where}: سجلات السورة ${r.sura_no} غير متجاورة`);
      suraOrder.push(r.sura_no);
    }

    const expected = (ayaCursor.get(r.sura_no) ?? 0) + 1;
    if (r.aya_no !== expected) errors.push(`سورة ${r.sura_no}: آية مفقودة أو خارج الترتيب (متوقع ${expected}، وُجد ${r.aya_no})`);
    ayaCursor.set(r.sura_no, r.aya_no);
  }

  for (let i = 0; i < suraOrder.length; i++) {
    if (suraOrder[i] !== i + 1) {
      errors.push(`ترتيب السور غير صحيح عند الموضع ${i + 1} (وُجد ${suraOrder[i]})`);
      break;
    }
  }

  if (suraOrder.length !== 114) errors.push(`عدد السور = ${suraOrder.length} (المتوقع 114)`);
  if (rows.length !== 6236) errors.push(`عدد السجلات = ${rows.length} (المتوقع 6236)`);
  if (lastPage !== 604) errors.push(`آخر صفحة = ${lastPage} (المتوقع 604)`);
  if (uniquePages.size !== 604) errors.push(`عدد صفحات المصحف غير مكتمل = ${uniquePages.size} (المتوقع 604 صفحة)`);

  return {
    ok: errors.length === 0,
    records: rows.length,
    surahs: suraOrder.length,
    lastPage,
    errors,
    warnings,
  };
}
