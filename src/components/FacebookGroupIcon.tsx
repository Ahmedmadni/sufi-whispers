import type { SVGProps } from "react";

/**
 * Compact, recognizable Facebook group glyph. The filled 'f' is legible
 * down to 16px, unlike the outline-only icon. No external icon/font fetch.
 */
export function FacebookGroupIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className}
      aria-hidden="true" focusable="false" {...props}>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6"
        fill="#0866FF" />
      <path fill="#fff"
        d="M14.8 21V13.1h2.65l.42-3.18H14.8V7.88c0-.92.29-1.53 1.6-1.53h1.57V3.49c-.28-.04-1.23-.12-2.35-.12-2.55 0-4.3 1.56-4.3 4.43v2.12H8.4v3.18h2.62V21h3.78Z" />
    </svg>
  );
}
