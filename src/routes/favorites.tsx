import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Ornament } from "@/components/Decorations";
import { poems } from "@/data/poems";
import { useFavorites } from "@/hooks/use-favorites";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "المفضّلة — جامع النفحات" },
      { name: "description", content: "قصائدك المفضّلة من ديوان جامع النفحات." },
    ],
    links: [{ rel: "canonical", href: "/favorites" }],
  }),
  component: Favorites,
});

function Favorites() {
  const { favs, toggle } = useFavorites();
  const list = poems.filter((p) => favs.includes(p.id));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="pt-16 pb-10 px-4 text-center">
        <Ornament className="w-40 mx-auto mb-4 text-gold/70" />
        <h1 className="font-display text-4xl sm:text-5xl text-gradient-gold">قصائدك المفضّلة</h1>
        <p className="mt-3 text-muted-foreground font-body">
          {list.length > 0 ? `${list.length} من القصائد` : "لم تُضِف أي قصيدة بعد"}
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-2 gap-5">
        {list.map((p) => (
          <div key={p.id} className="relative glass rounded-2xl p-6 hover:glow-gold transition-all">
            <button
              onClick={() => toggle(p.id)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-gold/10"
            >
              <Heart className="w-5 h-5 fill-gold text-gold" />
            </button>
            <Link to="/poems/$id" params={{ id: String(p.id) }} className="block pe-10">
              <div className="text-xs text-gold/80 font-body mb-2">{p.category}</div>
              <h3 className="font-display text-2xl text-gold-soft">{p.title}</h3>
              <p className="mt-3 verse-line text-foreground/85 text-sm">{p.verses[0].text}</p>
            </Link>
          </div>
        ))}
        {list.length === 0 && (
          <div className="col-span-full text-center py-20">
            <Link to="/poems" className="glass-gold rounded-full px-6 py-3 text-gold-soft font-body inline-block">
              تصفّح الديوان
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
