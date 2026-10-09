import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Facebook, Sparkles, Feather, BookMarked, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ResumeBar } from "@/components/ResumeBar";
import { DhikrCard } from "@/components/DhikrCard";
import { HomeHero } from "@/components/HomeHero";
import { BookCover } from "@/components/BookCover";

import { books } from "@/data/books";

const SurahVirtues = lazy(() =>
  import("@/components/SurahVirtues").then((m) => ({ default: m.SurahVirtues })),
);

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/alkhaleelih/";
const SHAYKH_FULL_NAME =
  "فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل";

const TITLE = "الجمعية الخليلية الإسلامية — رحاب الخليلية";
const DESCRIPTION =
  "الموقع الرسمي للجمعية الخليلية الإسلامية تحت لواء شيخها فضيلة العارف بالله سيدي الشيخ صالح أبو خليل: المصحف الشريف كاملاً، ومكتبة كتب الطريق الخليلي، وفضائل السور، ونبذة عن شيخ الطريق.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sufi-whispers.lovable.app/" },
      { property: "og:site_name", content: "الجمعية الخليلية الإسلامية" },
      { property: "og:locale", content: "ar_AR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "theme-color", content: "#0d1a14" },
    ],
    links: [{ rel: "canonical", href: "https://sufi-whispers.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "الجمعية الخليلية الإسلامية",
              alternateName: "رحاب الخليلية",
              url: "https://sufi-whispers.lovable.app/",
              description: DESCRIPTION,
              sameAs: [FACEBOOK_GROUP_URL],
              founder: { "@type": "Person", name: SHAYKH_FULL_NAME },
            },
            {
              "@type": "WebSite",
              name: "رحاب الخليلية",
              url: "https://sufi-whispers.lovable.app/",
              inLanguage: "ar",
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

const QUICK_LINKS = [
  {
    to: "/quran" as const,
    icon: BookMarked,
    title: "المصحف الشريف",
    text: "برواية حفص عن عاصم، بخطّ مجمع الملك فهد، مقسّمًا على صفحات المصحف.",
  },
  {
    to: "/library" as const,
    icon: BookOpen,
    title: "المكتبة",
    text: "كتب الطريق الخليلي كاملة للقراءة على الهاتف مع حفظ موضع القراءة.",
  },
  {
    to: "/shaykh" as const,
    icon: Feather,
    title: "نبذة عن الشيخ",
    text: "تعريف بشيخ الجمعية ومنهجه في التربية والسلوك وآثاره العلمية.",
  },
  {
    to: "/books/$bookId" as const,
    params: { bookId: "ward" },
    icon: Star,
    title: "الأوراد والأذكار",
    text: "ورد الاستغفار وأوراد الطريق مع تنقّل سريع بين الأبواب.",
  },
];

function HomePage() {
  const reducedMotion = useReducedMotion();
  const featured = books.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* ============ HERO ============ */}
      <HomeHero />

      {/* ============ RESUME ============ */}
      <ResumeBar />

      {/* ============ WIRD OF THE HOUR ============ */}
      <section className="mx-auto w-full max-w-5xl px-3 sm:px-6 pt-6" dir="rtl">
        <DhikrCard />
      </section>



      {/* ============ QUICK ACCESS ============ */}
      <section className="rihab-section w-full border-y border-gold/15 bg-secondary/15 py-8 sm:py-12" dir="rtl">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-x-5 gap-y-6 px-4 sm:grid-cols-4 sm:gap-7 sm:px-6">
          {QUICK_LINKS.map(({ to, params, icon: Icon, title, text }) => (
            <Link
              key={title}
              to={to}
              {...(params ? { params } : {})}
              className="group rounded-xl border border-gold/15 bg-background/25 p-4 text-right transition-[border-color,background-color,transform] hover:border-gold/50 hover:bg-gold/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span className="inline-flex items-center gap-2 text-gold-soft font-display text-sm sm:text-lg">
                <Icon className="w-4 h-4" />
                {title}
              </span>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-body leading-6 sm:leading-7">
                {text}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ FEATURED BOOKS ============ */}
      <section className="rihab-section relative mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-16" dir="rtl">
        <div className="text-right mb-7 sm:mb-10">
          <div className="flex items-center gap-2 mb-2 text-gold-soft">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-body tracking-widest">من نفحات المكتبة</span>
          </div>
          <h2 className="font-display text-xl sm:text-3xl text-gradient-gold leading-[1.6]">
            كتبٌ مختارة
          </h2>
          <div className="rihab-ornament mt-3 justify-start" aria-hidden="true">✦</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((b, i) => (
            <motion.div
              key={b.id}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 3) * 0.06 }}
            >
              <Link
                to="/books/$bookId"
                params={{ bookId: b.id }}
                className="book-card group flex flex-col items-center text-center"
              >
                <div className="book-art relative w-full aspect-[3/4] group-active:scale-[0.98]">
                  <BookCover
                    src={b.cover}
                    alt={b.title}
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 23vw, 230px"
                  />
                   <div className="absolute inset-0 ring-1 ring-inset ring-gold/30 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-velvet/85 to-transparent pointer-events-none" />
                </div>
                <h3 className="book-card__label mt-3 font-display text-gold-soft text-sm sm:text-base leading-relaxed line-clamp-2">
                  {b.title}
                </h3>
                {b.subtitle && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5 line-clamp-2">
                    {b.subtitle}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/library"
            className="inline-flex items-center gap-2 rounded-lg border border-gold/25 px-5 py-2 text-sm font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>تصفّح جميع الكتب</span>
          </Link>
        </div>
      </section>

      {/* ============ SURAH VIRTUES ============ */}
      <Suspense fallback={<div className="h-40" />}>
        <SurahVirtues />
      </Suspense>

      {/* ============ SHAYKH ============ */}
      <section id="shaykh" dir="rtl" className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-10 sm:py-16">
        <div className="relative border-t border-gold/35 py-6 sm:py-10">

          <div className="relative flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold-soft" />
            <h2 className="font-display text-gold-soft text-lg sm:text-2xl leading-[1.6]">
              نبذة عن شيخ الطريق
            </h2>
          </div>

          <div className="relative space-y-3 text-sm sm:text-base leading-8 font-body text-foreground/90 text-right">
            <p>
              شيخ الجمعية الخليلية الإسلامية:{" "}
              <span className="text-gold-soft">{SHAYKH_FULL_NAME}</span>؛ جمع بين
              علوم الشريعة وأذواق الحقيقة، وسار بالمريدين على منهاج السلف من أهل
              الله؛ ذوقاً ومقاماً، وأدباً وحالاً.
            </p>
            <p>
              مجالسه نفحاتٌ من مدح سيد السادات ﷺ، وتربيةٌ على تقوى الله، ومحبةٌ
              خالصة لآل البيت الكرام، وحرصٌ على إحياء السنن، وردُّ القلوب إلى حضرة
              مولاها. ومن آثار الطريق المباركة:{" "}
              <span className="text-gold-soft">جامع النفحات</span>،
              و<span className="text-gold-soft">السيرة الخليلية</span>،
              و<span className="text-gold-soft">المناقب الخليلية</span>،
              و<span className="text-gold-soft">المناهل الخليلية</span>، وغيرها ممّا
              يجده القارئ في هذه المكتبة.
            </p>
          </div>

          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/shaykh"
              className="inline-flex items-center gap-2 rounded-sm border border-gold/40 px-4 py-2 text-sm font-body text-gold-soft hover:border-gold transition-colors"
            >
              <Feather className="w-4 h-4" />
              <span>النبذة الكاملة</span>
            </Link>
            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gold/25 px-4 py-2 text-sm font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
            >
              <Facebook className="w-4 h-4" />
              <span>مجموعة الجمعية على فيسبوك</span>
            </a>
            <Link
              to="/books/$bookId"
              params={{ bookId: "sirah" }}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/25 px-4 py-2 text-sm font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
            >
              اقرأ السيرة الخليلية
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
