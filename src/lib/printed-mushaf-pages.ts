import { PRINTED_MUSHAF, clampMushafPage } from "@/lib/printed-mushaf";

/**
 * Pages are original PNG objects, extracted byte-for-byte from the user's
 * SHA-256 verified Madinah 1441H PDF (PDF sheets 4..607).
 *
 * The publisher workflow refuses a PDF with an unexpected SHA256/page count,
 * and stores a manifest with SHA256 for all 604 untouched source images.
 * The separate public branch is hosted online and is NOT in the APK.
 */
export const PRINTED_PAGE_IMAGE_BASE =
  "https://raw.githubusercontent.com/Ahmedmadni/sufi-whispers/0b944b349fd28295803a0a96fbf2906a14286245/pages";

/**
 * Capacitor bundles all 604 approved printed pages under its local origin.
 * Image encoding may be lossless WebP or the original PNG, whichever is
 * smaller. The bundled manifest is produced from pixel-equal verified pages.
 */
export type OfflinePrintedMushafManifest = {
  format: 1;
  sourceSha256: string;
  pageCount: number;
  pages: Record<string, { name: string; bytes: number; sha256: string }>;
};

export const MOBILE_OFFLINE_MUSHAF_URL = "/printed-mushaf/manifest.json";
export const APPROVED_MUSHAF_SHA256 =
  "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28";

export function validateOfflineMushafManifest(value: unknown): OfflinePrintedMushafManifest {
  if (!value || typeof value !== "object") throw new Error("فهرس المصحف المحلي غير موجود.");
  const data = value as Partial<OfflinePrintedMushafManifest>;
  if (data.format !== 1 || data.sourceSha256 !== APPROVED_MUSHAF_SHA256 ||
    data.pageCount !== PRINTED_MUSHAF.quranPages || !data.pages ||
    typeof data.pages !== "object" ||
    Object.keys(data.pages).length !== PRINTED_MUSHAF.quranPages) {
    throw new Error("فهرس المصحف المحلي لا يطابق النسخة القرآنية المعتمدة.");
  }
  for (let page = 1; page <= PRINTED_MUSHAF.quranPages; page++) {
    const entry = data.pages[String(page)];
    const stem = String(page).padStart(3, "0");
    if (!entry || ![stem + ".png", stem + ".webp"].includes(entry.name) ||
      !Number.isInteger(entry.bytes) || entry.bytes <= 0 ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error(`ملف الصفحة ${page} غير مدرج بشكل صحيح داخل التطبيق.`);
    }
  }
  return data as OfflinePrintedMushafManifest;
}

export function offlinePrintedPageImageUrl(
  page: number, manifest: OfflinePrintedMushafManifest,
): string {
  const entry = manifest.pages[String(clampMushafPage(page))];
  if (!entry) throw new Error("صفحة المصحف المحلي غير متوفرة.");
  return "/printed-mushaf/pages/" + entry.name;
}

export const PRINTED_PAGE_IMAGE_WIDTH = 957;
export const PRINTED_PAGE_IMAGE_HEIGHT = 1368;

export function printedPageImageUrl(
  page: number,
  offlineManifest?: OfflinePrintedMushafManifest | null,
): string {
  if (import.meta.env.VITE_MOBILE === "true") {
    // Never silently fetch remote page images in Android, even on failures.
    // The offline manifest must load before the reader attempts image display.
    return offlineManifest ? offlinePrintedPageImageUrl(page, offlineManifest) : "";
  }
  const index = clampMushafPage(page);
  return `${PRINTED_PAGE_IMAGE_BASE}/${String(index).padStart(3, "0")}.png`;
}

export function adjacentPrintedPages(page: number): number[] {
  const current = clampMushafPage(page);
  return [current - 1, current + 1].filter(
    (candidate) => candidate >= 1 && candidate <= PRINTED_MUSHAF.quranPages,
  );
}

/**
 * Never display an unverified source as a fallback or retype image text.
 * If the image CDN is unreachable, provide the existing verified text mode.
 */
export const PRINTED_PAGE_MANIFEST_URL =
  "https://raw.githubusercontent.com/Ahmedmadni/sufi-whispers/0b944b349fd28295803a0a96fbf2906a14286245/manifest.json";
