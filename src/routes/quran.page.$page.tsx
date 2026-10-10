import { createFileRoute, redirect } from "@tanstack/react-router";
import { clampMushafPage } from "@/lib/printed-mushaf";

/** Legacy dynamic Quran display is hidden; only printed images may be read. */
export const Route = createFileRoute("/quran/page/$page")({
  beforeLoad: ({ params }) => {
    const parsed = Number(params.page);
    throw redirect({
      to: "/quran/printed",
      search: { page: Number.isInteger(parsed) ? clampMushafPage(parsed) : 1 },
    });
  },
});
