import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Facebook, Sparkles, Moon, Feather } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Ornament } from "@/components/Decorations";
import { Particles } from "@/components/Particles";
import { books } from "@/data/books";
import heroNabawi from "@/assets/hero-nabawi.jpg";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/share/p/1c2E8HCajb/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مكتبة النفحات — نفحاتٌ من حضرة سيد السادات ﷺ" },
      {
        name: "description",
        content:
          "بوابة صوفية إلى الطريق الخليلي: مدائح، أوراد، سيرة، مناقب، ومناهل في المعارف والآداب — بروح المسجد النبوي الشريف.",
      },
      { property: "og:title", content: "مكتبة النفحات — نفحاتٌ من حضرة سيد السادات ﷺ" },
      {
        property: "og:description",
        content:
          "بوابة صوفية إلى الطريق الخليلي: مدائح، أوراد، سيرة، مناقب، ومناهل في المعارف والآداب — بروح المسجد النبوي الشريف.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sufi-whispers.lovable.app/" },
      { property: "og:site_name", content: "مكتبة النفحات" },
      { property: "og:locale", content: "ar_AR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "مكتبة النفحات — نفحاتٌ من حضرة سيد السادات ﷺ" },
      {
        name: "twitter:description",
        content:
          "بوابة صوفية إلى الطريق الخليلي: مدائح، أوراد، سيرة، مناقب، ومناهل في المعارف والآداب — بروح المسجد النبوي الشريف.",
      },
      { name: "theme-color", content: "#0d1a14" },
    ],
    links: [{ rel: "canonical", href: "https://sufi-whispers.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "مكتبة النفحات",
          url: "https://sufi-whispers.lovable.app/",
          description:
            "بوابة صوفية إلى الطريق الخليلي: مدائح، أوراد، سيرة، مناقب، ومناهل في المعارف والآداب — بروح المسجد النبوي الشريف.",
          inLanguage: "ar",
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = books.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* Hero image */}
        <div className="absolute inset-0">
          <img
            src={heroNabawi}
            alt="المسجد النبوي الشريف"
            width={1920}
            height={1200}
            className="w-full h-full object-cover object-center opacity-70"
          />
          {/* Cinematic gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-velvet/40 via-velvet/60 to-velvet" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--velvet)_85%)]" />
        </div>

        <Particles count={20} />

        {/* Ornamental arch frame */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-14 sm:pt-24 pb-20 sm:pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full glass-gold px-4 py-1.5 text-[11px] sm:text-xs font-body text-gold-soft"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>على منهاج السلف من أهل الله</span>
          </motion.div>

          {/* Arch container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.1 }}
            className="relative mx-auto max-w-2xl"
          >
            {/* Mihrab arch svg */}
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
              <path
                d="M60 470 L60 205 Q60 60 200 60 Q340 60 340 205 L340 470"
                fill="none"
                stroke="url(#archGold)"
                strokeWidth="0.6"
                opacity="0.6"
              />
              <circle cx="200" cy="40" r="4" fill="currentColor" />
            </svg>

            <div className="relative py-8 sm:py-12 px-4 sm:px-8">
              <p className="font-quran text-gold-soft/90 text-sm sm:text-base mb-3">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.35] text-gradient-gold drop-shadow-[0_2px_20px_rgba(200,160,80,0.35)]">
                مكتبة النفحات
              </h1>
              <p className="mt-3 font-display text-gold-soft/85 text-base sm:text-xl">
                نفحاتٌ من حضرة سيد السادات ﷺ
              </p>
              <div className="my-6 flex items-center justify-center">
                <Ornament className="w-40 sm:w-56 text-gold" />
              </div>
              <p className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed font-body text-foreground/85">
                بوّابة رقميّة صوفيّة إلى الطريق الخليلي؛ مدائحُ، وأورادٌ،
                وسيرةٌ ومناقبُ، ومناهلُ في المعارف والآداب — على هدي سيّد الأنام ﷺ
                ومنارة المدينة المنوّرة.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/library"
                  className="group inline-flex items-center gap-2 rounded-lg glass-gold px-5 py-2.5 text-sm sm:text-base font-body text-gold-soft glow-gold hover:scale-105 transition-transform"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ادخل المكتبة</span>
                </Link>
                <a
                  href="#shaykh"
                  className="inline-flex items-center gap-2 rounded-lg border border-gold/30 px-5 py-2.5 text-sm sm:text-base font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
                >
                  <Feather className="w-4 h-4" />
                  <span>نبذة عن شيخ الطريق</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-velvet pointer-events-none" />
      </section>

      {/* ============ FEATURED BOOKS ============ */}
      <section className="relative mx-auto w-full max-w-5xl px-3 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2 text-gold-soft">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-body tracking-widest">
              من نفحات المكتبة
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-gradient-gold">
            كتبٌ مختارة
          </h2>
          <div className="mt-3 mx-auto ornament-divider w-2/3 max-w-sm" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {featured.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
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

      {/* ============ SHAYKH ============ */}
      <section
        id="shaykh"
        dir="rtl"
        className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-10 sm:py-16"
      >
        <div className="relative glass rounded-2xl p-5 sm:p-10 overflow-hidden">
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-emerald-glow/15 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold-soft" />
            <h2 className="font-display text-gold-soft text-xl sm:text-2xl">
              نبذة عن شيخ الطريق
            </h2>
          </div>

          <div className="relative space-y-3 text-sm sm:text-base leading-relaxed font-body text-foreground/90 text-right">
            <p>
              سيدي العارف بالله الشيخ{" "}
              <span className="text-gold-soft">محمد أبو خليل</span> قدّس الله سرّه،
              من أعلام الطريق الخليلي وأئمة السلوك والتربية في زمانه، جمع بين علوم
              الشريعة وأسرار الحقيقة، وسار بالمريدين على منهاج السلف من أهل الله؛
              ذوقاً ومقاماً، وأدباً وحالاً.
            </p>
            <p>
              كانت مجالسه نفحاتٍ من مدح سيد السادات ﷺ، وتربيةً على تقوى الله،
              ومحبةً خالصة لآل البيت الكرام، وحرصاً على إحياء السنن، وردّ القلوب
              إلى حضرة مولاها. ومن آثاره المباركة:{" "}
              <span className="text-gold-soft">جامع النفحات</span>،
              و<span className="text-gold-soft">السيرة الخليلية</span>،
              و<span className="text-gold-soft">المناقب الخليلية</span>،
              و<span className="text-gold-soft">المناهل الخليلية</span>، وغيرها
              ممّا يجده القارئ في هذه المكتبة.
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
              className="inline-flex items-center gap-2 rounded-lg border border-gold/25 px-4 py-2 text-sm font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
            >
              اقرأ السيرة الخليلية
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="mt-auto border-t border-gold/15 py-6 text-center">
        <p className="text-[11px] sm:text-xs text-muted-foreground font-body">
          ﷺ اللهم صلِّ وسلم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين
        </p>
      </footer>
    </div>
  );
}
