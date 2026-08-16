import { useEffect, useState } from "react";
import { toast } from "sonner";

export const SALAWAT_FORMULAS = [
  "ﷺ اللهم صلِّ وسلم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين",
  "﴿.. اَللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ عَدَدَ مَا فِي عِلْمِ اَللَّهِ صَلَاةً دَائِمَةً بِدَوَامِ مُلْكِ اَللَّهِ .. ﴾ 🕊🌿",
  "اللهم زد سيدنا ومولانا محمدًا ﷺ تشريفًا وتعظيمًا وتبجيلًا وتفخيمًا، وزدنا حبًّا في مقامه العظيم.",
];

/** Rotates between the salawat formulas automatically. */
export function SalawatRotator({
  className = "",
  intervalMs = 12000,
}: {
  className?: string;
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % SALAWAT_FORMULAS.length), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <p key={i} className={`salawat-fade ${className}`} dir="rtl">
      {SALAWAT_FORMULAS[i]}
    </p>
  );
}

/** Reminds the reader to send salawat every 5 minutes. */
export function SalawatReminder({ everyMs = 5 * 60 * 1000 }: { everyMs?: number }) {
  useEffect(() => {
    let i = 1;
    const id = setInterval(() => {
      const text = SALAWAT_FORMULAS[i % SALAWAT_FORMULAS.length];
      i += 1;
      toast("تذكير بالصلاة على النبي ﷺ", {
        description: text,
        duration: 12000,
        action: { label: "صلّيت", onClick: () => undefined },
      });
    }, everyMs);
    return () => clearInterval(id);
  }, [everyMs]);

  return null;
}
