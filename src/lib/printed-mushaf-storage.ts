import { PRINTED_MUSHAF } from "@/lib/printed-mushaf";

const DB = "rihab-verified-printed-quran-v1";
const STORE = "verified-pdf";
const KEY = "madina-hafs-green-1441";

/** An invalid cached copy must be removed, not rendered or trusted. */
export class PrintedMushafCorruptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrintedMushafCorruptError";
  }
}

type SavedDocument = {
  key: string;
  pdf: Blob;
  sha256: string;
  bytes: number;
};

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("هذا الجهاز لا يدعم حفظ الملفات داخل التطبيق."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("قاعدة حفظ المصحف مشغولة في نافذة أخرى. أغلق النسخة الأخرى وأعد المحاولة."));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getOfflinePrintedMushaf(): Promise<Blob | null> {
  const db = await openDatabase();
  let saved: SavedDocument | undefined;
  try {
    saved = await new Promise<SavedDocument | undefined>((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result as SavedDocument | undefined);
    });
  } finally { db.close(); }
  if (!saved) return null;
  if (saved.sha256 !== PRINTED_MUSHAF.sha256 ||
      saved.bytes !== PRINTED_MUSHAF.byteLength ||
      !(saved.pdf instanceof Blob) ||
      saved.pdf.size !== PRINTED_MUSHAF.byteLength) {
    throw new PrintedMushafCorruptError("النسخة المحلية غير مطابقة لبيانات المصحف المعتمد؛ احذف الملف وأعد استيراد الأصل.");
  }
  // Re-check actual bytes on reopen. IndexedDB metadata alone cannot prove
  // that an existing cached PDF still matches its trusted source.
  try {
    await verifyPdf(saved.pdf);
  } catch {
    throw new PrintedMushafCorruptError("المصحف المحفوظ لم يجتز فحص سلامة SHA-256. أعد استيراد الملف الأصلي.");
  }
  return saved.pdf;
}

export async function deleteOfflinePrintedMushaf() {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const txn = db.transaction(STORE, "readwrite");
      txn.objectStore(STORE).delete(KEY);
      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
      txn.onabort = () => reject(txn.error);
    });
  } finally { db.close(); }
}

async function verifyPdf(pdf: Blob): Promise<void> {
  if (pdf.size !== PRINTED_MUSHAF.byteLength) {
    throw new Error("حجم الملف مختلف عن نسخة المصحف المعتمدة. اختر الملف المرفق الأصلي (نحو 62 ميجابايت).");
  }
  const header = await pdf.slice(0, 1024).text();
  if (!header.includes("%PDF-")) throw new Error("الملف المختار ليس ملف PDF سليمًا.");
  if (!globalThis.crypto?.subtle) throw new Error("الجهاز لا يدعم التحقق المشفّر من سلامة ملف المصحف.");
  const binary = await pdf.arrayBuffer();
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", binary));
  const sha256 = [...bytes].map((v) => v.toString(16).padStart(2, "0")).join("");
  if (sha256 !== PRINTED_MUSHAF.sha256) {
    throw new Error("بصمة المصحف لا تطابق الملف الأصلي المرفق. لن يتم عرض نسخة مختلفة.");
  }
}

export async function saveOfflinePrintedMushaf(pdf: Blob): Promise<Blob> {
  await verifyPdf(pdf);
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const txn = db.transaction(STORE, "readwrite");
      txn.objectStore(STORE).put({
        key: KEY,
        pdf,
        sha256: PRINTED_MUSHAF.sha256,
        bytes: pdf.size,
      } satisfies SavedDocument);
      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
      txn.onabort = () => reject(txn.error);
    });
  } catch (e) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.name === "UnknownError")) {
      throw new Error("مساحة الحفظ المحلية غير كافية. حرّر مساحة على الجهاز ثم أعد المحاولة.");
    }
    throw e;
  } finally { db.close(); }
  return pdf;
}

/**
 * A one-time 62MB download rather than embedding 62MB into every APK.
 * The file is never used until its SHA-256 matches the exact uploaded PDF.
 * A network/CORS failure should offer manual PDF import as fallback.
 */
/**
 * Converts a network response to a Blob with byte counting, without keeping
 * both an array of chunks and a second full-size Uint8Array in JS memory.
 * The caller still verifies the exact original file hash before storage.
 */
export async function receivePrintedPdf(
  response: Response,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  if (!response.ok) throw new Error(`تعذّر تنزيل المصحف (HTTP ${response.status}). يمكنك استيراد ملف PDF من جهازك.`);
  const declaredLength = Number(response.headers.get("content-length"));
  if (declaredLength > PRINTED_MUSHAF.byteLength) {
    throw new Error("المصدر يُرسل ملفًا أكبر من النسخة المعتمدة. أُوقف التنزيل لحماية التخزين.");
  }
  if (signal?.aborted) throw new DOMException("تم إلغاء التنزيل.", "AbortError");
  if (!response.body) {
    const blob = await response.blob();
    if (blob.size > PRINTED_MUSHAF.byteLength) throw new Error("حجم الملف المحمّل غير متوقع.");
    onProgress(blob.size / PRINTED_MUSHAF.byteLength);
    return blob;
  }

  let loaded = 0;
  const measuredStream = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (signal?.aborted) throw new DOMException("تم إلغاء التنزيل.", "AbortError");
      loaded += chunk.byteLength;
      if (loaded > PRINTED_MUSHAF.byteLength) {
        throw new Error("تم إيقاف تنزيل ملف يزيد عن حجم النسخة المعتمدة.");
      }
      onProgress(Math.min(1, loaded / PRINTED_MUSHAF.byteLength));
      controller.enqueue(chunk);
    },
  }));
  const pdf = await new Response(measuredStream).blob();
  if (signal?.aborted) throw new DOMException("تم إلغاء التنزيل.", "AbortError");
  return pdf;
}

export async function downloadOfflinePrintedMushaf(
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(PRINTED_MUSHAF.sourceUrl, {
    cache: "no-store",
    mode: "cors",
    headers: { Accept: "application/pdf" },
    signal,
  });
  const pdf = await receivePrintedPdf(response, onProgress, signal);
  if (signal?.aborted) throw new DOMException("تم إلغاء التنزيل.", "AbortError");
  return saveOfflinePrintedMushaf(pdf);
}
