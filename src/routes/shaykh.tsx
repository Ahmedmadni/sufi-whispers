import { createFileRoute, Link } from "@tanstack/react-router";
import { Facebook, BookOpen, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Decorations";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/alkhaleelih/";
const SHAYKH_FULL_NAME =
  "فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل";

export const Route = createFileRoute("/shaykh")({
  head: () => {
    const title = "نبذة عن شيخ الطريق — الجمعية الخليلية الإسلامية";
    const description =
      "نبذة عن فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل، شيخ الجمعية الخليلية الإسلامية: منهجه في التربية والسلوك، ومجالسه، وآثاره العلمية.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: "https://sufi-whispers.lovable.app/shaykh" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: "https://sufi-whispers.lovable.app/shaykh" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: SHAYKH_FULL_NAME,
            honorificPrefix: "فضيلة العارف بالله سيدي الشيخ",
            description,
            inLanguage: "ar",
            url: "https://sufi-whispers.lovable.app/shaykh",
            affiliation: {
              "@type": "Organization",
              name: "الجمعية الخليلية الإسلامية",
              url: "https://sufi-whispers.lovable.app/",
            },
          }),
        },
      ],
    };
  },
  component: ShaykhPage,
});

function ShaykhPage() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <header className="text-center">
          <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full glass-gold px-4 py-1.5 text-[11px] sm:text-xs font-body text-gold-soft">
            <Sparkles className="w-3.5 h-3.5" />
            <span>الجمعية الخليلية الإسلامية</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-gradient-gold leading-[1.6]">
            نبذة عن شيخ الطريق
          </h1>
          <p className="mt-3 text-sm sm:text-base font-body text-foreground/85 leading-8">
            {SHAYKH_FULL_NAME}
          </p>
          <div className="my-5 flex justify-center">
            <Ornament className="w-40 sm:w-56 text-gold" />
          </div>
        </header>

        <section className="glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">شيخ الجمعية</h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/85 font-body leading-8">
            تسير الجمعية الخليلية الإسلامية تحت لواء شيخها فضيلة العارف بالله سيدي
            الشيخ صالح أحمد الشافعي محمد محمد أبو خليل؛ جامعاً بين علوم الشريعة
            وأذواق الحقيقة، قائماً على تربية المريدين بالكتاب والسنّة على منهاج
            السلف من أهل الله، ذوقاً ومقاماً، وأدباً وحالاً.
          </p>
        </section>

        <section className="mt-4 glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">منهجه في التربية والسلوك</h2>
          <ul className="mt-2 space-y-2 text-sm sm:text-base text-foreground/85 font-body leading-8 list-disc pr-5">
            <li>تصحيح العقيدة والعبادة على هدي الكتاب والسنّة وفهم سلف الأمة.</li>
            <li>تزكية النفس بالذكر والأوراد والمحاسبة، وترك ما لا يعني.</li>
            <li>محبّة سيّد السادات ﷺ وآل بيته الكرام، وإحياء السنن والمدائح النبوية.</li>
            <li>الأدب مع الله ومع الخلق، ورفق في الدعوة، وخدمة الناس ونفعهم.</li>
          </ul>
        </section>

        <section className="mt-4 glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">مجالسه</h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/85 font-body leading-8">
            مجالسُ ذكرٍ وعلمٍ ومدحٍ لسيّد الأنام ﷺ، يتخلّلها شرحُ الأوراد وآداب
            الطريق، وتربيةٌ عمليّة على التقوى والصدق والإخلاص، وردُّ القلوب إلى
            حضرة مولاها.
          </p>
        </section>

        <section className="mt-4 glass-gold rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">من آثار الطريق الخليلي</h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/85 font-body leading-8">
            جامع النفحات، وورد الاستغفار، والسيرة الخليلية، والمناقب الخليلية،
            والمناهل الخليلية، والنفحات الخليلية، والمربّي، وكشف الغطاء عن أهل
            البلاء — وجميعها متاحة للقراءة داخل المكتبة.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/library"
              className="inline-flex items-center gap-2 rounded-lg glass-gold px-4 py-2 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
            >
              <BookOpen className="w-4 h-4" />
              <span>تصفّح المكتبة</span>
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
          </div>
        </section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground font-body">
          ﷺ اللهم صلِّ وسلم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
