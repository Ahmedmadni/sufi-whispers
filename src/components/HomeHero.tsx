import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookMarked, BookOpen, Feather } from "lucide-react";
import logo from "@/assets/rihab-logo.png.asset.json";
import heroNabawi from "@/assets/green-dome.jpg";
import shaykhSaleh from "@/assets/shaykh-saleh-cutout.png";

const SHAYKH_FULL_NAME =
  "فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل";

export function HomeHero() {
  return (
    <section className="hero-sequence relative isolate min-h-[calc(100svh-3.5rem)] overflow-hidden" aria-labelledby="home-title">
      <div className="hero-scene absolute inset-0" aria-hidden="true">
        <img
          src={heroNabawi}
          alt=""
          width={1920}
          height={1080}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-velvet/20 via-velvet/45 to-velvet" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--velvet)_100%)]" />
      </div>

      <div className="hero-intro absolute inset-0 z-30 grid place-items-center bg-velvet px-5 text-center" aria-hidden="true">
        <div>
          <div className="hero-logo-draw relative mx-auto w-44 sm:w-60">
            <img src={logo.url} alt="" width={320} height={380} className="h-auto w-full object-contain" />
            <span className="hero-logo-sheen absolute inset-0" />
          </div>
          <p className="hero-typewriter mt-5 overflow-hidden whitespace-nowrap font-display text-xl text-gold-soft sm:text-3xl">
            الجمعية الخليلية الإسلامية
          </p>
        </div>
      </div>

      <motion.img
        src={shaykhSaleh}
        alt="فضيلة الشيخ صالح أبو خليل"
        width={848}
        height={1264}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 4.7, duration: 1.15, ease: "easeOut" }}
        className="hero-shaykh absolute bottom-0 left-[-12%] z-10 h-[57%] w-auto max-w-[62%] object-contain object-bottom drop-shadow-2xl [mask-image:linear-gradient(to_right,black_78%,transparent_99%)] sm:left-[2%] sm:h-[78%] sm:max-w-[45%]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.9, duration: 0.9 }}
        className="relative z-20 mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-6xl items-start px-4 pb-24 pt-10 sm:items-center sm:px-8 sm:pb-20 sm:pt-12"
      >
        <div className="ml-auto w-full max-w-2xl text-center sm:w-[58%] sm:text-right">
          <p className="mb-3 font-quran text-base text-gold-soft sm:text-xl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <h1 id="home-title" className="font-display text-3xl font-bold leading-[1.55] text-gradient-gold sm:text-5xl lg:text-6xl">
            الجمعية الخليلية الإسلامية
          </h1>
          <p className="mt-3 font-display text-base font-semibold leading-8 text-foreground sm:text-xl">
            تحت لواء شيخها {SHAYKH_FULL_NAME}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-8 text-foreground/90 sm:mx-0 sm:text-lg sm:leading-9">
            رحابٌ تجمع المصحف الشريف، وكتب الطريق الخليلي، والأوراد والذكر؛ في تجربة قراءة واضحة وميسّرة.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Link to="/quran" className="inline-flex min-h-12 items-center gap-2 rounded-lg glass-gold px-5 py-3 font-body text-base font-semibold text-gold-soft">
              <BookMarked className="h-5 w-5" /> المصحف الشريف
            </Link>
            <Link to="/library" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-gold/40 bg-velvet/65 px-5 py-3 font-body text-base font-semibold text-foreground">
              <BookOpen className="h-5 w-5" /> المكتبة
            </Link>
            <Link to="/shaykh" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-gold/30 bg-velvet/65 px-5 py-3 font-body text-base font-semibold text-foreground">
              <Feather className="h-5 w-5" /> نبذة عن الشيخ
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}