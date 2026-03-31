import { useEffect } from "react";
import { motion } from "framer-motion";

/** Animated green smoke + fly overlay for the Junk rarity */
export const JunkEffect = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  const smokeParticles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 25 + (i * 7) % 50,
    delay: i * 0.22,
    size: 45 + (i % 3) * 20,
    drift: (i % 2 === 0 ? 1 : -1) * (20 + i * 5),
  }));

  // Card is 368px wide. Flies positioned in the top portion using fixed pixel coords.
  const flies = [
    { id: 0, left: 40,  top: 60,  delay: 0.0 },
    { id: 1, left: 110, top: 40,  delay: 0.3 },
    { id: 2, left: 180, top: 75,  delay: 0.55 },
    { id: 3, left: 245, top: 35,  delay: 0.15 },
    { id: 4, left: 305, top: 65,  delay: 0.45 },
    { id: 5, left: 80,  top: 110, delay: 0.7 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-50">
      {/* Smoke puffs rising */}
      {smokeParticles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0.5, 0.25, 0],
            y: [-10, -140 - p.id * 12],
            x: [0, p.drift],
            scale: [0.4, 2 + p.id * 0.08],
          }}
          transition={{ duration: 2.6, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            bottom: "22%",
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(85,107,47,0.8) 0%, rgba(61,79,37,0.5) 55%, transparent 100%)",
            filter: "blur(14px)",
          }}
        />
      ))}

      {/* Fly emojis buzzing over the top of the card */}
      {flies.map(f => (
        <motion.div
          key={f.id}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            x: [0, 14, -10, 8, -6, 12, 0],
            y: [0, -12, 6, -8, 10, -4, 0],
            opacity: [0, 1, 1, 1, 1, 1, 0],
          }}
          transition={{ duration: 3.2, delay: f.delay, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: f.left,
            top: f.top,
            fontSize: "20px",
            lineHeight: 1,
          }}
        >
          🪰
        </motion.div>
      ))}
    </div>
  );
};
