import { Link } from "@tanstack/react-router";
import { Home, BookMarked, BookOpen, Feather } from "lucide-react";
import { TasbihIcon } from "@/components/TasbihIcon";

// Keep the approved five destinations and native bottom placement. The icons
// now share one visual size, active container, and readable text label.
const item = "rihab-nav-item flex flex-1 flex-col items-center justify-center gap-1 py-1 font-body";
const active = { className: "text-gold-soft" };

export function BottomNav() {
  return (
    <nav
      dir="rtl"
      aria-label="التنقّل السريع"
      className="bottom-nav lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch px-2">
        <Link to="/" activeOptions={{ exact: true }} activeProps={active} className={item}>
          <span className="rihab-nav-item__icon" aria-hidden="true">
            <Home className="h-[22px] w-[22px]" strokeWidth={2.25} />
          </span>
          <span className="rihab-nav-item__label">الرئيسية</span>
        </Link>
        <Link to="/quran/printed" search={{ page: 1 }} activeProps={active} className={item}>
          <span className="rihab-nav-item__icon" aria-hidden="true">
            <BookMarked className="h-[22px] w-[22px]" strokeWidth={2.25} />
          </span>
          <span className="rihab-nav-item__label">المصحف</span>
        </Link>
        <Link to="/dhikr" activeProps={active}
          className={`${item} rihab-nav-item--featured`}>
          <span className="bottom-nav-fab" aria-hidden="true">
            <TasbihIcon className="h-[25px] w-[25px]" />
          </span>
          <span className="rihab-nav-item__label">الذكر</span>
        </Link>
        <Link to="/library" activeProps={active} className={item}>
          <span className="rihab-nav-item__icon" aria-hidden="true">
            <BookOpen className="h-[22px] w-[22px]" strokeWidth={2.25} />
          </span>
          <span className="rihab-nav-item__label">المكتبة</span>
        </Link>
        <Link to="/shaykh" activeProps={active} className={item}>
          <span className="rihab-nav-item__icon" aria-hidden="true">
            <Feather className="h-[22px] w-[22px]" strokeWidth={2.25} />
          </span>
          <span className="rihab-nav-item__label">الطريق</span>
        </Link>
      </div>
    </nav>
  );
}
