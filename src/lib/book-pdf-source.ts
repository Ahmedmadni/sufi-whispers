/**
 * PDF.js on Android WebView is more reliable when its worker gets the
 * validated PDF bytes directly, instead of depending on range/stream support
 * of WebView's virtual https://localhost asset transport.
 */
export async function loadLocalBookPdf(
  url: string,
  signal?: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("..")) {
    throw new Error("مسار الكتاب غير مسموح داخل التطبيق.");
  }
  const response = await fetch(url, { signal, cache: "default" });
  if (!response.ok) {
    throw new Error(`ملف الكتاب غير متاح في نسخة التطبيق (HTTP ${response.status}).`);
  }
  const binary = await response.arrayBuffer();
  if (binary.byteLength < 200 || binary.byteLength > 30 * 1024 * 1024) {
    throw new Error("حجم ملف الكتاب غير صالح للعرض داخل التطبيق.");
  }
  const bytes = new Uint8Array(binary);
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, 16));
  if (!header.startsWith("%PDF-")) {
    throw new Error("مصدر الكتاب لا يحتوي على ملف PDF صحيح.");
  }
  return bytes;
}
