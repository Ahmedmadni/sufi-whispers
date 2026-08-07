/**
 * Verifies the official KFGQPC dataset served from the CDN asset.
 * Run: bun run scripts/validate-quran.ts
 */
import pointer from "../src/data/quran/hafsData_v2-0.json.asset.json";
import { validateQuranDataset } from "../src/lib/quran-validate";

const base = process.env["QURAN_ASSET_BASE"] ?? "https://sufi-whispers.lovable.app";
const url = pointer.url.startsWith("http") ? pointer.url : base + pointer.url;

const res = await fetch(url);
if (!res.ok) {
  console.error(`تعذّر تحميل البيانات: ${res.status} ${url}`);
  process.exit(1);
}
const report = validateQuranDataset(await res.json());

console.log("المصدر:", url);
console.log("السجلات:", report.records, "| السور:", report.surahs, "| آخر صفحة:", report.lastPage);
if (!report.ok) {
  console.error("فشل التحقق:");
  for (const e of report.errors.slice(0, 30)) console.error(" -", e);
  process.exit(1);
}
console.log("✓ سليم: 114 سورة، 6236 آية، 604 صفحات — بدون تعديل على النص.");
