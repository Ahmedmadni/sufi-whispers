import { Link } from "@tanstack/react-router";
import { Home, BookMarked, BookOpen, Feather } from "lucide-react";
import { TasbihIcon } from "@/components/TasbihIcon";

const item =
  "flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-body text-foreground/75 transition-colors";
const active = { className: "text-gold-soft" };

export function BottomNav() {
  return (
    <nav
      dir="ltr"
      aria-label="التنقّل السريع — شريط جانبي على اليسار"
      className="bottom-nav left-rail-nav"
    >
      <div dir="rtl" className="left-rail-nav__links flex flex-col items-stretch gap-1 px-1.5 py-3">
        <Link to="/" activeOptions={{ exact: true }} activeProps={active} className={item}>
          <Home className="w-[18px] h-[18px]" />
          <span>الرئيسية</span>
        </Link>
        <Link to="/quran/printed" search={{ page: 1 }} activeProps={active} className={item}>
          <BookMarked className="w-[18px] h-[18px]" />
          <span>المصحف</span>
        </Link>

        <Link
          to="/dhikr"
          activeProps={{ className: "text-gold-soft" }}
          className="relative flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-body text-foreground/75"
        >
          <span className="bottom-nav-fab">
            <TasbihIcon className="w-5 h-5" />
          </span>
          <span className="mt-0.5">الذكر</span>
        </Link>

        <Link to="/library" activeProps={active} className={item}>
          <BookOpen className="w-[18px] h-[18px]" />
          <span>المكتبة</span>
        </Link>
        <Link to="/shaykh" activeProps={active} className={item}>
          <Feather className="w-[18px] h-[18px]" />
          <span>الطريق</span>
        </Link>
      </div>
    </nav>
  );
}
