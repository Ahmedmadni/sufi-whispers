import { createFileRoute, redirect } from "@tanstack/react-router";
import { SURA_INDEX } from "@/data/quran/suras";

/** Preserve old deep links, but always open the original printed Mushaf. */
export const Route = createFileRoute("/quran/surah/$suraNo")({
  beforeLoad: ({ params }) => {
    const sura = SURA_INDEX.find((item) => item.no === Number(params.suraNo));
    throw redirect({ to: "/quran/printed", search: { page: sura?.startPage ?? 1 } });
  },
});
