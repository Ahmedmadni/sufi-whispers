import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getBook } from "@/data/books";

const PdfBookViewer = lazy(() => import("@/components/PdfBookViewer"));

export const Route = createFileRoute("/books/$bookId")({
  head: ({ params }) => {
    const book = getBook(params.bookId);
    const title = book ? `${book.title} — مكتبة النفحات` : "كتاب — مكتبة النفحات";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: book?.subtitle ?? "قراءة الكتاب في مكتبة النفحات",
        },
        { name: "theme-color", content: "#0d1a14" },
      ],
    };
  },
  loader: ({ params }) => {
    const book = getBook(params.bookId);
    if (!book) throw notFound();
    return { book };
  },
  component: BookPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
        <p className="font-display text-gold-soft">لم يُعثر على الكتاب</p>
        <Link to="/" className="text-sm text-gold-soft underline">
          العودة إلى المكتبة
        </Link>
      </div>
    </div>
  ),
});

function ViewerSkeleton() {
  return (
    <div className="glass rounded-2xl p-2 flex justify-center items-center min-h-[70vh] bg-velvet/30">
      <Skeleton className="w-full max-w-[800px] aspect-[1/1.4] rounded-lg" />
    </div>
  );
}

function BookPage() {
  const { book } = Route.useLoaderData();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-gold-soft/80 hover:text-gold-soft font-body"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            المكتبة
          </Link>
          <span className="font-display text-gold-soft text-sm truncate">
            {book.title}
          </span>
        </div>
        {mounted ? (
          <Suspense fallback={<ViewerSkeleton />}>
            <PdfBookViewer pdfUrl={book.pdfUrl} bookId={book.id} />
          </Suspense>
        ) : (
          <ViewerSkeleton />
        )}
      </section>
    </div>
  );
}
