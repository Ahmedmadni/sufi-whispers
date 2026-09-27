import { cn } from "@/lib/utils";

interface TasbihIconProps {
  className?: string;
}

/** أيقونة مسبحة (سُبحة بمعلّقة) بأسلوب Lucide. */
export function TasbihIcon({ className }: TasbihIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("w-6 h-6", className)}
    >
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="3.5" r="1.5" />
        <circle cx="15.5" cy="4.44" r="1.5" />
        <circle cx="18.06" cy="7" r="1.5" />
        <circle cx="19" cy="10.5" r="1.5" />
        <circle cx="18.06" cy="14" r="1.5" />
        <circle cx="15.5" cy="16.56" r="1.5" />
        <circle cx="8.5" cy="16.56" r="1.5" />
        <circle cx="5.94" cy="14" r="1.5" />
        <circle cx="5" cy="10.5" r="1.5" />
        <circle cx="5.94" cy="7" r="1.5" />
        <circle cx="8.5" cy="4.44" r="1.5" />
        <circle cx="12" cy="21" r="1.4" />
      </g>
      <path
        d="M12 17.6v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
