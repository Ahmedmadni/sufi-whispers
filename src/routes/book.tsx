import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Skeleton } from "@/components/ui/skeleton";

const PdfBookViewer = lazy(() => import("@/components/PdfBookViewer"));

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "استعراض الكتاب — جامع النفحات" },
      {
        name: "description",
        content:
          "تصفّح كتاب جامع النفحات في مدح سيد السادات ﷺ صفحةً صفحةً مع البحث برقم الصفحة.",
      },
    ],
  }),
  component: BookPage,
});

function ViewerSkeleton() {
  return (
    <>
      <div className="glass rounded-2xl p-4 sm:p-5 mb-5 flex flex-wrap items-center gap-3 justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="glass rounded-2xl p-3 flex justify-center items-center min-h-[60vh] bg-velvet/30">
        <Skeleton className="w-full max-w-[800px] aspect-[1/1.4] rounded-lg" />
      </div>
    </>
  );
}

function BookPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-8">
          <div className="text-xs text-gold/80 font-body tracking-widest mb-2 uppercase">
            النسخة الرقمية الكاملة
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-gradient-gold">
            استعراض الكتاب
          </h1>
          <p className="mt-3 text-sm text-muted-foreground font-body">
            تصفّح الكتاب أو أدخل رقم الصفحة الظاهر في الفهرس للانتقال إليها مباشرة.
          </p>
        </header>

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
