import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { books, CATEGORY_LABELS, type Book, type BookCategory } from "@/data/books";
import { BookCover } from "@/components/BookCover";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة — رحاب الخليلية" },
      {
        name: "description",
        content:
          "تصفّح كتب الطريق الخليلي: جامع النفحات، ورد الاستغفار، السيرة الخليلية، كشف الغطاء، النفحات الخليلية، المربّي، المناقب الخليلية والمناهل الخليلية — مكتبة رقمية صوفية للقراءة والبحث.",
      },
      { property: "og:title", content: "المكتبة — رحاب الخليلية" },
      {
        property: "og:description",
        content:
          "تصفّح كتب الطريق الخليلي: جامع النفحات، ورد الاستغفار، السيرة الخليلية، كشف الغطاء، النفحات الخليلية، المربّي، المناقب والمناهل — مكتبة رقمية صوفية.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sufi-whispers.lovable.app/library" },
      { property: "og:site_name", content: "رحاب الخليلية" },
      { property: "og:locale", content: "ar_AR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "المكتبة — رحاب الخليلية" },
      {
        name: "twitter:description",
        content:
          "تصفّح كتب الطريق الخليلي: جامع النفحات، ورد الاستغفار، السيرة الخليلية، كشف الغطاء، النفحات الخليلية، المربّي، المناقب والمناهل — مكتبة رقمية صوفية.",
      },
      { name: "theme-color", content: "#0d1a14" },
    ],
    links: [{ rel: "canonical", href: "https://sufi-whispers.lovable.app/library" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "المكتبة — رحاب الخليلية",
          url: "https://sufi-whispers.lovable.app/library",
          description:
            "تصفّح كتب الطريق الخليلي: جامع النفحات، ورد الاستغفار، السيرة الخليلية، كشف الغطاء، النفحات الخليلية، المربّي، المناقب الخليلية والمناهل الخليلية.",
          inLanguage: "ar",
        }),
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<BookCategory | "all">("all");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: books.length };
    for (const b of books) counts[b.category] = (counts[b.category] ?? 0) + 1;
    return counts;
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredBooks = books.filter((b) => {
    if (activeCategory !== "all" && b.category !== activeCategory) return false;
    if (!normalizedQuery) return true;
    const haystack = [b.title, b.subtitle ?? "", CATEGORY_LABELS[b.category]]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const categoryChips: Array<{ key: BookCategory | "all"; label: string }> = [
    { key: "all", label: "الكل" },
    ...(Object.keys(CATEGORY_LABELS) as BookCategory[]).map((k) => ({
      key: k,
      label: CATEGORY_LABELS[k],
    })),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <header className="library-banner mb-6 sm:mb-10 text-center">
          <p className="rihab-eyebrow justify-center">رحاب الخليلية · مكتبة التراث</p>
          <h1 className="relative mt-3 font-display text-[#e8c788] text-2xl sm:text-4xl leading-relaxed">
            المكتبة الخليلية
          </h1>
          <div className="rihab-ornament my-3" aria-hidden="true">✦</div>
          <p className="relative mx-auto max-w-xl text-sm sm:text-base leading-7 text-[#f4ead7]/85 font-body">
            تصفّح {books.length} من مؤلفات ومدائح وأوراد الطريق الخليلي، واختر كتابك لتواصل القراءة.
          </p>
        </header>

        <div className="relative max-w-md mx-auto mb-6 sm:mb-8">
          <label htmlFor="book-search" className="sr-only">
            ابحث في عناوين الكتب
          </label>
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/70" size={18} />
          <input
            id="book-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في عناوين الكتب والقصائد..."
            dir="rtl"
            className="w-full rounded-lg border border-gold/30 bg-background/60 py-2.5 pr-10 pl-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold-soft transition-colors"
              aria-label="مسح البحث"
            >
              ×
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="تصفية الكتب حسب التصنيف"
          dir="rtl"
          className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8"
        >
          {categoryChips.map((c) => {
            const isActive = activeCategory === c.key;
            const count = categoryCounts[c.key] ?? 0;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveCategory(c.key)}
                className={`library-filter px-3 py-1.5 rounded-full text-xs sm:text-sm font-body border transition-all ${
                  isActive
                    ? "bg-gold/20 border-gold/60 text-gold-soft shadow-sm"
                    : "bg-background/40 border-gold/20 text-muted-foreground hover:border-gold/40 hover:text-gold-soft"
                }`}
              >
                <span>{c.label}</span>
                <span className="mr-1.5 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {activeCategory !== "all" || query ? (
          <p className="text-center text-xs text-muted-foreground mb-4">
            {filteredBooks.length} من {books.length} كتاب
          </p>
        ) : null}

        {filteredBooks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">
              لا توجد نتائج مطابقة{query ? ` لـ «${query}»` : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              className="mt-3 text-gold-soft hover:text-gold text-sm underline underline-offset-4"
            >
              عرض جميع الكتب
            </button>
          </div>
        ) : (
          <Dialog
            open={!!selectedBook}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedBook(null);
                window.requestAnimationFrame(() => {
                  triggerRef.current?.focus();
                });
              }
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {filteredBooks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setSelectedBook(b);
                  }}
                  className="book-card group flex flex-col items-center text-center"
                >
                  <div className="book-art relative w-full aspect-[3/4] group-active:scale-[0.98]">
                    <BookCover
                      src={b.cover}
                      alt={b.title}
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-gold/30 rounded-lg pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-velvet/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="px-3 py-1 rounded-full glass-gold text-[11px] text-gold-soft font-body">
                        معاينة سريعة
                      </span>
                    </div>
                  </div>
                  <h2 className="book-card__label mt-3 w-full px-1 font-display text-gold-soft text-sm sm:text-base leading-relaxed text-balance line-clamp-2 break-words">
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5 line-clamp-2 break-words">
                      {b.subtitle}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <DialogContent
              overlayClassName="bg-velvet/85 backdrop-blur-sm"
              hideClose
              aria-modal="true"
              className="glass rounded-2xl border-gold/30 p-4 sm:p-6 shadow-2xl overflow-hidden data-[state=closed]:hidden"
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                triggerRef.current?.focus();
              }}
            >
              {selectedBook && (
                <>
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="absolute top-3 left-3 sm:top-4 sm:left-4 p-1.5 rounded-full glass text-gold-soft hover:text-gold hover:bg-gold/10 transition-colors"
                      aria-label="إغلاق المعاينة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </DialogClose>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
                    <div className="book-art relative w-32 sm:w-40 aspect-[3/4] shrink-0">
                      <BookCover
                        src={selectedBook.cover}
                        alt={selectedBook.title}
                        priority
                        sizes="160px"
                      />
                      <div className="absolute inset-0 ring-1 ring-inset ring-gold/30 rounded-lg pointer-events-none" />
                    </div>

                    <div className="flex-1 text-center sm:text-right min-w-0" dir="rtl">
                      <span className="inline-block px-2.5 py-1 rounded-full glass-gold text-[10px] text-gold-soft font-body mb-2">
                        {CATEGORY_LABELS[selectedBook.category]}
                      </span>
                      <DialogTitle asChild>
                        <h2 className="font-display text-gold-soft text-lg sm:text-xl leading-tight mb-1">
                          {selectedBook.title}
                        </h2>
                      </DialogTitle>
                      {selectedBook.subtitle && (
                        <p className="text-xs text-muted-foreground font-body mb-3">
                          {selectedBook.subtitle}
                        </p>
                      )}
                      <DialogDescription asChild>
                        <p className="text-xs sm:text-sm text-foreground/80 font-body leading-relaxed line-clamp-4 sm:line-clamp-5">
                          {selectedBook.description}
                        </p>
                      </DialogDescription>
                    </div>
                  </div>

                  <div
                    className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3"
                    dir="rtl"
                  >
                    <Link
                      to="/books/$bookId"
                      params={{ bookId: selectedBook.id }}
                      onClick={() => setSelectedBook(null)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-body text-velvet bg-gold-soft hover:bg-gold transition-colors shadow-lg shadow-gold/20"
                    >
                      ابدأ القراءة
                    </Link>
                    <Link
                      to="/books/$bookId"
                      params={{ bookId: selectedBook.id }}
                      onClick={() => setSelectedBook(null)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-body text-gold-soft glass hover:bg-gold/10 transition-colors"
                    >
                      صفحة التفاصيل
                    </Link>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
