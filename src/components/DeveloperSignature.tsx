import { Facebook } from "lucide-react";

/** Discreet credit, kept in the Path section rather than fixed navigation. */
export function DeveloperSignature() {
  return (
    <div className="mx-auto mt-9 w-fit border-t border-gold/20 px-5 pt-4 text-center font-body">
      <span className="block text-[11px] text-muted-foreground">برمجة وتطوير: أحمد المدني</span>
      <a href="https://www.facebook.com/elmadni1998"
        target="_blank" rel="noopener noreferrer"
        className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11px] text-gold-soft"
        aria-label="التواصل مع المبرمج أحمد المدني عبر فيسبوك">
        <Facebook className="h-3.5 w-3.5" /> التواصل مع المطور
      </a>
    </div>
  );
}
