import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Skeleton } from "@/components/ui/skeleton";

const PdfBookViewer = lazy(() => import("@/components/PdfBookViewer"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "جامع النفحات في مدح سيد السادات ﷺ" },
      {
        name: "description",
        content:
          "النسخة الرقمية الكاملة من كتاب جامع النفحات في مدح سيد السادات ﷺ — تصفّح على الهاتف.",
      },
      { name: "theme-color", content: "#0d1a14" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: BookPage,
});

function ViewerSkeleton() {
  return (
    <div className="glass rounded-2xl p-2 flex justify-center items-center min-h-[70vh] bg-velvet/30">
      <Skeleton className="w-full max-w-[800px] aspect-[1/1.4] rounded-lg" />
    </div>
  );
}

function BookPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {mounted ? (
          <Suspense fallback={<ViewerSkeleton />}>
            <PdfBookViewer />
          </Suspense>
        ) : (
          <ViewerSkeleton />
        )}
      </section>
    </div>
  );
}
