"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCcw, ChevronRight, LayoutGrid, X } from "lucide-react";
import confetti from "canvas-confetti";

type PackState = "sealed" | "tearing" | "opened" | "revealing" | "done";
type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

interface CardData {
  id: string;
  rarity: Rarity;
  name: string;
}

const RARITY_COLORS: Record<Rarity, { bg: string; text: string; icon: string; border: string }> = {
  Common: { bg: "from-slate-300 via-gray-200 to-slate-400", text: "text-slate-800", icon: "text-slate-100", border: "border-slate-100/50" },
  Uncommon: { bg: "from-green-300 via-emerald-200 to-green-400", text: "text-green-900", icon: "text-green-100", border: "border-green-100/50" },
  Rare: { bg: "from-blue-300 via-cyan-200 to-blue-400", text: "text-blue-900", icon: "text-blue-100", border: "border-blue-100/50" },
  Epic: { bg: "from-purple-300 via-fuchsia-200 to-purple-400", text: "text-purple-900", icon: "text-purple-100", border: "border-purple-100/50" },
  Legendary: { bg: "from-yellow-300 via-amber-200 to-orange-400", text: "text-amber-900", icon: "text-yellow-100", border: "border-yellow-100/50" },
};

const generatePack = (): CardData[] => {
  const getRarity = (pool: Rarity[], chances: number[]): Rarity => {
    const r = Math.random();
    let sum = 0;
    for (let i = 0; i < pool.length; i++) {
      sum += chances[i];
      if (r <= sum) return pool[i];
    }
    return pool[pool.length - 1];
  };

  return [
    { id: Math.random().toString(), rarity: getRarity(["Common", "Uncommon"], [0.8, 0.2]), name: "" },
    { id: Math.random().toString(), rarity: getRarity(["Common", "Uncommon", "Rare"], [0.7, 0.25, 0.05]), name: "" },
    { id: Math.random().toString(), rarity: getRarity(["Uncommon", "Rare", "Epic"], [0.7, 0.25, 0.05]), name: "" },
    { id: Math.random().toString(), rarity: getRarity(["Rare", "Epic", "Legendary"], [0.6, 0.3, 0.1]), name: "" },
    { id: Math.random().toString(), rarity: getRarity(["Rare", "Epic", "Legendary"], [0.3, 0.4, 0.3]), name: "" },
  ].map((c, i) => ({
    ...c,
    name: `Mystic ${c.rarity} Relic`,
  }));
};

export default function Home() {
  const [packState, setPackState] = useState<PackState>("sealed");
  const [tearProgress, setTearProgress] = useState(0);
  const [isTearing, setIsTearing] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isGridView, setIsGridView] = useState(false);

  const topPartRef = useRef<HTMLDivElement>(null);
  const isOpenedRef = useRef(false);
  const controls = useAnimation();

  const handleOpen = useCallback(() => {
    if (isOpenedRef.current) return;
    isOpenedRef.current = true;
    setPackState("opened");
    setTearProgress(100);
    setCards(generatePack());
    
    controls.start({
      y: -150,
      x: 100,
      opacity: 0,
      rotate: 25,
      transition: { duration: 0.6, ease: "easeOut" },
    });

    setTimeout(() => {
      setPackState("revealing");
    }, 800);
  }, [controls]);

  const updateTear = (clientX: number) => {
    if (topPartRef.current && !isOpenedRef.current) {
      const rect = topPartRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let progress = (x / rect.width) * 100;
      progress = Math.max(0, Math.min(100, progress));

      setTearProgress((prev) => {
        const newProgress = Math.max(prev, progress);
        if (newProgress >= 85) {
          setTimeout(handleOpen, 0);
          return 100;
        }
        return newProgress;
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (packState !== "sealed" && packState !== "tearing") return;
    setIsTearing(true);
    setPackState("tearing");
    updateTear(e.clientX);
    if (topPartRef.current) {
      topPartRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isTearing) return;
    updateTear(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isTearing) return;
    setIsTearing(false);
    if (topPartRef.current) {
      topPartRef.current.releasePointerCapture(e.pointerId);
    }
    if (tearProgress > 85) {
      handleOpen();
    } else {
      setTearProgress(0);
      setPackState("sealed");
    }
  };

  const handleFlip = (idx: number) => {
    setFlippedCards(prev => ({ ...prev, [idx]: true }));
    if (cards[idx]?.rarity === "Legendary") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FBBF24", "#F59E0B", "#D97706", "#FFFBEB"],
      });
    }
  };

  const handleNextCard = () => {
    if (activeCardIndex < cards.length - 1) {
      setActiveCardIndex(prev => prev + 1);
    } else {
      setPackState("done");
    }
  };

  const resetPack = () => {
    isOpenedRef.current = false;
    setPackState("sealed");
    setTearProgress(0);
    setCards([]);
    setActiveCardIndex(0);
    setFlippedCards({});
    setIsGridView(false);
    controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
  };

  const topFoilContent = (
    <div className="w-full h-full flex flex-col pointer-events-none">
      <div className="w-full h-4 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-lg overflow-hidden flex shrink-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`crimp-${i}`} className="flex-1 border-r border-slate-600/30"></div>
        ))}
      </div>
      <div className="w-full flex-1 bg-gradient-to-b from-purple-600 to-purple-700 relative overflow-hidden border-b border-purple-500/50 shadow-inner">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex items-center justify-center px-4">
          {(packState === "sealed" || packState === "tearing") && tearProgress < 10 && (
            <div className="bg-white/20 backdrop-blur text-white text-xs py-1 px-3 rounded-full font-semibold animate-pulse shadow-lg border border-white/20">
              Swipe to Tear ✨
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] border-b-2 border-dashed border-white/30 truncate"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(120,0,255,0.1),_rgba(0,0,0,1))] pointer-events-none" />

      <main className="relative z-10 w-full max-w-md mx-auto p-6 h-[100dvh] flex flex-col items-center justify-center">
        <h1 className="absolute top-12 text-3xl font-bold text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 w-full">
          Pocket Pack Opener
        </h1>

        <div className="flex-1 w-full relative flex items-center justify-center select-none pt-16">

          {/* CARDS DISPLAY */}
          <AnimatePresence>
            {(packState === "revealing" || packState === "done") && cards.map((card, idx) => {
              if (packState === "revealing" && idx !== activeCardIndex) return null;
              
              const isFlipped = flippedCards[idx] || packState === "done";
              const zIndex = packState === "done" ? cards.length - idx : 20;

              return (
                <motion.div
                  key={card.id}
                  initial={{ y: 50, scale: 0.8, opacity: 0 }}
                  animate={{ 
                    y: packState === "done" ? idx * 10 - 20 : 0, 
                    x: packState === "done" ? (idx - 2) * 20 : 0,
                    scale: packState === "done" ? 0.9 : 1, 
                    opacity: 1,
                    rotate: packState === "done" ? (idx - 2) * 5 : 0
                  }}
                  exit={{ y: -50, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                  onClick={() => {
                    if (packState === "revealing") {
                      if (!isFlipped) {
                        handleFlip(idx);
                      } else if (idx === activeCardIndex) {
                        handleNextCard();
                      }
                    }
                  }}
                  className="absolute cursor-pointer perspective-1000 w-64 h-80"
                  style={{ zIndex }}
                >
                  <motion.div
                    className="w-full h-full relative preserve-3d"
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: isFlipped ? 0 : 180 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Card Back */}
                    <div
                      className="absolute inset-0 w-full h-full bg-blue-900 rounded-xl border-4 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center backface-hidden"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <div className="text-blue-300 font-bold text-2xl tracking-widest uppercase rotate-45 opacity-50">
                        GATCHA
                      </div>
                      {packState === "revealing" && !isFlipped && (
                        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-blue-200 animate-pulse">
                          Tap to flip
                        </div>
                      )}
                    </div>

                    {/* Card Front */}
                    <div
                      className={`absolute inset-0 w-full h-full bg-gradient-to-br ${RARITY_COLORS[card.rarity].bg} rounded-xl p-1 shadow-2xl backface-hidden`}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className={`w-full h-full border-2 ${RARITY_COLORS[card.rarity].border} rounded-lg flex flex-col items-center bg-black/10 backdrop-blur-sm p-4 relative overflow-hidden`}>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"></div>
                        <div className="w-full h-1/2 bg-white/20 rounded-md mb-4 flex items-center justify-center">
                          <Sparkles className={`w-16 h-16 ${RARITY_COLORS[card.rarity].icon}`} />
                        </div>
                        <h2 className={`text-xl font-black ${RARITY_COLORS[card.rarity].text} w-full text-center uppercase tracking-wider mb-2`}>
                          {card.rarity}
                        </h2>
                        <p className={`${RARITY_COLORS[card.rarity].text} text-sm text-center font-medium opacity-80`}>
                          {card.name}
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 mix-blend-overlay rounded-xl pointer-events-none"></div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* THE PACK */}
          {packState !== "done" && packState !== "revealing" && (
            <motion.div
              className="absolute w-64 h-80 z-30 flex flex-col items-center"
              animate={{ y: [0, -5, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
            >
              <div className="relative w-full h-full flex flex-col group drop-shadow-2xl">
                {/* TOP TEARABLE PART */}
                <motion.div
                  ref={topPartRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  animate={controls}
                  className="relative h-1/4 w-full cursor-pointer z-40 touch-none"
                  style={{
                    transformOrigin: "100% 100%",
                    transform: tearProgress > 0
                      ? `rotate(${tearProgress * 0.05}deg) translateY(${-tearProgress * 0.05}px)`
                      : 'none',
                  }}
                >
                  <div className="absolute inset-0 w-full h-full drop-shadow-2xl">
                    {topFoilContent}
                    {tearProgress > 0 && tearProgress < 100 && (
                      <div
                        className="absolute bottom-[-1px] left-0 h-[3px] bg-white/60 blur-[2px]"
                        style={{ width: `${tearProgress}%` }}
                      ></div>
                    )}
                  </div>
                </motion.div>

                {/* BOTTOM MAIN BODY */}
                <div className="h-3/4 w-full bg-gradient-to-b from-purple-700 to-indigo-900 relative rounded-b-lg overflow-hidden shadow-2xl border-t border-indigo-800">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-32 h-32 rounded-full border-4 border-purple-400/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-4 border-t-purple-300 border-r-pink-300 border-b-transparent border-l-transparent rotate-45 opacity-50"></div>
                      <Sparkles className="w-12 h-12 text-pink-300 opacity-80" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-lg text-purple-200 uppercase tracking-widest shadow-black drop-shadow-md">
                    Series 1
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-500 to-slate-400 rounded-b-lg overflow-hidden flex">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={`crimp-b-${i}`} className="flex-1 border-r border-slate-600/30"></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="h-24 flex items-center justify-center w-full z-40 mt-8">
          <AnimatePresence mode="wait">
            {packState === "revealing" && flippedCards[activeCardIndex] && (
              <motion.button
                key="next-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleNextCard}
                className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all"
              >
                {activeCardIndex < cards.length - 1 ? "Next Card" : "Finish"}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}

            {packState === "done" && (
              <motion.div
                key="done-controls"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <button
                  onClick={() => setIsGridView(true)}
                  className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all"
                >
                  <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  View Details
                </button>
                <button
                  onClick={resetPack}
                  className="group flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-pink-500/25 transition-all transform hover:scale-105 active:scale-95"
                >
                  <RefreshCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
                  Open Another
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* GRID OVERLAY */}
      <AnimatePresence>
        {isGridView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col items-center p-6 sm:p-12 overflow-y-auto"
          >
            <div className="w-full max-w-5xl flex flex-col items-center pb-24">
              <h2 className="text-3xl font-bold mb-12 mt-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Pack Review
              </h2>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                {cards.map((card, idx) => (
                  <motion.div 
                    key={`grid-${card.id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative w-56 h-72 sm:w-64 sm:h-80"
                  >
                    <div className={`w-full h-full bg-gradient-to-br ${RARITY_COLORS[card.rarity].bg} rounded-xl p-1 shadow-2xl relative`}>
                      <div className={`w-full h-full border-2 ${RARITY_COLORS[card.rarity].border} rounded-lg flex flex-col items-center bg-black/10 backdrop-blur-sm p-4 relative overflow-hidden`}>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"></div>
                        <div className="w-full h-1/2 bg-white/20 rounded-md mb-4 flex items-center justify-center">
                          <Sparkles className={`w-12 h-12 sm:w-16 sm:h-16 ${RARITY_COLORS[card.rarity].icon}`} />
                        </div>
                        <h2 className={`text-lg sm:text-xl font-black ${RARITY_COLORS[card.rarity].text} w-full text-center uppercase tracking-wider mb-2`}>
                          {card.rarity}
                        </h2>
                        <p className={`${RARITY_COLORS[card.rarity].text} text-xs sm:text-sm text-center font-medium opacity-80`}>
                          {card.name}
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 mix-blend-overlay rounded-xl pointer-events-none"></div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => setIsGridView(false)}
                className="mt-16 group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Close Review
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
