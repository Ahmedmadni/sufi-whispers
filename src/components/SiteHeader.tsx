import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Home, Heart, Info, Search } from "lucide-react";
import { useState } from "react";
import { SearchModal } from "./SearchModal";

export function SiteHeader() {
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { to: "/", label: "الرئيسية", icon: Home },
    { to: "/poems", label: "الديوان", icon: BookOpen },
    { to: "/favorites", label: "المفضّلة", icon: Heart },
    { to: "/about", label: "عن الكتاب", icon: Info },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-velvet/60 border-b border-gold/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full glass-gold flex items-center justify-center text-gold font-display text-lg group-hover:scale-105 transition-transform">
              ج
            </div>
            <span className="hidden sm:block font-display text-gold-soft text-sm leading-tight">
              جامع النفحات
              <span className="block text-[10px] text-muted-foreground">في مدح سيد السادات</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body transition-all ${
                    active
                      ? "glass-gold text-gold-soft"
                      : "text-muted-foreground hover:text-gold-soft hover:bg-gold/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-gold-soft hover:bg-gold/5 transition-all"
              aria-label="بحث"
            >
              <Search className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
