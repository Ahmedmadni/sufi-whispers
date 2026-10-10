import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseLastPrintedPage, PRINTED_LAST_PAGE_KEY } from "@/lib/printed-mushaf";

/** Only the approved printed original is a reading surface. */
export const Route = createFileRoute("/quran/")({
  beforeLoad: () => {
    let page = 1;
    if (typeof window !== "undefined") {
      try { page = parseLastPrintedPage(localStorage.getItem(PRINTED_LAST_PAGE_KEY)); } catch { /* optional */ }
    }
    throw redirect({ to: "/quran/printed", search: { page } });
  },
});
