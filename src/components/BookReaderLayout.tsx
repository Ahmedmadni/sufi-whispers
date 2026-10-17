import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Works even on Android WebViews where the native Fullscreen API is denied.
 * Portalling to document.body avoids transformed route ancestors and keeps
 * the in-app exit button visible above the bottom navigation.
 */
export function useBookImmersive() {
  const [immersive, setImmersive] = useState(false);
  useEffect(() => {
    if (!immersive || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [immersive]);
  return { immersive, setImmersive };
}

export function BookReaderLayout({ immersive, children, label }: {
  immersive: boolean;
  children: ReactNode;
  label: string;
}) {
  const content = (
    <section dir="rtl" aria-label={label}
      className={`book-reader-layout mx-auto flex w-full min-w-0 max-w-5xl flex-col ${immersive ? "book-reader--immersive" : ""}`}>
      {children}
    </section>
  );
  return immersive && typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
}
