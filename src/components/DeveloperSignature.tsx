import { Facebook } from "lucide-react";

/** Developer contact without a visible personal name; kept inside the Path section. */
export function DeveloperSignature() {
  return (
    <div className="mx-auto mt-9 w-fit border-t border-gold/20 px-5 pt-4 text-center font-body">
      <a href="https://www.facebook.com/elmadni1998"
        target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs text-gold-soft transition-colors hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label="تواصل مع المطور عبر فيسبوك">
        <Facebook className="h-4 w-4 text-[#0866FF]" aria-hidden="true" /> تواصل مع المطور
      </a>
    </div>
  );
}
