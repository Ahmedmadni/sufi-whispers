import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Eye, Minimize2 } from "lucide-react";
import { WirdAudioPlayer } from "@/components/WirdAudioPlayer";
import { focalScrollAfterZoom, zoomOnDoubleTap } from "@/lib/reader-interaction";

/** Works on Android WebViews where native fullscreen is denied. Portalling
 * to document.body escapes transformed route parents. Escape always exits.
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

/** One tap toggles reader chrome. Double tap zooms the BOOK from the gesture
 * focal position. A delayed single tap avoids a double-tap toolbar flicker.
 * Never run on buttons, editable text or hyperlinks.
 */
export function useBookReaderChrome(
  immersive: boolean,
  viewport: RefObject<HTMLDivElement | null>,
  zoom: number,
  setZoom: (value: number) => void,
) {
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipTapUntil = useRef(0);
  const clearTap = useCallback(() => {
    if (tapTimeout.current !== null) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
    }
  }, []);
  useEffect(() => () => clearTap(), [clearTap]);
  useEffect(() => {
    if (!immersive) setToolbarVisible(true);
  }, [immersive]);

  const suppressSurfaceTap = useCallback((durationMs = 340) => {
    clearTap();
    skipTapUntil.current = Date.now() + durationMs;
  }, [clearTap]);
  const onSurfaceClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("button,a,input,textarea,select,summary,[contenteditable=true]")) return;
    if (Date.now() < skipTapUntil.current) return;
    if (event.detail >= 2) {
      clearTap();
      const el = viewport.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nextZoom = zoomOnDoubleTap(zoom);
      const focal = focalScrollAfterZoom({
        x: event.clientX, y: event.clientY, left: rect.left, top: rect.top,
        scrollLeft: Math.max(0, el.scrollLeft), scrollTop: el.scrollTop,
        currentZoom: zoom, nextZoom,
      });
      setZoom(nextZoom);
      skipTapUntil.current = Date.now() + 240;
      // React paints the resized PDF canvas/image before adjusting scroll position.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (el.isConnected) el.scrollTo({left: focal.left, top: focal.top, behavior:"auto"});
      }));
      return;
    }
    if (event.detail !== 1) return;
    clearTap();
    tapTimeout.current = setTimeout(() => {
      setToolbarVisible(value => !value);
      tapTimeout.current = null;
    }, 260);
  }, [clearTap, setZoom, viewport, zoom]);
  const onSurfaceKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    clearTap();
    setToolbarVisible(value => !value);
  }, [clearTap]);
  return { toolbarVisible, setToolbarVisible, onSurfaceClick, onSurfaceKeyDown, suppressSurfaceTap };
}

export function BookReaderLayout({ immersive, toolbarVisible = true, onRevealToolbar, onExit, children, label, audioPage }: {
  immersive: boolean;
  toolbarVisible?: boolean;
  onRevealToolbar?: () => void;
  onExit?: () => void;
  children: ReactNode;
  label: string;
  audioPage?: number;
}) {
  const content = (
    <section dir="rtl" aria-label={label}
      className={`book-reader-layout mx-auto flex w-full min-w-0 max-w-5xl flex-col ${immersive ? "book-reader--immersive" : ""} ${toolbarVisible ? "" : "book-reader--chrome-hidden"}`}>
      {!toolbarVisible && immersive && (
        <div className="reader-chrome-rescue" dir="ltr">
          <button type="button" aria-label="إظهار شريط أدوات الكتاب" title="إظهار الأدوات"
            onClick={onRevealToolbar} className="reader-chrome-rescue__button"><Eye size={20} aria-hidden="true"/></button>
          <button type="button" aria-label="الخروج من ملء الشاشة" title="الخروج من ملء الشاشة"
            onClick={onExit} className="reader-chrome-rescue__button"><Minimize2 size={20} aria-hidden="true"/></button>
        </div>
      )}
      {audioPage !== undefined && <WirdAudioPlayer page={audioPage} />}
      {children}
    </section>
  );
  return immersive && typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
}
