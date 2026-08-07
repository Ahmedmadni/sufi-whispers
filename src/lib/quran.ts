import datasetAsset from "@/data/quran/hafsData_v2-0.json.asset.json";
import { SURA_INDEX } from "@/data/quran/suras";

/**
 * Official dataset: KFGQPC Uthmanic Hafs data v2.0
 * (مجمع الملك فهد لطباعة المصحف الشريف)
 *
 * The dataset is READ-ONLY and is served verbatim from the original file.
 * `aya_text` is the only field allowed for display (Uthmanic script).
 * `aya_text_emlaey` is used for search indexing only.
 */
export type Aya = {
  id: number;
  jozz: number;
  page: number;
  sura_no: number;
  sura_name_en: string;
  sura_name_ar: string;
  line_start: number;
  line_end: number;
  aya_no: number;
  aya_text: string;
  aya_text_emlaey: string;
};

export const QURAN_DATASET_URL = datasetAsset.url;
export const QURAN_DATASET_NAME = "hafsData_v2-0.json";
export const QURAN_SOURCE = "مجمع الملك فهد لطباعة المصحف الشريف — KFGQPC Hafs v2.0";
export const MAX_PAGE = 604;
export { SURA_INDEX };

let cache: Aya[] | null = null;
let inflight: Promise<Aya[]> | null = null;

export async function loadQuran(): Promise<Aya[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(QURAN_DATASET_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`تعذّر تحميل بيانات المصحف (${r.status})`);
      return r.json() as Promise<Aya[]>;
    })
    .then((data) => {
      cache = data;
      inflight = null;
      return data;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}

export const quranQueryOptions = {
  queryKey: ["quran", "hafs-v2-0"] as const,
  queryFn: loadQuran,
  staleTime: Infinity,
  gcTime: Infinity,
};

export const getSura = (all: Aya[], suraNo: number) =>
  all.filter((a) => a.sura_no === suraNo);

export const getPage = (all: Aya[], page: number) =>
  all.filter((a) => a.page === page);

/** Search index normalization applies ONLY to `aya_text_emlaey`, never to `aya_text`. */
const normalizeForSearch = (s: string) =>
  s
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

export function searchQuran(all: Aya[], query: string, limit = 60): Aya[] {
  const q = normalizeForSearch(query);
  if (q.length < 2) return [];
  const out: Aya[] = [];
  for (const a of all) {
    if (normalizeForSearch(a.aya_text_emlaey).includes(q)) {
      out.push(a);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/* ---------- Last reading position (local only) ---------- */

export type ReadingPosition = {
  suraNo: number;
  suraNameAr: string;
  ayaNo: number;
  page: number;
  at: number;
};

const POS_KEY = "quran:last-position";

export function saveReadingPosition(pos: Omit<ReadingPosition, "at">) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify({ ...pos, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function readReadingPosition(): ReadingPosition | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    return raw ? (JSON.parse(raw) as ReadingPosition) : null;
  } catch {
    return null;
  }
}
