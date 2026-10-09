import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpLeft, BookMarked, BookOpen, Feather } from "lucide-react";
import logo from "@/assets/rihab-logo-clean.png";
import heroNabawi from "@/assets/green-dome.jpg";
import shaykhSaleh from "@/assets/shaykh-saleh-cutout.png";

export function HomeHero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="hero-sequence relative isolate min-h-[min(610px,calc(100svh-8rem))] overflow-hidden border-b border-gold/25 bg-velvet sm:min-h-[650px]" aria-labelledby="home-title">
      <div className="hero-scene absolute inset-0" aria-hidden="true">
        <img
          src={heroNabawi}
          alt=""
          width={1920}
          height={1080}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-[66%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-velvet/65 via-velvet/30 to-velvet/95 sm:bg-gradient-to-l sm:from-velvet/90 sm:via-velvet/45 sm:to-velvet/25" />
      </div>

      <div className="hero-geometry" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-intro absolute inset-0 z-30 grid place-items-center bg-velvet px-5 text-center" aria-hidden="true">
        <div>
          <div className="hero-logo-draw relative mx-auto w-36 sm:w-48">
            <img src={logo} alt="" width={320} height={380} className="h-auto w-full object-contain" />
            <span
              className="hero-logo-sheen absolute inset-0"
              style={{
                WebkitMaskImage: `url(${logo})`,
                maskImage: `url(${logo})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          </div>
          <p className="hero-typewriter mt-4 overflow-hidden whitespace-nowrap font-display text-lg text-gold-soft sm:text-2xl">
            الجمعية الخليلية الإسلامية
          </p>
        </div>
      </div>

      <motion.img
        src={shaykhSaleh}
        alt="فضيلة الشيخ صالح أبو خليل"
        width={848}
        height={1264}
        initial={reducedMotion ? false : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.85, duration: 0.65 }}
        className="absolute bottom-0 left-[-9%] z-10 h-[48%] w-auto max-w-[55%] object-contain object-bottom drop-shadow-2xl [mask-image:linear-gradient(to_right,black_80%,transparent_100%)] sm:left-[1%] sm:h-[88%] sm:max-w-[48%]"
      />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.7, duration: 0.65 }}
        className="relative z-20 mx-auto flex min-h-[min(610px,calc(100svh-8rem))] max-w-6xl flex-col px-5 pb-5 pt-8 sm:min-h-[650px] sm:justify-center sm:px-8 sm:py-12"
      >
        <div className="w-full sm:mr-0 sm:ml-auto sm:w-[57%]">
          <div className="mb-4 sm:mb-7">
            <span className="hero-callout">✦ رحاب الخليلية · نور المعرفة وهدوء القراءة</span>
          </div>
          <h1 id="home-title" className="max-w-xl font-display text-[clamp(1.7rem,7vw,2.4rem)] font-bold leading-[1.5] text-foreground sm:text-5xl sm:leading-[1.45]">
            الجمعية الخليلية <span className="text-gold-soft">الإسلامية</span>
          </h1>
          <p className="mt-2 max-w-lg border-r-2 border-gold pr-3 font-body text-sm leading-7 text-foreground/90 sm:mt-5 sm:text-lg sm:leading-9">
            تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل
          </p>
          <p className="mt-2 max-w-md font-body text-sm leading-7 text-foreground/85 sm:mt-5 sm:text-base sm:leading-8">
            المصحف الشريف، وكتب الطريق الخليلي، والأوراد والذكر.
          </p>
          <div className="hero-links mt-5 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
            <Link to="/quran" className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition-transform active:translate-y-0.5 sm:min-h-12 sm:px-5 sm:text-base">
              <BookMarked className="h-4 w-4" /> المصحف الشريف <ArrowUpLeft className="h-4 w-4" />
            </Link>
            <Link to="/library" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-gold/65 bg-velvet/70 px-4 py-2 font-body text-sm font-semibold text-foreground backdrop-blur-sm sm:min-h-12 sm:px-5 sm:text-base">
              <BookOpen className="h-4 w-4" /> المكتبة
            </Link>
            <Link to="/shaykh" className="inline-flex min-h-11 items-center gap-2 border-b border-gold/70 px-2 py-2 font-body text-sm font-semibold text-gold-soft sm:text-base">
              <Feather className="h-4 w-4" /> نبذة عن الشيخ
            </Link>
          </div>
          <div className="mt-7 flex items-center gap-3 text-[11px] font-body text-[#e8c788]/80 sm:mt-10" aria-label="أقسام رحاب الخليلية">
            <span>المصحف الشريف</span>
            <span aria-hidden="true">✦</span>
            <span>المكتبة</span>
            <span aria-hidden="true">✦</span>
            <span>الأوراد</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}