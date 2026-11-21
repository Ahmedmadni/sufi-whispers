import { motion, useReducedMotion } from "framer-motion";
import logo from "@/assets/rihab-logo-clean.png";
import heroNabawi from "@/assets/green-dome.jpg";
import shaykhSaleh from "@/assets/shaykh-saleh-cutout.png";
import approvedSceneImage from "@/assets/rihab-approved-full-mobile-poster.webp";

export function HomeHero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="hero-sequence hero-sequence--mandate hero-sequence--approved-mobile relative isolate min-h-[min(610px,calc(100svh-8rem))] overflow-hidden border-b border-gold/25 bg-velvet sm:min-h-[650px]" aria-labelledby="home-title">
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
        <div className="absolute inset-0 bg-gradient-to-b from-velvet/80 via-velvet/55 to-velvet/95 sm:bg-gradient-to-l sm:from-velvet/95 sm:via-velvet/70 sm:to-velvet/45" />
      </div>

      {/* The exact approved full poster includes the corrected khāʾ dot
          baked into its lossless WebP pixels; no overlay or duplicate text. */}
      <img
        src={approvedSceneImage}
        alt="تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل"
        width={941}
        height={1672}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="hero-approved-scene"
      />
      {/* The approved poster stays intact in portrait. A secondary *native-only*
          landscape caption keeps the exact inscription legible beside the
          original image when a phone or tablet rotates to a short viewport. */}
      <div className="hero-landscape-caption" aria-hidden="true" dir="rtl">
        <span className="hero-landscape-caption__overline">تحت لواء فضيلة العارف بالله</span>
        <span className="hero-landscape-caption__name">سيدي الشيخ صالح أحمد الشافعي</span>
        <span className="hero-landscape-caption__line">محمد محمد أبو خليل</span>
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
            رحاب الخليلية
          </p>
        </div>
      </div>

      <div className="hero-heading absolute inset-x-0 z-20 px-5 sm:px-8">
        <h1 id="home-title" className="font-display font-bold text-foreground">
          رحاب الخليلية
        </h1>
      </div>

      <motion.img
        src={shaykhSaleh}
        alt="فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل"
        width={848}
        height={1264}
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.55, duration: 0.65 }}
        className="hero-shaykh absolute z-10 w-auto object-contain object-bottom drop-shadow-2xl"
      />
    </section>
  );
}
