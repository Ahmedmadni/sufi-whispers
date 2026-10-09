import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import visualCss from "../visual-experience.css?url";
import premiumCss from "../premium-ui.css?url";
import { Toaster } from "@/components/ui/sonner";
import { SalawatReminder } from "@/components/Salawat";
import { BottomNav } from "@/components/BottomNav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-7xl font-display text-gradient-gold">٤٠٤</h1>
        <h2 className="mt-4 text-xl font-display text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          الصفحة التي تبحث عنها قد انتقلت أو لم تعد متاحة.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg glass-gold px-5 py-2 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
        >
          العودة إلى الديوان
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-xl font-display text-gold-soft">حدث خطأ ما</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          لم نتمكن من تحميل هذه الصفحة.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-lg glass-gold px-4 py-2 text-sm text-gold-soft"
          >
            إعادة المحاولة
          </button>
          <a href="/" className="rounded-lg border border-gold/30 px-4 py-2 text-sm text-foreground">
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "الجمعية الخليلية الإسلامية — رحاب الخليلية" },
      { name: "description", content: "الموقع الرسمي للجمعية الخليلية الإسلامية: المصحف الشريف كاملاً، ومكتبة كتب الطريق الخليلي وأوراده، ونبذة عن شيخ الطريق." },
      { name: "author", content: "الجمعية الخليلية الإسلامية" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "الجمعية الخليلية الإسلامية" },
      { property: "og:locale", content: "ar_AR" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: visualCss },
      { rel: "stylesheet", href: premiumCss },
      { rel: "preload", href: "/__l5e/assets-v1/0672fba1-2706-4d5c-a2ab-244997041972/uthmanic_hafs_v20.ttf", as: "font", type: "font/ttf", crossOrigin: "anonymous" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // TanStack Start renders <html>/<body> for SSR; the standalone Android SPA
  // mounts inside #root and must not nest another HTML document.
  if (import.meta.env.VITE_MOBILE === "true") return <>{children}</>;
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('rihab-theme')||'dark';document.documentElement.classList.add(t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <BottomNav />
      <SalawatReminder />
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}
