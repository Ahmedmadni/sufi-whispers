import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-velvet/70 border-b border-gold/15">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0 group">
          <div className="w-9 h-9 shrink-0 rounded-full glass-gold flex items-center justify-center text-gold font-display text-base group-hover:scale-105 transition-transform">
            م
          </div>
          <span className="font-display text-gold-soft text-sm leading-tight truncate">
            مكتبة النفحات
            <span className="block text-[10px] text-muted-foreground truncate">
              كتب في مدح سيد السادات ﷺ
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
