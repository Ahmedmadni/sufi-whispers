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
          <h2 className="font-display text-lg text-gold-soft">الاسم والنسب الشريف</h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/85 font-body leading-8">
            هو فضيلة الشيخ صالح بن العارف بالله الشيخ أحمد الشافعي بن محمد بن محمد
            أبو خليل، شيخ الجمعية الخليلية الإسلامية ونقيب السادة الأشراف بمدينة
            الزقازيق. ينحدر من الدوحة النبوية المباركة جامعاً بين النسبين الشريفين؛
            إذ يتصل نسب والده بسيدنا الإمام الحسين، ونسب والدته بسيدنا الإمام الحسن
            رضي الله عنهما.
          </p>
        </section>

        <section className="mt-4 glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">المولد والنشأة</h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/85 font-body leading-8">
            وُلد في التاسع من سبتمبر سنة ١٩٥٨م بكفر النحال في مدينة الزقازيق بمحافظة
            الشرقية، في بيتٍ قام على العلم والذكر والتصوف السنّي؛ فجدّه العارف بالله
            سيدي محمد محمد أبو خليل مؤسس المدرسة الخليلية، ووالده العارف بالله الشيخ
            أحمد الشافعي أبو خليل. نشأ ملازماً لمجالس والده، متشرباً آداب السلوك
            ومحبة سيدنا رسول الله ﷺ وآل بيته، حتى آلت إليه راية التربية ورعاية
            الساحة الخليلية والجمعية.
          </p>
        </section>

        <section className="mt-4 glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">الساحة الخليلية ومجالسها</h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/85 font-body leading-8">
            مقرّه مسجد وساحة سيدي أبو خليل بالزقازيق، بجوار أضرحة مشايخ السلسلة
            الخليلية، ويقصدها المريدون والمحبون من محافظات مصر وخارجها. وتُعقد فيها
            مجالس الذكر والعلم والمدح النبوي، وتُحيا المناسبات الإسلامية كالمولد
            النبوي الشريف والإسراء والمعراج وليلة النصف من شعبان.
          </p>
        </section>

        <section className="mt-4 glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">منهجه في التربية والسلوك</h2>
          <ul className="mt-2 space-y-2 text-sm sm:text-base text-foreground/85 font-body leading-8 list-disc pr-5">
            <li>الاستمساك بالكتاب والسنّة؛ فالتصوف الصادق عملٌ بالشريعة ظاهراً وتحقّقٌ بالتزكية باطناً.</li>
            <li>الاستغراق في محبة سيدنا النبي ﷺ وآل بيته، والإكثار من الصلاة عليه ومدحه مع الأدب التام.</li>
            <li>الأدب مع الله ومع الخلق، وإطعام الطعام، وإعانة المحتاجين وتفريج الكرب.</li>
          </ul>
        </section>

        <section className="mt-4 glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">نظام الأوراد اليومية</h2>
          <ul className="mt-2 space-y-2 text-sm sm:text-base text-foreground/85 font-body leading-8 list-disc pr-5">
            <li><strong className="text-gold-soft">من الفجر إلى العصر:</strong> الصلاة على سيدنا النبي ﷺ بالصيغ الخليلية.</li>
            <li><strong className="text-gold-soft">من العصر إلى المغرب:</strong> الاستغفار والتضرع بورد الاستغفار في توبة الأبرار.</li>
            <li><strong className="text-gold-soft">من المغرب إلى الفجر:</strong> الذكر بأسماء الله الحسنى، مائة ألف مرة لكل اسم قبل الانتقال لما بعده.</li>
          </ul>
        </section>

        <section className="mt-4 glass-gold rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">من آثار الطريق الخليلي</h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/85 font-body leading-8">
            كشف الغطاء عن أهل البلاء لفضيلة الشيخ صالح أبو خليل، وورد الاستغفار في
            توبة الأبرار، والنفحات الخليلية، والمناهل الخليلية، والسيرة الخليلية،
            والمربّي، والمناقب الخليلية — وجميعها متاحة للقراءة داخل المكتبة.
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
