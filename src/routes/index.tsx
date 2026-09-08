import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Facebook, Sparkles, Moon, Feather, BookMarked, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Decorations";
import { Particles } from "@/components/Particles";
import { ResumeBar } from "@/components/ResumeBar";
import { DhikrCard } from "@/components/DhikrCard";


import { books } from "@/data/books";
import heroNabawi from "@/assets/hero-nabawi.jpg";
import logo from "@/assets/rihab-logo.png.asset.json";

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
  const featured = books.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroNabawi}
            alt="المسجد النبوي الشريف"
            width={1920}
            height={1200}
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-velvet/40 via-velvet/60 to-velvet" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--velvet)_85%)]" />
        </div>

        <Particles count={16} />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-20 pb-16 sm:pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full glass-gold px-4 py-1.5 text-[11px] sm:text-xs font-body text-gold-soft"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>على منهاج السلف من أهل الله</span>
          </motion.div>

          <div className="relative mx-auto max-w-2xl">
            {/* Mihrab arch */}
            <svg
              viewBox="0 0 400 480"
              className="absolute inset-x-0 -top-4 mx-auto w-full h-auto text-gold/40 pointer-events-none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="archGold" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <path
                d="M40 470 L40 200 Q40 40 200 40 Q360 40 360 200 L360 470"
                fill="none"
                stroke="url(#archGold)"
                strokeWidth="1.2"
              />
              <circle cx="200" cy="40" r="4" fill="currentColor" />
            </svg>

            <div className="relative py-7 sm:py-11 px-4 sm:px-8">
              <p className="font-quran text-gold-soft/90 text-sm sm:text-base mb-3">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <img
                src={logo.url}
                alt="شعار الجمعية الخليلية الإسلامية"
                width={320}
                height={380}
                decoding="async"
                className="mx-auto w-36 sm:w-52 h-auto object-contain drop-shadow-[0_6px_30px_rgba(200,160,80,0.35)]"
              />
              <h1 className="mt-4 font-display text-2xl sm:text-4xl lg:text-5xl leading-[1.5] text-gradient-gold drop-shadow-[0_2px_20px_rgba(200,160,80,0.35)]">
                الجمعية الخليلية الإسلامية
              </h1>
              <p className="mt-2 font-display text-gold-soft/85 text-sm sm:text-lg leading-8">
                تحت لواء شيخها {SHAYKH_FULL_NAME}
              </p>

              <div className="my-5 flex items-center justify-center">
                <Ornament className="w-36 sm:w-52 text-gold" />
              </div>
              <p className="mx-auto max-w-xl text-sm sm:text-base leading-8 font-body text-foreground/85">
                منصّةٌ رقميّة تجمع المصحف الشريف كاملاً، وكتب الطريق الخليلي
                وأوراده، وفضائل السُّور — للقراءة على الهاتف في أي وقت.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/quran"
                  className="inline-flex items-center gap-2 rounded-lg glass-gold px-5 py-2.5 text-sm sm:text-base font-body text-gold-soft glow-gold hover:scale-105 transition-transform"
                >
                  <BookMarked className="w-4 h-4" />
                  <span>المصحف الشريف</span>
                </Link>
                <Link
                  to="/library"
                  className="inline-flex items-center gap-2 rounded-lg border border-gold/30 px-5 py-2.5 text-sm sm:text-base font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>المكتبة</span>
                </Link>
                <Link
                  to="/shaykh"
                  className="inline-flex items-center gap-2 rounded-lg border border-gold/20 px-4 py-2.5 text-sm font-body text-foreground/75 hover:text-gold-soft hover:border-gold/60 transition-colors"
                >
                  <Feather className="w-4 h-4" />
                  <span>نبذة عن الشيخ</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-velvet pointer-events-none" />
      </section>

      {/* ============ RESUME ============ */}
      <ResumeBar />

      {/* ============ WIRD OF THE HOUR ============ */}
      <section className="mx-auto w-full max-w-5xl px-3 sm:px-6 pt-6" dir="rtl">
        <DhikrCard />
      </section>



      {/* ============ QUICK ACCESS ============ */}
      <section className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-8 sm:py-12" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {QUICK_LINKS.map(({ to, params, icon: Icon, title, text }) => (
            <Link
              key={title}
              to={to}
              {...(params ? { params } : {})}
              className="glass rounded-2xl p-4 sm:p-5 text-right hover:border-gold/40 transition-colors"
            >
              <span className="inline-flex items-center gap-2 text-gold-soft font-display text-base sm:text-lg">
                <Icon className="w-4 h-4" />
                {title}
              </span>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-body leading-7">
                {text}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ FEATURED BOOKS ============ */}
      <section className="relative mx-auto w-full max-w-5xl px-3 sm:px-6 pb-10 sm:pb-16" dir="rtl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2 text-gold-soft">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-body tracking-widest">من نفحات المكتبة</span>
          </div>
          <h2 className="font-display text-xl sm:text-3xl text-gradient-gold leading-[1.6]">
            كتبٌ مختارة
          </h2>
          <div className="mt-3 mx-auto ornament-divider w-2/3 max-w-sm" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 3) * 0.06 }}
            >
              <Link
                to="/books/$bookId"
                params={{ bookId: b.id }}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden glass-gold shadow-lg group-hover:shadow-2xl group-active:scale-[0.98] transition-all">
                  <img
                    src={b.cover}
                    alt={b.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-gold/30 rounded-lg pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-velvet/85 to-transparent pointer-events-none" />
                </div>
                <h3 className="mt-2.5 font-display text-gold-soft text-sm sm:text-base leading-tight line-clamp-2">
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
        <div className="relative glass rounded-2xl p-5 sm:p-10 overflow-hidden">
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-emerald-glow/15 blur-3xl pointer-events-none" />

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
              className="inline-flex items-center gap-2 rounded-lg glass-gold px-4 py-2 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
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
