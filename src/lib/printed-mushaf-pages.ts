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

export const PRINTED_PAGE_IMAGE_WIDTH = 957;
export const PRINTED_PAGE_IMAGE_HEIGHT = 1368;

export function printedPageImageUrl(page: number): string {
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
