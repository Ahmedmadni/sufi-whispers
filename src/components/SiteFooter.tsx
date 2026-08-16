import { Link } from "@tanstack/react-router";
import { Facebook } from "lucide-react";
import { SalawatRotator } from "@/components/Salawat";


const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/alkhaleelih/";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gold/15 py-7" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <p className="font-display text-gold-soft text-sm">الجمعية الخليلية الإسلامية</p>
        <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground font-body leading-6">
          تحت لواء شيخها فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل
        </p>

        <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-body">
          <Link to="/" className="text-foreground/75 hover:text-gold-soft transition-colors">
            الرئيسية
          </Link>
          <Link to="/library" className="text-foreground/75 hover:text-gold-soft transition-colors">
            المكتبة
          </Link>
          <Link to="/quran" className="text-foreground/75 hover:text-gold-soft transition-colors">
            المصحف
          </Link>
          <Link to="/shaykh" className="text-foreground/75 hover:text-gold-soft transition-colors">
            نبذة عن الشيخ
          </Link>
          <Link to="/about" className="text-foreground/75 hover:text-gold-soft transition-colors">
            عن الجمعية
          </Link>
          <a
            href={FACEBOOK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-foreground/75 hover:text-gold-soft transition-colors"
          >
            <Facebook className="w-3.5 h-3.5" />
            فيسبوك
          </a>
        </nav>

        <p className="mt-4 text-[11px] sm:text-xs text-muted-foreground font-body">
          ﷺ اللهم صلِّ وسلم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين
        </p>
      </div>
    </footer>
  );
}
