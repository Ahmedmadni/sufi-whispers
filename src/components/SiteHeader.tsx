import { Link } from "@tanstack/react-router";
import { Facebook, Settings2 } from "lucide-react";
import logo from "@/assets/rihab-logo-clean.png";

const linkClass =
  "rounded-md px-2 sm:px-2.5 py-1.5 text-foreground/80 hover:text-gold-soft transition-colors whitespace-nowrap";
const activeClass = { className: "text-gold-soft bg-gold/10" };

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 border-b border-gold/25 bg-velvet/90 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        <Link to="/" className="site-header__brand flex items-center gap-2 min-w-0 group">
          <img
            src={logo}
            alt="شعار الجمعية الخليلية الإسلامية"
            width={36}
            height={36}
            decoding="async"
            className="w-9 h-9 shrink-0 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-display text-gold-soft text-sm leading-tight truncate">
            رحاب الخليلية
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2 text-[11px] sm:text-sm font-body" aria-label="التنقل الرئيسي">
          <Link to="/" activeOptions={{ exact: true }} activeProps={activeClass} className={`${linkClass} hidden`}>
            الرئيسية
          </Link>
          <Link to="/library" activeProps={activeClass} className={`${linkClass} hidden`}>
            المكتبة
          </Link>
          <Link to="/quran/printed" search={{ page: 1 }} activeProps={activeClass} className={`${linkClass} hidden`}>
            المصحف
          </Link>
          <Link to="/shaykh" activeProps={activeClass} className={`${linkClass} hidden`}>
            الطريق
          </Link>
          <a
            href="https://www.facebook.com/groups/alkhaleelih/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مجموعة الجمعية على فيسبوك"
            title="فيسبوك الجمعية"
            className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/20 text-gold-soft hover:bg-gold/10"
          >
            <Facebook className="h-[19px] w-[19px] text-[#0866FF]" aria-hidden="true" />
          </a>
          <Link to="/settings" aria-label="الإعدادات والنسخ الاحتياطي" title="الإعدادات والنسخ الاحتياطي"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 text-gold-soft hover:bg-gold/10">
            <Settings2 className="h-[18px] w-[18px]" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
