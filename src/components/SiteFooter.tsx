import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gold/15 py-6 text-center">
      <p className="text-[11px] sm:text-xs text-muted-foreground font-body">
        ﷺ اللهم صلِّ وسلم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين
      </p>
      <Link
        to="/about"
        className="mt-2 inline-block text-[11px] sm:text-xs text-gold-soft/80 hover:text-gold-soft font-body"
      >
        عن التطبيق
      </Link>
    </footer>
  );
}
