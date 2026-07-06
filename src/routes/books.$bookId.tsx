import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getBook, type Book } from "@/data/books";

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

function BookPreview({ book }: { book: Book }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-[70vh] bg-velvet/30 animate-fade-in">
      <div className="relative w-40 sm:w-56 aspect-[3/4] rounded-lg overflow-hidden glass-gold shadow-2xl mb-5">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-gold/30 rounded-lg pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-velvet/40 to-transparent pointer-events-none" />
      </div>
      <h1 className="font-display text-gold-soft text-lg sm:text-2xl text-center leading-tight px-2">
        {book.title}
      </h1>
      {book.subtitle && (
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-body text-center max-w-md px-2">
          {book.subtitle}
        </p>
      )}
      <div className="mt-6 flex items-center gap-2 text-[11px] sm:text-xs text-gold-soft/70 font-body">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-soft/70 animate-pulse" />
        <span>جارٍ تحميل الكتاب…</span>
      </div>
    </div>
  );
}

function BookPage() {
  const { book } = Route.useLoaderData();
  const [mounted, setMounted] = useState(false);
  // Delay mounting the heavy PDF viewer for one frame so the preview
  // paints instantly with the cover and title.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

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
          <Suspense fallback={<BookPreview book={book} />}>
            <PdfBookViewer pdfUrl={book.pdfUrl} bookId={book.id} />
          </Suspense>
        ) : (
          <BookPreview book={book} />
        )}
      </section>
    </div>
  );
}
