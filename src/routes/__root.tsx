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
import { Toaster } from "@/components/ui/sonner";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
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
      { title: "رحاب الخليلية — نفحاتٌ من حضرة سيد السادات ﷺ" },
      { name: "description", content: "بوابة صوفية إلى الطريق الخليلي: مدائح، أوراد، سيرة، مناقب، ومناهل في المعارف والآداب — بروح المسجد النبوي الشريف." },
      { name: "author", content: "الجمعية الخليلية الإسلامية" },
      { property: "og:title", content: "رحاب الخليلية — نفحاتٌ من حضرة سيد السادات ﷺ" },
      { property: "og:description", content: "بوابة صوفية إلى الطريق الخليلي: مدائح، أوراد، سيرة، مناقب، ومناهل في المعارف والآداب — بروح المسجد النبوي الشريف." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "رحاب الخليلية" },
      { property: "og:locale", content: "ar_AR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "رحاب الخليلية — نفحاتٌ من حضرة سيد السادات ﷺ" },
      { name: "twitter:description", content: "بوابة صوفية إلى الطريق الخليلي: مدائح، أوراد، سيرة، مناقب، ومناهل في المعارف والآداب — بروح المسجد النبوي الشريف." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/sHg6QnS04TcmbXVlhYYOOD3JhZB2/social-images/social-1781277052051-الغلاف_وجهين1222.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/sHg6QnS04TcmbXVlhYYOOD3JhZB2/social-images/social-1781277052051-الغلاف_وجهين1222.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Kufam:wght@400;500;600;700&family=Cairo:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
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
      <Toaster />
    </QueryClientProvider>
  );
}
