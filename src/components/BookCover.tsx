import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** "eager" for above-the-fold covers (e.g. modal), otherwise lazy. */
  priority?: boolean;
  sizes?: string;
};

/**
 * غلاف كتاب بتحميل كسول (lazy) وتأثير blur-up placeholder
 * لتحسين الأداء على الشبكات البطيئة والأجهزة المحمولة.
 */
export function BookCover({ src, alt, className = "", priority = false, sizes }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // If the image is already cached, onLoad may not fire — sync from the DOM.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Blur placeholder: soft gradient in brand tones while the image loads */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br from-gold/15 via-velvet/40 to-gold/10 transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100 animate-pulse"
        }`}
      />
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-[opacity,filter] duration-500 ease-out ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-md scale-105"
        } ${className}`}
      />
    </div>
  );
}
