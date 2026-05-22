import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Ornament, IslamicPattern } from "@/components/Decorations";
import { bookMeta, poems } from "@/data/poems";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن الكتاب — جامع النفحات" },
      { name: "description", content: "تعرّف على ديوان جامع النفحات في مدح سيد السادات ﷺ." },
      { property: "og:title", content: "عن الكتاب — جامع النفحات" },
      { property: "og:description", content: "ديوان صوفي روحاني في مدح المصطفى ﷺ." },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  const totalVerses = poems.reduce((s, p) => s + p.verses.length, 0);
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <article className="relative max-w-3xl mx-auto px-4 py-16">
        <IslamicPattern className="absolute inset-0 w-full h-full text-gold/20 opacity-30 -z-10" />

        <header className="text-center mb-12">
          <Ornament className="w-44 mx-auto mb-5 text-gold/70" />
          <h1 className="font-display text-3xl sm:text-5xl text-gradient-gold leading-tight">
            {bookMeta.title}
          </h1>
          <p className="mt-4 text-muted-foreground font-body">{bookMeta.subtitle}</p>
        </header>

        <div className="glass rounded-3xl p-8 sm:p-12 space-y-6 font-body leading-loose text-foreground/90">
          <p>
            «جامع النفحات في مدح سيد السادات» ديوان روحاني صوفي يجمع نفحات المدائح النبوية،
            صدر عن <span className="text-gold-soft">{bookMeta.publisher}</span>، يقع الأصل المطبوع
            في <span className="text-gold-soft">{bookMeta.pages}</span> صفحة.
          </p>
          <p>
            هذه النسخة الرقمية تجربة قراءة فاخرة تستحضر روح المخطوطات الإسلامية القديمة بأسلوب
            بصري سينمائي، مع دعم كامل للغة العربية ومعالجة احترافية للتشكيل والخط الفني.
          </p>
          <div className="ornament-divider my-8" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-display text-3xl text-gradient-gold">{poems.length}</div>
              <div className="text-xs text-muted-foreground mt-1">قصيدة</div>
            </div>
            <div>
              <div className="font-display text-3xl text-gradient-gold">{totalVerses}</div>
              <div className="text-xs text-muted-foreground mt-1">بيتًا</div>
            </div>
            <div>
              <div className="font-display text-3xl text-gradient-gold">{bookMeta.pages}</div>
              <div className="text-xs text-muted-foreground mt-1">صفحة أصلية</div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground font-body">
          ﷺ صلّى الله على سيدنا محمد وعلى آله وصحبه وسلّم
        </p>
      </article>
    </div>
  );
}
