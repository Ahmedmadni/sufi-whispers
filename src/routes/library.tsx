import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { books, CATEGORY_LABELS, type Book, type BookCategory } from "@/data/books";



export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة — مكتبة النفحات" },
      {
        name: "description",
        content:
          "تصفّح كتب الطريق الخليلي: جامع النفحات، ورد الاستغفار، السيرة الخليلية، كشف الغطاء، النفحات الخليلية، المربّي، المناقب الخليلية والمناهل الخليلية — مكتبة رقمية صوفية للقراءة والبحث.",
      },
      { property: "og:title", content: "المكتبة — مكتبة النفحات" },
      {
        property: "og:description",
        content:
          "تصفّح كتب الطريق الخليلي: جامع النفحات، ورد الاستغفار، السيرة الخليلية، كشف الغطاء، النفحات الخليلية، المربّي، المناقب والمناهل — مكتبة رقمية صوفية.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sufi-whispers.lovable.app/library" },
      { property: "og:site_name", content: "مكتبة النفحات" },
      { property: "og:locale", content: "ar_AR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "المكتبة — مكتبة النفحات" },
      {
        name: "twitter:description",
        content:
          "تصفّح كتب الطريق الخليلي: جامع النفحات، ورد الاستغفار، السيرة الخليلية، كشف الغطاء، النفحات الخليلية، المربّي، المناقب والمناهل — مكتبة رقمية صوفية.",
      },
      { name: "theme-color", content: "#0d1a14" },
    ],
    links: [
      { rel: "canonical", href: "https://sufi-whispers.lovable.app/library" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "المكتبة — مكتبة النفحات",
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

  useEffect(() => {
    if (!selectedBook) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedBook(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [selectedBook]);



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
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="font-display text-gold-soft text-2xl sm:text-3xl mb-2">
            المكتبة
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-body">
            اختر كتاباً للقراءة
          </p>
        </div>

        <div className="relative max-w-md mx-auto mb-6 sm:mb-8">
          <label htmlFor="book-search" className="sr-only">
            ابحث في عناوين الكتب
          </label>
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/70"
            size={18}
          />
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
          role="tablist"
          aria-label="تصنيفات الكتب"
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
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(c.key)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-body border transition-all ${
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {filteredBooks.map((b) => (
              <Link
                key={b.id}
                to="/books/$bookId"
                params={{ bookId: b.id }}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden glass-gold shadow-lg group-hover:shadow-2xl group-active:scale-[0.98] transition-all">
                  <img
                    src={b.cover}
                    alt={b.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-gold/30 rounded-lg pointer-events-none" />
                </div>
                <h2 className="mt-2.5 w-full px-1 font-display text-gold-soft text-sm sm:text-base leading-tight text-balance line-clamp-2 break-words">
                  {b.title}
                </h2>
                {b.subtitle && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5 line-clamp-2 break-words">
                    {b.subtitle}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
