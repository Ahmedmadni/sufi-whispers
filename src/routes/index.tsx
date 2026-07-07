import { createFileRoute, Link } from "@tanstack/react-router";
import { Facebook, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { books } from "@/data/books";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/share/p/1c2E8HCajb/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مكتبة النفحات — كتب في مدح سيد السادات ﷺ" },
      {
        name: "description",
        content:
          "مكتبة رقمية تضم كتاب جامع النفحات، الوِرد الطولي، والسيرة الخليلية — تصفّح على الهاتف.",
      },
      { name: "theme-color", content: "#0d1a14" },
    ],
    links: [{ rel: "canonical", href: "/" }],
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

        <section
          id="shaykh"
          dir="rtl"
          className="mt-12 sm:mt-16 glass rounded-2xl p-5 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold-soft" />
            <h2 className="font-display text-gold-soft text-lg sm:text-2xl">
              نبذة عن شيخ الطريق
            </h2>
          </div>

          <div className="relative space-y-3 text-sm sm:text-base leading-relaxed font-body text-foreground/90 text-right">
            <p>
              سيدي العارف بالله الشيخ <span className="text-gold-soft">محمد أبو خليل</span>{" "}
              قدّس الله سرّه، من أعلام الطريق الخليلي وأئمة السلوك والتربية في زمانه،
              جمع بين علوم الشريعة وأسرار الحقيقة، وسار بالمريدين على منهاج السلف من
              أهل الله؛ ذوقاً ومقاماً، وأدباً وحالاً.
            </p>
            <p>
              كانت مجالسه نفحاتٍ من مدح سيد السادات ﷺ، وتربيةً على تقوى الله، ومحبةً
              خالصة لآل البيت الكرام، وحرصاً على إحياء السنن، وردّ القلوب إلى حضرة
              مولاها. ومن آثاره المباركة: <span className="text-gold-soft">جامع النفحات</span>،
              و<span className="text-gold-soft">السيرة الخليلية</span>،
              و<span className="text-gold-soft">المناقب الخليلية</span>،
              و<span className="text-gold-soft">المناهل الخليلية</span>، وغيرها ممّا
              يجده القارئ في هذه المكتبة.
            </p>
          </div>

          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg glass-gold px-4 py-2 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
            >
              <Facebook className="w-4 h-4" />
              <span>مجموعة الطريق الخليلي على فيسبوك</span>
            </a>
            <Link
              to="/books/$bookId"
              params={{ bookId: "sirah" }}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/25 px-4 py-2 text-sm font-body text-foreground/80 hover:text-gold-soft hover:border-gold/50 transition-colors"
            >
              اقرأ السيرة الخليلية
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
