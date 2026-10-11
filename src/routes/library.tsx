import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X, ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { books } from "@/data/books";
import { BookCover } from "@/components/BookCover";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة الخليلية — رحاب الخليلية" },
      { name: "description", content: "كتب الطريق الخليلي الثمانية، للقراءة والبحث داخل التطبيق دون اتصال." },
      { property: "og:title", content: "المكتبة الخليلية — رحاب الخليلية" },
      { property: "og:locale", content: "ar_AR" },
    ],
    links: [{ rel: "canonical", href: "https://sufi-whispers.lovable.app/library" }],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("ar");
  const results = normalized
    ? books.filter(book => [book.title, book.subtitle ?? "", book.description]
        .join(" ").toLocaleLowerCase("ar").includes(normalized))
    : books;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-24 pt-5 sm:px-6 sm:pt-10">
        <header className="mx-auto mb-5 max-w-lg text-center sm:mb-8">
          <div className="library-islamic-frame relative mx-auto px-5 py-4 sm:py-6">
            <h1 className="font-display text-xl leading-relaxed text-gold-soft sm:text-3xl">
              المكتبة الخليلية
            </h1>
          </div>
        </header>
        <button type="button" onClick={() => { setQuery(""); setSearchOpen(true); }}
          className="mx-auto mb-6 flex min-h-12 w-full max-w-xl items-center gap-3 rounded-xl border border-gold/30 bg-background/65 px-4 text-right text-sm text-muted-foreground shadow-sm transition-colors hover:border-gold/60 sm:mb-9"
          aria-label="البحث في الكتب">
          <Search className="h-5 w-5 text-gold-soft" />
          <span>ابحث عن كتاب...</span>
        </button>

        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8" aria-label="الكتب المتوفرة">
          {books.map(book => (
            <Link key={book.id} to="/books/$bookId" params={{ bookId: book.id }}
              className="book-card group flex min-w-0 flex-col items-center text-center">
              <div className="book-art relative aspect-[3/4] w-full">
                <BookCover src={book.cover} alt={book.title} sizes="(max-width: 640px) 47vw, 30vw" />
                <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-gold/25" />
              </div>
              <h2 className="mt-2.5 line-clamp-2 w-full text-balance px-1 font-display text-sm leading-relaxed text-gold-soft sm:text-base">
                {book.title}
              </h2>
            </Link>
          ))}
        </div>
      </main>

      {searchOpen && (
        <div role="dialog" aria-modal="true" aria-label="بحث المكتبة"
          className="fixed inset-0 z-[100] flex flex-col bg-background/98 px-3 pb-5 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 border-b border-gold/20 pb-3">
            <button type="button" onClick={() => setSearchOpen(false)}
              aria-label="إغلاق البحث" className="rounded-lg border border-gold/25 p-2.5 text-gold-soft">
              <X className="h-5 w-5" />
            </button>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-soft" />
              <input autoFocus type="search" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="ابحث في الكتب المتوفرة"
                aria-label="اسم الكتاب"
                className="h-12 w-full rounded-xl border border-gold/30 bg-background/70 pr-10 pl-3 text-sm text-foreground outline-none focus:border-gold/70" />
            </div>
          </div>
          <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto overscroll-contain pt-4">
            <p className="mb-3 px-2 text-xs text-muted-foreground">
              {normalized ? `نتائج البحث (${results.length})` : `الكتب المتوفرة (${results.length})`}
            </p>
            {results.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">لا توجد كتب مطابقة للبحث.</p>
            ) : (
              <ul className="divide-y divide-gold/15 rounded-xl border border-gold/20 bg-card/35">
                {results.map(book => (
                  <li key={book.id}>
                    <Link to="/books/$bookId" params={{ bookId: book.id }}
                      onClick={() => setSearchOpen(false)}
                      className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-gold/10">
                      <span className="min-w-0 font-body text-sm text-foreground">
                        <span className="block font-medium">{book.title}</span>
                        {book.subtitle && <small className="mt-1 block truncate text-xs text-muted-foreground">{book.subtitle}</small>}
                      </span>
                      <ChevronLeft className="h-4 w-4 shrink-0 text-gold-soft" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
