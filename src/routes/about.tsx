import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => {
    const title = "عن التطبيق — رحاب الخليلية";
    const description =
      "معلومات عن تطبيق رحاب الخليلية، مرجع نص المصحف الشريف (مجمع الملك فهد — رواية حفص)، وبيانات مطوّر التطبيق أحمد المدني.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl sm:text-3xl text-gradient-gold text-center">
          عن التطبيق
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground font-body leading-7">
          رحاب الخليلية تطبيق للقراءة يجمع كتب الطريق الخليلي مع المصحف الشريف كاملاً،
          بواجهة عربية خفيفة تعمل على الهاتف دون إنترنت بعد التحميل.
        </p>

        <section className="mt-7 glass rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">مرجع نص المصحف</h2>
          <p className="mt-2 text-sm text-foreground/85 font-body leading-7">
            نص المصحف من مجمع الملك فهد لطباعة المصحف الشريف — رواية حفص عن عاصم
            (KFGQPC Uthmanic Hafs v2.0)، ويُعرض بخطّه الرسمي دون أي تعديل على النص.
          </p>
        </section>

        <section className="mt-4 glass-gold rounded-2xl px-5 py-5">
          <h2 className="font-display text-lg text-gold-soft">مطوّر التطبيق</h2>
          <p className="mt-2 text-sm text-foreground/85 font-body leading-7">أحمد المدني</p>
          <a
            href="https://ahmedelmadni.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-body text-gold-soft hover:underline"
          >
            ahmedelmadni.com
          </a>
        </section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground font-body">
          ﷺ اللهم صلِّ وسلم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
