import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { books } from "@/data/books";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة — مكتبة النفحات" },
      {
        name: "description",
        content:
          "مكتبة رقمية تضم كتب الطريق الخليلي: جامع النفحات، الوِرد الطولي، السيرة الخليلية، المناقب والمناهل — تصفّح واقرأ على الهاتف.",
      },
      { property: "og:title", content: "المكتبة — مكتبة النفحات" },
      {
        property: "og:description",
        content: "تصفّح كتب الطريق الخليلي واقرأها في تجربة صوفية هادئة.",
      },
      { name: "theme-color", content: "#0d1a14" },
    ],
    links: [{ rel: "canonical", href: "/library" }],
  }),
  component: LibraryPage,
});

function LibraryPage() {
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {books.map((b) => (
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
      </section>
    </div>
  );
}
