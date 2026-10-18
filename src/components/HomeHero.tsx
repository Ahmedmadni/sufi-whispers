import { motion, useReducedMotion } from "framer-motion";
import logo from "@/assets/rihab-logo-clean.png";
import heroNabawi from "@/assets/green-dome.jpg";
import shaykhSaleh from "@/assets/shaykh-saleh-cutout.png";

// This is the exact approved description, not a shortened or invented title.
const SHAYKH_BANNER = "تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل";

export function HomeHero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="hero-sequence hero-sequence--mandate relative isolate min-h-[min(610px,calc(100svh-8rem))] overflow-hidden border-b border-gold/25 bg-velvet sm:min-h-[650px]" aria-labelledby="home-title">
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
        alt="فضيلة الشيخ صالح أبو خليل"
        width={848}
        height={1264}
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.55, duration: 0.65 }}
        className="hero-shaykh absolute z-10 w-auto object-contain object-bottom drop-shadow-2xl"
      />

      <div className="hero-mandate absolute inset-x-0 bottom-0 z-30" dir="rtl" aria-label="كلمة التعريف بالشيخ">
        <div className="hero-mandate__frame">
          {/* A non-animated, single copy is always available to assistive technologies. */}
          <p className="sr-only">{SHAYKH_BANNER}</p>
          <div className="hero-mandate__viewport" aria-hidden="true">
            <div className="hero-mandate__track">
              <span className="hero-mandate__phrase">{SHAYKH_BANNER}</span>
              <span className="hero-mandate__phrase hero-mandate__duplicate">{SHAYKH_BANNER}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
