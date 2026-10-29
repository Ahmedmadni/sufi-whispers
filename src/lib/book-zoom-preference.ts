import { useEffect, useState } from "react";
import { boundedBookZoom } from "@/lib/book-pinch";

export const BOOK_ZOOM_KEY = "rihab-book-page-zoom";

export function readBookZoom(storage: Pick<Storage, "getItem">): number {
  try {
    const value = storage.getItem(BOOK_ZOOM_KEY);
    return value === null ? 1 : boundedBookZoom(Number(value));
  } catch { return 1; }
}

/** Hydration-safe preference shared by PDF and offline-image readers. */
export function useBookZoomPreference() {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    setZoom(readBookZoom(window.localStorage));
  }, []);
  return [zoom, setZoom] as const;
}

export function saveBookZoom(value: number): number {
  const zoom = boundedBookZoom(value);
  try { window.localStorage.setItem(BOOK_ZOOM_KEY, String(zoom)); } catch { /* optional persistence */ }
  return zoom;
}