import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/rihab-logo.png.asset.json";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-velvet/70 border-b border-gold/15">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0 group">
          <img
            src={logo.url}
            alt="شعار مجموعة في رحاب الخليلية"
            width={36}
            height={36}
            className="w-9 h-9 shrink-0 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-display text-gold-soft text-sm leading-tight truncate">
            رحاب الخليلية
            <span className="block text-[10px] text-muted-foreground truncate">
              مجموعة في رحاب الطريق الخليلي
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-body">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-gold-soft bg-gold/10" }}
            className="rounded-md px-2.5 py-1.5 text-foreground/80 hover:text-gold-soft transition-colors"
          >
            الرئيسية
          </Link>
          <Link
            to="/library"
            activeProps={{ className: "text-gold-soft bg-gold/10" }}
            className="rounded-md px-2.5 py-1.5 text-foreground/80 hover:text-gold-soft transition-colors"
          >
            المكتبة
          </Link>
          <Link
            to="/quran"
            activeProps={{ className: "text-gold-soft bg-gold/10" }}
            className="rounded-md px-2.5 py-1.5 text-foreground/80 hover:text-gold-soft transition-colors"
          >
            المصحف
          </Link>
          <ThemeToggle />
        </nav>

      </div>
    </header>
  );
}
