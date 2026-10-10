import { PRINTED_MUSHAF } from "@/lib/printed-mushaf";

const DB = "rihab-verified-printed-quran-v1";
const STORE = "verified-pdf";
const KEY = "madina-hafs-green-1441";

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
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getOfflinePrintedMushaf(): Promise<Blob | null> {
  const db = await openDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const saved = req.result as SavedDocument | undefined;
        resolve(
          saved?.sha256 === PRINTED_MUSHAF.sha256 &&
          saved?.bytes === PRINTED_MUSHAF.byteLength &&
          saved.pdf instanceof Blob &&
          saved.pdf.size === PRINTED_MUSHAF.byteLength
            ? saved.pdf
            : null,
        );
      };
    });
  } finally { db.close(); }
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
  } finally { db.close(); }
  return pdf;
}

/**
 * A one-time 62MB download rather than embedding 62MB into every APK.
 * The file is never used until its SHA-256 matches the exact uploaded PDF.
 * A network/CORS failure should offer manual PDF import as fallback.
 */
export async function downloadOfflinePrintedMushaf(onProgress: (fraction: number) => void): Promise<Blob> {
  const response = await fetch(PRINTED_MUSHAF.sourceUrl, {
    cache: "no-store",
    mode: "cors",
    headers: { Accept: "application/pdf" },
  });
  if (!response.ok) throw new Error(`تعذّر تنزيل المصحف (HTTP ${response.status}). يمكنك استيراد ملف PDF من جهازك.`);
  if (!response.body) {
    return saveOfflinePrintedMushaf(await response.blob());
  }
  const parts: Uint8Array[] = [];
  const reader = response.body.getReader();
  let loaded = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      parts.push(result.value);
      loaded += result.value.byteLength;
      if (loaded > PRINTED_MUSHAF.byteLength) throw new Error("تم إيقاف تنزيل ملف يزيد عن حجم النسخة المعتمدة.");
      onProgress(loaded / PRINTED_MUSHAF.byteLength);
    }
  } finally { reader.releaseLock(); }
  const binary = new Uint8Array(loaded);
  let offset = 0;
  for (const part of parts) {
    binary.set(part, offset);
    offset += part.byteLength;
  }
  return saveOfflinePrintedMushaf(new Blob([binary.buffer as ArrayBuffer], { type: "application/pdf" }));
}
