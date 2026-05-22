import { motion } from "framer-motion";

export function Particles({ count = 24 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 8 + Math.random() * 10;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-gold/60"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: -10,
              boxShadow: "0 0 8px var(--gold)",
            }}
            animate={{ y: [-20, -800], opacity: [0, 1, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}
